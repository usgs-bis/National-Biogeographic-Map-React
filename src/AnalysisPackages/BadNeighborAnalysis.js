import React from "react";
import { BarLoader } from "react-spinners"
import withSharedAnalysisCharacteristics from "./AnalysisPackage"
import DonutChart from "../Charts/DonutChart";
import TableChart from "../Charts/TableChart"
import "./AnalysisPackages.css";

const SB_URL = "https://www.sciencebase.gov/catalog/item/5cc34cbae4b09b8c0b7606b9?format=json"

const BADNEIGHBOR_URL = process.env.REACT_APP_BIS_API + "/api/v1/nonnativespecies/"

let sb_properties = {
    "title": "Bad Neighbor Invasives"
}

const layers = []

class BadNeighborAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                donutChart: { id: "", config: {}, data: null },
                tableChart: { id: "", config: {}, data: null },
            },
            tableGroup: "All Invasives",
        }

        this.donutChart = React.createRef()

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
        if (this.props.initBap) {
            this.setState({
                tableGroup: this.props.initBap.tableGroup
            })
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.feature !== this.props.feature) {
            this.featureChange()
        }
        this.props.setShareState({
            tableGroup: this.state.tableGroup
        })
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
        fetch(BADNEIGHBOR_URL + this.props.feature.properties.feature_id)
            .then(res => res.json())
            .then(
                (result) => {
                    if (result && result.hits.hits[0] && result.hits.hits[0]._source.data) {
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
                                donutChart: { id: "", config: {}, data: null },
                                tableChart: { id: "", config: {}, data: null }
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
            if (chart.toString() === "donutChart" && data) {

                const chartId = "BadNeighbor_DonutChart"
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
                    formattedData.push({ "name": k, "percent": 0, "Count": count, "color": "random" })
                }
                formattedData = formattedData.map(d => {
                    d["percent"] = getPercent(d["Count"], total)
                    return d
                })


                const chartConfig = {
                    margins: { left: 75, right: 80, top: 100, bottom: 0 },
                    chart: { title: `Percent Threat of Sample Groups Bad Neighbors in ${this.props.feature.properties.feature_name}`, subtitle: `` },
                    tooltip: { data: { name: "Group", percent: "Contribution", Count: "Count" } },
                    lables: { fontSize: '8px', label: ({data}) => `${data.name} ${(parseFloat(data.percent)).toFixed(2).toString()}%` },
                    onClick: (d) => { this.filterTableData(d) }
                }
                formattedData.sort((a, b) => {
                    if(a.percent < b.percent) {
                        return -1
                    }
                    return a.percent > b.percent ? 1 : 0
                }).reverse()
                charts[chart] = { id: chartId, config: chartConfig, data: formattedData }
            }
            if (chart.toString() === "tableChart" && data) {
                const chartId = "BadNeighbor_tableChart"
                let chartTitle = `${this.props.feature.properties.feature_name} Bad Neighbors: ${this.state.tableGroup}`
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
            tableGroup: d.name,
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
        if (this.state.charts.donutChart.data && this.props.isOpen) {
            const tableData = this.state.charts.tableChart.data
            function getRow(elm) {
                const species = elm[0]
                const val = elm[1]
                if (typeof val === 'string' ) {
                    return [species, val]
                }
                return [species, { text: val.props.children[1], link: val.props.href }]
            }
            function getColumn(startIdx, endIdx) {
                return {
                    width: 175,
                    margin: [3, 0],
                    stack: [
                        {
                            style: 'tableStyle',
                            table: {
                                widths: ['50%', '50%'],
                                heights: 20,
                                body: tableData.slice(startIdx, endIdx)
                                    .map(getRow)
                            }
                        },
                    ]
                }
            }
            return this.donutChart.current.print().then(img => {
                return [
                    { stack: this.props.getSBItemForPrint() },
                    { text: this.state.charts.donutChart.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                    { text: this.state.charts.donutChart.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                    { image: img, alignment: 'center', width: 250 },
                    { text: this.state.charts.tableChart.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 10] },
                    {
                        columns: [
                            getColumn(0, Math.floor(tableData.length / 3)),
                            getColumn(Math.floor(tableData.length / 3), Math.floor(tableData.length / 3) * 2),
                            getColumn(Math.floor(tableData.length / 3) * 2, tableData.length)
                        ]
                    }
                ]
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
                    <DonutChart
                        ref={this.donutChart}
                        data={this.state.charts.donutChart.data}
                        id={this.state.charts.donutChart.id}
                        config={this.state.charts.donutChart.config} />
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
