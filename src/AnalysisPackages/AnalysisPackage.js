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
            this.resetAnalysisLayers = this.resetAnalysisLayers.bind(this)
            this.updateEnabled = this.updateEnabled.bind(this)
            this.canOpen = this.canOpen.bind(this)
            this.inputRefs = {}
            this.getSBItemForPrint = this.getSBItemForPrint.bind(this)
            this.htmlToPDFMake = this.htmlToPDFMake.bind(this)
        }

        // this should stop baps from rendering untill the timeslider moves
        // or the feature is changed
        shouldComponentUpdate(nextProps, nextState) {
            if(nextProps.feature && nextProps.feature.properties.feature_id !== this.state.feature_id) return true
            if(nextProps.yearMax !== this.props.yearMax || nextProps.yearMin !== this.props.yearMin) return true
            return false
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
                    Object.keys(l).forEach(function (key) {
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
            Object.keys(l).forEach(function (key) {
                l[key].checked = false
            })

            return l
        }

        updateAnalysisLayers() {
            let that = this
            let enabledLayers = []
            Object.keys(this.state.layers).forEach(function (key) {
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
            this.setState({ layersOpen: !this.state.layersOpen })
        }

        setOpacity(key) {
            this.state.layers[key].layer.setOpacity(this[key + "Opacity"].value)
        }

        getAnalysisLayers() {
            let that = this
            if (this.state.layers) {
                return (
                    <div className="analysis-layers">
                        <div onClick={that.toggleLayerDropdown} className="analysis-layers-dropdown">
                            {"Analysis Layers"}
                            <Glyphicon
                                className="analysis-dropdown-glyph"
                                glyph={that.state.layersOpen ? "menu-down" : "menu-right"}
                            />
                        </div>
                        <Collapse className='analysis-dropdown-content' isOpen={that.state.layersOpen}>
                            {Object.keys(this.state.layers).map(function (key) {
                                let layer = that.state.layers[key]
                                return (
                                    <FormGroup key={key} check>
                                        <Label check>
                                            <input
                                                style={{ display: layer.hideCheckbox ? "none" : "inline-block" }}
                                                ref={(input) => { that[key] = input; that["inputRefs"][key] = input }}
                                                onChange={function () { that.updateAnalysisLayers() }}
                                                checked={that.state.layers[key].checked}
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
                                            defaultValue={.5} />
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

        htmlToPDFMake(content, element) {
            if (element.hasChildNodes()) {
                let children = element.childNodes
                for (let i = 0; i < children.length; i++) {
                    this.htmlToPDFMake(content, children[i])
                }
            }
            else {
                element.textContent = element.textContent.replace(/↵/g, '').trim()
                content.push(element)
            }
            return content
        }


        getSBItemForPrint() {
            var body = document.createElement("div");
            body.innerHTML = this.state.sb_properties.body
            let contents = this.htmlToPDFMake([], body)

            let pdfDoc = []
            let text = []
            pdfDoc.push({ text: this.state.sb_properties.title, style: 'analysisTitle', margin: [5, 2, 5, 20], pageBreak: 'before' })

            for (let content of contents) {
                if (content.nodeName === '#text' && content.textContent) {

                    let definition = { text: content.textContent, style: 'sbProperties', margin: [10, 2, 0, 2] }
                    let parent = content.parentElement.nodeName
                    let grandparent = content.parentElement.parentElement ? content.parentElement.parentElement.nodeName : null

                    if (parent === 'H1' || parent === 'H2' || parent === 'H3' || parent === 'H4') {
                        definition.style = 'sbPropertiesTitle'
                        definition.margin = [5, 5, 0, 5]
                        definition.text = content.textContent + '\n'
                    }
                    if (parent === 'U' || grandparent === 'U') {
                        definition.decoration = 'underline'
                        definition.bold = true
                        definition.text = content.textContent + ' '
                    }
                    if (parent === 'LI' ) {
                        definition.margin[0] += 10
                        definition.text = '     •   ' +content.textContent
                        definition.preserveLeadingSpaces= true
                    }
                    if (parent === 'A') {
                        definition.style = 'annotationLink'
                        definition.link = content.textContent
                        definition.text = content.textContent
                    }
                    if (parent === 'EM') {
                        definition.italics = true
                    }
                    text.push(definition)
                }
                else {
                    text.push({ text: '\n' })
                }
            }
            pdfDoc.push({ text: text })
            pdfDoc.push({ text: 'ScienceBase Item', style: 'sbPropertiesTitle' })
            pdfDoc.push({ text: this.state.sb_properties.link.url, style: 'annotationLink', margin: [15, 10, 5, 0], link: this.state.sb_properties.link.url })
            pdfDoc.push({ text: '', pageBreak: 'after' })

            return pdfDoc

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
                            {...this.props}
                            {...this.state}
                            setOpacity={this.setOpacity}
                            toggleLayerDropdown={this.toggleLayerDropdown}
                            updateBapLayers={this.updateAnalysisLayers}
                            resetAnalysisLayers={this.resetAnalysisLayers}
                            getAnalysisLayers={this.getAnalysisLayers}
                            getSBItemForPrint={this.getSBItemForPrint}
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
