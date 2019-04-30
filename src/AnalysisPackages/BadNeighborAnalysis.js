import React from "react";
import { BarLoader } from "react-spinners"
import withSharedAnalysisCharacteristics from "./AnalysisPackage"
import HorizontalBarChart from "../Charts/HorizontalBarChart";
import TableChart from "../Charts/TableChart"

import "./AnalysisPackages.css";

const SB_URL = "https://www.sciencebase.gov/catalog/item/5cc34cbae4b09b8c0b7606b9?format=json"

const BADNEIGHBOR_URL = process.env.REACT_APP_BIS_API + "/api/v1/badneighbor/state?fips="

let sb_properties = {
    "title": "Bad Neighbor Invasives"
}

const layers = {}

class BadNeighborAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                barChart: { id: "", config: {}, data: null },
                tableChart: { id: "", config: {}, data: null },
            },
            tableGroup: "All Invasives",
            layersOpen: false,
            value: []
        }

        this.getCharts = this.getCharts.bind(this)
        this.print = this.print.bind(this)
        this.featureChange = this.featureChange.bind(this)
        this.fetch = this.fetch.bind(this)
        this.createUniqueBapContents = this.createUniqueBapContents.bind(this)
        this.filterTableData = this.filterTableData.bind(this)
        this.resetTable = this.resetTable.bind(this)
    }

    componentDidMount() {
        this.props.onRef(this)
        this.featureChange()
    }

    componentDidUpdate(prevProps) {
        if (prevProps.feature !== this.props.feature) {
            this.featureChange()
        }
    }

    featureChange() {
        if (this.props.feature) {
            if (this.props.feature.properties.feature_class === "US States and Territories") {
                this.fetch()
            }
            else {
                this.props.isEnabled(false)
                this.props.canOpen(false)
            }
        }
        else {
            this.props.canOpen(false)
            this.props.isEnabled(true)
        }

    }

    fetch() {
        this.setState({
            loading: true,
            error: false
        })
        const fips = this.props.feature.properties.feature_id.split("US_States_and_Territories:state_fipscode:")[1]
        fetch(BADNEIGHBOR_URL + fips)
            .then(res => res.json())
            .then(
                (result) => {
                    if (result && result.hits.hits[0]) {
                        this.props.setBapJson(result.hits.hits[0]._source.properties)
                        const charts = this.getCharts(result.hits.hits[0]._source.data)
                        this.setState({
                            charts: charts,
                            loading: false,
                            data: result.hits.hits[0]._source.data
                        })
                        this.props.isEnabled(true)
                        this.props.canOpen(true)

                    } else {
                        this.setState({
                            charts: {
                                horizontalBarChart: { id: "", config: {}, data: null }
                            },
                            data: null
                        })
                        this.props.isEnabled(false)
                        this.props.canOpen(false)
                    }
                },
                (error) => {
                    this.setState({
                        error: true,
                        loading: false
                    });
                }
            )
    }



    /**
     * Loop through the charts defined in the state and look for a data object in datas that matches.
     * Create the chart id, data, and config as documented in the chart type.
     * @param {Object {}} datas - one enrty for each chart named the same as defined in the state
     */
    getCharts(data) {

        const getPercent = (value, total) => {
            value = parseFloat(value)
            return parseFloat(((value / parseFloat(total)) * 100).toFixed(1))
        }

        let charts = {}

        for (let chart of Object.keys(this.state.charts)) {

            if (chart.toString() === "barChart" && data) {

                const chartId = "BadNeighbor_HorizontalBarChart"
                let formattedData = []
                let total = 0
                for (let key of Object.keys(data)) {
                    let k = key.split('_').map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(' ')
                    let count = 0
                    if ('bad_neighbor_count' in data[key]) {
                        count = parseInt(data[key]["bad_neighbor_count"])
                    }
                    else {
                        for (let subkey of Object.keys(data[key])) {
                            if ('bad_neighbor_count' in data[key][subkey]) {
                                count += parseInt(data[key][subkey]["bad_neighbor_count"])
                            }
                        }
                    }
                    total += count
                    formattedData.push({ "Group": k, "Percent": 0, "Count": count, "color": "rgb(100,100,100)" })

                }
                formattedData = formattedData.map(d => {
                    d["Percent"] = getPercent(d["Count"], total)
                    return d
                })


                const chartConfig = {
                    margins: { left: 100, right: 20, top: 20, bottom: 70 },
                    chart: { title: `Percent Threat of Sample Groups Bad Neighbors in ${this.props.feature.properties.feature_name}`, subtitle: `` },
                    xAxis: { key: 'Percent', label: "Realative Contribution", ticks: 5, tickFormat: (d) => { return `${parseInt(d)}%` } },
                    yAxis: { key: 'Group', label: "Bad Neighbor Group", ticks: 5, tickFormat: (d) => { return d } },
                    tooltip: { label: (d) => { return `<div style="text-align:left;"><div><b>Group</b>: ${d.Group}</div><div><b>Contribution</b>: ${d.Percent}%</div><div><b>Count</b>: ${d.Count}</div></div>` } },
                    onClick: (d) => { this.filterTableData(d) }
                }
                formattedData.reverse()
                charts[chart] = { id: chartId, config: chartConfig, data: formattedData }

            }
            if (chart.toString() === "tableChart" && data) {
                const chartId = "BadNeighbor_tableChart"
                let chartTitle = `${this.props.feature.properties.feature_name} Bad Neighbors : ${this.state.tableGroup}`
                const chartSubTitle = `(Click on a bar above to filter the table and see only neighboring invasive species within a catagory.)`
                let formattedData = []
                for (let key of Object.keys(data)) {
                    let k = key.split('_').map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(' ')
                    let list = []
                    if ('species_list' in data[key]) {
                        list = data[key]["species_list"].map((d) => {
                            return [d.name, <a href={`https://bison.usgs.gov/index.jsp?scientificName=${d.name}&ITIS=itis`} target='_blank' rel='noopener noreferrer' > {d.tsn}</a>]
                        })
                    }
                    else {
                        for (let subkey of Object.keys(data[key])) {
                            if ('species_list' in data[key][subkey]) {
                                list = list.concat(data[key][subkey]["species_list"].map((d) => {
                                    return [d.name, <a href={`https://bison.usgs.gov/index.jsp?scientificName=${d.name}&ITIS=itis`} target='_blank' rel='noopener noreferrer' > {d.tsn}</a>]
                                }))
                            }
                        }
                    }
                    formattedData.push({ "Group": k, "List": list })
                }
                let chartData = [['Species', 'TSN']]
                for (let d in formattedData) {
                    if (this.state.tableGroup === 'All Invasives' || this.state.tableGroup.toString() === formattedData[d].Group.toString()) {
                        chartData = chartData.concat(formattedData[d].List)
                    }
                }

                const chartConfig = {
                    margins: { left: 20, right: 20, top: 20, bottom: 125 },
                    chart: { title: chartTitle, subtitle: chartSubTitle, color: this.state.gapColor },
                }
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }



            }
        }
        return charts
    }


    filterTableData(d) {
        this.setState({
            tableGroup: d.Group,
        }, () => {
            const charts = this.getCharts(this.state.data)
            this.setState({
                charts: charts,
                submitted: true,
                loading: false
            })
        })
    }
    resetTable() {
        this.setState({
            tableGroup: "All Invasives",
        }, () => {
            const charts = this.getCharts(this.state.data)
            this.setState({
                charts: charts,
                submitted: true,
                loading: false
            })
        })
    }

    print() {
        if (this.state.charts.barChart.data && this.props.isOpen) {
            return [
                this.BarChart.print(this.state.charts.barChart.id)
                    .then(img => {
                        return [
                            { stack: this.props.getSBItemForPrint() },
                            { text: this.BarChart.props.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                            { text: this.BarChart.props.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                            { image: img, alignment: 'center', width: 250 },
                        ]
                    })
            ]
        }
        return []
    }

    createUniqueBapContents() {
        return (
            <div>
                {this.props.getAnalysisLayers()}
                {this.props.handleBapError(this.state.error)}
                <div className="chartsDiv">
                    <HorizontalBarChart onRef={ref => (this.BarChart = ref)} data={this.state.charts.barChart.data} id={this.state.charts.barChart.id} config={this.state.charts.barChart.config} />

                    <div className="chart-headers">
                        <button className="submit-analysis-btn" onClick={this.resetTable}>Clear Chart Selection</button>
                    </div>
                    <TableChart
                        data={this.state.charts.tableChart.data}
                        id={this.state.charts.tableChart.id}
                        config={this.state.charts.tableChart.config} />
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

const BadNeighborAnalysis = withSharedAnalysisCharacteristics(BadNeighborAnalysisPackage, layers, sb_properties, SB_URL);

export default BadNeighborAnalysis;
