import * as turf from '@turf/turf'
import AppConfig from '../config'
import HorizontalBarChart from '../Charts/HorizontalBarChart'
import L from 'leaflet'
import React, {useState, useEffect, useRef, forwardRef, useImperativeHandle, useContext, Ref} from 'react'
import withSharedAnalysisCharacteristics from './AnalysisPackage'
import {BarLoader} from 'react-spinners'
import {TimeEnabledLayer, defaultTimeDimension} from './TimeEnabledLayer'
import {TimeSliderContext} from '../Contexts/TimeSliderContext'

const SB_URL = 'https://www.sciencebase.gov/catalog/item/5a87249de4b00f54eb3a2e1e?format=json'
const EXPECTED_LAND_USE_ENDPOINT = AppConfig.REACT_APP_BIS_API + '/api/v1/expectedlanduse/'


const sb_properties = {
  title: 'Expected Land Use'
}
const layers = [
  new TimeEnabledLayer('Expected Land Use over time 2001-2061', 'https://dev-blm.sciencebase.gov/geoserver/bcb/wms', 'expected_land_use', '5a87249de4b00f54eb3a2e1e'),
  {
    title: 'Expected Land Use 2061',
    layer: L.tileLayer.wms(
      'https://sciencebase.usgs.gov/geoserver/bcb/wms',
      {
        layers: 'classified_chance_of_development',
        format: 'image/png',
        opacity: .5,
        transparent: true
      }
    ),
    legend: {
      imageUrl: 'https://sciencebase.usgs.gov/geoserver/bcb/wms?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=classified_chance_of_development'
    },
    checked: false,
    sb_item: '5a87249de4b00f54eb3a2e1e'
  }
]

export interface IExpectedLandUseAnalysisPackageProps {
  setShareState: Function
  feature: any
  isPriorityBap: boolean
  canOpen: Function
  isEnabled: Function
  setBapJson: Function
  getSBItemForPrint: Function
  getAnalysisLayers: Function
  handleBapError: Function
  getBapContents: Function
}

const EMPTY_CHARTS = {
  barChart: {id: '', config: {}, data: null}
}

const ExpectedLandUseAnalysisPackage = (props: IExpectedLandUseAnalysisPackageProps, ref: Ref<any>) => {
  const [, setTimeSliderState] = useContext(TimeSliderContext)
  const [loading, setLoading] = useState(false)
  const [charts, setCharts] = useState(EMPTY_CHARTS)
  const [error, setError] = useState(false)
  const [timeDimension, setTimeDimension] = useState(defaultTimeDimension)

  const barChart = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    print: print
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useEffect(() => {
    featureChange()
    const layer = layers[0] as TimeEnabledLayer
    const fetchTimeDimension = async () => {
      const timeDimension = await layer.getTimeDimension()
      setTimeDimension(timeDimension)
    }
    fetchTimeDimension()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    props.setShareState({})
  })

  useEffect(() => {
    featureChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.feature])

  useEffect(() => {
    if (props.isPriorityBap) {
      setTimeSliderState({minSliderValue: timeDimension.minVal, maxSliderValue: timeDimension.maxVal})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isPriorityBap, timeDimension])

  const featureChange = () => {
    if (props.feature) {
      fetchData()
      return
    }
    props.canOpen(false)
    props.isEnabled(true)
  }

  const fetchData = () => {
    setLoading(true)
    setError(false)

    const request = props.feature.properties.userDefined ?
      fetch(EXPECTED_LAND_USE_ENDPOINT + `polygon?geojson=${JSON.stringify(props.feature.geometry)}`) :
      fetch(EXPECTED_LAND_USE_ENDPOINT + `place?feature_id=${props.feature.properties.feature_id}`)

    request
      .then(res => res.json())
      .then(values => {
        if (!values.success) {
          setLoading(false)
          setError(true)
          return
        }
        props.setBapJson(values)
        setCharts(getCharts(values))
        setLoading(false)
        props.isEnabled(true)
        props.canOpen(true)
      })
  }

  const numberWithCommas = (x: number) => {
    return x.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  /**
   * Loop through the charts defined in the state and look for a data object in datas that matches.
   * Create the chart id, data, and config as documented in the chart type.
   * @param {Object {}} datas - one enrty for each chart named the same as defined in the state
   */
  const getCharts = (datas: any) => {

    let newCharts = EMPTY_CHARTS

    const labels = [
      {short: '0%', long: 'No Threat - 0%', color: '#CCCCCC'},
      {short: '1-33%', long: 'Low Threat - 1 to 33%', color: '#48A908'},
      {short: '34-66%', long: 'Medium Threat - 34 to 66%', color: '#F7ED5F'},
      {short: '67-100%', long: 'High Threat - 67 to 100%', color: '#EC2D1A'}
    ]

    for (let key in charts) {
      if (key === 'barChart') {
        const data = datas.result
        const chartId = 'ExpectedLandUse_BarChart'
        const chartConfig = {
          margins: {left: 100, right: 20, top: 20, bottom: 70},
          chart: {title: 'Expected Land Use Change'},
          xAxis: {key: 'area', label: 'Area (acres)', ticks: 5, },
          yAxis: {key: 'value', label: 'Threat', ticks: 4, tickFormat: (_d: any, idx: number) => {return labels[idx + 1].short}},
          tooltip: {label: (d: any) => {return `<p>${d.label.long}: ${numberWithCommas(d.area)} acres</p>`}}
        }
        const chartData = data.map((d: any, idx: number) => {
          return {
            value: d.value,
            area: (turf as any).convertArea(d.area, 'meters', 'acres'),
            label: labels[idx],
            color: labels[idx].color
          }
        })
        newCharts.barChart = {id: chartId, config: chartConfig, data: chartData}
      }
    }

    return newCharts
  }

  const print = () => {
    const data: any = charts.barChart.data
    const dataCopy = data ? [...data] : data
    const noThreat = dataCopy ? dataCopy.splice(0, 1)[0] : dataCopy
    if (charts.barChart.data) {
      return [
        barChart.current.print(charts.barChart.id)
          .then((img: any) => {
            return [
              {stack: props.getSBItemForPrint()},
              {text: barChart.current.props.config.chart.title, style: 'chartTitle'},
              {text: barChart.current.props.config.chart.subtitle, style: 'chartSubtitle'},
              {image: img, alignment: 'center', width: 450},
              {text: noThreat ? `${noThreat.label.long}: ${numberWithCommas(noThreat.area)} acres` : ''}
            ]
          })
      ]
    }
    return []
  }

  const createUniqueBapContents = () => {
    const data: any = charts.barChart.data
    const dataCopy = data ? [...data] : data
    const noThreat = dataCopy ? dataCopy.splice(0, 1)[0] : dataCopy
    return (
      <div>
        {props.getAnalysisLayers()}
        {props.handleBapError(error)}
        <div className="chartsDiv">
          <HorizontalBarChart
            ref={barChart}
            data={dataCopy}
            id={charts.barChart.id}
            config={charts.barChart.config}
          />
          {noThreat && <div className="text-right mr-2">
            {`${noThreat.label.long}: ${numberWithCommas(noThreat.area)} acres`}
          </div>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <BarLoader width={'100%'} color={'white'} loading={loading} />
      {props.getBapContents(createUniqueBapContents)}
    </div>
  )
}

const ExpectedLandUseAnalysis = withSharedAnalysisCharacteristics(forwardRef(ExpectedLandUseAnalysisPackage), layers, sb_properties, SB_URL)

export default ExpectedLandUseAnalysis
