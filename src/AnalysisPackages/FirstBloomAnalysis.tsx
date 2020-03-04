import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, FunctionComponent } from 'react'
import L from 'leaflet'
import { BarLoader } from 'react-spinners'
import withSharedAnalysisCharacteristics from './AnalysisPackage'
import BoxAndWhiskerChart from '../Charts/BoxAndWhiskerChart'
import HistogramChart from '../Charts/HistogramChart'
import RidgelinePlotChart from '../Charts/RidgelinePlotChart'
import './AnalysisPackages.css'
import AppConfig from '../config'
import { IChart } from '../Charts/Chart'

const SB_URL = 'https://www.sciencebase.gov/catalog/item/5abd5fede4b081f61abfc472?format=json'
const FIRSTBLOOM_URL = AppConfig.REACT_APP_BIS_API + '/api/v1/phenology/place/firstbloom'
const FIRSTBLOOM_POLY_URL = AppConfig.REACT_APP_BIS_API + '/api/v1/phenology/polygon/firstbloom'
const PUBLIC_TOKEN = AppConfig.REACT_APP_PUBLIC_TOKEN

let sb_properties = {
  'title': 'First Bloom Spring Index'
}

const layers = [
  {
    title: 'Average Bloom PRISM',
    layer: L.tileLayer.wms(
      'https://geoserver.usanpn.org/geoserver/si-x/wms',
      {
        format: 'image/png',
        layers: 'average_bloom_prism',
        opacity: .5,
        transparent: true
      }
    ),
    legend: {
      imageUrl: 'https://geoserver.usanpn.org/geoserver/si-x/wms??service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=average_bloom_prism'
    },
    timeEnabled: true,
    checked: false,
    sb_item: '5ac3b12ee4b0e2c2dd0c2b95'
  }
]

export interface IFirstBloomAnalysisPackageProps {
  initBap: { bucketSize: number, didSubmit: boolean }
  setShareState: Function
  feature: null | any
  isEnabled: Function
  canOpen: Function
  yearMin: number
  yearMax: number
  setBapJson: Function
  // HOC props
  isOpen: boolean
  getSBItemForPrint: Function
  getAnalysisLayers: Function
  handleBapError: Function
  getBapContents: Function
}

export interface IFirstBloomAnalysisPackageCharts {
    histogram: IChart
    ridgelinePlot: IChart
    boxAndWhisker: IChart
}

