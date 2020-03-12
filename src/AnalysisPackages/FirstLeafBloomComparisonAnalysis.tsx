import React, { FunctionComponent, useState, useContext, useEffect, useImperativeHandle, useRef, forwardRef } from 'react'
import { BarLoader } from 'react-spinners'

import withSharedAnalysisCharacteristics from './AnalysisPackage'
import ComparisonChart from '../Charts/ComparisonChart'
import './AnalysisPackages.css'
import AppConfig from '../config'
import { TimeSliderContext } from '../Contexts/TimeSliderContext'
import { TimeEnabledLayer, defaultTimeDimension } from './TimeEnabledLayer'

const SB_URL = 'https://www.sciencebase.gov/catalog/item/5b685d1ce4b006a11f75b0a8?format=json'
const FIRSTLEAF_URL = AppConfig.REACT_APP_BIS_API + '/api/v1/phenology/place/firstleaf'
const FIRSTLEAF_POLY_URL = AppConfig.REACT_APP_BIS_API + '/api/v1/phenology/polygon/firstleaf'
const FIRSTBLOOM_URL = AppConfig.REACT_APP_BIS_API + '/api/v1/phenology/place/firstbloom'
const FIRSTBLOOM_POLY_URL = AppConfig.REACT_APP_BIS_API + '/api/v1/phenology/polygon/firstbloom'

const PUBLIC_TOKEN = AppConfig.REACT_APP_PUBLIC_TOKEN

let sb_properties = {
  'title': 'First Leaf / First Bloom Spring Index Comparison'
}

const layers = [
  new TimeEnabledLayer('Average Leaf PRISM', 'https://geoserver.usanpn.org/geoserver/si-x/wms', 'average_leaf_prism', '591c6ec6e4b0a7fdb43dea8a'),
  new TimeEnabledLayer('Average Bloom PRISM', 'https://geoserver.usanpn.org/geoserver/si-x/wms', 'average_bloom_prism', '5ac3b12ee4b0e2c2dd0c2b95'),
]

