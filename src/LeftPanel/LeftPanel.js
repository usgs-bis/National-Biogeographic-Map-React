import React from "react";
import "./LeftPanel.css";
import { Button, Row, Col, Collapse, CardBody, Card } from "reactstrap";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, FormGroup, Label } from 'reactstrap';
import {Glyphicon, Grid} from "react-bootstrap";
import NFHPAnalysis from "../AnalysisPackages/NFHPAnalysis"

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

    onBlur () {
        let that = this
        setTimeout(function () {
            that.setState({
                focused: false
            })
            that.refs.textInput.value = ""
        }, 100)
    }

    submit(e) {
        this.state.submitHandler(e)
    }

    render() {
        let that = this;
        const featureText = () => {
            if (this.state.feature_name) {
                return (
                    <div>
                    <span className="panel-title">{this.state.feature_name}</span><br/>
                    <span className="category-text">Category:</span><span className="feature-text">  {this.state.feature_class}</span>
                    </div>
                )
            }
        }
        return (
            <div className="left-panel">
                <Grid>
                    <Row className="top-row">
                        <Col xs="1" className="no-padding">
                            <Button onClick={this.toggleBasemapDropdown} title={"Settings"} className='placeholder-button' >
                                <Glyphicon className="inner-glyph" glyph="menu-hamburger"/>
                            </Button>
                        </Col>
                        <Col xs="1" className="no-padding">
                            <Button className='placeholder-button' />
                        </Col>
                        <Col xs="10" className="no-padding">
                            <div className={"search-box"}>
                                <input ref={"textInput"} onClick={this.onFocus} onBlur={this.onBlur} onKeyUp={this.handleKeyUp}
                                       className={"input-box"} type={"text"} />
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs="1">
                        </Col>
                        <Col xs="1">
                        </Col>
                        <Col xs="10">
                            <Dropdown
                                className={"dropdown-results"}
                                isOpen={this.props.results.length > 0 && (this.state.focused || this.props.mapClicked)}
                                toggle={this.toggleSfrDropdown}>
                                <DropdownToggle className={"no-show"}>
                                    X
                                </DropdownToggle>
                                <DropdownMenu right className={"dropdown-results"}
                                              modifiers={{
                                                  setMaxHeight: {
                                                      enabled: true,
                                                      order: 890,
                                                      fn: (data) => {
                                                          return {
                                                              ...data,
                                                              styles: {
                                                                  ...data.styles,
                                                                  overflow: 'auto',
                                                                  maxHeight: 200
                                                              },
                                                          };
                                                      },
                                                  },
                                              }}
                                >
                                    {this.props.results.map(function(d, idx){
                                        return (
                                            <DropdownItem
                                                onClick={function(){that.submit(this)}}
                                                id={d.feature_id}
                                                key={d.feature_id}>
                                                {d.feature_name} ({d.feature_class})
                                            </DropdownItem>)
                                    })}
                                </DropdownMenu>
                            </Dropdown>
                        </Col>
                    </Row>
                </Grid>
                <Collapse className="settings-dropdown" isOpen={this.state.basemapsOpen}>
                    <Card>
                        <span className="header">Basemaps</span>
                        <CardBody>
                            {this.state.bioscape.basemaps.map(function(d, idx) {
                                return <FormGroup key={d.title + idx} check>
                                    <Label check>
                                        <input
                                            onChange={function() {that.basemapChanged(d)}}
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
                {featureText()}
                <NFHPAnalysis feature_id={this.state.feature_id}/>
            </div>
        );
    }
}
export default LeftPanel;
