import React from "react";
import "./LeftPanel.css";
import SearchBar from "./searchBar/searchBar.js"
import PDFReport from "../PDF/PdfReport";
import { BarLoader } from "react-spinners"
import * as turf from '@turf/turf'
import Biogeography from "../Bioscapes/Biogeography";
import TerrestrialEcosystems2011 from "../Bioscapes/TerrestrialEcosystems2011";

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

class LeftPanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            results: props.results,
            bioscape: props.bioscape,
            updateAnalysisLayers: props.updateAnalysisLayers,
            loading: false,
            enabledLayers: [],
        }

        this.share = this.share.bind(this);
        this.report = this.report.bind(this);
        this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
        this.loaderRef = React.createRef();
    }

    componentWillReceiveProps(props) {
        if (props.feature && props.feature.properties) {

            let approxArea = 'Unknown'
            try {
                if (props.feature.properties.source_data && props.feature.properties.source_data.value && JSON.parse(props.feature.properties.source_data.value)[0].areasqkm) {
                    let areaSqMeters = JSON.parse(props.feature.properties.source_data.value)[0].areasqkm
                    approxArea = numberWithCommas(parseInt(turf.convertArea(areaSqMeters, 'kilometres', 'acres')))
                }
                else {
                    let area = 0
                    if (props.feature.geometry.type === 'MultiPolygon') {
                        for (let poly of props.feature.geometry.coordinates) {
                            area += turf.area(turf.polygon(poly))
                        }
                    }
                    else {
                        area = turf.area(turf.polygon(props.feature.geometry.coordinates))
                    }
                    approxArea = numberWithCommas(parseInt(turf.convertArea(area)))
                }
            }
            catch (e) {

            }

            this.setState({
                feature: props.feature,
                feature_id: props.feature.properties.feature_id,
                feature_name: props.feature.properties.feature_name,
                feature_class: props.feature.properties.feature_class,
                feature_area: approxArea

            })
        }

    }


    share() {
        this.props.shareState()
    }

    report() {
        this.setState({
            loading: true
        })

        let charts = []
        charts.push(this.FirstLeafAnalysis.print())
        charts.push(this.FirstBloomAnalysis.print())
        charts.push(this.FirstLeafBloomComparisonAnalysis.print())
        charts.push(this.NFHPAnalysis.print())
        charts.push(this.EcosystemProtectionAnalysis.print())
        charts.push(this.SpeciesProtectionAnalysis.print())
        charts.push(this.PhenologyAnalysis.print())
        charts.push(this.OBISAnalysis.print())
        this.PDFReport.generateReport(this.state.feature_name, this.state.feature_class, this.props.map, charts)
            .then(() => {
                setTimeout(() => {
                    this.setState({
                        loading: false
                    })
                }, 3000);
            })
    }

    updateAnalysisLayers(enabledLayers, bapId) {
        this.setState({
            enabledLayers: enabledLayers
        })

        this.state.updateAnalysisLayers(enabledLayers, bapId)
    }


    render() {

        const featureText = () => {
            if (this.state.feature_name) {
                return (
                    <div className="panel-header">
                        <div className="panel-title">
                            <span >{this.state.feature_name}</span>
                        </div>
                        <div className="panel-subtitle">
                            <div className="category-text">Category: <span className="feature-text">  {this.state.feature_class}</span></div>
                            <div className="category-text">Approximate Area: <span className="feature-text">  {this.state.feature_area} acres</span></div>
                        </div>
                        <div className="panel-buttons">
                            <button className="submit-analysis-btn" onClick={this.share}>Share</button>
                            <input className="share-url-input" type="text"></input>
                            <button className="submit-analysis-btn" onClick={this.report}>
                                <PDFReport onRef={ref => (this.PDFReport = ref)}></PDFReport>
                            </button>
                        </div>
                        <BarLoader ref={this.loaderRef} width={100} widthUnit={"%"} color={"white"} loading={this.state.loading} />
                    </div>
                )
            }
        }
        return (
            <div className="left-panel">
                <div id='left-panel-header' className="left-panel-header">

                    <SearchBar results={this.props.results}
                        textSearchHandler={this.props.textSearchHandler}
                        submitHandler={this.props.submitHandler}
                        mapClicked={this.props.mapClicked}
                        enabledLayers={this.state.enabledLayers}
                        bioscape={this.state.bioscape}
                        overlayChanged={this.props.overlayChanged}
                        basemapChanged={this.props.basemapChanged}></SearchBar>
                    {featureText()}
                </div>
                <div id='analysis-package-container' className="analysis-package-container" >
                    {
                        this.props.bioscapeName === "terrestrial-ecosystems-2011" ?
                            <TerrestrialEcosystems2011
                                {...this.props}
                                {...this.state}
                                updateAnalysisLayers={this.updateAnalysisLayers}
                            />
                            :
                            <Biogeography
                                {...this.props}
                                {...this.state}
                                updateAnalysisLayers={this.updateAnalysisLayers}
                            />

                    }
                    <div id="d3chartTooltip" className='chartTooltip'></div>
                </div>

            </div>
        );
    }
}
export default LeftPanel;
