import "./AnalysisPackages.css";
import L from "leaflet";
import React from "react";
import TableChart from "../Charts/TableChart"
import {BarLoader} from "react-spinners"
import {isEmpty} from 'lodash'

import withSharedAnalysisCharacteristics from "./AnalysisPackage"
import AppConfig from "../config";

let SB_URL = "https://www.sciencebase.gov/catalog/item/5c6c58b3e4b0fe48cb3e5d13?format=json"

let sb_properties = {
  "title": "NVCS Summary"
}

const layers = [
  {
    title: "Class",
    titlePrefix: "GAP Landcover 2011 ",
    elasticTerm: 'class',
    layer: L.tileLayer.wms(
      "https://www.sciencebase.gov/geoserver/nvcs/wms",
      {
        format: "image/png",
        layers: "class",
        opacity: .5,
        transparent: true
      }
    ),
    legend: {
      imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=class"
    },
    timeEnabled: true,
    checked: false,
    sb_item: '58d1b8ade4b0236b68f6b88e'
  },
  {
    title: "Subclass",
    titlePrefix: "GAP Landcover 2011 ",
    elasticTerm: 'subclass',
    layer: L.tileLayer.wms(
      "https://www.sciencebase.gov/geoserver/nvcs/wms",
      {
        format: "image/png",
        layers: "subclass",
        opacity: .5,
        transparent: true
      }
    ),
    legend: {
      imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=subclass"
    },
    timeEnabled: true,
    checked: false,
    sb_item: '58d2b96ce4b0236b68f84d9f'
  },
  {
    title: "Formation",
    titlePrefix: "GAP Landcover 2011 ",
    elasticTerm: 'formation',
    layer: L.tileLayer.wms(
      "https://www.sciencebase.gov/geoserver/nvcs/wms",
      {
        format: "image/png",
        layers: "formation",
        opacity: .5,
        transparent: true
      }
    ),
    legend: {
      imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=formation"
    },
    timeEnabled: true,
    checked: false,
    sb_item: '58d1ba7ae4b0236b68f6b8a3'
  },
  {
    title: "Division",
    titlePrefix: "GAP Landcover 2011 ",
    elasticTerm: 'division',
    layer: L.tileLayer.wms(
      "https://www.sciencebase.gov/geoserver/nvcs/wms",
      {
        format: "image/png",
        layers: "division",
        opacity: .5,
        transparent: true
      }
    ),
    legend: {
      imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=division"
    },
    timeEnabled: true,
    checked: false,
    sb_item: '58d2ba5ae4b0236b68f84db5'
  },
  {
    title: "Macrogroup",
    titlePrefix: "GAP Landcover 2011 ",
    elasticTerm: 'macrogroup',
    layer: L.tileLayer.wms(
      "https://www.sciencebase.gov/geoserver/nvcs/wms",
      {
        format: "image/png",
        layers: "macrogroup",
        opacity: .5,
        transparent: true
      }
    ),
    legend: {
      imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=macrogroup"
    },
    timeEnabled: true,
    checked: false,
    sb_item: '58d1bad8e4b0236b68f6b8a5'
  },
  {
    title: "Group",
    titlePrefix: "GAP Landcover 2011 ",
    elasticTerm: 'group',
    layer: L.tileLayer.wms(
      "https://www.sciencebase.gov/geoserver/nvcs/wms",
      {
        format: "image/png",
        layers: "group",
        opacity: .5,
        transparent: true
      }
    ),
    legend: {
      imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=group"
    },
    timeEnabled: true,
    checked: false,
    sb_item: '58d2bab6e4b0236b68f84dba'
  },
  {
    title: "Ecological System",
    titlePrefix: "GAP Landcover 2011 ",
    elasticTerm: 'ecosystem',
    layer: L.tileLayer.wms(
      "https://www.sciencebase.gov/geoserver/nvcs/wms",
      {
        format: "image/png",
        layers: "ecological_system",
        opacity: .5,
        transparent: true
      }
    ),
    legend: {
      imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=ecological_system"
    },
    timeEnabled: true,
    checked: false,
    sb_item: '58d1bb47e4b0236b68f6b8a7'
  }

]

const NVCS_SUMM = AppConfig.REACT_APP_BIS_API + "/api/v1/nvcs/summary";


