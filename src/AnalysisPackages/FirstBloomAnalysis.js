import React from "react";
import { Collapse } from "reactstrap"
import { Glyphicon } from "react-bootstrap";
import L from "leaflet"
import { FormGroup, Label } from 'reactstrap';
import { BarLoader } from "react-spinners"

import BoxAndWhiskerChart from "../Charts/BoxAndWhiskerChart";
import HistogramChart from "../Charts/HistogramChart";
import RidgelinePlotChart from "../Charts/RidgelinePlotChart";
import "./AnalysisPackages.css";

const SB_URL = "https://www.sciencebase.gov/catalog/item/58bf0b61e4b014cc3a3a9c10?format=json"
const FIRSTBLOOM_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenology/place/firstbloom"
const PUBLIC_TOKEN = process.env.REACT_APP_PUBLIC_TOKEN

let properties = {
    "title": "First Bloom Spring Index"
}

const layers = {
    first_leaf_service: {
        title: "First Leaf",
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

class FirstBloomAnalysis extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                histogram: { id: "", config: {}, data: null },
                ridgelinePlot: { id: "", config: {}, data: null },
                boxAndWhisker: { id: "", config: {}, data: null }
            },
            layers: layers,
            updateAnalysisLayers: props.updateAnalysisLayers,
            loading: false,
            bucketSize: { value: 3 },
            title: properties.title,
            submitted: false,
            canSubmit: false,
            isOpen: false,
            glyph: "menu-right"
        }

        this.toggleDropdown = this.toggleDropdown.bind(this)
        this.getCharts = this.getCharts.bind(this)
        this.submitAnalysis = this.submitAnalysis.bind(this)
        this.setBucketSize = this.setBucketSize.bind(this)
        this.clearCharts = this.clearCharts.bind(this)
        this.toggleLayerDropdown = this.toggleLayerDropdown.bind(this)
        this.getAnalysisLayers = this.getAnalysisLayers.bind(this)
        this.setOpacity = this.setOpacity.bind(this)
        this.resetAnalysisLayers =  this.resetAnalysisLayers.bind(this)
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
        this.setBucketSize()

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
                                submitted: true,
                                loading: false
                            })
                        } else {
                            this.setState({
                                submitted: true,
                                loading: false,
                                layers: this.resetAnalysisLayers()
                            })
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

    resetAnalysisLayers() {
        this.props.updateAnalysisLayers([])
        let l = layers
        Object.keys(l).forEach(function(key) {
            l[key].checked = false
        })

        return l
    }

    updateAnalysisLayers() {
        let that = this
        let enabledLayers = []
        Object.keys(this.state.layers).forEach(function(key) {
            if (that[key].checked) {
                let obj = that.state
                let l = obj.layers
                l[key].checked = true
                obj.layers = l
                that.setState(obj)
                enabledLayers.push(that.state.layers[key])
            } else {
                let obj = that.state
                let l = obj.layers
                l[key].checked = false
                obj.layers = l
                that.setState(obj)
            }
        })

        this.state.updateAnalysisLayers(enabledLayers)
    }

    toggleLayerDropdown() {
        this.setState({layersOpen: !this.state.layersOpen})
    }

    setOpacity(key) {
        this.state.layers[key].layer.setOpacity(this[key + "Opacity"].value)
    }

    getAnalysisLayers () {
        let that = this
        if (this.state.layers) {
            return (
                <div className="analysis-layers">
                    <span onClick={that.toggleLayerDropdown} className="analysis-layers-dropdown">
                    {"Analysis Layers"}
                        <Glyphicon
                            className="analysis-dropdown-glyph"
                            glyph={that.state.layersOpen ? "menu-down" : "menu-right"}
                        />
                </span>
                    <Collapse isOpen={that.state.layersOpen}>
                        {Object.keys(this.state.layers).map(function (key) {
                            let layer = that.state.layers[key]
                            return (
                                <FormGroup key={key} check>
                                    <Label check>
                                        <input
                                            ref={(input) => { that[key] = input; }}
                                            onChange={function() {that.updateAnalysisLayers()}}
                                            checked={that.state.layers[key].checked}
                                            type="checkbox" />
                                        {' ' + layer.title}
                                    </Label>
                                    <input style={{width: "50%"}}
                                           ref={(input) => { that[key + "Opacity"] = input; }}
                                           onChange={function() {
                                               that.setOpacity(key)
                                           }}
                                           type="range"
                                           step=".05"
                                           min="0"
                                           max="1"
                                           defaultValue={.5}/>
                                </FormGroup>
                            )
                        })}
                    </Collapse>
                </div>
            )
        }
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
                        <HistogramChart data={this.state.charts.histogram.data} id={this.state.charts.histogram.id} config={this.state.charts.histogram.config} bucketSize={this.state.bucketSize.value} />
                        <RidgelinePlotChart data={this.state.charts.ridgelinePlot.data} id={this.state.charts.ridgelinePlot.id} config={this.state.charts.ridgelinePlot.config} bucketSize={this.state.bucketSize.value} />
                        <BoxAndWhiskerChart data={this.state.charts.boxAndWhisker.data} id={this.state.charts.boxAndWhisker.id} config={this.state.charts.boxAndWhisker.config} />
                        <div className="chart-footers" >
                            <div className="anotations">
                                First Bloom Spring Index data was provided by the <a href="https://www.usanpn.org">USA National Phenology Network</a>, data retrieved {new Date().toDateString()}
                                <br></br>
                                <br></br>
                                <a target={"_blank"} href={"https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&amp;service=WMS&amp;layers=average_bloom_prism"}>https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&amp;service=WMS&amp;layers=average_bloom_prism</a>
                            </div>
                        </div>
                    </div>
                </Collapse>
            </div>
        )
    }
}
export default FirstBloomAnalysis;
