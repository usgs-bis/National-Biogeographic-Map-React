import React from "react";
import { Collapse } from "reactstrap"
import { Glyphicon } from "react-bootstrap";
import { FormGroup, Label } from 'reactstrap';

import "./AnalysisPackages.css"

const withSharedAnalysisCharacteristics = (AnalysisPackage,
                                           layers,
                                           sb_properties,
                                           sb_url) => {
    class HOC extends React.Component {
        constructor(props) {
            super(props)
            this.state = {
                sb_properties: sb_properties,
                submitted: false,
                canOpen: false,
                isOpen: false,
                glyph: "menu-right",
                updateAnalysisLayers: props.updateAnalysisLayers,
                value: [],
                layers: layers,
                bapId: props.bapId,
                isEnabled: true,
            }
            this.toggleDropdown = this.toggleDropdown.bind(this)
            this.toggleLayerDropdown = this.toggleLayerDropdown.bind(this)
            this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
            this.setOpacity = this.setOpacity.bind(this)
            this.getAnalysisLayers = this.getAnalysisLayers.bind(this)
            this.resetAnalysisLayers =  this.resetAnalysisLayers.bind(this)
            this.updateEnabled = this.updateEnabled.bind(this)
            this.canOpen = this.canOpen.bind(this)
            this.inputRefs = {}
        }

        componentDidMount() {
            fetch(sb_url)
                .then(res => res.json())
                .then(
                    (result) => {
                        this.setState({
                            sb_properties: result
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
            if (prevProps.priorityBap !== this.props.priorityBap) {
                if (this.props.priorityBap !== this.state.bapId) {
                    let l = layers;
                    let that = this;
                    Object.keys(l).forEach(function(key) {
                        l[key].checked = false
                        that.inputRefs[key].checked = false
                    })

                    this.setState({
                        layers: l
                    })
                }
            }
        }

        resetAnalysisLayers() {
            this.props.updateAnalysisLayers([])
            let l = this.state.layers
            Object.keys(l).forEach(function(key) {
                l[key].checked = false
            })

            return l
        }

        updateAnalysisLayers() {
            let that = this
            let enabledLayers = []
            Object.keys(this.state.layers).forEach(function(key) {
                if (that[key].checked) {
                    let obj = that.state
                    let l = obj.layers
                    l[key].checked = true
                    obj.layers = l
                    that.setState(obj)
                    enabledLayers.push(that.state.layers[key])
                } else {
                    let obj = that.state
                    let l = obj.layers
                    l[key].checked = false
                    obj.layers = l
                    that.setState(obj)
                }
            })

            this.state.updateAnalysisLayers(enabledLayers, this.state.bapId)
        }

        toggleLayerDropdown() {
            this.setState({layersOpen: !this.state.layersOpen})
        }

        setOpacity(key) {
            this.state.layers[key].layer.setOpacity(this[key + "Opacity"].value)
        }

        getAnalysisLayers () {
            let that = this
            if (this.state.layers) {
                return (
                    <div className="analysis-layers">
                    <span onClick={that.toggleLayerDropdown} className="analysis-layers-dropdown">
                        {"Analysis Layers"}
                        <Glyphicon
                            className="analysis-dropdown-glyph"
                            glyph={that.state.layersOpen ? "menu-down" : "menu-right"}
                        />
                    </span>
                        <Collapse isOpen={that.state.layersOpen}>
                            {Object.keys(this.state.layers).map(function (key) {
                                let layer = that.state.layers[key]
                                return (
                                    <FormGroup key={key} check>
                                        <Label check>
                                            <input
                                                style={{display: layer.hideCheckbox ? "none" : "inline-block"}}
                                                ref={(input) => { that[key] = input; that["inputRefs"][key] = input }}
                                                onChange={function() {that.updateAnalysisLayers()}}
                                                checked={that.state.layers[key].checked}
                                                type="checkbox" />
                                            {' ' + layer.title}
                                        </Label>
                                        <input style={{width: "50%"}}
                                               ref={(input) => { that[key + "Opacity"] = input; }}
                                               onChange={function() {
                                                   that.setOpacity(key)
                                               }}
                                               type="range"
                                               step=".05"
                                               min="0"
                                               max="1"
                                               defaultValue={.5}/>
                                    </FormGroup>
                                )
                            })}
                        </Collapse>
                    </div>
                )
            }
        }

        updateEnabled(enabled) {
            this.setState({
                isEnabled: enabled
            })
        }

        canOpen(canOpen) {
            this.setState({
                canOpen: canOpen
            })
        }

        toggleDropdown() {
            if (this.state.canOpen) {
                this.setState({
                    isOpen: !this.state.isOpen,
                    glyph: !this.state.isOpen ? "menu-down" : "menu-right"
                })
            }
        }

        render() {
            return (
                <div
                    style={{ display: this.state.isEnabled ? 'block' : 'none' }}
                    className="nbm-flex-row-no-padding">
                    <span onClick={this.toggleDropdown} className="bapTitle">
                        {this.state.sb_properties.title}
                        <Glyphicon style={{ display: this.state.canOpen ? "inline-block" : "none" }}
                                   className="dropdown-glyph"
                                   glyph={this.state.glyph} />
                    </span>
                    <Collapse className="settings-dropdown" isOpen={this.state.isOpen && this.state.isEnabled}>
                        <AnalysisPackage
                            { ...this.props }
                            { ...this.state }
                            setOpacity={this.setOpacity}
                            toggleLayerDropdown={this.toggleLayerDropdown}
                            updateBapLayers={this.updateAnalysisLayers}
                            resetAnalysisLayers={this.resetAnalysisLayers}
                            getAnalysisLayers={this.getAnalysisLayers}
                            isEnabled={this.updateEnabled}
                            canOpen={this.canOpen}
                            inputRefs={this.inputRefs}
                        />
                    </Collapse>
                </div>
            );
        }

    }

    return HOC
}

export default withSharedAnalysisCharacteristics;
