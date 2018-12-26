import React from "react";
import "./LeftPanel.css";
import { Button, Collapse, CardBody, Card, ButtonGroup } from "reactstrap";
import { Glyphicon } from "react-bootstrap";
import { RadioGroup } from "../CustomRadio/CustomRadio";
import pdfMake from "pdfmake/build/pdfmake.js"
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';
import NFHPAnalysis from "../AnalysisPackages/NFHPAnalysis"
import FirstLeafAnalysis from "../AnalysisPackages/FirstLeafAnalysis";
import FirstBloomAnalysis from "../AnalysisPackages/FirstBloomAnalysis";
import FirstLeafBloomComparisonAnalysis from "../AnalysisPackages/FirstLeafBloomComparisonAnalysis";
import SpeciesProtectionAnalysis from "../AnalysisPackages/SpeciesProtectionAnalysis";
import EcosystemProtectionAnalysis from "../AnalysisPackages/EcosystemProtectionAnalysis";
import PhenologyAnalysis from "../AnalysisPackages/PhenologyAnalysis";
import OBISAnalysis from "../AnalysisPackages/OBISAnalysis";

pdfMake.vfs = pdfFonts.pdfMake.vfs;
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
            priorityBap: "bap1"

        }
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
    }

    componentWillReceiveProps(props) {
        if (props.feature) {
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
        let that = this
        setTimeout(function () {
            that.setState({
                focused: false
            });
            that.textInput.value = ""
        }, 150)
    }

    submit(e) {
        this.state.submitHandler(e)
    }

    share() { }

    report() {

        this.NFHPAnalysis.print().then((res) => {
            var docDefinition = {
                content: [
                    // if you don't need styles, you can use a simple string to define a paragraph
                    'This is a standard paragraph, using default style',

                    // using a { text: '...' } object lets you set styling properties
                    { text: 'This paragraph will have a bigger font', fontSize: 15 },
                    { image: res, alignment: 'center', width: 500 },


                    // if you set pass an array instead of a string, you'll be able
                    // to style any fragment individually
                    {
                        text: [
                            'This paragraph is defined as an array of elements to make it possible to ',
                            { text: 'restyle part of it and make it bigger ', fontSize: 15 },
                            'than the rest.'
                        ]
                    }
                ]
            }
            pdfMake.createPdf(docDefinition).download(`${this.state.feature_name}.pdf`);
        })


    }

    updateAnalysisLayers(enabledLayers, bapId) {
        this.setState({
            priorityBap: bapId
        })

        this.state.updateAnalysisLayers(enabledLayers)
    }

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
                            <button className="submit-analysis-btn" onClick={this.report}>Report</button>

                        </div>
                    </div>
                )
            }
        }
        return (
            <div className="left-panel">
                <div className="left-panel-header">
                    <div className="nbm-flex-row">
                        <div className="nbm-flex-column">
                            <Button onClick={this.toggleBasemapDropdown} title={"Settings"} className='placeholder-button' >
                                <Glyphicon className="inner-glyph" glyph="menu-hamburger" />
                            </Button>
                        </div>
                        <div className="nbm-flex-column">
                            <Button className='placeholder-button' />
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
                            onRef={ref => (this.NFHPAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            yearMin={this.props.yearMin}
                            yearMax={this.props.yearMax}
                            priorityBap={this.state.priorityBap}
                            bapId={`bap${counter++}`}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <FirstBloomAnalysis
                            onRef={ref => (this.NFHPAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            yearMin={this.props.yearMin}
                            yearMax={this.props.yearMax}
                            priorityBap={this.state.priorityBap}
                            bapId={`bap${counter++}`}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <FirstLeafBloomComparisonAnalysis
                            onRef={ref => (this.NFHPAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            yearMin={this.props.yearMin}
                            yearMax={this.props.yearMax}
                            priorityBap={this.state.priorityBap}
                            bapId={`bap${counter++}`}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <NFHPAnalysis
                            onRef={ref => (this.NFHPAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.state.priorityBap}
                            bapId={`bap${counter++}`}

                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <EcosystemProtectionAnalysis
                            onRef={ref => (this.NFHPAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.state.priorityBap}
                            bapId={`bap${counter++}`}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <SpeciesProtectionAnalysis
                            onRef={ref => (this.NFHPAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.state.priorityBap}
                            bapId={`bap${counter++}`}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <PhenologyAnalysis
                            onRef={ref => (this.NFHPAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.state.priorityBap}
                            bapId={`bap${counter++}`}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <OBISAnalysis
                            onRef={ref => (this.NFHPAnalysis = ref)}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            feature={this.state.feature}
                            priorityBap={this.state.priorityBap}
                            bapId={`bap${counter++}`}
                        />
                    </div>
                </div>

            </div>
        );
    }
}
export default LeftPanel;
