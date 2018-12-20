import React from "react";
import { DynamicMapLayer } from "esri-leaflet"
import { BarLoader } from "react-spinners"

import HorizontalBarChart from "../Charts/HorizontalBarChart";
import "./AnalysisPackages.css";

import withSharedAnalysisCharacteristics from "./AnalysisPackage"

const SB_URL = "https://www.sciencebase.gov/catalog/item/5aa2b21ae4b0b1c392e9d968?format=json"
const NFHP_URL = process.env.REACT_APP_BIS_API + "/api/v1/nfhpmetrics/condition?feature_id=";

let sb_properties = {
    "title": "Fish Habitat Condition and Disturbance Summaries"
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

class NFHPAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                horizontalBarChart: { id: "", config: {}, data: null }
            },
            layersOpen: false,
            value: []
        }

        this.getCharts = this.getCharts.bind(this)
    }

    componentDidUpdate(prevProps) {
        if (this.props.feature &&
            this.props.feature.properties.feature_id &&
            (!prevProps.feature || this.props.feature.properties.feature_id !== prevProps.feature.properties.feature_id)) {
            this.setState({
                loading: true
            })
            fetch(NFHP_URL + this.props.feature.properties.feature_id)
                .then(res => res.json())
                .then(
                    (result) => {
                        if (result && result.hits.hits[0]) {
                            const charts = this.getCharts({ horizontalBarChart: result.hits.hits[0]._source.properties })
                            this.setState({
                                charts: charts,
                                loading: false
                            })
                            this.props.isEnabled(true)
                            this.props.canOpen(true)

                        } else {
                            this.setState({
                                charts: {
                                    horizontalBarChart: { id: "", config: {}, data: null }
                                },
                                layers: this.props.resetAnalysisLayers()
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
    }

    /**
     * Loop through the charts defined in the state and look for a data object in datas that matches.
     * Create the chart id, data, and config as documented in the chart type.
     * @param {Object {}} datas - one enrty for each chart named the same as defined in the state
     */
    getCharts(datas) {

        function getPercent(value, scoredKm) {
            value = parseFloat(value)
            return parseFloat(((value / parseFloat(scoredKm)) * 100).toFixed(1))
        }
        const numberWithCommas = (x) => {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let charts = {}

        for (let chart of Object.keys(this.state.charts)) {

            if (chart.toString() === "horizontalBarChart" && datas[chart]) {

                const data = datas[chart]
                const chartId = "NFHP_HorizontalBarChart"
                const chartConfig = {
                    margins: { left: 100, right: 20, top: 20, bottom: 70 },
                    chart: { title: `Risk to Fish Habitat Degradation ${this.props.feature.properties.feature_name}`, subtitle: `Fish habitat condition was scored on ${numberWithCommas(parseFloat(data.scored_km).toFixed(0))} of ${numberWithCommas((parseFloat(data.scored_km) + parseFloat(data.not_scored_km)).toFixed(0))}' NHDPlusV1 stream kilometers within ${data.place_name}` },
                    xAxis: { key: 'Percent', label: "NFHP Scored Stream Kilometers [%]", ticks: 5, tickFormat: (d) => { return `${parseInt(d)}%` } },
                    yAxis: { key: 'Risk', label: "Risk To Fish Habitat Degradation", ticks: 5, tickFormat: (d) => { return d } },
                    tooltip: { label: (d) => { return `<p>${d.Risk}: ${d.Percent}%</p>` } }
                }
                const chartData = [
                    { "Risk": "Very high", "Percent": getPercent(data.veryhigh_km, data.scored_km), "color": "#FF0000" },
                    { "Risk": "High", "Percent": getPercent(data.high_km, data.scored_km), "color": "#FFAA00" },
                    { "Risk": "Moderate", "Percent": getPercent(data.moderate_km, data.scored_km), "color": "#A3FF73" },
                    { "Risk": "Low", "Percent": getPercent(data.low_km, data.scored_km), "color": "#00C5FF" },
                    { "Risk": "Very low", "Percent": getPercent(data.verylow_km, data.scored_km), "color": "#C500FF" }
                ]
                chartData.reverse()
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
        }
        return charts
    }

    render() {
        return (
            <div>
                <BarLoader color={"white"} loading={this.state.loading}/>
                {this.props.getAnalysisLayers()}
                <div className="chartsDiv">
                    <HorizontalBarChart
                        data={this.state.charts.horizontalBarChart.data}
                        id={this.state.charts.horizontalBarChart.id}
                        config={this.state.charts.horizontalBarChart.config} />
                </div>
            </div>
        )
    }
}
const NFHPAnalysis = withSharedAnalysisCharacteristics(NFHPAnalysisPackage, layers, sb_properties, SB_URL);

export default NFHPAnalysis;