const FirstBloomAnalysisPackage: FunctionComponent<any> = (props: IFirstBloomAnalysisPackageProps, ref) => {
  const [charts, setCharts] = useState<IFirstBloomAnalysisPackageCharts>({
    histogram: { id: '', config: {}, data: null },
    ridgelinePlot: { id: '', config: {}, data: null },
    boxAndWhisker: { id: '', config: {}, data: null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [bucketSize, setBucketSize] = useState(3)
  const [didSubmit, setDidSubmit] = useState(false)

  const HistogramChartRef: any = useRef(null)
  const RidgelinePlotChartRef: any = useRef(null)
  const BoxAndWhiskerChartRef: any = useRef(null)

  useImperativeHandle(ref, () => ({
    print: print
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useEffect(() => {
    console.log('firstBloomAnalysis componentDidMount()')
    featureChange()
    if (props.initBap) {
      setBucketSize(props.initBap.bucketSize)
      setDidSubmit(props.initBap.didSubmit)
      if (props.initBap.didSubmit) {
        console.log('set timeout')
        setTimeout(submitAnalysis, 3000)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    console.log('firstBloomAnalysis componentDidUpdate')
    props.setShareState({
      bucketSize: bucketSize,
      didSubmit: didSubmit
    })
  })

  useEffect(() => {
    clearCharts()
    featureChange()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.feature])

  const featureChange = () => {
    if (props.feature) {
      if (props.feature.properties.feature_id.includes('OBIS_Areas')) {
        props.isEnabled(false)
        props.canOpen(false)
      } else if (props.feature.properties.userDefined) {
        props.isEnabled(true)
        props.canOpen(true)
        // setCanSubmit(true)
      } else {
        props.isEnabled(true)
        props.canOpen(true)
        // setCanSubmit(true)
      }
    } else {
      props.canOpen(false)
      props.isEnabled(true)
    }
  }

  const submitAnalysis = () => {
    if (props.feature && !props.feature.properties.userDefined) {
      setLoading(true)
      setError(false)
      clearCharts()
      fetch(FIRSTBLOOM_URL + `?year_min=${props.yearMin}&year_max=${props.yearMax}&feature_id=${props.feature.properties.feature_id}&token=${PUBLIC_TOKEN}`)
        .then(res => res.json())
        .then(
          (result) => {
            if (result) {
              props.setBapJson(result)
              const charts = getCharts({ histogram: result, ridgelinePlot: result, boxAndWhisker: result })
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
          (error) => {
            setLoading(false)
            setError(true)
          }
        )
    } else if (props.feature) {
      setLoading(true)
      setError(false)
      clearCharts()
      const request = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        method: 'post',
        body: JSON.stringify({
          geojson: props.feature.geometry
        })
      }
      fetch(FIRSTBLOOM_POLY_URL + `?year_min=${props.yearMin}&year_max=${props.yearMax}&token=${PUBLIC_TOKEN}`, request)
        .then(res => res.json())
        .then(
          (result) => {
            if (result) {
              props.setBapJson(result)
              const charts = getCharts({ histogram: result, ridgelinePlot: result, boxAndWhisker: result })
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
          (error) => {
            setLoading(false)
            setError(true)
          }
        )
    }
  }

  const clearCharts = () => {
    console.log('clearCharts??')
    let newCharts: any = {}
    for (let chart of Object.keys(charts)) {
      newCharts[chart] = { id: '', config: {}, data: null }
    }
    setCharts(newCharts)
    // setCanSubmit(false)
    setDidSubmit(false)
  }

  /**
   * Loop through the charts defined in the state and look for a data object in datas that matches.
   * Create the chart id, data, and config as documented in the chart type.
   * @param {Object {}} datas - one enrty for each chart named the same as defined in the state
   */
  const getCharts = (datas: any): IFirstBloomAnalysisPackageCharts => {

    let newCharts = {
      histogram: { id: '', config: {}, data: null },
      ridgelinePlot: { id: '', config: {}, data: null },
      boxAndWhisker: { id: '', config: {}, data: null }
    }

    if (datas.histogram) {
      const data = datas.histogram
      let firstYear = Object.keys(data)[0]
      let lastYear = Object.keys(data)[Object.keys(data).length - 1]
      const chartId = 'FB_Histogram'
      const chartConfig = {
          margins: { left: 80, right: 20, top: 20, bottom: 70 },
          chart: {
          title: `First Bloom Spring Index for ${props.feature.properties.feature_name}`,
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
      const chartId = 'FB_RidgelinePlot'
      const chartConfig = {
        margins: { left: 80, right: 20, top: 35, bottom: 70 },
        chart: {
          title: `First Bloom Spring Index for ${props.feature.properties.feature_name}`,
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
      const chartId = 'FB_BoxAndWhisker'
      const chartConfig = {
        margins: { left: 80, right: 20, top: 20, bottom: 70 },
        chart: {
          title: `First Bloom Spring Index for ${props.feature.properties.feature_name}`,
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
    console.log('FirstBloomPrint')
    if (charts.histogram.data && props.isOpen) {

      const chartsPrint = []
      chartsPrint.push(HistogramChartRef.print(charts.histogram.id))
      chartsPrint.push(BoxAndWhiskerChartRef.print(charts.boxAndWhisker.id))
      chartsPrint.push(RidgelinePlotChartRef.print(charts.ridgelinePlot.id))

      return Promise.all(chartsPrint.flat()).then(contents => {
        return [
          { stack: props.getSBItemForPrint() },
          {
            columns: [

              {
                width: 'auto',
                stack: [
                  { text: HistogramChartRef.props.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                  { text: HistogramChartRef.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                  { image: contents[0], alignment: 'center', width: 250 },
                  { text: BoxAndWhiskerChartRef.props.config.chart.title, style: 'chartTitle', margin: [5, 20, 5, 2] },
                  { text: BoxAndWhiskerChartRef.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                  { image: contents[1], alignment: 'center', width: 250 }
                ]
              },

              {
                width: 'auto',
                stack: [
                  { text: RidgelinePlotChartRef.props.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                  { text: RidgelinePlotChartRef.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                  { image: contents[2], alignment: 'center', width: 250 },
                  { text: 'First Bloom Spring Index data was provided by the', style: 'annotation', margin: [5, 10, 5, 0] },
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

            <button className="submit-analysis-btn" onClick={submitAnalysis}>Analyze Time Period: {props.yearMin} to  {props.yearMax}</button>
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
              First Bloom Spring Index data was provided by the <a href="https://www.usanpn.org">USA National Phenology Network</a>, data retrieved {new Date().toDateString()}
              <br></br>
              <br></br>
              <a target={'_blank'} rel="noopener noreferrer" href={'https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&service=WMSlayers=average_bloom_prism'}>https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&amp;service=WMS&amp;layers=average_bloom_prism</a>
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

const FirstBloomAnalysis = withSharedAnalysisCharacteristics(forwardRef(FirstBloomAnalysisPackage), layers, sb_properties, SB_URL)

export default FirstBloomAnalysis
