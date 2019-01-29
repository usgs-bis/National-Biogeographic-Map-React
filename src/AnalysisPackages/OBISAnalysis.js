import React from "react";
import { DynamicMapLayer } from "esri-leaflet"
import { BarLoader } from "react-spinners"

import SpeciesCountChart from "../Charts/SpeciesCountChart";
import "./AnalysisPackages.css";

import withSharedAnalysisCharacteristics from "./AnalysisPackage"

const SB_URL = "https://www.sciencebase.gov/catalog/item/5b7c1ef2e4b0f5d5788601be?format=json"
const OBIS_URL = "https://api.obis.org/v3/statistics/composition/class?areaid=";

let sb_properties = {
    "title": "Most Reported Marine Species per Exclusive Economic Zone"
}

const layers = {
    nfhp_service: {
        title: "Risk to Fish Habitat Degradation",
        layer: new DynamicMapLayer({
            url: "https://gis1.usgs.gov/arcgis/rest/services/nfhp2015/HCI_Dissolved_NFHP2015_v20160907/MapServer",
            opacity: .5
        }),
        checked: false
    }
}

class OBISAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                speciesCountChart: { id: "", config: {}, data: null }
            },
            layersOpen: false,
            value: []
        }

        this.getCharts = this.getCharts.bind(this)
        this.handelNoData = this.handelNoData.bind(this)
        this.print = this.print.bind(this)

    }

    componentDidMount() {
        this.props.onRef(this)
    }

    handelNoData() {
        this.setState({
            charts: {
                speciesCountChart: { id: "", config: {}, data: null }
            },
            layers: this.props.resetAnalysisLayers()
        })
        this.props.isEnabled(false)
        this.props.canOpen(false)
    }

    componentDidUpdate(prevProps) {
        if (this.props.feature &&
            this.props.feature.properties.feature_id &&
            (!prevProps.feature || this.props.feature.properties.feature_id !== prevProps.feature.properties.feature_id)) {
            if (this.props.feature.properties.feature_id.includes('OBIS_Areas:')) {
                this.setState({
                    loading: true
                })
                fetch(OBIS_URL + this.props.feature.properties.feature_id.split(':')[1])
                    .then(res => res.json())
                    .then(
                        (result) => {
                            console.log(result)
                            if (result) {
                                const charts = this.getCharts(result)
                                this.setState({
                                    charts: charts,
                                    loading: false
                                })
                                this.props.isEnabled(true)
                                this.props.canOpen(true)

                            } else {
                                this.handelNoData()
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
            else {
                this.handelNoData()
            }
        }
        else {

        }
    }

    /**
     * Loop through the charts defined in the state and look for a data object in datas that matches.
     * Create the chart id, data, and config as documented in the chart type.
     * @param {Object {}} data - one enrty for each chart named the same as defined in the state
     */
    getCharts(data) {

        const numberWithCommas = (x) => {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let charts = {}

        for (let chart of Object.keys(this.state.charts)) {

            let classData = []

            Object.keys(data).forEach(d => {
                classData.push(
                    {
                        name: d + ` (${data[d].species})`,
                        value: data[d].records,
                        species: data[d].species,
                        shortName: d
                    }
                )
            })


            if (chart.toString() === "speciesCountChart" && data) {

                const chartId = "NFHP_speciesCountChart"
                const chartConfig = {
                    margins: { left: 225, right: 20, top: 20, bottom: 70 },
                    chart: { title: `Observation By Class For OBIS Area In ${this.props.feature.properties.feature_name}`, subtitle: `` },
                    xAxis: { key: 'records', label: "Records", ticks: 5, tickFormat: (d) => { return `${numberWithCommas(parseInt(d))}` } },
                    yAxis: { key: 'class', label: "Class", ticks: 5, tickFormat: (d) => { return d } },
                    tooltip: {
                        label: (d) => {
                            return `<p>
                    Name: <label>${d.shortName}</label> <br>
                    Records: <label>${numberWithCommas(parseInt(d.value))}</label> <br>
                    Species: <label>${numberWithCommas(parseInt(d.species))}</label> <br>
                    </p>` }
                    }
                }
                charts[chart] = { id: chartId, config: chartConfig, data: classData }
            }
        }
        return charts
    }

    // print() {
    //     if (this.state.charts.speciesCountChart.data) {
    //         return [
    //             this.SpeciesCountChart.print(this.state.charts.speciesCountChart.id)
    //         ]
    //     }
    //     return []
    // }

    print() {
        if (this.state.charts.speciesCountChart.data) {
            return [
                this.SpeciesCountChart.print(this.state.charts.speciesCountChart.id)
                    .then(img => {
                        return [
                            { text: sb_properties.title, style: 'analysisTitle', margin: [5, 2, 5, 20], pageBreak: 'before' },
                            { text: this.state.charts.speciesCountChart.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                            { image: img, alignment: 'center', width: 450 }
                        ]
                    })
            ]
        }
        return []
    }

    render() {
        return (
            <div>
                <BarLoader color={"white"} loading={this.state.loading} />
                {this.props.getAnalysisLayers()}
                <div className="chartsDiv">
                    <SpeciesCountChart
                        onRef={ref => (this.SpeciesCountChart = ref)}
                        data={this.state.charts.speciesCountChart.data}
                        id={this.state.charts.speciesCountChart.id}
                        config={this.state.charts.speciesCountChart.config} />
                </div>
            </div>
        )
    }
}
const OBISAnalysis = withSharedAnalysisCharacteristics(OBISAnalysisPackage, layers, sb_properties, SB_URL);

export default OBISAnalysis;
