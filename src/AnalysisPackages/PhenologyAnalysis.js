import React from "react";
import { Collapse } from "reactstrap"
import { Glyphicon } from "react-bootstrap";
import { DynamicMapLayer } from "esri-leaflet"
import { BarLoader } from "react-spinners"

import HorizontalBarChart from "../Charts/HorizontalBarChart";
import "./AnalysisPackages.css";

import withSharedAnalysisCharacteristics from "./AnalysisPackage"

const SB_URL = "https://www.sciencebase.gov/catalog/item/5b96d589e4b0702d0e82700a?format=json"
const PHENO32_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenocast/place/agdd_32";
const PHENO50_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenocast/place/agdd_50";
const PUBLIC_TOKEN = process.env.REACT_APP_PUBLIC_TOKEN


let sb_properties = {
    "title": "Phenology Forecasts"
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

class PhenologyAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {},
            pests: ['Apple Maggot', 'Emerald Ash Borer', 'Lilac Borer', 'Winter Moth', 'Hemlock Woolly Adelgid'],
            dates: [{ name: 'Current', date: new Date() }, { name: 'Six-Day', date: new Date(new Date().getTime() + 6 * 86400000) }],
            submitted: false,
            canSubmit: false,
            isOpen: false,
            glyph: "menu-right",
            loading: false,
            title:sb_properties.title
        }

        this.toggleDropdown = this.toggleDropdown.bind(this)
        this.getCharts = this.getCharts.bind(this)
        this.toggleLayerDropdown = this.props.toggleLayerDropdown.bind(this)
        this.updateBapLayers = this.props.updateBapLayers.bind(this)
        this.setOpacity = this.props.setOpacity.bind(this)
        this.getAnalysisLayers = this.props.getAnalysisLayers.bind(this)
        this.resetAnalysisLayers = this.props.resetAnalysisLayers.bind(this)
        this.getFetchForDate = this.getFetchForDate.bind(this)
        this.submitAnalysis = this.submitAnalysis.bind(this)
        this.clearCharts = this.clearCharts.bind(this)
    }


    toggleDropdown() {
        this.setState({
            isOpen: !this.state.isOpen,
            glyph: !this.state.isOpen ? "menu-down" : "menu-right"
        })
    }

    componentDidMount() {
        fetch(SB_URL)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        submitted: false,
                        title: result.title
                    })
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    componentWillReceiveProps(props) {
        if (props.feature && props.feature.properties.feature_id !== this.state.feature_id) {

            this.clearCharts()
            this.setState({
                canSubmit: true,
                feature_id: props.feature.properties.feature_id
            })
        }
    }

    clearCharts() {
        let charts = {}
        for (let chart of Object.keys(this.state.charts)) {
            charts[chart] = { id: "", config: {}, data: null }
        }
        this.setState({
            charts: charts,
        })
    }


    getFetchForDate(url, date) {
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
        return fetch(`${url}&date=${formattedDate}`)
            .then(res => { return res.json() },
                (error) => {
                    this.setState({
                        error
                    });
                })
    }

    submitAnalysis(prevProps) {
        if (this.props.feature &&
            this.props.feature.properties.feature_id &&
            (!prevProps.feature || this.props.feature.properties.feature_id !== prevProps.feature.properties.feature_id)) {
            this.setState({
                loading: true
            })
            let fetches = []
            for (let date of this.state.dates) {
                fetches.push(this.getFetchForDate(`${PHENO32_URL}?feature_id=${this.props.feature.properties.feature_id}&token=${PUBLIC_TOKEN}`, date.date))
                fetches.push(this.getFetchForDate(`${PHENO50_URL}?feature_id=${this.props.feature.properties.feature_id}&token=${PUBLIC_TOKEN}`, date.date))
            }
            Promise.all(fetches).then(results => {
                if (results) {
                    const charts = this.getCharts(results)
                    this.setState({
                        charts: charts,
                        submitted: true,
                        loading: false
                    })
                }
            })
        }
    }

    /**
     * Loop through the charts defined in the state.
     * Create the chart id, data, and config as documented in the chart type.
     * @param {Object {}} data
     */
    getCharts(data) {

        console.log(data)
        return true

        // function getPercent(value, scoredKm) {
        //     value = parseFloat(value)
        //     return parseFloat(((value / parseFloat(scoredKm)) * 100).toFixed(1))
        // }
        // const numberWithCommas = (x) => {
        //     return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        // }

        // let charts = {}

        // for (let chart of Object.keys(this.state.charts)) {

        //     if (chart.toString() === "horizontalBarChart" && datas[chart]) {

        //         const data = datas[chart]
        //         const chartId = "NFHP_HorizontalBarChart"
        //         const chartConfig = {
        //             margins: { left: 100, right: 20, top: 20, bottom: 70 },
        //             chart: { title: `Risk to Fish Habitat Degradation ${this.props.feature.properties.feature_name}`, subtitle: `Fish habitat condition was scored on ${numberWithCommas(parseFloat(data.scored_km).toFixed(0))} of ${numberWithCommas((parseFloat(data.scored_km) + parseFloat(data.not_scored_km)).toFixed(0))}' NHDPlusV1 stream kilometers within ${data.place_name}` },
        //             xAxis: { key: 'Percent', label: "NFHP Scored Stream Kilometers [%]", ticks: 5, tickFormat: (d) => { return `${parseInt(d)}%` } },
        //             yAxis: { key: 'Risk', label: "Risk To Fish Habitat Degradation", ticks: 5, tickFormat: (d) => { return d } },
        //             tooltip: { label: (d) => { return `<p>${d.Risk}: ${d.Percent}%</p>` } }
        //         }
        //         const chartData = [
        //             { "Risk": "Very high", "Percent": getPercent(data.veryhigh_km, data.scored_km), "color": "#FF0000" },
        //             { "Risk": "High", "Percent": getPercent(data.high_km, data.scored_km), "color": "#FFAA00" },
        //             { "Risk": "Moderate", "Percent": getPercent(data.moderate_km, data.scored_km), "color": "#A3FF73" },
        //             { "Risk": "Low", "Percent": getPercent(data.low_km, data.scored_km), "color": "#00C5FF" },
        //             { "Risk": "Very low", "Percent": getPercent(data.verylow_km, data.scored_km), "color": "#C500FF" }
        //         ]
        //         chartData.reverse()
        //         charts[chart] = { id: chartId, config: chartConfig, data: chartData }
        //     }
        // }
        // return charts
    }

    render() {
        return (
            <div
                style={{ display: 'block' }}
                className="nbm-flex-row-no-padding">
                <span onClick={this.toggleDropdown} className="bapTitle">
                    {this.state.title}
                    <Glyphicon style={{ display: this.state.canSubmit ? "inline-block" : "none" }}
                        className="dropdown-glyph"
                        glyph={this.state.glyph} />
                </span>
                <Collapse className="settings-dropdown" isOpen={this.state.isOpen}>
                <BarLoader width={100} widthUnit={"%"} color={"white"} loading={this.state.loading}/>
                    {this.getAnalysisLayers()}
                    <div className="chartsDiv">
                        <div className="chart-headers" >
                            <button className="submit-analysis-btn" onClick={this.submitAnalysis}>Get Phenology Forecast</button>
                        </div>
                        {/* <HorizontalBarChart
                            data={this.state.charts.horizontalBarChart.data}
                            id={this.state.charts.horizontalBarChart.id}
                            config={this.state.charts.horizontalBarChart.config} /> */}
                    </div>
                </Collapse>
            </div>
        )
    }
}
const PhenologyAnalysis = withSharedAnalysisCharacteristics(PhenologyAnalysisPackage, layers);

export default PhenologyAnalysis;
