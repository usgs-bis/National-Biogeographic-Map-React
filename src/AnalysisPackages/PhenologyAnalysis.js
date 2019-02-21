import React from "react";
import L from "leaflet"
import { BarLoader } from "react-spinners"

import { RadioButton } from "../CustomRadio/CustomRadio"
import HorizontalBarChart from "../Charts/HorizontalBarChart";
import "./AnalysisPackages.css";

import withSharedAnalysisCharacteristics from "./AnalysisPackage"

const SB_URL = "https://www.sciencebase.gov/catalog/item/5b96d589e4b0702d0e82700a?format=json"
const PHENO32_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenocast/place/agdd_32";
const PHENO32_POLY_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenocast/polygon/agdd_32";
const PHENO50_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenocast/place/agdd_50";
const PHENO50_POLY_URL = process.env.REACT_APP_BIS_API + "/api/v1/phenocast/polygon/agdd_50";
const PUBLIC_TOKEN = process.env.REACT_APP_PUBLIC_TOKEN


let sb_properties = {
    "title": "Phenology Forecasts"
}

let baseLegendUrl = "https://geoserver.usanpn.org/geoserver/gdd/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng"

let layers = {
    phenology_service: {
        title: "Phenocasts",
        layer: L.tileLayer.wms(
            "https://geoserver.usanpn.org/geoserver/gdd/wms",
            {
                format: "image/png",
                opacity: .5,
                transparent: true
            }
        ),
        legend: {
            imageUrl: ""
        },
        checked: true,
        hideCheckbox: true
    }
}

class PhenologyAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            data: null,
            dates: [{ name: 'Current', date: new Date() }, { name: 'Six-Day', date: new Date(new Date().getTime() + 6 * 86400000) }],
            canSubmit: false,
            loading: false,
            charts: [],
            refs: [],
            selectedIndex: 0
        }


        this.getCharts = this.getCharts.bind(this)
        this.getFetchForDate = this.getFetchForDate.bind(this)
        this.submitAnalysis = this.submitAnalysis.bind(this)
        this.clearCharts = this.clearCharts.bind(this)
        this.print = this.print.bind(this)
        this.getFormattedDate = this.getFormattedDate.bind(this)
        this.toggleRadioBtn = this.toggleRadioBtn.bind(this)
        this.turnOnLayer = this.turnOnLayer.bind(this)
        this.featureChange = this.featureChange.bind(this)
        this.createUniqueBapContents = this.createUniqueBapContents.bind(this)
    }

    componentDidMount() {
        this.props.onRef(this)
        this.featureChange()
    }


    componentDidUpdate(prevProps) {
        if (prevProps.feature !== this.props.feature) {
            this.clearCharts()
            this.featureChange()
        }
    }

    featureChange() {
        if (this.props.feature) {
            if (this.props.feature.properties.userDefined) {
                this.props.isEnabled(true)
                this.props.canOpen(true)
                this.setState({
                    canSubmit: true
                })
            }
            else {
                this.props.isEnabled(true)
                this.props.canOpen(true)
                this.setState({
                    canSubmit: true
                })
            }
        }
        else {
            this.props.canOpen(false)
            this.props.isEnabled(true)
        }

    }


    clearCharts() {
        this.setState({
            data: null,
            charts: [],
            refs: []
        })
    }

    turnOnLayer(value) {
        layers["phenology_service"]["legend"]["imageUrl"] = baseLegendUrl + `&layer=${value[0]}&style=${value[1]}`

        // this will get flipped to turn on the layer in analysysPackage 
        layers["phenology_service"].checked = false
        this.props.updateBapLayers(layers["phenology_service"])

        layers["phenology_service"]["layer"].setParams({
            layers: value[0],
            styles: value[1],
            time: this.getFormattedDate(value[2])
        })
    }

    toggleRadioBtn(index) {
        this.getCharts(this.state.data, index)
    }

    getFormattedDate(date) {
        const year = date.getFullYear()
        let month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`
    }


    getFetchForDate(url, date) {
        const formattedDate = this.getFormattedDate(date)
        return fetch(`${url}&date=${formattedDate}`)
            .then(res => { return res.json() },
                (error) => {
                    this.setState({
                        error
                    });
                })
    }

    submitAnalysis() {
        if (this.props.feature && !this.props.feature.properties.userDefined) {
            this.setState({
                loading: true,
                error: false
            })
            let fetches = []
            for (let date of this.state.dates) {
                fetches.push(this.getFetchForDate(`${PHENO32_URL}?feature_id=${this.props.feature.properties.feature_id}&token=${PUBLIC_TOKEN}`, date.date))
                fetches.push(this.getFetchForDate(`${PHENO50_URL}?feature_id=${this.props.feature.properties.feature_id}&token=${PUBLIC_TOKEN}`, date.date))
            }
            Promise.all(fetches).then(results => {
                if (results) {
                    this.setState({
                        data: results,
                        loading: false
                    }, () => {
                        this.getCharts(this.state.data, 0)
                    })
                    this.props.isEnabled(true)
                    this.props.canOpen(true)

                } else {
                    this.props.isEnabled(false)
                    this.props.canOpen(false)
                }
            }, (error) => {
                this.setState({
                    error: true,
                    loading: false
                });
            })
        }
        else if (this.props.feature) {
            // hit with drawn polygon
            this.setState({
                loading: true,
                error: false
            })
            let fetches = []
            for (let date of this.state.dates) {
                fetches.push(this.getFetchForDate(`${PHENO32_POLY_URL}?geojson=${JSON.stringify(this.props.feature.geometry)}&token=${PUBLIC_TOKEN}`, date.date))
                fetches.push(this.getFetchForDate(`${PHENO50_POLY_URL}?geojson=${JSON.stringify(this.props.feature.geometry)}&token=${PUBLIC_TOKEN}`, date.date))
            }
            Promise.all(fetches).then(results => {
                if (results) {
                    this.setState({
                        data: results,
                        loading: false
                    }, () => {
                        this.getCharts(this.state.data)
                    })
                    this.props.isEnabled(true)
                    this.props.canOpen(true)

                } else {
                    this.props.isEnabled(false)
                    this.props.canOpen(false)
                }
            }, (error) => {
                this.setState({
                    error: true,
                    loading: false
                });
            })
        }
    }

    /**
     * Loop through the charts defined in the state.
     * Create the chart id, data, and config as documented in the chart type.
     * @param {Object {}} data
     */
    getCharts(data, idx) {
        if (!data) return

        let selectedIndex = idx;
        if (!selectedIndex) selectedIndex = 0;

        try {

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
                "agdd_50f": {
                    "Current": data[1][`${this.getFormattedDate(this.state.dates[0].date)}`],
                    "Six-Day": data[3][`${this.getFormattedDate(this.state.dates[1].date)}`]
                },
                "agdd": {
                    "Current": data[0][`${this.getFormattedDate(this.state.dates[0].date)}`],
                    "Six-Day": data[2][`${this.getFormattedDate(this.state.dates[1].date)}`]
                }
            }

            let chartData = {
                "agdd_50f": {
                    "Apple Maggot": {
                        "Not Approaching Treatment Window": {
                            "range": [0, 650],
                            "color": "rgb(153,153,153)"
                        },
                        "Approaching Treatment Window": {
                            "range": [650, 900],
                            "color": "rgb(255,237,111)"
                        },
                        "Treatment Window": {
                            "range": [900, 2000],
                            "color": "rgb(65,171,93)"
                        },
                        "Treatment Window Passed": {
                            "range": [2000],
                            "color": "rgb(193,154,107)"
                        },
                    },
                    "Emerald Ash Borer": {
                        "Not Approaching Treatment Window": {
                            "range": [0, 350],
                            "color": "rgb(153,153,153)"
                        },
                        "Approaching Treatment Window": {
                            "range": [350, 450],
                            "color": "rgb(255,237,111)"
                        },
                        "Treatment Window": {
                            "range": [450, 1500],
                            "color": "rgb(65,171,93)"
                        },
                        "Treatment Window Passed": {
                            "range": [1500],
                            "color": "rgb(193,154,107)"
                        },
                    },
                    "Lilac Borer": {
                        "Not Approaching Treatment Window": {
                            "range": [0, 350],
                            "color": "rgb(153,153,153)"
                        },
                        "Approaching Treatment Window": {
                            "range": [350, 500],
                            "color": "rgb(255,237,111)"
                        },
                        "Treatment Window": {
                            "range": [500, 1300],
                            "color": "rgb(65,171,93)"
                        },
                        "Treatment Window Passed": {
                            "range": [1300],
                            "color": "rgb(193,154,107)"
                        },
                    },
                    "Winter Moth": {
                        "Not Approaching Treatment Window": {
                            "range": [0, 20],
                            "color": "rgb(153,153,153)"
                        },
                        "Treatment Window": {
                            "range": [20, 350],
                            "color": "rgb(65,171,93)"
                        },
                        "Treatment Window Passed": {
                            "range": [350],
                            "color": "rgb(193,154,107)"
                        },
                    }
                },
                "agdd": {
                    "Hemlock Woolly Adelgid": {
                        "Not Approaching Treatment Window": {
                            "range": [0, 25],
                            "color": "rgb(153,153,153)"
                        },
                        "Approaching Treatment Window": {
                            "range": [25, 1000],
                            "color": "rgb(255,237,111)"
                        },
                        "Treatment Window": {
                            "range": [1000, 2200],
                            "color": "rgb(65,171,93)"
                        },
                        "Treatment Window Passed": {
                            "range": [2200],
                            "color": "rgb(193,154,107)"
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
            let refs = []
            let i = 0;
            for (let layer of Object.keys(rawData)) {
                for (let pestName of Object.keys(chartData[layer])) {
                    for (let time of Object.keys(rawData[layer])) {
                        const timeIndex = time === 'Current' ? 0 : 1
                        let chartId = `PHENO_${pestName.replace(/\s/g, '')}_${time}`
                        const chartConfig = {
                            width: 400,
                            height: 150,
                            margins: { left: 50, right: 20, top: 20, bottom: 40 },
                            chart: { title: timeIndex ? '' : `${pestName}`, subtitle: `` },
                            xAxis: { key: 'acres', label: "Approximate Acreage", ticks: 5, tickFormat: (d) => { return `${numberWithCommas(parseInt(d))}` } },
                            yAxis: { key: 'name', label: `${time}  ${this.getFormattedDate(this.state.dates[timeIndex].date)}`, ticks: 5, tickFormat: (d) => { '' } },
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

                        let style = pestName.toLowerCase().replace(/\s/g, '_')
                        let d = this.state.dates[timeIndex].date
                        charts.push(
                            <div key={chartId} className="nbm-flex-row-no-padding" style={{ borderBottom: "1px solid gray" }}>
                                <div style={{ justifyContent: "center" }} className="nbm-flex-column-big">
                                    <HorizontalBarChart
                                        onRef={ref => { (this.chartId = ref); refs.push(this.chartId) }}
                                        key={chartId}
                                        data={chartDataFormatted}
                                        id={chartId}
                                        config={chartConfig} />
                                </div>
                                <div style={{ justifyContent: "center", paddingRight: "5px" }} className="nbm-flex-column">
                                    <RadioButton
                                        isChecked={(selectedIndex === i)}
                                        value={[layer, style, d]}
                                        index={i}
                                        handler={this.toggleRadioBtn.bind(this)}
                                    />
                                </div>
                            </div>
                        )
                        if (i === selectedIndex) {
                            this.turnOnLayer([layer, style, d])
                        }
                        i++
                    }
                }
            }
            this.setState({
                charts: charts,
                refs: refs
            })

        }
        catch (error) {
            this.setState({
                error,
                loading: false
            });
            return null
        }
    }

    print() {
        if (this.state.refs.length && this.props.isOpen) {
            let charts = []
            for (let i = 0; i < this.state.refs.length; i++) {
                charts.push(this.state.refs[i].print(this.state.charts[i].props.id))
            }

            return Promise.all(charts.flat()).then(contents => {
                let content = []
                content.push({ stack: this.props.getSBItemForPrint() })

                for (let i = 0; i < this.state.refs.length; i += 2) {
                    content.push({ text: this.state.charts[i].props.config.chart.title, style: 'chartTitle', margin: [5, 5, 5, 5] })
                    content.push({
                        columns: [
                            {
                                width: 'auto',
                                stack: [
                                    { image: contents[i], alignment: 'center', width: 250, height: 110 }
                                ]
                            },
                            {
                                width: 'auto',
                                stack: [
                                    { image: contents[i + 1], alignment: 'center', width: 250, height: 110 }
                                ]
                            }
                        ]
                    })
                }
                content.push({ text: 'Phenology Forecasts data were provided by the', style: 'annotation', margin: [5, 10, 5, 0] })
                content.push({ text: 'USA National Phenology Network', style: 'annotationLink', margin: [5, 0, 5, 0], link: 'https://www.usanpn.org' })
                content.push({ text: `Data retrieved ${new Date().toDateString()}`, style: 'annotation', margin: [5, 0, 5, 0] })

                return content
            })
        }
        return []
    }

    createUniqueBapContents() {
        return (
            <div>
                {this.props.getAnalysisLayers()}
                {this.props.handleBapError(this.state.error)}
                <div className="chartsDiv">
                    <div className="chart-headers" >
                        <button className="submit-analysis-btn" onClick={this.submitAnalysis}>Get Phenology Forecast</button>
                    </div>
                    {this.state.charts}
                    <div className="chart-footers" >
                        <div className="anotations">
                            Phenology Forecasts data were provided by the <a href="https://www.usanpn.org">USA National Phenology Network</a>, data retrieved {new Date().toDateString()}
                            <br></br>
                            <br></br>
                            <a target={"_blank"} href={"https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&service=WMS&layers=agdd_50f,agdd"}>https://geoserver.usanpn.org/geoserver/si-x/wms?request=GetCapabilities&amp;service=WMS&amp;layers=agdd_50f,agdd</a>
                        </div>
                    </div>
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
const PhenologyAnalysis = withSharedAnalysisCharacteristics(
    PhenologyAnalysisPackage,
    layers,
    sb_properties,
    SB_URL);

export default PhenologyAnalysis;
