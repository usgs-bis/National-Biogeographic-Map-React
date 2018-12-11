import React from "react";
import "./LeftPanel.css";
import { Button, Row, Col, Collapse, CardBody, Card } from "reactstrap";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, FormGroup, Label } from 'reactstrap';
import {Glyphicon, Grid} from "react-bootstrap";

class LeftPanel extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            results: props.results,
            textSearchHandler: props.textSearchHandler,
            basemapChanged: props.basemapChanged,
            submitHandler: props.submitHandler,
            textFocus: false,
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
        if (props.focused) {
            this.refs.textInput.focus()
            this.setState({
                focused: props.focused
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
        let that = this;
        setTimeout(function() {
            that.setState({
                focused: false
            })
        }, 100)
    }

    submit(e) {
        this.state.submitHandler(e)
    }

    render() {
        let that = this;
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
                                <input ref={"textInput"} onFocus={this.onFocus} onBlur={this.onBlur} onKeyUp={this.handleKeyUp}
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
                                isOpen={this.props.results.length > 0 && this.state.focused}
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
            </div>
        );
    }
}
export default LeftPanel;
