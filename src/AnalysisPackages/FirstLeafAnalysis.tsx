import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useContext, Ref } from 'react'
import { BarLoader } from 'react-spinners'

import withSharedAnalysisCharacteristics from './AnalysisPackage'
import BoxAndWhiskerChart from '../Charts/BoxAndWhiskerChart'
import HistogramChart from '../Charts/HistogramChart'
import RidgelinePlotChart from '../Charts/RidgelinePlotChart'
import './AnalysisPackages.css'
import AppConfig from '../config'
import { IChart } from '../Charts/Chart'
import { TimeSliderContext } from '../Contexts/TimeSliderContext'
import { TimeEnabledLayer, defaultTimeDimension } from './TimeEnabledLayer'

const SB_URL = 'https://www.sciencebase.gov/catalog/item/58bf0b61e4b014cc3a3a9c10?format=json'
const FIRSTLEAF_URL = AppConfig.REACT_APP_BIS_API + '/api/v1/phenology/place/firstleaf'
const FIRSTLEAF_POLY_URL = AppConfig.REACT_APP_BIS_API + '/api/v1/phenology/polygon/firstleaf'
const PUBLIC_TOKEN = AppConfig.REACT_APP_PUBLIC_TOKEN

let sb_properties = {
  'title': 'First Leaf Spring Index'
}

const layers = [
  new TimeEnabledLayer('Average Leaf PRISM', 'https://geoserver.usanpn.org/geoserver/si-x/wms', 'average_leaf_prism', '591c6ec6e4b0a7fdb43dea8a'),
]

export interface IFirstLeafAnalysisPackageProps {
  initBap: { bucketSize: number, didSubmit: boolean }
  setShareState: Function
  feature: null | any
  isEnabled: Function
  canOpen: Function
  setBapJson: Function
  // HOC props
  isPriorityBap: boolean
  getSBItemForPrint: Function
  getAnalysisLayers: Function
  handleBapError: Function
  getBapContents: Function
}

export interface IFirstLeafAnalysisPackageCharts {
  histogram: IChart
  ridgelinePlot: IChart
  boxAndWhisker: IChart
}

const EMPTY_CHARTS = {
  histogram: { id: '', config: {}, data: null },
  ridgelinePlot: { id: '', config: {}, data: null },
  boxAndWhisker: { id: '', config: {}, data: null }
}

