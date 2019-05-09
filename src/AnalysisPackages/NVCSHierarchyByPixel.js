import React from "react";
import { BarLoader } from "react-spinners"
import L from "leaflet";
import AccordionChart from "../Charts/AccordionChart"
import "./AnalysisPackages.css";
import withSharedAnalysisCharacteristics from "./AnalysisPackage"

const SB_URL = "https://www.sciencebase.gov/catalog/item/582a1819e4b01fad8726554a?format=json"
const PIXEL_URL = "https://www.sciencebase.gov/geoserver/nvcs/wms"

let sb_properties = {
    "title": "NVCS Hierarchy by Pixel"
}

const HBP_URL = process.env.REACT_APP_BIS_API + "/api/v1/nvcs/hierarchy_by_pixel?pixel_value=";


const layers = {
    class_service: {
        title: "Class",
        titlePrefix: "GAP Landcover 2011 ",
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
    subclass_service: {
        title: "Subclass",
        titlePrefix: "GAP Landcover 2011 ",
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
    formation_service: {
        title: "Formation",
        titlePrefix: "GAP Landcover 2011 ",
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
    division_service: {
        title: "Division",
        titlePrefix: "GAP Landcover 2011 ",
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
    macrogroup_service: {
        title: "Macrogroup",
        titlePrefix: "GAP Landcover 2011 ",
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
    nvc_group_service: {
        title: "Group",
        titlePrefix: "GAP Landcover 2011 ",
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
    ecosys_lu_service: {
        title: "Ecological System",
        titlePrefix: "GAP Landcover 2011 ",
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

    },

}
class NVCSHierarchyByPixelPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            layersOpen: false,
            pixelValue: null,
            charts: {
                pixelHierarchy: { id: "", config: {}, data: null }
            },
            enabledLayer: null
        }

        this.print = this.print.bind(this)
        this.fetch = this.fetch.bind(this)
        this.createUniqueBapContents = this.createUniqueBapContents.bind(this)
        this.getHBPData = this.getHBPData.bind()
        this.getCharts = this.getCharts.bind(this)

    }

    componentDidMount() {
        this.props.onRef(this)
        this.fetch()
    }

    componentDidUpdate(prevProps) {
        // simple objects wont be the same bit the json representation should be
        if (JSON.stringify(prevProps.point) !== JSON.stringify(this.props.point)) {
            this.fetch()
        }
    }

    componentWillReceiveProps(props) {
        if (props.layers) {
            let enabledLayer = Object.keys(props.layers).find((key) => {
                return props.layers[key].checked
            })
            if (enabledLayer && this.state.charts.pixelHierarchy.data) {

                let match = this.state.charts.pixelHierarchy.data.find((d) => {
                    return Object.keys(d)[0].includes(props.layers[enabledLayer].title)
                })
                if (match) {
                    this.setState({
                        enabledLayer: Object.keys(match)[0]
                    })
                }
            }
            else {
                this.setState({
                    enabledLayer: null
                })
            }
        }
    }


    fetch() {
        if (!this.props.point.lat || !this.props.point.lng) return

        this.setState({
            loading: true,
            error: false
        })
        let buffer = .01;
        var parameters = {
            service: 'WMS',
            version: '1.3',
            request: 'GetFeatureInfo',
            layers: "ecological_system",
            query_layers: "ecological_system",
            feature_count: 50,
            info_format: 'application/json',
            CRS: 'EPSG:4326',
            buffer: 1,
            width: 101,
            height: 101,
            x: 50,
            y: 50,
            bbox: (this.props.point.lng - buffer) + ',' + (this.props.point.lat - buffer) + ',' +
                (this.props.point.lng + buffer) + ',' + (this.props.point.lat + buffer)
        }
        var url = new URL(PIXEL_URL)
        Object.keys(parameters).forEach(key => url.searchParams.append(key, parameters[key]))
        fetch(url)
            .then(res => res.json())
            .then(
                (result) => {
                    this.props.setBapJson(result)
                    let pixelValue = null
                    if (result["features"].length) {
                        pixelValue = result["features"][0]["properties"]["pixel_value"]
                    }
                    this.getHBPData(pixelValue, this)
                },
                (error) => {
                    this.setState({
                        error: true,
                        loading: false
                    });
                }
            )
    }

    getHBPData(pixelValue, that) {
        fetch(HBP_URL + pixelValue)
            .then(res => res.json())
            .then(
                (result) => {
                    if (result && result.hits && result.hits.hits.length) {
                        const hbpData = result.hits.hits[0]["_source"]["properties"]
                        const charts = that.getCharts({ pixelHierarchy: hbpData })
                        that.setState({
                            pixelValue: pixelValue,
                            loading: false,
                            charts: charts
                        })
                        that.props.isEnabled(true)
                        that.props.canOpen(true)

                    } else {
                        that.setState({
                            pixelValue: null,
                            loading: false,
                            charts: {
                                pixelHierarchy: { id: "", config: {}, data: null }
                            }
                        })
                        that.props.isEnabled(false)
                        that.props.canOpen(false)
                    }
                },
                (error) => {
                    that.setState({
                        error,
                        loading: false
                    });
                }
            )
    }

    getCharts(datas) {
        if (!datas || !datas.pixelHierarchy) return { pixelHierarchy: { id: "", config: {}, data: null } }
        datas = datas.pixelHierarchy
        const chartId = 'HBPAccordian'
        const chartTitle = `NVCS Hierarchy by Pixel`
        const chartConfig = {
            margins: { left: 20, right: 20, top: 20, bottom: 125 },
            chart: { title: chartTitle, subtitle: `` },
        }
        let data = []
        const prefixes = [
            "ecosystem_",
            "group_",
            "macrogroup_",
            "division_",
            "formation_",
            "subclass_",
            "class_"
        ];

        for (let prefix of prefixes) {
            let title = `${datas[`${prefix}type`]} ${datas[`${prefix}code`]} ${datas[`${prefix}title`]}`
            let content = datas[`${prefix}description`]
            let obj = {}
            obj[title] = content
            data.push(obj)

        }
        data.reverse()
        return {
            pixelHierarchy: { id: chartId, config: chartConfig, data: data }
        }
    }


    print() {
        if (this.state.charts.pixelHierarchy.data && this.props.isOpen) {
            let content = []
            for (let entry of this.state.charts.pixelHierarchy.data) {
                let key = Object.keys(entry)[0]
                content.push({ text: key, style: 'sbPropertiesTitle', margin: [5, 5, 0, 5] })
                content.push({ text: entry[key], style: 'sbProperties', margin: [10, 5, 0, 5] })
            }
            let report = [
                { stack: this.props.getSBItemForPrint() },
                { text: this.state.charts.pixelHierarchy.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 10] },
                { stack: content }
            ]
            return report
        }
    }

    createUniqueBapContents() {
        return (
            <div>
                {this.props.getAnalysisLayers()}
                {this.props.handleBapError(this.state.error)}
                <div className="chartsDiv">
                    <AccordionChart
                        onRef={ref => (this.AccordionChart = ref)}
                        data={this.state.charts.pixelHierarchy.data}
                        id={this.state.charts.pixelHierarchy.id}
                        config={this.state.charts.pixelHierarchy.config}
                        highlight={this.state.enabledLayer}
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
const NVCSHierarchyByPixel = withSharedAnalysisCharacteristics(NVCSHierarchyByPixelPackage, layers, sb_properties, SB_URL, true);

export default NVCSHierarchyByPixel;
