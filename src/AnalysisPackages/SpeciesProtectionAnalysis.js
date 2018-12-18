import React from "react";
import { Collapse } from "reactstrap"
import { Glyphicon } from "react-bootstrap";
import { DynamicMapLayer } from "esri-leaflet"
import { FormGroup, Label } from 'reactstrap';
import { BarLoader } from "react-spinners"
import PieChart from "../Charts/PieChart"
import TableChart from "../Charts/TableChart"

import "./AnalysisPackages.css";

const SB_URL = "https://www.sciencebase.gov/catalog/item/5b86d48ce4b0702d0e7962b5?format=json"
const SPECIES_URL = process.env.REACT_APP_BIS_API + "/api/v1/gapmetrics/species/protection?feature_id=";

let sb_properties = {
    "title": "Protection Status of Terrestrial Vertebrate Species"
}

class SpeciesProtectionAnalysis extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            charts: {
                gap12: { id: "", config: {}, data: null },
                gap123: { id: "", config: {}, data: null },
                gapTable: { id: "", config: {}, data: null }
            },
            data: null,
            taxaLetter: "ALL",
            title: sb_properties.title,
            submitted: false,
            isOpen: false,
            glyph: "menu-right",
            enabledLayers: {
                nfhp_service: false
            },
            layers: {
                "nfhp_service": {
                    "title": "Risk to Fish Habitat Degradation",
                    "layer": new DynamicMapLayer({
                        "url": "https://gis1.usgs.gov/arcgis/rest/services/nfhp2015/HCI_Dissolved_NFHP2015_v20160907/MapServer"
                    }),
                    "opacity": .5
                }
            },
            updateAnalysisLayers: props.updateAnalysisLayers,
            value: []
        }

        this.toggleDropdown = this.toggleDropdown.bind(this)
        this.getCharts = this.getCharts.bind(this)
        this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
        this.setOpacity = this.setOpacity.bind(this)
        this.onSpeciesChanged = this.onSpeciesChanged.bind(this)
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
            fetch(SPECIES_URL + this.props.feature.properties.feature_id)
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
                                    gapTable: { id: "", config: {}, data: null }
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


    getCharts(data) {


        let charts = {}
        let dataTemplate = {
            status_1_2: [
                { color: '#660000', count: 0, name: '< 1%', percent: 0.0 },
                { color: '#FF0000', count: 0, name: '1 - 10%', percent: 0.0 },
                { color: '#EDCB62', count: 0, name: '10 - 17%', percent: 0.0 },
                { color: '#9CCB19', count: 0, name: '17 - 50%', percent: 0.0 },
                { color: '#228B22', count: 0, name: '> 50%', percent: 0.0 },
            ],
            status_1_2_3: [
                { color: '#660000', count: 0, name: '< 1%', percent: 0.0 },
                { color: '#FF0000', count: 0, name: '1 - 10%', percent: 0.0 },
                { color: '#EDCB62', count: 0, name: '10 - 17%', percent: 0.0 },
                { color: '#9CCB19', count: 0, name: '17 - 50%', percent: 0.0 },
                { color: '#228B22', count: 0, name: '> 50%', percent: 0.0 },
            ],
            species: {
                all: [],
                amphibian_species: [],
                bird_species: [],
                mammal_species: [],
                reptile_species: []
            }
        }

        for (let row of data) {
            let c = {
                common_name: row.spp_comname ? row.spp_comname : "",
                scientific_name: row.spp_sciname ? row.spp_sciname : "",
                status_1_2: row.gapstat12perc,
                status_1_2_3: row.gapstat123perc,
                taxaletter: row.taxa,
                sppcode: row.sppcode
            }
            dataTemplate.species.all.push(c)
            if (c.taxaletter === 'A') dataTemplate.species.amphibian_species.push(c)
            if (c.taxaletter === 'B') dataTemplate.species.bird_species.push(c)
            if (c.taxaletter === 'M') dataTemplate.species.mammal_species.push(c)
            if (c.taxaletter === 'R') dataTemplate.species.reptile_species.push(c)

            let total = data.length

            if (row.gapstat12group === '<1' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2[0].count += 1
            else if (row.gapstat12group === '1-10' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2[1].count += 1
            else if (row.gapstat12group === '10-17' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2[2].count += 1
            else if (row.gapstat12group === '17-50' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2[3].count += 1
            else if (row.gapstat12group === '>50' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2[4].count += 1

            if (row.gapstat123group === '<1' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2_3[0].count += 1
            else if (row.gapstat123group === '1-10' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2_3[1].count += 1
            else if (row.gapstat123group === '10-17' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2_3[2].count += 1
            else if (row.gapstat123group === '17-50' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2_3[3].count += 1
            else if (row.gapstat123group === '>50' && (this.state.taxaLetter === 'ALL' || this.state.taxaLetter === c.taxaletter)) dataTemplate.status_1_2_3[4].count += 1

            dataTemplate.status_1_2.forEach(x => {
                x.percent = parseFloat(x.count / total) * 100
            })
            dataTemplate.status_1_2_3.forEach(x => {
                x.percent = parseFloat(x.count / total) * 100
            })
        }

        for (let chart of Object.keys(this.state.charts)) {
            if (chart.toString() === "gap12" && data) {
                const chartId = "SP_GAP12"
                const chartConfig = {
                    margins: { left: 20, right: 20, top: 20, bottom: 125 },
                    chart: { title: `GAP Status 1 & 2`, subtitle: `` },
                    tooltip: { label: (d) => { return `<p><div>${d.data.name}</div><div>${d.data.count} species</div></p>` } }
                }
                const chartData = dataTemplate.status_1_2
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "gap123" && data) {
                const chartId = "SP_GAP123"
                const chartConfig = {
                    margins: { left: 20, right: 20, top: 20, bottom: 125 },
                    chart: { title: `GAP Status 1, 2 & 3`, subtitle: `` },
                    tooltip: { label: (d) => { return `<p><div>${d.data.name}</div><div>${d.data.count} species</div></p>` } }
                }
                const chartData = dataTemplate.status_1_2_3
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }
            }
            else if (chart.toString() === "gapTable" && data) {
                const chartId = "SP_GAPTABLE"
                let preData = dataTemplate.species.all
                let tableType = "All Species"
                if (this.state.taxaLetter === 'A') {
                    preData = dataTemplate.species.amphibian_species
                    tableType = "Amphibians";
                } else if (this.state.taxaLetter === 'B') {
                    preData = dataTemplate.species.bird_species
                    tableType = "Birds";
                } else if (this.state.taxaLetter === 'M') {
                    preData = dataTemplate.species.mammal_species
                    tableType = "Mammals";
                } else if (this.state.taxaLetter === 'R') {
                    preData = dataTemplate.species.reptile_species
                    tableType = "Reptiles";
                }
                let chartData = [["Species Name", "Range", "Habitat"]]
                for (let row of preData) {
                    let raido1 = <input id={`Range_${row.sppcode}`} type="radio" name={`Range_${row.sppcode}`} value={row.sppcode} />//`<input type="radio" id="Range_${row.sppcode}" name="spp_Range" value="${row.sppcode}" onClick="">`
                    let raido2 = <input id={`Habitat_${row.sppcode}`} type="radio" name={`Habitat_${row.sppcode}`} value={row.sppcode} />//`<input type="radio" id="Habitat_${row.sppcode}" name="spp_Habitat" value="${row.sppcode}" onClick="">`
                    chartData.push([<span>{`${row.common_name} (${row.scientific_name})`}</span>, raido1, raido2,])
                }
                const chartConfig = {
                    margins: { left: 20, right: 20, top: 20, bottom: 125 },
                    chart: { title: `${tableType} in ${this.props.feature.properties.feature_name} (${chartData.length})`, subtitle: `` },
                }
                charts[chart] = { id: chartId, config: chartConfig, data: chartData }

            }
        }
        return charts
    }

    updateAnalysisLayers() {
        let that = this
        let enabledLayers = []
        Object.keys(this.state.layers).forEach(function (key) {
            if (that[key].checked) {
                let obj = { enabledLayers: {} }
                obj.enabledLayers[key] = true
                that.setState(obj)
                enabledLayers.push(that.state.layers[key])
            } else {
                let obj = { enabledLayers: {} }
                obj.enabledLayers[key] = false
                that.setState(obj)
            }
        })

        this.state.updateAnalysisLayers(enabledLayers)
    }

    setOpacity(key) {
        this.state.layers[key].layer.setOpacity(this[key + "Opacity"].value)
    }

    onSpeciesChanged(e) {
        this.setState({
            taxaLetter: e.currentTarget.value
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
        let that = this
        const getAnalysisLayers = () => {
            return Object.keys(this.state.layers).map(function (key) {
                let layer = that.state.layers[key]
                return <FormGroup key={key} check>
                    <Label check>
                        <input
                            ref={(input) => { that[key] = input; }}
                            onChange={function () { that.updateAnalysisLayers() }}
                            checked={that.state.enabledLayers[key]}
                            type="checkbox" />
                        {' ' + layer.title}
                    </Label>
                    <input style={{ width: "50%" }}
                        ref={(input) => { that[key + "Opacity"] = input; }}
                        onChange={function () {
                            that.setOpacity(key)
                        }}
                        type="range"
                        step=".05"
                        min="0"
                        max="1"
                        defaultValue={1} />
                </FormGroup>
            })
        }
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
                    <BarLoader color={"white"} loading={this.state.loading} />
                    <div className="analysis-layers">
                        {getAnalysisLayers()}
                    </div>
                    <div
                        style={{ display: (this.props.feature && this.props.feature.properties.feature_name) ? 'block' : 'none' }}
                        className="chartsDiv">
                        <div className="chart-titles">
                            <div className="title">Protection Status of Species in {this.props.feature ? this.props.feature.properties.feature_name : ''}</div>
                            <div className="subtitle">(Click on a slice to filter the table and see only species whose habitat falls in that percent of protection. Click on a radio button to see only species of that type.)</div>
                            <div className="spp-raido-btn">
                                <div><input type="radio" name="species" value={"ALL"} checked={this.state.taxaLetter === "ALL"} onChange={this.onSpeciesChanged} />All</div>
                                <div><input type="radio" name="species" value={"A"} checked={this.state.taxaLetter === "A"} onChange={this.onSpeciesChanged} />Amphibians</div>
                                <div><input type="radio" name="species" value={"B"} checked={this.state.taxaLetter === "B"} onChange={this.onSpeciesChanged} />Birds</div>
                                <div><input type="radio" name="species" value={"M"} checked={this.state.taxaLetter === "M"} onChange={this.onSpeciesChanged} />Mammals</div>
                                <div><input type="radio" name="species" value={"R"} checked={this.state.taxaLetter === "R"} onChange={this.onSpeciesChanged} />Reptiles</div>
                            </div>



                        </div>
                        <div>
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
                        <TableChart
                            data={this.state.charts.gapTable.data}
                            id={this.state.charts.gapTable.id}
                            config={this.state.charts.gapTable.config} />
                    </div>
                </Collapse>
            </div>
        )
    }
}
export default SpeciesProtectionAnalysis;