const FirstLeafAnalysisPackage = (props: IFirstLeafAnalysisPackageProps, ref: Ref<any>) => {
  const [timeSliderState, setTimeSliderState] = useContext(TimeSliderContext)
  const [charts, setCharts] = useState<IFirstLeafAnalysisPackageCharts>(EMPTY_CHARTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [bucketSize, setBucketSize] = useState(3)
  const [didSubmit, setDidSubmit] = useState(false)
  const [timeDimension, setTimeDimension] = useState(defaultTimeDimension)

  const HistogramChartRef = useRef<any>(null)
  const RidgelinePlotChartRef = useRef<any>(null)
  const BoxAndWhiskerChartRef = useRef<any>(null)
  const featureRef = useRef(props.feature)

  useImperativeHandle(ref, () => ({
    print: print
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useEffect(() => {
    featureChange()
    if (props.initBap) {
      setBucketSize(props.initBap.bucketSize)
      setDidSubmit(props.initBap.didSubmit)
      if (props.initBap.didSubmit) {
        setTimeout(submitAnalysis, 3000)
      }
    }
    const [layer] = layers
    const fetchTimeDimension = async () => {
      const timeDimension = await layer.getTimeDimension()
      setTimeDimension(timeDimension)
    }
    fetchTimeDimension()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    props.setShareState({
      bucketSize: bucketSize,
      didSubmit: didSubmit
    })
  })

  useEffect(() => {
    clearCharts()
    featureChange()
    featureRef.current = props.feature
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.feature])

  useEffect(() => {
    if (props.isPriorityBap) {
      setTimeSliderState({ minSliderValue: timeDimension.minVal, maxSliderValue: timeDimension.maxVal })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isPriorityBap, timeDimension])

  const featureChange = () => {
    if (props.feature) {
      if (props.feature.properties.feature_id.includes('OBIS_Areas')) {
        props.isEnabled(false)
        props.canOpen(false)
      } else if (props.feature.properties.userDefined) {
        props.isEnabled(true)
        props.canOpen(true)
      } else {
        props.isEnabled(true)
        props.canOpen(true)
      }
    } else {
      props.canOpen(false)
      props.isEnabled(true)
    }
  }

  const submitAnalysis = () => {
    const feature = featureRef.current
    if (feature && !feature.properties.userDefined) {
      setLoading(true)
      setError(false)
      clearCharts()
      fetch(FIRSTLEAF_URL + `?year_min=${timeSliderState.rangeYearMin}&year_max=${timeSliderState.rangeYearMax}&feature_id=${feature.properties.feature_id}&token=${PUBLIC_TOKEN}`)
        .then(res => res.json())
        .then(
          (result) => {
            if (result) {
              props.setBapJson(result)
              const charts = getCharts({ histogram: result, ridgelinePlot: result, boxAndWhisker: result }, feature.properties.feature_name)
              setCharts(charts)
              setLoading(false)
              setDidSubmit(true)
              props.isEnabled(true)
              props.canOpen(true)
            } else {
              setLoading(false)
              props.isEnabled(false)
              props.canOpen(false)
            }
          },
          (_error) => {
            setLoading(false)
            setError(true)
          }
        )
    } else if (feature) {
      setLoading(true)
      setError(false)
      clearCharts()
      const request = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        method: 'post',
        body: JSON.stringify({
          geojson: feature.geometry
        })
      }
      fetch(FIRSTLEAF_POLY_URL + `?year_min=${timeSliderState.rangeYearMin}&year_max=${timeSliderState.rangeYearMax}&token=${PUBLIC_TOKEN}`, request)
        .then(res => res.json())
        .then(
          (result) => {
            if (result) {
              props.setBapJson(result)
              const charts = getCharts({ histogram: result, ridgelinePlot: result, boxAndWhisker: result }, feature.properties.feature_name)
              setCharts(charts)
              setLoading(false)
              setDidSubmit(true)
              props.isEnabled(true)
              props.canOpen(true)
            } else {
              setLoading(false)
              props.isEnabled(false)
              props.canOpen(false)
            }
          },
          (_error) => {
            setLoading(false)
            setError(true)
          }
        )
    }
  }

  const clearCharts = () => {
    setCharts(EMPTY_CHARTS)
    setDidSubmit(false)
  }

  /**
   * Loop through the charts defined in the state and look for a data object in datas that matches.
   * Create the chart id, data, and config as documented in the chart type.
   * @param {Object {}} datas - one enrty for each chart named the same as defined in the state
   */
  const getCharts = (datas: any, featureName: string): IFirstLeafAnalysisPackageCharts => {

    let newCharts = EMPTY_CHARTS

    if (datas.histogram) {
      const data = datas.histogram
      let firstYear = Object.keys(data)[0]
      let lastYear = Object.keys(data)[Object.keys(data).length - 1]
      const chartId = 'FL_Histogram'
      const chartConfig = {
        margins: { left: 80, right: 20, top: 20, bottom: 70 },
        chart: {
          title: `First Leaf Spring Index for ${featureName}`,
          subtitle: `All Years for the Period ${firstYear} to ${lastYear}`
        },
        xAxis: { label: 'Day of Year' },
        yAxis: { label: 'Number of Grid Cells' }
      }
      newCharts.histogram = { id: chartId, config: chartConfig, data: data }
    }

    if (datas.ridgelinePlot) {
      // To Do
      const data = datas.ridgelinePlot
      let firstYear = Object.keys(data)[0]
      let lastYear = Object.keys(data)[Object.keys(data).length - 1]
      const chartId = 'FL_RidgelinePlot'
      const chartConfig = {
        margins: { left: 80, right: 20, top: 35, bottom: 70 },
        chart: {
          title: `First Leaf Spring Index for ${featureName}`,
          subtitle: `By Year for the Period ${firstYear} to ${lastYear}`
        },
        xAxis: { label: 'Day of Year' },
        yAxis: { label: 'Year' }
      }
      newCharts.ridgelinePlot = { id: chartId, config: chartConfig, data: data }
    }

    if (datas.boxAndWhisker) {
      const data = datas.boxAndWhisker
      let firstYear = Object.keys(data)[0]
      let lastYear = Object.keys(data)[Object.keys(data).length - 1]
      const chartId = 'FL_BoxAndWhisker'
      const chartConfig = {
        margins: { left: 80, right: 20, top: 20, bottom: 70 },
        chart: {
          title: `First Leaf Spring Index for ${featureName}`,
          subtitle: `All Years for the Period ${firstYear} to ${lastYear}`
        },
        xAxis: { label: 'Year' },
        yAxis: { label: 'Day of Year' }
      }
      newCharts.boxAndWhisker = { id: chartId, config: chartConfig, data: data }
    }

    return newCharts
  }

  const print = () => {
    if (charts.histogram.data) {

      const chartsPrint = []
      chartsPrint.push(HistogramChartRef.current.print(charts.histogram.id))
      chartsPrint.push(BoxAndWhiskerChartRef.current.print(charts.boxAndWhisker.id))
      chartsPrint.push(RidgelinePlotChartRef.current.print(charts.ridgelinePlot.id))

      return Promise.all(chartsPrint.flat()).then(contents => {
        return [
          { stack: props.getSBItemForPrint() },
          {
            columns: [

              {
                width: 'auto',
                stack: [
                  { text: HistogramChartRef.current.props.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                  { text: HistogramChartRef.current.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                  { image: contents[0], alignment: 'center', width: 250 },
                  { text: BoxAndWhiskerChartRef.current.props.config.chart.title, style: 'chartTitle', margin: [5, 20, 5, 2] },
                  { text: BoxAndWhiskerChartRef.current.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                  { image: contents[1], alignment: 'center', width: 250 }
                ]
              },

              {
                width: 'auto',
                stack: [
                  { text: RidgelinePlotChartRef.current.props.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                  { text: RidgelinePlotChartRef.current.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                  { image: contents[2], alignment: 'center', width: 250 },
                  { text: 'First Leaf Spring Index data was provided by the', style: 'annotation', margin: [5, 10, 5, 0] },
                  { text: 'USA National Phenology Network', style: 'annotationLink', margin: [5, 0, 5, 0], link: 'https://www.usanpn.org' },
                  { text: `Data retrieved ${new Date().toDateString()}`, style: 'annotation', margin: [5, 0, 5, 0] }
                ]
              }
            ]
          }
        ]
      })
    }
    return []
  }

  const createUniqueBapContents = () => {
    return (
      <div>
        {props.getAnalysisLayers()}
        {props.handleBapError(error)}
        <div className="chartsDiv">
          <div className="chart-headers" >

            <button className="submit-analysis-btn" onClick={submitAnalysis}>Analyze Time Period: {timeSliderState.rangeYearMin} to {timeSliderState.rangeYearMax}</button>
            <div className="bucket-size-div" style={{ display: charts.histogram.data ? 'block' : 'none' }}>
              <span>Binwidth: {bucketSize}</span>
              <input
                onChange={(e) => setBucketSize(e.currentTarget.valueAsNumber)}
                defaultValue={bucketSize}
                min={1}
                max={5}
                step="1"
                type="range" />
            </div>
          </div>
          <HistogramChart ref={HistogramChartRef} data={charts.histogram.data} id={charts.histogram.id} config={charts.histogram.config} bucketSize={bucketSize} />
          <RidgelinePlotChart ref={RidgelinePlotChartRef} data={charts.ridgelinePlot.data} id={charts.ridgelinePlot.id} config={charts.ridgelinePlot.config} bucketSize={bucketSize} />
          <BoxAndWhiskerChart ref={BoxAndWhiskerChartRef} data={charts.boxAndWhisker.data} id={charts.boxAndWhisker.id} config={charts.boxAndWhisker.config} />
          <div className="chart-footers" >
            <div className="anotations">
              First Leaf Spring Index data was provided by the <a href="https://www.usanpn.org">USA National Phenology Network</a>, data retrieved {new Date().toDateString()}
              <br></br>
              <br></br>
              <a target={'_blank'} rel="noopener noreferrer" href={'https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&service=WMS&layers=average_leaf_prism'}>https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&amp;service=WMS&amp;layers=average_leaf_prism</a>
            </div>
          </div>
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

const FirstLeafAnalysis = withSharedAnalysisCharacteristics(forwardRef(FirstLeafAnalysisPackage), layers, sb_properties, SB_URL)
export default FirstLeafAnalysis
