import React from "react";
import L from "leaflet"
import { BarLoader } from "react-spinners"

import withSharedAnalysisCharacteristics from "./AnalysisPackage"
import ComparisonChart from "../Charts/ComparisonChart";
import "./AnalysisPackages.css";

const SB_URL = "https://www.sciencebase.gov/catalog/item/5b685d1ce4b006a11f75b0a8?format=json"
const FIRSTLEAF_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenology/place/firstleaf"
const FIRSTBLOOM_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenology/place/firstbloom"
const PUBLIC_TOKEN = process.env.REACT_APP_PUBLIC_TOKEN

let sb_properties = {
    "title": "First Leaf / First Bloom Spring Index Comparison"
}

const layers = {
    first_leaf_service: {
        title: "Average Leaf PRISM",
        layer: L.tileLayer.wms(
            "https://geoserver.usanpn.org/geoserver/si-x/wms",
            {
                format: "image/png",
                layers: "average_leaf_prism",
                opacity: .5,
                transparent: true
            }
        ),
        timeEnabled: true,
        checked: false
    },
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

class FirstLeafBloomComparisonAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                comparison: { id: "", config: {}, data: null },
            },
            canSubmit: false,
            loading: false
        }

        this.getCharts = this.getCharts.bind(this)
        this.submitAnalysis = this.submitAnalysis.bind(this)
        this.clearCharts = this.clearCharts.bind(this)
        this.print = this.print.bind(this)

    }

    componentDidMount() {
        this.props.onRef(this)
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
            let firstLeafFetch = fetch(FIRSTLEAF_URL + `?year_min=${this.props.yearMin}&year_max=${this.props.yearMax}&feature_id=${this.props.feature.properties.feature_id}&token=${PUBLIC_TOKEN}`)
                .then(res => { return res.json() },
                    (error) => {
                        this.setState({
                            error
                        });
                    })
            let firstBloomFetch = fetch(FIRSTBLOOM_URL + `?year_min=${this.props.yearMin}&year_max=${this.props.yearMax}&feature_id=${this.props.feature.properties.feature_id}&token=${PUBLIC_TOKEN}`)
                .then(res => { return res.json() },
                    (error) => {
                        this.setState({
                            error
                        });
                    })
            Promise.all([firstLeafFetch, firstBloomFetch]).then(results => {
                if (results && results.length === 2) {
                    const charts = this.getCharts({ comparison: { leaf: results[0], bloom: results[1] } })
                    this.setState({
                        charts: charts,
                        loading: false
                    })
                    this.props.isEnabled(true)
                    this.props.canOpen(true)
                } else {
                    this.props.isEnabled(false)
                    this.props.canOpen(false)
                    this.setState({
                        loading: false,
                        layers: this.resetAnalysisLayers()
                    })
                }
            })

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

            if (chart.toString() === "comparison" && datas[chart]) {
                const data = datas[chart]
                const chartId = "FL_FB_Comparison"
                const chartConfig = {
                    margins: { left: 80, right: 20, top: 20, bottom: 70 },
                    chart: { title: `First Bloom Spring Index/First Leaf Spring Index for  ${this.props.feature.properties.feature_name}`, subtitle: `By Year for the Period ${this.props.yearMin} to ${this.props.yearMax}` },
                    xAxis: { label: "Day of Year" },
                    yAxis: { label: "Year" }
                }
                const chartData = data
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
        }
        return charts
    }

    print() {
        if(this.state.charts.comparison.data){
            return [
                this.ComparisonChart.print(this.state.charts.comparison.id)
            ]
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
                    </div>
                    <ComparisonChart onRef={ref => (this.ComparisonChart = ref)} data={this.state.charts.comparison.data} id={this.state.charts.comparison.id} config={this.state.charts.comparison.config} />
                    <div className="chart-footers" >
                        <div className="anotations">
                            First Leaf / First Bloom Spring Index Comparison data were provided by  the <a href="https://www.usanpn.org">USA National Phenology Network</a>, data retrieved {new Date().toDateString()}
                            <br></br>
                            <br></br>
                            <a target={"_blank"} href={"https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&service=WMS&layers=average_leaf_prism,average_bloom_prism"}>https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&amp;service=WMS&amp;layers=average_leaf_prism,average_bloom_prism</a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
const FirstLeafBloomComparisonAnalysis = withSharedAnalysisCharacteristics(FirstLeafBloomComparisonAnalysisPackage,
    layers,
    sb_properties,
    SB_URL);

export default FirstLeafBloomComparisonAnalysis;
