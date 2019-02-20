import React from "react";
import { Collapse, Button, Tooltip } from "reactstrap"
import { Glyphicon } from "react-bootstrap";
import { FormGroup, Label } from 'reactstrap';
import CustomDialog from "../CustomDialog/CustomDialog";

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
                isOpen: props.priorityBap === props.bapId,
                glyph: "menu-right",
                value: [],
                layers: layers,
                isEnabled: true,
                bapWindowOpen: false,
                bapWindowToolTip: false,
                pBapToolTipOpen:false
            }
            this.allowPriority = true
            this.initilized = false
            this.toggleDropdown = this.toggleDropdown.bind(this)
            this.toggleLayerDropdown = this.toggleLayerDropdown.bind(this)
            this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
            this.setOpacity = this.setOpacity.bind(this)
            this.getAnalysisLayers = this.getAnalysisLayers.bind(this)
            this.getBapContents = this.getBapContents.bind(this)
            this.resetAnalysisLayers = this.resetAnalysisLayers.bind(this)
            this.updateEnabled = this.updateEnabled.bind(this)
            this.canOpen = this.canOpen.bind(this)
            this.inputRefs = {}
            this.getSBItemForPrint = this.getSBItemForPrint.bind(this)
            this.htmlToPDFMake = this.htmlToPDFMake.bind(this)
            this.initilize = this.initilize.bind(this)
            this.setPriorityBap = this.setPriorityBap.bind(this)
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
            this.initilize(this.props)

        }

        componentDidUpdate(prevProps, prevState) {
            if (prevProps.priorityBap !== this.props.priorityBap) {
                if (this.props.priorityBap !== this.props.bapId) {
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
            // forcing a rerender so the bapwindow will populate
            // not sure why calling this.render() doesnt work
            // will try to find a better way. 
            else if (prevState.bapWindowOpen !== this.state.bapWindowOpen) {
                this.setState({
                    random: Math.random()
                })
            }
        }

        initilize(props) {
            if (props.priorityBap === props.bapId && props.initLayerTitle) {
                let layers = []
                Object.keys(this.state.layers).forEach((key) => {
                    let layer = this.state.layers[key]
                    if (this.state.layers[key].title === props.initLayerTitle) {
                        layer.checked = true
                        this.inputRefs[key].checked = true
                    }
                    layers.push(layer)
                })
                this.setState({
                    layers: layers
                })
                this.updateAnalysisLayers()
            }

            this.initilized = true
        }

        resetAnalysisLayers() {
            this.props.updateAnalysisLayers([])
            let l = this.state.layers
            Object.keys(l).forEach(function (key) {
                l[key].checked = false
            })

            return l
        }

        updateAnalysisLayers(layer) {
            let newLayers = {}
            let enabledLayers = []
            Object.keys(this.state.layers).forEach((key) => {
                newLayers[key] = this.state.layers[key]
                if (newLayers[key].title !== layer.title) {
                    newLayers[key].checked = false
                }
                else {
                    newLayers[key].checked = !newLayers[key].checked
                    if (newLayers[key].checked) {
                        enabledLayers.push(newLayers[key])
                    }
                }
            })
            this.setState({
                layers: newLayers
            })
            this.props.updateAnalysisLayers(enabledLayers, this.props.bapId)
        }

        setPriorityBap() {
            if (this.state.canOpen) {
                if (this.props.priorityBap === this.props.bapId) {
                    this.allowPriority = !this.allowPriority
                }
                if (this.allowPriority) {
                    let avaiableLayers = Object.keys(this.state.layers)
                    if (avaiableLayers.length) {
                        this.updateAnalysisLayers(this.state.layers[avaiableLayers[0]])
                    }
                    this.setState({
                        isOpen: true,
                        glyph: "menu-down",
                    })
                }
                else {
                    this.updateAnalysisLayers({})

                }
            }
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
                                                onChange={function () { that.updateAnalysisLayers(that.state.layers[key]) }}
                                                checked={that.state.layers[key].checked}
                                                type="checkbox" />
                                            {' ' + (layer.titlePrefix ? layer.titlePrefix : "") + layer.title}
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

        getBapContents(bapContent) {
            return (
                <div>
                    <Button id={`openBapWindow${this.props.bapId}`} className='submit-analysis-btn bap-window-button' style={{ display: this.state.bapWindowOpen ? "none" : "inline-block" }}
                        onClick={() => this.setState({ bapWindowOpen: !this.state.bapWindowOpen })} >
                        <Glyphicon className="inner-glyph" glyph="resize-full"
                        />
                    </Button>
                    <Tooltip
                        style={{ fontSize: "14px" }} isOpen={this.state.bapWindowToolTip && !this.state.bapWindowOpen}
                        target={`openBapWindow${this.props.bapId}`} toggle={() => this.setState({
                            bapWindowToolTip: !this.state.bapWindowToolTip
                        })} delay={0}>
                        View Bap in new window
                    </Tooltip>
                    {
                        this.state.bapWindowOpen &&
                        <CustomDialog
                            className="bap-popout-window"
                            isResizable={true}
                            isDraggable={true}
                            title={this.state.sb_properties.title}
                            modal={false}
                            onClose={() => {
                                this.setState({
                                    bapWindowToolTip: false,
                                    bapWindowOpen: false
                                })
                            }
                            }
                            body={bapContent()}
                        />
                    }
                    {!this.state.bapWindowOpen && bapContent()}
                </div>
            )
        }

        updateEnabled(enabled) {
            this.setState({
                isEnabled: enabled
            })
        }

        canOpen(canOpen) {
            if (!canOpen && this.state.isOpen) {
                this.toggleDropdown()
            }
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
                    if (parent === 'LI') {
                        definition.margin[0] += 10
                        definition.text = '     •   ' + content.textContent
                        definition.preserveLeadingSpaces = true
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

        togglePbapTooltip = () => this.setState({
            pBapToolTipOpen: !this.state.pBapToolTipOpen
        });


        render() {
            return (
                <div id={this.props.bapId}
                    style={{ display: this.state.isEnabled ? 'block' : 'none' }}
                    className="nbm-flex-row-no-padding small-padding">

                    <div className="bap-title-content" style={{ width: '20px' }}>
                        <span onClick={this.toggleDropdown} className="bapTitle">
                            <Glyphicon style={{ display: this.state.canOpen ? "inline-block" : "none" }}
                                className="dropdown-glyph"
                                glyph={this.state.glyph} />
                        </span>
                    </div>
                    <div className="bap-title-content" style={{ width: 'calc(100% - 40px)' }}>
                        <span onClick={this.toggleDropdown} className="bapTitle">{this.state.sb_properties.title}</span>
                    </div>
                    <div className="bap-title-content" style={{ width: '20px' }}>
                        <input id={`pBapToolTip${this.props.bapId}`} className="priority-bap-raido" style={{ display: this.state.canOpen ? 'block' : 'none' }} type='radio' readOnly={true} checked={this.props.bapId === this.props.priorityBap && this.allowPriority} onClick={this.setPriorityBap} ></input>
                        <Tooltip
                            style={{ fontSize: "14px" }} isOpen={this.state.pBapToolTipOpen}
                            target={`pBapToolTip${this.props.bapId}`} toggle={this.togglePbapTooltip} delay={0}>
                            { this.props.bapId === this.props.priorityBap && this.allowPriority ? "Deselect Priority Bap" : "Select Priority Bap"}
                         </Tooltip>
                    </div>
                    <Collapse className="settings-dropdown" isOpen={this.state.isOpen && this.state.isEnabled}>
                        <AnalysisPackage
                            {...this.props}
                            {...this.state}
                            setOpacity={this.setOpacity}
                            toggleLayerDropdown={this.toggleLayerDropdown}
                            updateBapLayers={this.updateAnalysisLayers}
                            resetAnalysisLayers={this.resetAnalysisLayers}
                            getAnalysisLayers={this.getAnalysisLayers}
                            getBapContents={this.getBapContents}
                            getSBItemForPrint={this.getSBItemForPrint}
                            isEnabled={this.updateEnabled}
                            canOpen={this.canOpen}
                            inputRefs={this.inputRefs}
                            layers={this.state.layers}
                        />
                    </Collapse>
                </div>
            );
        }

    }

    return HOC
}

export default withSharedAnalysisCharacteristics;