interface IFirstLeafBloomComparisonAnalysisPackageProps {
  initBap: { didSubmit: boolean }
  setShareState: Function
  feature: any
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

const EMPTY_CHARTS = {
  ComparisonChart: { id: '', config: {}, data: null }
}

const FirstLeafBloomComparisonAnalysisPackage: FunctionComponent<IFirstLeafBloomComparisonAnalysisPackageProps> = (props, ref) => {
  const [timeSliderState, setTimeSliderState] = useContext(TimeSliderContext)
  const [charts, setCharts] = useState(EMPTY_CHARTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [didSubmit, setDidSubmit] = useState(false)
  const [timeDimension, setTimeDimension] = useState(defaultTimeDimension)

  const ComparisonChartRef = useRef<any>(null)
  const featureRef = useRef(props.feature)

  useImperativeHandle(ref, () => ({
    print: print
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useEffect(() => {
    featureChange()
    if (props.initBap) {
      setDidSubmit(props.initBap.didSubmit)
      if (props.initBap.didSubmit) {
        setTimeout(submitAnalysis, 3000)
      }
    }
    const fetchTimeDimension = async () => {
      const res = await Promise.all(layers.map(l => l.getTimeDimension()))
      const minVal = Math.min(...res.map(td => td.minVal))
      const maxVal = Math.max(...res.map(td => td.maxVal))
      setTimeDimension({ minVal, maxVal, step: res[0].step })
    }
    fetchTimeDimension()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    props.setShareState({
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
      setTimeSliderState({minSliderValue: 1982, maxSliderValue: 2018})
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
      let firstLeafFetch = fetch(FIRSTLEAF_URL + `?year_min=${timeSliderState.rangeYearMin}&year_max=${timeSliderState.rangeYearMax}&feature_id=${feature.properties.feature_id}&token=${PUBLIC_TOKEN}`)
        .then(res => { return res.json() },
          (error) => {
            setError(true)
          })
      let firstBloomFetch = fetch(FIRSTBLOOM_URL + `?year_min=${timeSliderState.rangeYearMin}&year_max=${timeSliderState.rangeYearMax}&feature_id=${feature.properties.feature_id}&token=${PUBLIC_TOKEN}`)
        .then(res => { return res.json() },
          (error) => {
            setError(true)
          })
      Promise.all([firstLeafFetch, firstBloomFetch]).then(results => {
        if (results && results.length === 2) {
          props.setBapJson(results)
          const charts = getCharts({ ComparisonChart: { leaf: results[0], bloom: results[1] } }, feature.properties.feature_name)
          setCharts(charts)
          setLoading(false)
          setDidSubmit(true)
          props.isEnabled(true)
          props.canOpen(true)
        } else {
          props.isEnabled(false)
          props.canOpen(false)
          setLoading(false)
        }
      })
    } else if (feature) {
      setLoading(true)
      setError(false)
      clearCharts()
      const request = {
        headers: new Headers({ 'Content-Type': 'application/json'}),
        method: 'post',
        body: JSON.stringify({
          geojson: feature.geometry
        })
      }
      let firstLeafFetch = fetch(FIRSTLEAF_POLY_URL + `?year_min=${timeSliderState.rangeYearMin}&year_max=${timeSliderState.rangeYearMax}&token=${PUBLIC_TOKEN}`, request)
        .then(res => { return res.json() },
          (error) => {
            setError(true)
          })
      let firstBloomFetch = fetch(FIRSTBLOOM_POLY_URL + `?year_min=${timeSliderState.rangeYearMin}&year_max=${timeSliderState.rangeYearMax}&token=${PUBLIC_TOKEN}`, request)
        .then(res => { return res.json() },
          (error) => {
            setError(true)
          })
      Promise.all([firstLeafFetch, firstBloomFetch]).then(results => {
        if (results && results.length === 2) {
          props.setBapJson(results)
          const charts = getCharts({ ComparisonChart: { leaf: results[0], bloom: results[1] } }, feature.properties.feature_name)
          setCharts(charts)
          setLoading(false)
          setDidSubmit(true)
          props.isEnabled(true)
          props.canOpen(true)
        } else {
          props.isEnabled(false)
          props.canOpen(false)
          setLoading(false)
        }
      })
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
  const getCharts = (datas: any, featureName: string) => {

    let newCharts = EMPTY_CHARTS

    if (datas.ComparisonChart) {
      const data = datas.ComparisonChart
      let firstYear = Object.keys(data.bloom)[0]
      let lastYear = Object.keys(data.bloom)[Object.keys(data.bloom).length - 1]
      const chartId = 'FL_FB_Comparison'
      const chartConfig = {
        margins: { left: 80, right: 20, top: 20, bottom: 70 },
        chart: { title: `First Bloom Spring Index/First Leaf Spring Index for  ${featureName}`, subtitle: `By Year for the Period ${firstYear} to ${lastYear}` },
        xAxis: { label: 'Day of Year' },
        yAxis: { label: 'Year' }
      }
      charts.ComparisonChart = { id: chartId, config: chartConfig, data: data }
    }

    return newCharts
  }

  const print = () => {
    console.log('wer ere')
    if (charts.ComparisonChart.data) {
      return [
        ComparisonChartRef.current.print(charts.ComparisonChart.id)
          .then((img: any) => {
            return [
              { stack: props.getSBItemForPrint() },
              { text: ComparisonChartRef.current.props.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
              { text: ComparisonChartRef.current.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
              { image: img, alignment: 'center', width: 450 },
              { text: 'First Leaf / First Bloom Spring Index Comparison data were provided by the', style: 'annotation', margin: [5, 10, 5, 0] },
              { text: 'USA National Phenology Network', style: 'annotationLink', margin: [5, 0, 5, 0], link: 'https://www.usanpn.org' },
              { text: `Data retrieved ${new Date().toDateString()}`, style: 'annotation', margin: [5, 0, 5, 0] }
            ]
          })
      ]
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
          </div>
          <ComparisonChart ref={ComparisonChartRef} data={charts.ComparisonChart.data} id={charts.ComparisonChart.id} config={charts.ComparisonChart.config} />
          <div className="chart-footers" >
            <div className="anotations">
              First Leaf / First Bloom Spring Index Comparison data were provided by the <a href="https://www.usanpn.org">USA National Phenology Network</a>, data retrieved {new Date().toDateString()}
              <br></br>
              <br></br>
              <a target={'_blank'} rel="noopener noreferrer" href={'https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&service=WMS&layers=average_leaf_prism,average_bloom_prism'}>https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&amp;service=WMS&amp;layers=average_leaf_prism,average_bloom_prism</a>
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

const FirstLeafBloomComparisonAnalysis = withSharedAnalysisCharacteristics(forwardRef(FirstLeafBloomComparisonAnalysisPackage), layers, sb_properties, SB_URL)
export default FirstLeafBloomComparisonAnalysis
