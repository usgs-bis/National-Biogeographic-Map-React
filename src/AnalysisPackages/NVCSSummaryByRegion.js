import React from "react";
import { BarLoader } from "react-spinners"
import L from "leaflet";
import TableChart from "../Charts/TableChart"
import "./AnalysisPackages.css";

import withSharedAnalysisCharacteristics from "./AnalysisPackage"

let SB_URL = "https://www.sciencebase.gov/catalog/item/5c6c58b3e4b0fe48cb3e5d13?format=json"

let sb_properties = {
    "title": "NVCS Summary"
}

const layers = {
    class_service: {
        title: "Class",
        titlePrefix: "GAP Landcover 2011 ",
        elasticTerm: 'nvc_class',
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
        checked: false
    },
    subclass_service: {
        title: "Subclass",
        titlePrefix: "GAP Landcover 2011 ",
        elasticTerm: 'nvc_subcl',
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
        checked: false
    },
    formation_service: {
        title: "Formation",
        titlePrefix: "GAP Landcover 2011 ",
        elasticTerm: 'nvc_form',
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
        checked: false
    },
    division_service: {
        title: "Division",
        titlePrefix: "GAP Landcover 2011 ",
        elasticTerm: 'nvc_div',
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
        checked: false
    },
    macrogroup_service: {
        title: "Macrogroup",
        titlePrefix: "GAP Landcover 2011 ",
        elasticTerm: 'nvc_macro',
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
        checked: false
    },
    nvc_group_service: {
        title: "Group",
        titlePrefix: "GAP Landcover 2011 ",
        elasticTerm: 'nvc_group',
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
        checked: false
    },
    ecosys_lu_service: {
        title: "Ecological System",
        titlePrefix: "GAP Landcover 2011 ",
        elasticTerm: 'ecosys_lu',
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
        checked: false
    },

}
let NVCS_SUMM_ECO_URL = "https://my-beta.usgs.gov/bcb/elastic/search/nvcs/eco_l3_nvc_summ?q="
let NVCS_SUMM_LCC_URL = "https://my-beta.usgs.gov/bcb/elastic/search/nvcs/lcc_nvc_summ?q="
let NVCS_SUMM_STATE_URL = "https://my-beta.usgs.gov/bcb/elastic/search/nvcs/state_nvc_summ?q="
let NVCS_SUMM_COUNTY_URL = "https://my-beta.usgs.gov/bcb/elastic/search/nvcs/county_nvc_summ?q="


class NVCSSummaryByRegionPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            layersOpen: false,
            charts: {
                nvcsSummTable: { id: "", config: {}, data: null }
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
    }

    componentDidUpdate(prevProps) {
        if (prevProps.feature !== this.props.feature) {
            this.fetch()
        }
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
        if (!this.props.feature) return
        this.setState({
            loading: true
        })
        let searchURL = null
        switch (this.props.feature.properties.feature_class) {
            case 'Ecoregion III':
                searchURL = NVCS_SUMM_ECO_URL
                sb_properties.title = "NVCS Summary within Ecoregion III Area"
                //SB_URL = "https://www.sciencebase.gov/catalog/item/580ff6e4e4b0f497e7960b53?format=json"
                break;
            case 'Landscape Conservation Cooperatives':
                searchURL = NVCS_SUMM_LCC_URL
                sb_properties.title = "NVCS Summary within LCC Area"
                //SB_URL = "https://www.sciencebase.gov/catalog/item/580ffa58e4b0f497e7960b5e?format=json"

                break;
            case 'US States and Territories':
                searchURL = NVCS_SUMM_STATE_URL
                sb_properties.title = "NVCS Summary within State"
                //SB_URL = "https://www.sciencebase.gov/catalog/item/580a50ece4b0f497e7906700?format=json"

                break;
            case 'US County':
                searchURL = NVCS_SUMM_COUNTY_URL
                sb_properties.title = "NVCS Summary within County"
                //SB_URL = "https://www.sciencebase.gov/catalog/item/5811385de4b0f497e799c5da?format=json"

                break;
            default:
                searchURL = null
        }


        let featureIdArray = this.props.feature.properties.feature_id.split(":")
        let term = {}
        if (featureIdArray.length === 3) {
            term[`properties.${featureIdArray[1]}`] = featureIdArray[2]
        }

        let nvcs_class = { "properties.level": 'nvc_class' }
        if (this.enabledLayer) {
            nvcs_class = { "properties.level": `${this.enabledLayer.elasticTerm}` }
        }

        const query = { "from": 0, "size": 50, "query": { "bool": { "must": [{ "match": term }, { "match": nvcs_class }] } } }
        fetch(searchURL + encodeURI(JSON.stringify(query)))
            .then(res => res.json())
            .then(
                (result) => {
                    if (result && result.success.hits.hits.length) {
                        const charts = this.getCharts(result.success.hits.hits)
                        this.setState({
                            charts: charts,
                            loading: false
                        })
                        this.props.isEnabled(true)
                        this.props.canOpen(true)

                    } else {
                        this.setState({
                            charts: {
                                nvcsSummTable: { id: "", config: {}, data: null }
                            }
                        })
                        this.props.isEnabled(false)
                        this.props.canOpen(false)
                    }
                },
                (error) => {
                    this.setState({
                        error,
                        loading: false
                    });
                }
            )
    }

    getCharts(datas) {

        const numberWithCommas = (x) => {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        const chartId = "NVCS_SUMMTABLE"
        const chartConfig = {
            margins: { left: 20, right: 20, top: 20, bottom: 125 },
            chart: { title: "NVCS " + (this.enabledLayer ? this.enabledLayer.title : "Class"), subtitle: `` },
        }
        let data = [['Land Cover Name', 'Acres']]

        for (let d of datas) {
            data.push([d._source.properties.nvcs_name, numberWithCommas(parseFloat(d._source.properties.acres).toFixed(0))])
        }


        return { nvcsSummTable: { id: chartId, config: chartConfig, data: data } }
    }


    print() {
        return []
    }
    createUniqueBapContents() {
        return (
            <div>
                {this.props.getAnalysisLayers()}
                <div className="chartsDiv">
                    <TableChart
                        onRef={ref => (this.TableChart = ref)}
                        data={this.state.charts.nvcsSummTable.data}
                        id={this.state.charts.nvcsSummTable.id}
                        config={this.state.charts.nvcsSummTable.config} />
                    <br></br>
                    This BAP still gets value from the old API, that data needs to move to the new flask API
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
const NVCSSummaryByRegion = withSharedAnalysisCharacteristics(NVCSSummaryByRegionPackage, layers, sb_properties, SB_URL);

export default NVCSSummaryByRegion;
