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
            data: null,
            dates: [{ name: 'Current', date: new Date() }, { name: 'Six-Day', date: new Date(new Date().getTime() + 6 * 86400000) }],
            submitted: false,
            canSubmit: false,
            isOpen: false,
            glyph: "menu-right",
            loading: false,
            title: sb_properties.title
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
        this.setState({
            data: null,
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
                    //const charts = this.getCharts(results)
                    this.setState({
                        data: results,
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

        if (!data) return

        function inRange(num, bucket, name) {
            if (bucket.length === 1) {
                return num > bucket[0]
            } else {
                return num > bucket[0] && num <= bucket[1]
            }
        }
        const numberWithCommas = (x) => {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let rawData = {
            "agdd_32": {
                "Current": data[0][`${this.state.dates[0].date.getFullYear()}-${this.state.dates[0].date.getMonth() + 1}-${this.state.dates[0].date.getDate()}`],
                "Six-Day": data[2][`${this.state.dates[1].date.getFullYear()}-${this.state.dates[1].date.getMonth() + 1}-${this.state.dates[1].date.getDate()}`]
            },
            "agdd_50": {
                "Current": data[1][`${this.state.dates[0].date.getFullYear()}-${this.state.dates[0].date.getMonth() + 1}-${this.state.dates[0].date.getDate()}`],
                "Six-Day": data[3][`${this.state.dates[1].date.getFullYear()}-${this.state.dates[1].date.getMonth() + 1}-${this.state.dates[1].date.getDate()}`]
            }
        }

        let chartData = {
            "agdd_50": {
                "Apple Maggot": {
                    "Not Approaching Treatment Window": {
                        "range": [0, 650],
                        "color": "#999999"
                    },
                    "Approaching Treatment Window": {
                        "range": [650, 900],
                        "color": "#FFED6F"
                    },
                    "Treatment Window": {
                        "range": [900, 2000],
                        "color": "#41AB5D"
                    },
                    "Treatment Window Passed": {
                        "range": [2000],
                        "color": "#C19A6B"
                    },
                },
                "Emerald Ash Borer": {
                    "Not Approaching Treatment Window": {
                        "range": [0, 350],
                        "color": "#999999"
                    },
                    "Approaching Treatment Window": {
                        "range": [350, 450],
                        "color": "#FFED6F"
                    },
                    "Treatment Window": {
                        "range": [450, 1500],
                        "color": "#41AB5D"
                    },
                    "Treatment Window Passed": {
                        "range": [1500],
                        "color": "#C19A6B"
                    },
                },
                "Lilac Borer": {
                    "Not Approaching Treatment Window": {
                        "range": [0, 350],
                        "color": "#999999"
                    },
                    "Approaching Treatment Window": {
                        "range": [350, 500],
                        "color": "#FFED6F"
                    },
                    "Treatment Window": {
                        "range": [500, 1300],
                        "color": "#41AB5D"
                    },
                    "Treatment Window Passed": {
                        "range": [1300],
                        "color": "#C19A6B"
                    },
                },
                "Winter Moth": {
                    "Not Approaching Treatment Window": {
                        "range": [0, 20],
                        "color": "#999999"
                    },
                    "Treatment Window": {
                        "range": [20, 350],
                        "color": "#41AB5D"
                    },
                    "Treatment Window Passed": {
                        "range": [350],
                        "color": "#C19A6B"
                    },
                }
            },
            "agdd_32": {
                "Hemlock Woolly Adelgid": {
                    "Not Approaching Treatment Window": {
                        "range": [0, 25],
                        "color": "#999999"
                    },
                    "Approaching Treatment Window": {
                        "range": [25, 1000],
                        "color": "#FFED6F"
                    },
                    "Treatment Window": {
                        "range": [1000, 2200],
                        "color": "#41AB5D"
                    },
                    "Treatment Window Passed": {
                        "range": [2200],
                        "color": "#C19A6B"
                    },
                }
            }
        }

        for (let layer of Object.keys(rawData)) {
            for (let time of Object.keys(rawData[layer])) {
                for (let num of rawData[layer][time]) {
                    for (let speciesName of Object.keys(chartData[layer])) {
                        for (let categoryLabel of Object.keys(chartData[layer][speciesName])) {
                            if (chartData[layer][speciesName][categoryLabel][time] === undefined) {
                                chartData[layer][speciesName][categoryLabel][time] = 0;
                            }
                            if (inRange(num, chartData[layer][speciesName][categoryLabel]["range"], speciesName)) {
                                chartData[layer][speciesName][categoryLabel][time] = chartData[layer][speciesName][categoryLabel][time] + 1
                            }
                        }
                    }
                }
            }
        }
        let charts = []
        for (let layer of Object.keys(rawData)) {
            for (let pestName of Object.keys(chartData[layer])) {
                for (let time of Object.keys(rawData[layer])) {
                    const timeIndex = time === 'Current' ? 0 : 1
                    const chartId = `PHENO_${pestName.replace(/\s/g, '')}_${time}`
                    const chartConfig = {
                        width:400,
                        height:150,
                        margins: { left: 50, right: 20, top: 20, bottom: 70 },
                        chart: { title: `${pestName}`, subtitle: `` },
                        xAxis: { key: 'acres', label: "Approximate Acreage", ticks: 5, tickFormat: (d) => { return `${numberWithCommas(parseInt(d))}` } },
                        yAxis: { key: 'name', label: `${time}  ${this.state.dates[timeIndex].date.getFullYear()}-${this.state.dates[timeIndex].date.getMonth() + 1}-${this.state.dates[timeIndex].date.getDate()}`, ticks: 5, tickFormat: (d) => { ''} },
                        tooltip: { label: (d) => { return `<p>${d.name}: ${numberWithCommas(d.acres)} Acres</p>` } }
                    }
                    let chartDataFormatted = []
                    let windows = ['Not Approaching Treatment Window', 'Approaching Treatment Window', 'Treatment Window', 'Treatment Window Passed']
                    windows.reverse()
                    for (let window of windows) {
                        if (chartData[layer][pestName][window]) {
                            chartDataFormatted.push({ "name": window, "acres": timeIndex ? chartData[layer][pestName][window]['Current'] : chartData[layer][pestName][window]['Six-Day'], "color": chartData[layer][pestName][window].color })
                        }
                    }
                    charts.push(
                        <HorizontalBarChart
                            key={chartId}
                            data={chartDataFormatted}
                            id={chartId}
                            config={chartConfig} />
                    )
                }
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
                    <BarLoader width={100} widthUnit={"%"} color={"white"} loading={this.state.loading} />
                    {this.getAnalysisLayers()}
                    <div className="chartsDiv">
                        <div className="chart-headers" >
                            <button className="submit-analysis-btn" onClick={this.submitAnalysis}>Get Phenology Forecast</button>
                        </div>
                        {this.getCharts(this.state.data)}
                    </div>
                </Collapse>
            </div>
        )
    }
}
const PhenologyAnalysis = withSharedAnalysisCharacteristics(PhenologyAnalysisPackage, layers);

export default PhenologyAnalysis;
