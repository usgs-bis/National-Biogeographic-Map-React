import React from 'react'
import { BarLoader } from 'react-spinners';
import L from "leaflet"
import * as turf from '@turf/turf'
import withSharedAnalysisCharacteristics from './AnalysisPackage';
import HorizontalBarChart from '../Charts/HorizontalBarChart';

const SB_URL = 'https://www.sciencebase.gov/catalog/item/5a87249de4b00f54eb3a2e1e?format=json';
const EXPECTED_LAND_USE_ENDPOINT = process.env.REACT_APP_BIS_API + '/api/v1/expectedlanduse/';

const sb_properties = {
  title: "Expected Land Use"
}

const layers = [
  {
    title: 'Expected Land Use',
    layer: L.tileLayer.wms(
        "https://dev-blm.sciencebase.gov/geoserver/bcb/wms",
        {
          layers: ['classified_chance_of_development'],
          format: "image/png",
          opacity: .5,
          transparent: true
        }
    ),
    legend: {
        imageUrl: "https://dev-blm.sciencebase.gov:443/geoserver/bcb/ows?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=classified_chance_of_development"
    },
    checked: false,
    sb_item: '5a87249de4b00f54eb3a2e1e'
  }
]

class ExpectedLandUseAnalysisPackage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      charts: {
        barChart: { id: '', config: {}, data: null }
      }
    }

    // this.barChart = React.createRef()

    this.getCharts = this.getCharts.bind(this)
    this.print = this.print.bind(this)
    this.featureChange = this.featureChange.bind(this)
    this.fetch = this.fetch.bind(this)
    this.createUniqueBapContents = this.createUniqueBapContents.bind(this)
  }

  componentDidMount() {
    this.props.onRef(this)
    this.featureChange()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.feature !== this.props.feature) {
        this.featureChange()
    }
    this.props.setShareState({})
  }

  featureChange() {
    if (this.props.feature) {
      this.fetch()
      return
    }
    this.props.canOpen(false)
    this.props.isEnabled(true)
  }

  fetch() {
    this.setState({
        loading: true,
        error: false
    })

    const request = this.props.feature.properties.userDefined ?
      fetch(EXPECTED_LAND_USE_ENDPOINT + `polygon?geojson=${JSON.stringify(this.props.feature.geometry)}`) :
      fetch(EXPECTED_LAND_USE_ENDPOINT + `place?feature_id=${this.props.feature.properties.feature_id}`)

    request
      .then(res => res.json())
      .then(values => {
        if (!values.success) {
          this.setState({
            loading: false,
            error: true
          })
          return
        }
        this.setState({
          charts: this.getCharts(values),
          loading: false
        })
        this.props.isEnabled(true)
        this.props.canOpen(true)
      })
  }

  /**
   * Loop through the charts defined in the state and look for a data object in datas that matches.
   * Create the chart id, data, and config as documented in the chart type.
   * @param {Object {}} datas - one enrty for each chart named the same as defined in the state
   */
  getCharts(datas) {

    const numberWithCommas = (x) => {
        return x.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let charts = {}
    
    const labels = [
      {short: '0%', long: 'No Threat - 0%', color: '#CCCCCC'},
      {short: '1-33%', long: 'Low Threat - 1 to 33%', color: '#48A908'},
      {short: '34-66%', long: 'Medium Threat - 34 to 66%', color: '#F7ED5F'},
      {short: '67-100%', long: 'High Threat - 67 to 100%', color: '#EC2D1A'}
    ]
    for (let key in this.state.charts ) {
      if(key === 'barChart') {
        const data = datas.result
        const chartId = 'ExpectedLandUse_BarChart'
        const chartConfig = {
          margins: { left: 100, right: 20, top: 20, bottom: 70 },
          chart: { title: 'Expected Land Use Change' },
          xAxis: { key: 'area', label: "Area (acres)", ticks: 5, }, //tickFormat: (d) => { return `${parseInt(d)}%` } },
          yAxis: { key: 'value', label: "Threat", ticks: 4, tickFormat: (d, idx) => { return labels[idx].short } },
          tooltip: { label: (d, idx) => { return `<p>${d.label.long}: ${numberWithCommas(d.area)} acres</p>` } }
        }
        const chartData = data.map((d, idx) => {
          return {
            value: d.value,
            area: turf.convertArea(d.area, 'meters', 'acres'),
            label: labels[idx],
            color: labels[idx].color
          }
        })
        charts[key] = { id: chartId, config: chartConfig, data: chartData }
      }
    }

    return charts
  }

  print() {
      if (this.state.charts.barChart.data && this.props.isOpen) {
          return [
              this.barChart.print(this.state.charts.barChart.id)
                  .then(img => {
                      return [
                          { stack: this.props.getSBItemForPrint() },
                          { text: this.barChart.props.config.chart.title, style: 'chartTitle' },
                          { text: this.barChart.props.config.chart.subtitle, style: 'chartSubtitle' },
                          { image: img, alignment: 'center', width: 450 }
                      ]
                  })
          ]
      }
      return []
  }

  createUniqueBapContents() {
    return (
      <div>
        {this.props.getAnalysisLayers()}
        {this.props.handleBapError(this.state.error)}
        <div className="chartsDiv">
          <HorizontalBarChart
              onRef={ref => (this.barChart = ref)}
              data={this.state.charts.barChart.data}
              id={this.state.charts.barChart.id}
              config={this.state.charts.barChart.config}
          />
        </div>
      </div>
    )
  }

  render() {
    return (
      <div>
        <BarLoader width={100} widthUnit={"%"} color={"white"} loading={this.state.loading} />
        {this.props.getBapContents(this.createUniqueBapContents)}
      </div>
    )
  }
}

const ExpectedLandUseAnalysis = withSharedAnalysisCharacteristics(ExpectedLandUseAnalysisPackage, layers, sb_properties, SB_URL);

export default ExpectedLandUseAnalysis;