class NVCSSummaryByRegionPackage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      layersOpen: false,
      charts: {
        nvcsSummTable: {id: "", config: {}, data: null}
      },
    }
    this.enabledLayer = null

    this.print = this.print.bind(this)
    this.fetch = this.fetch.bind(this)
    this.createUniqueBapContents = this.createUniqueBapContents.bind(this)
  }

  componentDidMount() {
    this.props.onRef(this)
    this.fetch()
    if (this.props.initBap) {
      // do any initlizing here
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.feature !== this.props.feature) {
      this.fetch()
    }
    this.props.setShareState({})
  }

  componentWillReceiveProps(props) {
    if (props.layers) {
      let enabledLayer = Object.keys(props.layers).find((key) => {
        return props.layers[key].checked
      })
      if (enabledLayer && props.layers[enabledLayer] !== this.enabledLayer) {
        this.enabledLayer = props.layers[enabledLayer]
        this.fetch()
      }
    }
  }

  fetch() {
    if (isEmpty(this.props.feature)) return
    this.setState({
      loading: true,
      error: false
    })

    let level = "class"
    if (this.enabledLayer) {
      level = this.enabledLayer.elasticTerm
    }

    fetch(NVCS_SUMM + encodeURI(`?feature_id=${this.props.feature.properties.feature_id}&level=${level}`))
      .then((res) => res.json())
      .then((result) => {
        this.props.setBapJson(result)
        if (result && result.hits && result.hits.hits.length) {
          const charts = this.getCharts(result.hits.hits)
          this.setState({
            charts: charts,
            loading: false
          })
          this.props.isEnabled(true)
          this.props.canOpen(true)

        } else {
          this.setState({
            charts: {
              nvcsSummTable: {id: "", config: {}, data: null}
            }
          })
          this.props.isEnabled(false)
          this.props.canOpen(false)
        }
      })
      .catch(() => {
        this.setState({
          error: true,
          loading: false
        });
      })

  }

  getCharts(datas) {

    const numberWithCommas = (x) => {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    const chartId = "NVCS_SUMMTABLE"
    const chartConfig = {
      margins: {left: 20, right: 20, top: 20, bottom: 125},
      chart: {title: "NVCS " + (this.enabledLayer ? this.enabledLayer.title : "Class"), subtitle: ``},
    }
    let data = [['Land Cover Name', 'Acres']]

    for (let d of datas) {
      data.push([d._source.properties.nvcs_name, numberWithCommas(parseFloat(d._source.properties.acres).toFixed(0))])
    }


    return {nvcsSummTable: {id: chartId, config: chartConfig, data: data}}
  }



  print() {
    if (this.state.charts.nvcsSummTable.data && this.props.isOpen) {

      return [
        {stack: this.props.getSBItemForPrint()},

        {text: this.state.charts.nvcsSummTable.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 10]},
        {
          columns: [
            {
              width: 600,
              margin: [3, 0],
              stack: [
                {
                  style: 'tableStyle',
                  table: {
                    widths: ['50%', '30%'],
                    heights: 12,
                    body: this.state.charts.nvcsSummTable.data
                      .map((elm, i) => {
                        if (i === 0) {
                          return [{text: elm[0], bold: true, fontSize: 12}, {text: elm[1], bold: true, fontSize: 12}]
                        }
                        return [{text: elm[0], bold: true}, elm[1]]
                      })
                  }
                },
              ]
            }
          ]
        },
      ]
    }

  }


  createUniqueBapContents() {
    return (
      <div>
        {this.props.getAnalysisLayers()}
        {this.props.handleBapError(this.state.error)}
        <div className="chartsDiv">
          <div style={{padding: '10px'}}>

            {`The data displayed in this table defaults to the 'Class' hierarchy level. To change levels, select a new one from the above 'Analysis Inputs'.`}

          </div>
          <TableChart
            onRef={ref => (this.TableChart = ref)}
            data={this.state.charts.nvcsSummTable.data}
            id={this.state.charts.nvcsSummTable.id}
            config={this.state.charts.nvcsSummTable.config} />
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
const NVCSSummaryByRegion = withSharedAnalysisCharacteristics(NVCSSummaryByRegionPackage, layers, sb_properties, SB_URL, true);

export default NVCSSummaryByRegion;
