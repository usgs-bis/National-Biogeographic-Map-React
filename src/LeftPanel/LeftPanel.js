import React from "react";
import "./LeftPanel.css";
import { Button, Collapse, CardBody, Card, ButtonGroup } from "reactstrap";
import { FormGroup, Label } from 'reactstrap';
import { Glyphicon } from "react-bootstrap";
import NFHPAnalysis from "../AnalysisPackages/NFHPAnalysis"
import FirstLeafAnalysis from "../AnalysisPackages/FirstLeafAnalysis";
import FirstBloomAnalysis from "../AnalysisPackages/FirstBloomAnalysis";
import FirstLeafBloomComparisonAnalysis from "../AnalysisPackages/FirstLeafBloomComparisonAnalysis";

class LeftPanel extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            results: props.results,
            textSearchHandler: props.textSearchHandler,
            basemapChanged: props.basemapChanged,
            submitHandler: props.submitHandler,
            basemapsOpen: false,
            bioscape: props.bioscape
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

    share(){}
    report(){}

    render() {
        let that = this;
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
                                {this.state.bioscape.basemaps.map(function (d, idx) {
                                    return <FormGroup key={d.title + idx} check>
                                        <Label check>
                                            <input
                                                onChange={function () { that.basemapChanged(d) }}
                                                value={d.serviceUrl}
                                                type="radio"
                                                name="basemaps" />
                                            {' ' + d.title}
                                        </Label>
                                    </FormGroup>
                                })}
                            </CardBody>
                        </Card>
                    </Collapse>
                </div>
                {featureText()}
                </div>
                <div className="analysis-package-container">
                    <div className="nbm-flex-row-no-padding">
                        <NFHPAnalysis feature={this.state.feature} />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <FirstLeafAnalysis
                            feature={this.state.feature}
                            yearMin={this.props.yearMin}
                            yearMax={this.props.yearMax}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <FirstBloomAnalysis
                            feature={this.state.feature}
                            yearMin={this.props.yearMin}
                            yearMax={this.props.yearMax}
                        />
                    </div>
                    <div className="nbm-flex-row-no-padding">
                        <FirstLeafBloomComparisonAnalysis
                            feature={this.state.feature}
                            yearMin={this.props.yearMin}
                            yearMax={this.props.yearMax}
                        />
                    </div>
                </div>

            </div>
        );
    }
}
export default LeftPanel;
