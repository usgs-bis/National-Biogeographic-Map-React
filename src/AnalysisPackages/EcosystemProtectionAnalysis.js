import React from "react";
import L from "leaflet"
import { BarLoader } from "react-spinners"
import { TiledMapLayer } from "esri-leaflet";
import withSharedAnalysisCharacteristics from "./AnalysisPackage"
import DonutChart from "../Charts/DonutChart";
import TableChart from "../Charts/TableChart"
import HorizontalBarChart from "../Charts/HorizontalBarChart";
import "./AnalysisPackages.css";
import ChartLegend from "../Charts/ChartLegend";

const SB_URL = "https://www.sciencebase.gov/catalog/item/5b747802e4b0f5d5787ed299?format=json"
const ECOSYSTEM_URL = process.env.REACT_APP_BIS_API + "/api/v1/gapmetrics/ecologicalsystems/protection?feature_id=";

let sb_properties = {
    "title": "Protection Status of Ecological Systems"
}

const layers = [
    {
        title: "PAD-US v1.4 GAP Status Code",
        layer: new TiledMapLayer({
            url: "https://gis1.usgs.gov/arcgis/rest/services/PADUS1_4/GAP_Status_Code/MapServer",
            opacity: .5
        }),
        legend: {
            arcgisUrl: "https://gis1.usgs.gov/arcgis/rest/services/PADUS1_4/GAP_Status_Code/MapServer/legend?f=pjson",
            layers: [0]
        },
        checked: false,
        disabled: true,
        sb_item: '56bba50ce4b08d617f657956'
    },
    {
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
        legend: {
            imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic" +
                "&format=image%2Fpng&layer=ecological_system"
        },
        checked: false,
        sb_item: '58d1bb47e4b0236b68f6b8a7'
    }
]

class EcosystemProtectionAnalysisPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                protectionStatus: { id: "", config: {}, data: null },
                gap12: { id: "", config: {}, data: null },
                gap123: { id: "", config: {}, data: null },
                gapTable: { id: "", config: {}, data: null },
                gapCoverage: { id: "", config: {}, data: null }
            },
            data: null,
            gapSelection: {
                status: 'ALL',
                range: 'ALL',
                color: 'white'
            },
            gapCoverageSelection: null
        }
        this.gap12StatusGroup = 'status_1_2_group'
        this.gap123StatusGroup = 'status_1_2_3_group'
        this.gap12 = React.createRef()
        this.gap123 = React.createRef()
        this.gapCoverage = React.createRef()

        this.getCharts = this.getCharts.bind(this)
        this.filterTableData = this.filterTableData.bind(this)
        this.showGapCoverage = this.showGapCoverage.bind(this)
        this.getColorFromName = this.getColorFromName.bind(this)
        this.resetEcoTable = this.resetEcoTable.bind(this)
        this.print = this.print.bind(this)
        this.featureChange = this.featureChange.bind(this)
        this.fetch = this.fetch.bind(this)
        this.createUniqueBapContents = this.createUniqueBapContents.bind(this)
    }

    componentDidMount() {
        this.props.onRef(this)
        this.featureChange()
        if (this.props.initBap) {
            this.setState({
                gapSelection: this.props.initBap.gapSelection
            })
        }
    }


    componentDidUpdate(prevProps) {
        if (prevProps.feature !== this.props.feature) {
            this.featureChange()
        }
        this.props.setShareState({
            gapSelection: this.state.gapSelection
        })
    }

    featureChange() {
        if (this.props.feature) {
            if (this.props.feature.properties.userDefined) {
                this.props.isEnabled(false)
                this.props.canOpen(false)
            }
            else {
                this.fetch()
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
        fetch(ECOSYSTEM_URL + this.props.feature.properties.feature_id)
            .then(res => res.json())
            .then(
                (result) => {
                    if (result && result.success) {
                        this.props.setBapJson(result.result)
                        const charts = this.getCharts(result.result)
                        this.setState({
                            charts: charts,
                            data: result.result,
                            submitted: true,
                            loading: false
                        })
                        this.props.isEnabled(true)
                        this.props.canOpen(true)
                    } else {
                        this.setState({
                            charts: {
                                protectionStatus: { id: "", config: {}, data: null },
                                gap12: { id: "", config: {}, data: null },
                                gap123: { id: "", config: {}, data: null },
                                gapTable: { id: "", config: {}, data: null },
                                gapCoverage: { id: "", config: {}, data: null }
                            },
                            submitted: true,
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

    getColorFromName(name) {
        const colorMap = {

            'Forest & Woodland': 'rgb(38,115,0)',
            'Shrubland & Herb Vegetation': 'rgb(246,196,103)',
            'Shrub & Herb Vegetation': 'rgb(246,196,103)',
            'Desert and Semi-Desert': 'rgb(210,180,140)',
            'Desert & Semi-Desert': 'rgb(210,180,140)',
            'Polar & High Montane Scrub Grassland & Barrens': 'rgb(237,224,242)',
            'Polar & High Montane Scrub, Grassland & Barrens': 'rgb(237,224,242)',
            'Aquatic Vegetation': 'rgb(0,197,255)',
            'Open Rock Vegetation': 'rgb(85,88,87)',
            'Agricultural And Developed Vegetation': 'rgb(254,254,193)',
            'Agricultural & Developed Vegetation': 'rgb(254,254,193)',
            'Developed & Other Human Use': 'rgb(201,77,66)',
            'Introduced & Semi Natural Vegetation': 'rgb(161,69,156)',
            'Recently Disturbed or Modified': 'rgb(135,46,38)',
            'Open Water': 'rgb(0,46,194)',
            'Nonvascular & Sparse Vascular Rock Vegetation': 'rgb(140,143,145)'
        }
        return colorMap[name] ? colorMap[name] : 'rgb(0,0,0)'
    }

    resetEcoTable() {
        this.setState({
            gapSelection: {
                status: 'ALL',
                range: 'ALL',
                color: 'white'
            }
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
            ecoregion_protection: [
                {
                    name: "CONUS",
                    chart_data: []
                },
                {
                    name: this.props.feature.properties.feature_name,
                    chart_data: []
                }
            ],
            ecosystem_coverage: [],
            ecological_systems: [],
            gap1_2: [
                { color: '#660000', count: 0, name: '< 1%', status: this.gap12StatusGroup, range: '<1', legend: '<1% is on GAP Status 1 and 2 lands (least protected).' },
                { color: '#ff0000', count: 0, name: '1 - 10%', status: this.gap12StatusGroup, range: '1-10', legend: '1 - 10% is on GAP Status 1 and 2 lands.' },
                { color: '#edcb62', count: 0, name: '10 - 17%', status: this.gap12StatusGroup, range: '10-17', legend: '10 - 17%* is on GAP Status 1 and 2 lands.' },
                { color: '#9ccb19', count: 0, name: '17 - 50%', status: this.gap12StatusGroup, range: '17-50', legend: '17% - 50% is on GAP Status 1 and 2 lands.' },
                { color: '#228b22', count: 0, name: '> 50%', status: this.gap12StatusGroup, range: '>50', legend: '> 50% is on GAP Status 1 and 2 lands (most protected).' },
            ],
            gap1_2_3: [
                { color: '#660000', count: 0, name: '< 1%', status: this.gap123StatusGroup, range: '<1' },
                { color: '#ff0000', count: 0, name: '1 - 10%', status: this.gap123StatusGroup, range: '1-10' },
                { color: '#edcb62', count: 0, name: '10 - 17%', status: this.gap123StatusGroup, range: '10-17' },
                { color: '#9ccb19', count: 0, name: '17 - 50%', status: this.gap123StatusGroup, range: '17-50' },
                { color: '#228b22', count: 0, name: '> 50%', status: this.gap123StatusGroup, range: '>50' },
            ],
        }
        const placeName = this.props.feature.properties.feature_name
        if (data.protection.CONUS) {
            let total = parseFloat(data.protection.CONUS.gapstat1ac)
                + parseFloat(data.protection.CONUS.gapstat2ac)
                + parseFloat(data.protection.CONUS.gapstat3ac)
                + parseFloat(data.protection.CONUS.gapstat4ac);
            let temp = [
                {
                    id: "Status12",
                    value: numberWithCommas(parseInt(data.protection.CONUS.gapstat1ac + data.protection.CONUS.gapstat2ac)),
                    percent: ((data.protection.CONUS.gapstat1ac + data.protection.CONUS.gapstat2ac) / total) * 100
                },
                {
                    id: "Status3",
                    value: numberWithCommas(parseInt(data.protection.CONUS.gapstat3ac)),
                    percent: (data.protection.CONUS.gapstat3ac / total) * 100
                },
                {
                    id: "Status4",
                    value: numberWithCommas(parseInt(data.protection.CONUS.gapstat4ac)),
                    percent: (data.protection.CONUS.gapstat4ac / total) * 100
                }
            ]
            dataTemplate.ecoregion_protection[0].chart_data = temp
        }
        if (data.protection[placeName]) {
            let total = parseFloat(data.protection[placeName].gapstat1ac)
                + parseFloat(data.protection[placeName].gapstat2ac)
                + parseFloat(data.protection[placeName].gapstat3ac)
                + parseFloat(data.protection[placeName].gapstat4ac);
            let temp = [
                {
                    id: "Status12",
                    value: numberWithCommas(parseInt(data.protection[placeName].gapstat1ac + data.protection[placeName].gapstat2ac)),
                    percent: ((data.protection[placeName].gapstat1ac + data.protection[placeName].gapstat2ac) / total) * 100
                },
                {
                    id: "Status3",
                    value: numberWithCommas(parseInt(data.protection[placeName].gapstat3ac)),
                    percent: (data.protection[placeName].gapstat3ac / total) * 100
                },
                {
                    id: "Status4",
                    value: numberWithCommas(parseInt(data.protection[placeName].gapstat4ac)),
                    percent: (data.protection[placeName].gapstat4ac / total) * 100
                }
            ]
            dataTemplate.ecoregion_protection[1].chart_data = temp
        }

        for (let row of data.systems) {
            if (!row.eco_code || !row.eco_code.includes('.')) {
                let c = {
                    acres: row.totalac,
                    name: row.nvc_name,
                    code: row.nvc_code,
                    status_1_2: row.gapstat12perc,
                    status_1_2_3: row.gapstat123perc
                }
                c[this.gap12StatusGroup] = row.gapstat12group
                c[this.gap123StatusGroup] = row.gapstat123group
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
            if (chart.toString() === "protectionStatus" && data) {

                const chartId = "EP_protectionStatus"
                const chartConfig = {
                    height: 200,
                    width: 400,
                    margins: { left: 50 + (6 * this.props.feature.properties.feature_name.length), right: 20, top: 20, bottom: 100 },
                    chart: { title: `Protection Status of ${this.props.feature.properties.feature_name} Compared to the Continental United States`, subtitle: `` },
                    xAxis: { key: 'Percent', label: "", ticks: 5, tickFormat: (d) => { return `${parseInt(d)}%` } },
                    yAxis: { key: 'name', label: "", ticks: 2, tickFormat: (d) => { return d } },
                    tooltip: {
                        label: (d) => {
                            let p = ""
                            let v = ""
                            let g = ""
                            if (d && Math.abs(d[1] - d[0] - d.data['Gap Status 1 & 2']) < 0.01) {
                                p = parseFloat(d.data['Gap Status 1 & 2']).toFixed(2).toString() + "%"
                                v = d.data.status12_v + " acres"
                                g = "Gap Status 1 & 2"
                            }
                            else if (d && Math.abs(d[1] - d[0] - d.data['Gap Status 3']) < 0.01) {
                                p = parseFloat(d.data['Gap Status 3']).toFixed(2).toString() + "%"
                                v = d.data.status3_v + " acres"
                                g = "Gap Status 3"
                            }
                            else if (d && Math.abs(d[1] - d[0] - d.data['Gap Status 4']) < 0.01) {
                                p = parseFloat(d.data['Gap Status 4']).toFixed(2).toString() + "%"
                                v = d.data.status4_v + " acres"
                                g = "Gap Status 4"
                            }
                            return `<div"><div>${g}</div><div>${p}</div><div>${v}</div></div>`
                        },
                        color: (d) => {
                            if (d && d[1] - d[0] === d.data['Gap Status 1 & 2']) {
                                return "rgb(90,143,41)"
                            }
                            else if (d && d[1] - d[0] === d.data['Gap Status 3']) {
                                return "rgb(204,204,204)"
                            }
                            else if (d && d[1] - d[0] === d.data['Gap Status 4']) {
                                return "rgb(66,66,67)"
                            }
                            return 'black'
                        }
                    },
                    legend: { rectSize: 18, spacing: 4, leftOffset: 0, verticalSpacing: 24, fontSize: '15px' },
                    stacked: true
                }
                let chartData = [
                    {
                        name: placeName,
                        total: 100,
                        status12_v: dataTemplate.ecoregion_protection[1].chart_data[0].value,
                        'Gap Status 1 & 2': dataTemplate.ecoregion_protection[1].chart_data[0].percent,
                        status3_v: dataTemplate.ecoregion_protection[1].chart_data[1].value,
                        'Gap Status 3': dataTemplate.ecoregion_protection[1].chart_data[1].percent,
                        status4_v: dataTemplate.ecoregion_protection[1].chart_data[2].value,
                        'Gap Status 4': dataTemplate.ecoregion_protection[1].chart_data[2].percent
                    },
                    {
                        name: 'CONUS',
                        total: 100,
                        status12_v: dataTemplate.ecoregion_protection[0].chart_data[0].value,
                        'Gap Status 1 & 2': dataTemplate.ecoregion_protection[0].chart_data[0].percent,
                        status3_v: dataTemplate.ecoregion_protection[0].chart_data[1].value,
                        'Gap Status 3': dataTemplate.ecoregion_protection[0].chart_data[1].percent,
                        status4_v: dataTemplate.ecoregion_protection[0].chart_data[2].value,
                        'Gap Status 4': dataTemplate.ecoregion_protection[0].chart_data[2].percent
                    }
                ]
                chartData.columns = ["name", 'Gap Status 1 & 2', 'Gap Status 3', 'Gap Status 4']
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "gap12" && data) {
                const chartId = "EP_GAP12"
                const chartConfig = {
                    margins: { left: 0, right: 0, top: 0, bottom: 0 },
                    chart: { title: `GAP Status 1 & 2`, subtitle: `` },
                    tooltip: { data: { name: "", count: "Ecosystems" } },
                    width: 150,
                    height: 150,
                    innerRadius: .8,
                    outerRadius: 1,
                    onClick: (d) => { this.filterTableData(d) }
                }
                const chartData = dataTemplate.gap1_2
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "gap123" && data) {
                const chartId = "EP_GAP123"
                const chartConfig = {
                    margins: { left: 0, right: 0, top: 0, bottom: 0 },
                    chart: { title: `GAP Status 1, 2 & 3`, subtitle: `` },
                    tooltip: { data: { name: "", count: "Ecosystems" } },
                    width: 150,
                    height: 150,
                    innerRadius: .8,
                    outerRadius: 1,
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
                let chartData = [['Ecological System', `Gap 1 & 2 Protection (%)`, `Gap 1, 2 & 3 Protection (%)`]]
                let percentProtected = ''
                let acresProtected = ''
                const gapSelection = this.state.gapSelection

                if (gapSelection.range !== 'ALL') {
                    preData = preData.filter((d) => { return d[gapSelection.status] === gapSelection.range })
                    if (gapSelection.status === this.gap12StatusGroup) chartTitle = `${preData.length} Ecological Systems with ${gapSelection.range}% within GAP Status 1 & 2 in ${this.props.feature.properties.feature_name}`
                    if (gapSelection.status === this.gap123StatusGroup) chartTitle = `${preData.length} Ecological Systems with ${gapSelection.range}% within GAP Status 1, 2 & 3 in ${this.props.feature.properties.feature_name}`
                    chartData = [['Ecological System', 'Acres Protected', '% Protected']]
                }

                for (let row of preData) {
                    const name = row.name
                    acresProtected = `${parseFloat(row.status_1_2).toFixed(2)}%`
                    percentProtected = `${parseFloat(row.status_1_2_3).toFixed(2)}%`

                    if (gapSelection.range !== 'ALL') {
                        if (gapSelection.status === this.gap12StatusGroup) {
                            percentProtected = `${parseFloat(row.status_1_2).toFixed(2)}%`
                            acresProtected = `${numberWithCommas(parseFloat(row.acres).toFixed(0))}`

                        }
                        if (gapSelection.status === this.gap123StatusGroup) {
                            percentProtected = `${parseFloat(row.status_1_2_3).toFixed(2)}%`
                            acresProtected = `${numberWithCommas(parseFloat(row.acres).toFixed(0))}`
                        }
                    }
                    chartData.push([name, acresProtected, percentProtected])
                }
                const chartConfig = {
                    margins: { left: 20, right: 20, top: 20, bottom: 125 },
                    chart: { title: chartTitle, subtitle: ``, color: gapSelection.color },
                }
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }

            }
            if (chart.toString() === "gapCoverage" && data) {
                const chartId = "EP_gapCoverage"
                const chartConfig = {
                    margins: { left: 75, right: 75, top: 80, bottom: 225 },
                    chart: { title: `Percent Coverage by National Vegetation Classification Class`, subtitle: `` },
                    tooltip: { data: { name: '', percent: "Percent" } },
                    legend: { rectSize: 12, spacing: 2, leftOffset: 1.3, verticalSpacing: 16, fontSize: '11px' },
                    lables: { fontSize: '8px' },
                    width: 200,
                    height: 200,
                    onClick: (d) => { this.showGapCoverage(d) }
                }
                const chartData = dataTemplate.ecosystem_coverage
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
        }
        return charts

    }


    filterTableData(d) {
        this.setState({
            gapSelection: d
        }, () => {
            const charts = this.getCharts(this.state.data)
            this.setState({
                charts: charts,
                submitted: true,
                loading: false
            })
        })
    }

    showGapCoverage(d) {
        this.setState({
            gapCoverageSelection: d
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
        if (this.state.charts.protectionStatus.data && this.props.isOpen) {
            let charts = []
            charts.push(this.HorizontalBarChart.print(this.state.charts.protectionStatus.id))
            charts.push(this.gap12.current.print())
            charts.push(this.gap123.current.print())
            charts.push(this.gapCoverage.current.print())

            const gapStatusLegend = []
            this.state.charts.gap12.data.forEach(item => {
                gapStatusLegend.push({
                    columns: [
                        { width: 'auto', table: { body: [[{text: '\n', fillColor: item.color}]] } },
                        { text: item.legend, margin: [5, 0, 0, 0] }
                    ]
                })
            })

            return Promise.all(charts.flat()).then(contents => {
                return [
                    { stack: this.props.getSBItemForPrint() },
                    { text: this.state.charts.protectionStatus.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                    { text: this.state.charts.protectionStatus.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                    { image: contents[0], alignment: 'center', width: 450, height: 300 },
                    {
                        pageBreak: 'before',
                        columns: [

                            {
                                width: 'auto',
                                stack: [
                                    { text: this.state.charts.gap12.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                                    { text: this.state.charts.gap12.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                                    { image: contents[1], alignment: 'center', width: 200, height: 200 },
                                ]
                            },

                            {
                                width: 'auto',
                                stack: [
                                    { text: this.state.charts.gap123.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2] },
                                    { text: this.state.charts.gap123.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                                    { image: contents[2], alignment: 'center', width: 200, height: 200 },
                                ]
                            }
                        ]
                    },
                    { stack: gapStatusLegend },
                    { text: this.state.charts.gapTable.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 10] },
                    {
                        columns: [
                            {
                                width: 175,
                                margin: [3, 0],
                                stack: [
                                    {
                                        style: 'tableStyle',
                                        table: {
                                            widths: ['40%', '30%', '30%'],
                                            heights: 50,
                                            body: this.state.charts.gapTable.data.slice(0, Math.floor(this.state.charts.gapTable.data.length / 3))
                                                .map(elm => {
                                                    return [elm[0], elm[1], elm[2]]
                                                })
                                        }
                                    },
                                ]
                            },
                            {
                                width: 175,
                                margin: [3, 0],
                                stack: [
                                    {
                                        style: 'tableStyle',
                                        table: {
                                            widths: ['40%', '30%', '30%'],
                                            heights: 50,
                                            body: this.state.charts.gapTable.data.slice(Math.floor(this.state.charts.gapTable.data.length / 3), Math.floor((this.state.charts.gapTable.data.length / 3) * 2))
                                                .map(elm => {
                                                    return [elm[0], elm[1], elm[2]]
                                                })
                                        }
                                    },
                                ]
                            },
                            {
                                width: 175,
                                margin: [3, 0],
                                stack: [
                                    {
                                        style: 'tableStyle',
                                        table: {
                                            widths: ['40%', '30%', '30%'],
                                            heights: 50,
                                            body: this.state.charts.gapTable.data.slice(Math.floor((this.state.charts.gapTable.data.length / 3) * 2), this.state.charts.gapTable.data.length)
                                                .map(elm => {
                                                    return [elm[0], elm[1], elm[2]]
                                                })
                                        }
                                    },
                                ]
                            },
                        ]
                    },
                    { text: this.state.charts.gapCoverage.config.chart.title, style: 'chartTitle', margin: [5, 2, 5, 2], pageBreak: 'before' },
                    { text: this.state.charts.gapCoverage.config.chart.subtitle, style: 'chartSubtitle', margin: [5, 2, 5, 10] },
                    { image: contents[3], alignment: 'center', width: 400, height: 560 },
                ]
            })
        }
        return []
    }

    createUniqueBapContents() {
        const gapSelection = this.state.gapSelection
        return (
            <div>
                {this.props.getAnalysisLayers()}
                {this.props.handleBapError(this.state.error)}
                <div
                    style={{ display: (this.props.feature && this.props.feature.properties.feature_name) ? 'block' : 'none' }}
                    className="chartsDiv">
                    <HorizontalBarChart
                        onRef={ref => (this.HorizontalBarChart = ref)}
                        data={this.state.charts.protectionStatus.data}
                        id={this.state.charts.protectionStatus.id}
                        config={this.state.charts.protectionStatus.config} />

                    <div className="dividing-line"></div>

                    <div>
                        <div className="chart-titles">
                            <div className="title">Protection Status of {this.props.feature ? this.props.feature.properties.feature_name : ''}</div>
                            <div className="subtitle">(Click on a slice to filter the table and see only systems with that percent of protection.)</div>
                        </div>
                        <div className="half-chart px-3">
                            <DonutChart
                                ref={this.gap12}
                                data={this.state.charts.gap12.data}
                                id={this.state.charts.gap12.id}
                                config={this.state.charts.gap12.config}
                                displayLabel={gapSelection.status === this.gap12StatusGroup ? gapSelection : null} />
                        </div>
                        <div className="half-chart px-3">
                            <DonutChart
                                ref={this.gap123}
                                data={this.state.charts.gap123.data}
                                id={this.state.charts.gap123.id}
                                config={this.state.charts.gap123.config}
                                displayLabel={gapSelection.status === this.gap123StatusGroup ? gapSelection : null} />
                        </div>
                        <ChartLegend items={this.state.charts.gap12.data ?
                            this.state.charts.gap12.data.map(data => {return {key: data.range, color: data.color, label: data.legend}}) : []}/>
                        <div className="chart-footers p-0">
                            <div className="anotations">
                                In this analysis the same thresholds are used to summarize protection status using GAP Status 1, 2, and 3 lands for those who consider multiple use lands as protected for their analyses.<br/><br/>
                                <span>
                                    * 17% represents the 2020 target threshold for protection of terrestrial ecosystems agreed upon by Parties to the Conservation on Biological Diversity during the Aichi Convention. 
                                    <a href="https://www.cbd.int/sp/targets/" target="_blank" rel="noopener noreferrer">https://www.cbd.int/sp/targets/</a>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="chart-headers pt-0">
                        <button className="submit-analysis-btn" onClick={this.resetEcoTable}>Clear Chart Selection</button>
                    </div>
                    <TableChart
                        data={this.state.charts.gapTable.data}
                        id={this.state.charts.gapTable.id}
                        config={this.state.charts.gapTable.config} />
                    <div className="dividing-line"></div>

                    <DonutChart
                        ref={this.gapCoverage}
                        data={this.state.charts.gapCoverage.data}
                        id={this.state.charts.gapCoverage.id}
                        config={this.state.charts.gapCoverage.config}
                        displayLabel={this.state.gapCoverageSelection}
                    />
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

const EcosystemProtectionAnalysis = withSharedAnalysisCharacteristics(EcosystemProtectionAnalysisPackage,
    layers,
    sb_properties,
    SB_URL);

export default EcosystemProtectionAnalysis;
