import React from "react";
import "./LeftPanel.css";
import { Button, Collapse, CardBody, Card, ButtonGroup, Tooltip } from "reactstrap";
import { Glyphicon } from "react-bootstrap";

import Legend from "../Legend/Legend";
import { RadioGroup } from "../CustomRadio/CustomRadio";
import PDFReport from "../PDF/PdfReport";
import NFHPAnalysis from "../AnalysisPackages/NFHPAnalysis";
import FirstLeafAnalysis from "../AnalysisPackages/FirstLeafAnalysis";
import FirstBloomAnalysis from "../AnalysisPackages/FirstBloomAnalysis";
import FirstLeafBloomComparisonAnalysis from "../AnalysisPackages/FirstLeafBloomComparisonAnalysis";
import SpeciesProtectionAnalysis from "../AnalysisPackages/SpeciesProtectionAnalysis";
import EcosystemProtectionAnalysis from "../AnalysisPackages/EcosystemProtectionAnalysis";
import PhenologyAnalysis from "../AnalysisPackages/PhenologyAnalysis";
import OBISAnalysis from "../AnalysisPackages/OBISAnalysis";
import { BarLoader } from "react-spinners"

class LeftPanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            results: props.results,
            textSearchHandler: props.textSearchHandler,
            basemapChanged: props.basemapChanged,
            submitHandler: props.submitHandler,
            basemapsOpen: false,
            bioscape: props.bioscape,
            updateAnalysisLayers: props.updateAnalysisLayers,
            loading: false,
            enabledLayers: [],
            settingsOpen: false

        }
        this.initilized = false
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.toggleSfrDropdown = this.toggleSfrDropdown.bind(this)
        this.onFocus = this.onFocus.bind(this)
        this.onBlur = this.onBlur.bind(this)
        this.submit = this.submit.bind(this)
        this.toggleBasemapDropdown = this.toggleBasemapDropdown.bind(this)
        this.basemapChanged = this.basemapChanged.bind(this);
        this.share = this.share.bind(this);
        this.report = this.report.bind(this);
        this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
        this.loaderRef = React.createRef();
    }

    componentWillReceiveProps(props) {
        if (props.feature && props.feature.properties) {
            this.setState({
                feature: props.feature,
                feature_id: props.feature.properties.feature_id,
                feature_name: props.feature.properties.feature_name,
                feature_class: props.feature.properties.feature_class
            })
        }

        if (props.mapClicked) {
            this.textInput.focus();
            this.setState({
                focused: true
            })
        }
        // if( !this.initilized &&  props.initBap){
        //     this.initilized = true
        //     this.setState({
        //         priorityBap : props.initBap.priorityBap
        //     })
        // }
    }

    basemapChanged(e) {
        this.state.basemapChanged(e)
    }

    toggleBasemapDropdown() {
        this.setState({ basemapsOpen: !this.state.basemapsOpen });
    }

    handleKeyUp(e) {
        this.state.textSearchHandler(e.target.value)
    }

    toggleSfrDropdown() {
    }

    onFocus() {
        this.setState({
            focused: true
        })
    }

    onBlur() {
        setTimeout(() => {
            this.setState({
                focused: false
            });
            this.textInput.value = ""
        }, 150)
    }

    submit(e) {
        this.state.submitHandler(e)
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

        this.state.updateAnalysisLayers(enabledLayers,bapId)
    }

    toggleSettingsTooltip = () => this.setState({
        settingsOpen: !this.state.settingsOpen
    });

    render() {
        let that = this;
        let counter = 1;
        const featureText = () => {
            if (this.state.feature_name) {
                return (
                    <div className="panel-header">
                        <div className="panel-title">
                            <span >{this.state.feature_name}</span>
                        </div>
                        <div className="panel-subtitle">
                            <span className="category-text">Category:</span><span className="feature-text">  {this.state.feature_class}</span>
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
                <div className="left-panel-header">
                    <div className="nbm-flex-row">
                        <div className="nbm-flex-column">
                            <Button id={"SettingsTooltip"} onClick={this.toggleBasemapDropdown} className='placeholder-button' >
                                <Glyphicon className="inner-glyph" glyph="menu-hamburger" />
                            </Button>
                            <Tooltip
                                placement="top" style={{fontSize: "14px"}} isOpen={this.state.settingsOpen}
                                target="SettingsTooltip" toggle={this.toggleSettingsTooltip} delay={0}>
                                Settings
                            </Tooltip>
                        </div>
                        <div className="nbm-flex-column">
                            <Legend
                                enabledLayers={this.state.enabledLayers}
                            />
                        </div>
                        <div className="nbm-flex-column-big">
                            <input ref={(input) => { this.textInput = input; }} onClick={this.onFocus} onBlur={this.onBlur} onKeyUp={this.handleKeyUp}
                                className="input-box" type={"text"} />
                        </div>
                    </div>
                    <div className="nbm-flex-row" >
                        <div className="button-group">
                            {(this.props.results.length > 0 && this.state.focused) ? <ButtonGroup vertical>
                                {this.props.results.map(function (d, idx) {
                                    return (
                                        <Button className="sfr-button" style={{ whiteSpace: 'normal' }}
                                            onClick={function () { that.submit(this) }}
                                            id={d.feature_id}
                                            key={d.feature_id}>
                                            {d.feature_name} ({d.feature_class})
                                    </Button>)
                                })}
                            </ButtonGroup> : null}
                        </div>
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <Collapse className="settings-dropdown" isOpen={this.state.basemapsOpen}>
                            <Card>
                                <span className="header">Basemaps</span>
                                <CardBody>
                                    <RadioGroup style={{ width: "100%" }}
                                        options={this.state.bioscape.basemaps}
                                        onChange={this.basemapChanged}
                                    />
                                </CardBody>
                            </Card>
                        </Collapse>
                    </div>
                    {featureText()}
                </div>
                <div className="analysis-package-container">
                    <div className="nbm-flex-row-no-padding">
                        <FirstLeafAnalysis
                            onRef={ref => (this.FirstLeafAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            yearMin={this.props.rangeYearMin}
                            yearMax={this.props.rangeYearMax}
                            priorityBap={this.props.priorityBap}
                            bapId={`bap${counter++}`}
                            initLayerTitle={this.props.initLayerTitle}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <FirstBloomAnalysis
                            onRef={ref => (this.FirstBloomAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            yearMin={this.props.rangeYearMin}
                            yearMax={this.props.rangeYearMax}
                            priorityBap={this.props.priorityBap}
                            bapId={`bap${counter++}`}
                            initLayerTitle={this.props.initLayerTitle}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <FirstLeafBloomComparisonAnalysis
                            onRef={ref => (this.FirstLeafBloomComparisonAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            yearMin={this.props.rangeYearMin}
                            yearMax={this.props.rangeYearMax}
                            priorityBap={this.props.priorityBap}
                            bapId={`bap${counter++}`}
                            initLayerTitle={this.props.initLayerTitle}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <NFHPAnalysis
                            onRef={ref => (this.NFHPAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.props.priorityBap}
                            bapId={`bap${counter++}`}
                            initLayerTitle={this.props.initLayerTitle}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <EcosystemProtectionAnalysis
                            onRef={ref => (this.EcosystemProtectionAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.props.priorityBap}
                            bapId={`bap${counter++}`}
                            initLayerTitle={this.props.initLayerTitle}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <SpeciesProtectionAnalysis
                            onRef={ref => (this.SpeciesProtectionAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.props.priorityBap}
                            bapId={`bap${counter++}`}
                            initLayerTitle={this.props.initLayerTitle}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <PhenologyAnalysis
                            onRef={ref => (this.PhenologyAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.props.priorityBap}
                            bapId={`bap${counter++}`}
                            initLayerTitle={this.props.initLayerTitle}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <OBISAnalysis
                            onRef={ref => (this.OBISAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.props.priorityBap}
                            bapId={`bap${counter++}`}
                            initLayerTitle={this.props.initLayerTitle}
                        />
                    </div>
                </div>

            </div>
        );
    }
}
export default LeftPanel;
