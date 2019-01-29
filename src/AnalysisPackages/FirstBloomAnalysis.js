import React from "react";
import L from "leaflet"
import { BarLoader } from "react-spinners"

import withSharedAnalysisCharacteristics from "./AnalysisPackage"
import BoxAndWhiskerChart from "../Charts/BoxAndWhiskerChart";
import HistogramChart from "../Charts/HistogramChart";
import RidgelinePlotChart from "../Charts/RidgelinePlotChart";
import "./AnalysisPackages.css";

const SB_URL = "https://www.sciencebase.gov/catalog/item/5abd5fede4b081f61abfc472?format=json"
const FIRSTBLOOM_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenology/place/firstbloom"
const PUBLIC_TOKEN = process.env.REACT_APP_PUBLIC_TOKEN

let sb_properties = {
    "title": "First Bloom Spring Index"
}

const layers = {
    first_bloom_service: {
        title: "Average Bloom PRISM",
        layer: L.tileLayer.wms(
            "https://geoserver.usanpn.org/geoserver/si-x/wms",
            {
                format: "image/png",
                layers: "average_bloom_prism",
                opacity: .5,
                transparent: true
            }
        ),
        timeEnabled: true,
        checked: false
    }
}

class FirstBloomAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                histogram: { id: "", config: {}, data: null },
                ridgelinePlot: { id: "", config: {}, data: null },
                boxAndWhisker: { id: "", config: {}, data: null }
            },
            layers: layers,
            loading: false,
            bucketSize: { value: 3 },
            canSubmit: false
        }

        this.toggleDropdown = this.toggleDropdown.bind(this)
        this.getCharts = this.getCharts.bind(this)
        this.submitAnalysis = this.submitAnalysis.bind(this)
        this.setBucketSize = this.setBucketSize.bind(this)
        this.clearCharts = this.clearCharts.bind(this)
        this.print = this.print.bind(this)

    }

    componentDidMount() {
        this.props.onRef(this)
      }

    toggleDropdown() {
        this.setState({
            isOpen: !this.state.isOpen,
            glyph: !this.state.isOpen ? "menu-down" : "menu-right"
        })
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

    componentWillReceiveProps(props) {
        if (props.feature && props.feature.properties.feature_id !== this.state.feature_id) {
            this.clearCharts()
            this.setState({
                canSubmit: true,
                feature_id: props.feature.properties.feature_id
            })
            this.props.canOpen(true)
        }
    }

    submitAnalysis() {
        if (this.props.feature && this.props.feature.properties.feature_id) {
            this.setState({
                loading: true
            })
            this.clearCharts()
            fetch(FIRSTBLOOM_URL + `?year_min=${this.props.yearMin}&year_max=${this.props.yearMax}&feature_id=${this.props.feature.properties.feature_id}&token=${PUBLIC_TOKEN}`)
                .then(res => res.json())
                .then(
                    (result) => {
                        if (result) {
                            const charts = this.getCharts({ histogram: result, ridgelinePlot: result, boxAndWhisker: result })
                            this.setState({
                                charts: charts,
                                loading: false
                            })
                            this.props.isEnabled(true)
                            this.props.canOpen(true)
                        } else {
                            this.setState({
                                loading: false,
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
        else if (this.props.feature) {
            // hit with drawn polygon
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
                const chartId = "FB_Histogram"
                const chartConfig = {
                    margins: { left: 80, right: 20, top: 20, bottom: 70 },
                    chart: { title: `First Bloom Spring Index for ${this.props.feature.properties.feature_name}`, subtitle: `All Years for the Period ${this.props.yearMin} to ${this.props.yearMax}` },
                    xAxis: { label: "Day of Year" },
                    yAxis: { label: "Number of Grid Cells" }
                }
                const chartData = data
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "ridgelinePlot" && datas[chart]) {
                // To Do
                const data = datas[chart]
                const chartId = "FB_RidgelinePlot"
                const chartConfig = {
                    margins: { left: 80, right: 20, top: 35, bottom: 70 },
                    chart: { title: `First Bloom Spring Index for ${this.props.feature.properties.feature_name}`, subtitle: `By Year for the Period ${this.props.yearMin} to ${this.props.yearMax}` },
                    xAxis: { label: "Day of Year" },
                    yAxis: { label: "Year" }
                }
                const chartData = data
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "boxAndWhisker" && datas[chart]) {

                const data = datas[chart]
                const chartId = "FB_BoxAndWhisker"
                const chartConfig = {
                    margins: { left: 80, right: 20, top: 20, bottom: 70 },
                    chart: { title: `First Bloom Spring Index for ${this.props.feature.properties.feature_name}`, subtitle: `All Years for the Period ${this.props.yearMin} to ${this.props.yearMax}` },
                    xAxis: { label: "Year" },
                    yAxis: { label: "Day of Year" }
                }
                const chartData = data
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
        }
        return charts
    }

    setBucketSize() {
        this.setState({
            bucketSize: this.bucketSize
        })
    }

    print() {
        if (this.state.charts.histogram.data) {

            let charts = []
            charts.push(this.HistogramChart.print(this.state.charts.histogram.id))
            charts.push(this.BoxAndWhiskerChart.print(this.state.charts.boxAndWhisker.id))
            charts.push(this.RidgelinePlotChart.print(this.state.charts.ridgelinePlot.id))

            return Promise.all(charts.flat()).then(contents => {
                return [
                    { text: sb_properties.title, style: 'analysisTitle', margin: [5, 2, 5, 20], pageBreak: 'before' },
                    {
                        columns: [

                            {
                                width: 'auto',
                                stack: [
                                    { text: this.HistogramChart.props.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                                    { text: this.HistogramChart.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                                    { image: contents[0], alignment: 'center', width: 250 },
                                    { text: this.BoxAndWhiskerChart.props.config.chart.title, style: 'chartTitle', margin: [5, 20, 5, 2]},
                                    { text: this.BoxAndWhiskerChart.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                                    { image: contents[1], alignment: 'center', width: 250 }
                                ]
                            },

                            {
                                width: 'auto',
                                stack: [
                                    { text: this.RidgelinePlotChart.props.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                                    { text: this.RidgelinePlotChart.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                                    { image: contents[2], alignment: 'center', width: 250 },
                                    { text: 'First Bloom Spring Index data was provided by the', style: 'annotation', margin: [5, 10, 5, 0] },
                                    { text: 'USA National Phenology Network', style: 'annotationLink', margin: [5, 0, 5, 0], link: 'https://www.usanpn.org' },
                                    { text: `data retrieved ${new Date().toDateString()}`, style: 'annotation', margin: [5, 0, 5, 0] }
                                ]
                            }
                        ]
                    }
                ]
            })
        }
        return []
    }

    render() {
        return (
            <div>
                <BarLoader width={100} widthUnit={"%"} color={"white"} loading={this.state.loading}/>
                {this.props.getAnalysisLayers()}
                <div className="chartsDiv">
                    <div className="chart-headers" >

                        <button className="submit-analysis-btn" onClick={this.submitAnalysis}>Analyze Time Period: {this.props.yearMin} to  {this.props.yearMax}</button>
                        <div className="bucket-size-div" style={{ display: this.state.charts.histogram.data ? "block" : "none" }}>
                            <span>Binwidth: {this.state.bucketSize.value}</span>
                            <input
                                ref={(input) => { this.bucketSize = input; }}
                                onChange={this.setBucketSize}
                                defaultValue={this.state.bucketSize.value}
                                min={1}
                                max={5}
                                step="1"
                                type="range" />
                        </div>
                    </div>
                    <HistogramChart onRef={ref => (this.HistogramChart = ref)} data={this.state.charts.histogram.data} id={this.state.charts.histogram.id} config={this.state.charts.histogram.config} bucketSize={this.state.bucketSize.value} />
                    <RidgelinePlotChart onRef={ref => (this.RidgelinePlotChart = ref)} data={this.state.charts.ridgelinePlot.data} id={this.state.charts.ridgelinePlot.id} config={this.state.charts.ridgelinePlot.config} bucketSize={this.state.bucketSize.value} />
                    <BoxAndWhiskerChart onRef={ref => (this.BoxAndWhiskerChart = ref)} data={this.state.charts.boxAndWhisker.data} id={this.state.charts.boxAndWhisker.id} config={this.state.charts.boxAndWhisker.config} />
                    <div className="chart-footers" >
                        <div className="anotations">
                            First Bloom Spring Index data was provided by the <a href="https://www.usanpn.org">USA National Phenology Network</a>, data retrieved {new Date().toDateString()}
                            <br></br>
                            <br></br>
                            <a target={"_blank"} href={"https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&service=WMSlayers=average_bloom_prism"}>https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&amp;service=WMS&amp;layers=average_bloom_prism</a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
const FirstBloomAnalysis = withSharedAnalysisCharacteristics(FirstBloomAnalysisPackage, layers, sb_properties, SB_URL);

export default FirstBloomAnalysis;
