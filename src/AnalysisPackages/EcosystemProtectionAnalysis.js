import React from "react";
import { Collapse } from "reactstrap"
import { Glyphicon } from "react-bootstrap";
import L from "leaflet"
import { BarLoader } from "react-spinners"
import { TiledMapLayer } from "esri-leaflet";

import withSharedAnalysisCharacteristics from "./AnalysisPackage"
import PieChart from "../Charts/PieChart"
import TableChart from "../Charts/TableChart"

import "./AnalysisPackages.css";

const SB_URL = "https://www.sciencebase.gov/catalog/item/5b747802e4b0f5d5787ed299?format=json"
const ECOSYSTEM_URL = process.env.REACT_APP_BIS_API + "/api/v1/gapmetrics/ecologicalsystems/protection?feature_id=";

let sb_properties = {
    "title": "Protection Status of Ecological Systems"
}

const layers = {
    gap_status: {
        title: "PAD-US v1.4 GAP Status Code",
        layer: new TiledMapLayer({
            url: "https://gis1.usgs.gov/arcgis/rest/services/PADUS1_4/GAP_Status_Code/MapServer",
            opacity: .5
        }),
        checked: false
    },
    ecological_systems: {
        title: "GAP Landcover 2011 Ecological System",
        layer: L.tileLayer.wms(
            "https://www.sciencebase.gov/geoserver/nvcs/wms",
            {
                format: "image/png",
                opacity: .5,
                transparent: true,
                layers: "ecological_system"
            }
        ),
        checked: false
    }
}

class EcosystemProtectionAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                gap12: { id: "", config: {}, data: null },
                gap123: { id: "", config: {}, data: null },
                gapTable: { id: "", config: {}, data: null },
                gapCoverage: { id: "", config: {}, data: null }
            },
            data: null,
            gapStatus: "ALL",
            gapRange: "ALL",
            title: sb_properties.title,
            submitted: false,
            isOpen: false,
            glyph: "menu-right",
            enabledLayers: {
                nfhp_service: false
            },
            layers: layers,
            value: []
        }

        this.toggleDropdown = this.toggleDropdown.bind(this)
        this.getCharts = this.getCharts.bind(this)
        this.toggleLayerDropdown = this.props.toggleLayerDropdown.bind(this)
        this.getAnalysisLayers = this.props.getAnalysisLayers.bind(this)
        this.updateBapLayers = this.props.updateBapLayers.bind(this)
        this.setOpacity = this.props.setOpacity.bind(this)
        this.resetAnalysisLayers = this.props.resetAnalysisLayers.bind(this)
        this.filterTableData = this.filterTableData.bind(this)
        this.getColorFromName = this.getColorFromName.bind(this)
        this.resetEcoTable = this.resetEcoTable.bind(this)
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


    componentDidUpdate(prevProps) {
        if (this.props.feature &&
            this.props.feature.properties.feature_id &&
            (!prevProps.feature || this.props.feature.properties.feature_id !== prevProps.feature.properties.feature_id)) {
            this.setState({
                loading: true
            })
            fetch(ECOSYSTEM_URL + this.props.feature.properties.feature_id)
                .then(res => res.json())
                .then(
                    (result) => {
                        if (result && result.success) {
                            const charts = this.getCharts(result.result)
                            this.setState({
                                charts: charts,
                                data: result.result,
                                submitted: true,
                                loading: false
                            })
                        } else {
                            this.setState({
                                charts: {
                                    gap12: { id: "", config: {}, data: null },
                                    gap123: { id: "", config: {}, data: null },
                                    gapTable: { id: "", config: {}, data: null },
                                    gapCoverage: { id: "", config: {}, data: null }
                                },
                                submitted: true,
                                enabledLayers: {
                                    nfhp_service: false,
                                    loading: false
                                }
                            })
                            this.props.updateAnalysisLayers([])
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

    getColorFromName(name) {
        const colorMap = {

            'Forest & Woodland': '#267300',
            'Shrubland & Herb Vegetation': '#F6C467',
            'Shrub & Herb Vegetation': '#F6C467',
            'Desert and Semi-Desert': '#D2B48C',
            'Desert & Semi-Desert': '#D2B48C',
            'Polar & High Montane Scrub Grassland & Barrens': '#EDE0F2',
            'Polar & High Montane Scrub, Grassland & Barrens': '#EDE0F2',
            'Aquatic Vegetation': '#00C5FF',
            'Open Rock Vegetation': '#555857',
            'Agricultural And Developed Vegetation': '#FEFEC1',
            'Agricultural & Developed Vegetation': '#FEFEC1',
            'Developed & Other Human Use': '#C94D42',
            'Introduced & Semi Natural Vegetation': '#A1459C',
            'Recently Disturbed or Modified': '#872E26',
            'Open Water': '#002EC2',
            'Nonvascular & Sparse Vascular Rock Vegetation': '#8C8F91'
        }
        return colorMap[name] ? colorMap[name] : '#000000'
    }

    resetEcoTable() {
        this.setState({
            gapStatus: "ALL",
            gapRange: "ALL"
        }, () => {
            const charts = this.getCharts(this.state.data)
            this.setState({
                charts: charts,
                submitted: true,
                loading: false
            })
        })
    }

    getCharts(data) {

        const numberWithCommas = (x) => {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        let charts = {}
        let dataTemplate = {
            ecoregion_protection: data.protection,
            ecosystem_coverage: [],
            ecological_systems: [],
            gap1_2: [
                { color: '#660000', count: 0, name: '< 1%', status: 'status_1_2_group', range: '<1' },
                { color: '#FF0000', count: 0, name: '1 - 10%', status: 'status_1_2_group', range: '1-10' },
                { color: '#EDCB62', count: 0, name: '10 - 17%', status: 'status_1_2_group', range: '10-17' },
                { color: '#9CCB19', count: 0, name: '17 - 50%', status: 'status_1_2_group', range: '17-50' },
                { color: '#228B22', count: 0, name: '> 50%', status: 'status_1_2_group', range: '>50' },
            ],
            gap1_2_3: [
                { color: '#660000', count: 0, name: '< 1%', status: 'status_1_2_3_group', range: '<1' },
                { color: '#FF0000', count: 0, name: '1 - 10%', status: 'status_1_2_3_group', range: '1-10' },
                { color: '#EDCB62', count: 0, name: '10 - 17%', status: 'status_1_2_3_group', range: '10-17' },
                { color: '#9CCB19', count: 0, name: '17 - 50%', status: 'status_1_2_3_group', range: '17-50' },
                { color: '#228B22', count: 0, name: '> 50%', status: 'status_1_2_3_group', range: '>50' },
            ],
        }
        for (let row of data.systems) {
            if (!row.eco_code || !row.eco_code.includes('.')) {
                let c = {
                    acres: row.totalac,
                    name: row.nvc_name,
                    code: row.nvc_code,
                    status_1_2: row.gapstat12perc,
                    status_1_2_3: row.gapstat123perc,
                    status_1_2_group: row.gapstat12group,
                    status_1_2_3_group: row.gapstat123group
                }
                dataTemplate.ecological_systems.push(c)

                let total = data.systems.length

                if (row.gapstat12group === '<1') dataTemplate.gap1_2[0].count += 1
                else if (row.gapstat12group === '1-10') dataTemplate.gap1_2[1].count += 1
                else if (row.gapstat12group === '10-17') dataTemplate.gap1_2[2].count += 1
                else if (row.gapstat12group === '17-50') dataTemplate.gap1_2[3].count += 1
                else if (row.gapstat12group === '>50') dataTemplate.gap1_2[4].count += 1

                if (row.gapstat123group === '<1') dataTemplate.gap1_2_3[0].count += 1
                else if (row.gapstat123group === '1-10') dataTemplate.gap1_2_3[1].count += 1
                else if (row.gapstat123group === '10-17') dataTemplate.gap1_2_3[2].count += 1
                else if (row.gapstat123group === '17-50') dataTemplate.gap1_2_3[3].count += 1
                else if (row.gapstat123group === '>50') dataTemplate.gap1_2_3[4].count += 1

                dataTemplate.gap1_2.forEach(x => {
                    x.percent = parseFloat(x.count / total) * 100
                })
                dataTemplate.gap1_2_3.forEach(x => {
                    x.percent = parseFloat(x.count / total) * 100
                })
            }
        }

        for (let row of data.coverage) {
            let c = {
                color: this.getColorFromName(row.nvc_name),
                name: row.nvc_name,
                percent: row.percent_nvcs_cover
            }
            dataTemplate.ecosystem_coverage.push(c)
        }

        dataTemplate.ecosystem_coverage.sort((a, b) => { return a.percent > b.percent ? -1 : 1 })

        for (let chart of Object.keys(this.state.charts)) {
            if (chart.toString() === "gap12" && data) {
                const chartId = "EP_GAP12"
                const chartConfig = {
                    margins: { left: 20, right: 20, top: 20, bottom: 125 },
                    chart: { title: `GAP Status 1 & 2`, subtitle: `` },
                    tooltip: { label: (d) => { return `<p><div>${d.data.name}</div><div>${d.data.count} ecosystem</div></p>` } },
                    legend: { rectSize: 12, spacing: 4, leftOffset: 6, fontSize: 'smaller' },
                    onClick: (d) => { this.filterTableData(d) }
                }
                const chartData = dataTemplate.gap1_2
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "gap123" && data) {
                const chartId = "EP_GAP123"
                const chartConfig = {
                    margins: { left: 20, right: 20, top: 20, bottom: 125 },
                    chart: { title: `GAP Status 1, 2 & 3`, subtitle: `` },
                    tooltip: { label: (d) => { return `<p><div>${d.data.name}</div><div>${d.data.count} ecosystem</div></p>` } },
                    legend: { rectSize: 12, spacing: 4, leftOffset: 6, fontSize: 'smaller' },
                    onClick: (d) => { this.filterTableData(d) }
                }
                const chartData = dataTemplate.gap1_2_3
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "gapTable" && data) {
                const chartId = "EP_GAPTABLE"
                let preData = dataTemplate.ecological_systems
                let tableType = "All Ecological Systems"
                let chartTitle = `${tableType} in ${this.props.feature.properties.feature_name} (${preData.length})`
                let chartData = [[<span>Ecological System</span>, <span>{`Gap 1 & 2 Protection (%)`}</span>, <span>{`Gap 1, 2 & 3 Protection (%)`}</span>]]
                let percentProtected = <span></span>
                let acresProtected = <span></span>

                if (this.state.gapRange !== 'ALL') {
                    preData = preData.filter((d) => { return d[this.state.gapStatus] === this.state.gapRange })
                    if (this.state.gapStatus === 'status_1_2_group') chartTitle = `${preData.length} Ecological Systems with ${this.state.gapRange}% within GAP Status 1 & 2 in ${this.props.feature.properties.feature_name}`
                    if (this.state.gapStatus === 'status_1_2_3_group') chartTitle = `${preData.length} Ecological Systems with ${this.state.gapRange}% within GAP Status 1, 2 & 3 in ${this.props.feature.properties.feature_name}`
                    chartData = [[<span>Ecological System</span>, <span> Acres Protected</span>, <span>% Protected</span>]]
                }

                for (let row of preData) {
                    const name = <span>{row.name}</span>
                    acresProtected = <span>{`${parseFloat(row.status_1_2).toFixed(2)}%`}</span>
                    percentProtected = <span>{`${parseFloat(row.status_1_2_3).toFixed(2)}%`}</span>

                    if (this.state.gapRange !== 'ALL') {
                        if (this.state.gapStatus === 'status_1_2_group') {
                            percentProtected = <span>{`${parseFloat(row.status_1_2).toFixed(2)}%`}</span>
                            acresProtected = <span>{`${numberWithCommas(parseFloat(row.acres).toFixed(0))}`}</span>

                        }
                        if (this.state.gapStatus === 'status_1_2_3_group') {
                            percentProtected = <span>{`${parseFloat(row.status_1_2_3).toFixed(2)}%`}</span>
                            acresProtected = <span>{`${numberWithCommas(parseFloat(row.acres).toFixed(0))}`}</span>
                        }
                    }
                    chartData.push([name, acresProtected, percentProtected])
                }
                const chartConfig = {
                    margins: { left: 20, right: 20, top: 20, bottom: 125 },
                    chart: { title: chartTitle, subtitle: `` },
                }
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }

            }
            if (chart.toString() === "gapCoverage" && data) {
                const chartId = "EP_gapCoverage"
                const chartConfig = {
                    margins: { left: 75, right: 75, top: 20, bottom: 175 },
                    chart: { title: `Percent Coverage by National Vegetation Classification Class`, subtitle: `` },
                    tooltip: { label: (d) => { return `<p><div>${d.data.name}</div><div>${parseFloat(d.data.percent).toFixed(2)}%</div></p>` } },
                    legend: { rectSize: 9, spacing: 2, leftOffset: 1.3, fontSize: 'x-small' },
                    onClick: (d) => { return null }
                }
                const chartData = dataTemplate.ecosystem_coverage
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
        }
        return charts

    }


    resetSppTable() {
        this.setState({
            gapStatus: "ALL",
            gapRange: "ALL"
        }, () => {
            const charts = this.getCharts(this.state.data)
            this.setState({
                charts: charts,
                submitted: true,
                loading: false
            })
        })
    }

    filterTableData(d) {
        this.setState({
            gapStatus: d.status,
            gapRange: d.range
        }, () => {
            const charts = this.getCharts(this.state.data)
            this.setState({
                charts: charts,
                submitted: true,
                loading: false
            })
        })
    }

    render() {
        return (
            <div
                style={{ display: (!!this.state.charts.gap12.data || !this.state.submitted) ? 'block' : 'none' }}
                className="nbm-flex-row-no-padding">
                <span onClick={this.toggleDropdown} className="bapTitle">
                    {this.state.title}
                    <Glyphicon style={{ display: this.state.submitted ? "inline-block" : "none" }}
                        className="dropdown-glyph"
                        glyph={this.state.glyph} />
                </span>
                <Collapse className="settings-dropdown" isOpen={this.state.isOpen && !!this.state.charts.gap12.data}>
                    <BarLoader width={100} widthUnit={"%"} color={"white"} loading={this.state.loading} />
                    {this.getAnalysisLayers()}
                    <div
                        style={{ display: (this.props.feature && this.props.feature.properties.feature_name) ? 'block' : 'none' }}
                        className="chartsDiv">

                        <div>
                            <div className="chart-titles">
                                <div className="title">Protection Status of {this.props.feature ? this.props.feature.properties.feature_name : ''}</div>
                                <div className="subtitle">Click on a slice to filter the table and see only systems with that percent of protection.)</div>
                            </div>
                            <div className="half-chart">
                                <PieChart
                                    data={this.state.charts.gap12.data}
                                    id={this.state.charts.gap12.id}
                                    config={this.state.charts.gap12.config} />
                            </div>
                            <div className="half-chart">
                                <PieChart
                                    data={this.state.charts.gap123.data}
                                    id={this.state.charts.gap123.id}
                                    config={this.state.charts.gap123.config} />
                            </div>
                        </div>

                        <div className="chart-headers">
                            <button className="submit-analysis-btn" onClick={this.resetEcoTable}>Clear Chart Selection</button>
                        </div>
                        <TableChart
                            data={this.state.charts.gapTable.data}
                            id={this.state.charts.gapTable.id}
                            config={this.state.charts.gapTable.config} />
                        <PieChart
                            data={this.state.charts.gapCoverage.data}
                            id={this.state.charts.gapCoverage.id}
                            config={this.state.charts.gapCoverage.config} />
                    </div>
                </Collapse>
            </div>
        )
    }
}
const EcosystemProtectionAnalysis = withSharedAnalysisCharacteristics(EcosystemProtectionAnalysisPackage, layers);

export default EcosystemProtectionAnalysis;
