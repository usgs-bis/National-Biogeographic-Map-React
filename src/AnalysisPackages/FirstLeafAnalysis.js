import React from "react";
import { Collapse } from "reactstrap"
import { Glyphicon } from "react-bootstrap";

import BoxAndWhiskerChart from "../Charts/BoxAndWhiskerChart";
import HistogramChart from "../Charts/HistogramChart";
import "./AnalysisPackages.css";

const SB_URL = "https://www.sciencebase.gov/catalog/item/58bf0b61e4b014cc3a3a9c10?format=json"
const FIRSTLEAF_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenology/place/firstleaf"
const PUBLIC_TOKEN = process.env.REACT_APP_PUBLIC_TOKEN

let properties = {
    "title": "First Leaf Analysis default"
}

class FirstLeafAnalysis extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                histogram: { id: "", config: {}, data: null },
                ridgelinePlot: { id: "", config: {}, data: null },
                boxAndWhisker: { id: "", config: {}, data: null }
            },
            title: properties.title,
            submitted: false,
            canSubmit: false,
            isOpen: false,
            glyph: "menu-right"
        }

        this.toggleDropdown = this.toggleDropdown.bind(this)
        this.getCharts = this.getCharts.bind(this)
        this.submitAnalysis = this.submitAnalysis.bind(this)


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
                        submitted: false
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
        if (props.feature_id) {
            this.setState({
                canSubmit: true
            })
        }
    }

    submitAnalysis() {
        if (this.props.feature_id) {
            fetch(FIRSTLEAF_URL + `?year_min=${this.props.yearMin}&year_max=${this.props.yearMax}&feature_id=${this.props.feature_id}&token=${PUBLIC_TOKEN}`)
                .then(res => res.json())
                .then(
                    (result) => {
                        if (result) {
                            const charts = this.getCharts({ histogram: result, ridgelinePlot: result, boxAndWhisker: result })
                            this.setState({
                                charts: charts,
                                submitted: true
                            })
                        } else {
                            this.setState({
                                submitted: true
                            })
                        }
                    },
                    (error) => {
                        this.setState({
                            error
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

        let charts = {}

        for (let chart of Object.keys(this.state.charts)) {

            if (chart.toString() === "histogram" && datas[chart]) {
                const data = datas[chart]
                const chartId = "FL_Histogram"
                const chartConfig = {
                    margins: { left: 80, right: 20, top: 20, bottom: 70 },
                    chart: { title: `First Leaf Spring Index for ${this.props.feature_name}`, subtitle: `All Years for the Period ${this.props.yearMin} to ${this.props.yearMax}` },
                    xAxis: { label: "Day of Year" },
                    yAxis: { label: "Number of Grid Cells" }
                }
                const chartData = data
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "ridgelinePlot" && datas[chart]) {
                // To Do
                const data = datas[chart]
                const chartId = "FL_RidgelinePlot"
                const chartConfig = {}
                const chartData = data
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "boxAndWhisker" && datas[chart]) {

                const data = datas[chart]
                const chartId = "FL_BoxAndWhisker"
                const chartConfig = {
                    margins: { left: 80, right: 20, top: 20, bottom: 70 },
                    chart: { title: `First Leaf Spring Index for ${this.props.feature_name}`, subtitle: `All Years for the Period ${this.props.yearMin} to ${this.props.yearMax}` },
                    xAxis: { label: "Year" },
                    yAxis: { label: "Day of Year" }
                }
                const chartData = data
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
        }
        return charts
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
                    <div className="chartsDiv">
                        <div className="chart-headers" >
                            Range: {this.props.yearMin} -  {this.props.yearMax}
                            <button className="submit-analysis-btn" onClick={this.submitAnalysis}>Submit</button>
                        </div>
                        <HistogramChart data={this.state.charts.histogram.data} id={this.state.charts.histogram.id} config={this.state.charts.histogram.config} />
                        <BoxAndWhiskerChart data={this.state.charts.boxAndWhisker.data} id={this.state.charts.boxAndWhisker.id} config={this.state.charts.boxAndWhisker.config} />
                    </div>
                </Collapse>
            </div>
        )
    }
}
export default FirstLeafAnalysis;
