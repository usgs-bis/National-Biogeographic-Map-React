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
                pBapToolTipOpen: false,
                sbInfoPopUp: false,
                sbInfoPopUpToolTip: false,
                sbInfoLayerPopUp: false,
                sbInfoLayerPopUpToolTip: false,
                layersOpen: false
            }
            this.allowPriority = true
            this.initilized = false
            this.toggleDropdown = this.toggleDropdown.bind(this)
            this.toggleLayerDropdown = this.toggleLayerDropdown.bind(this)
            this.setOpacity = this.setOpacity.bind(this)
            this.getAnalysisLayers = this.getAnalysisLayers.bind(this)
            this.getBapContents = this.getBapContents.bind(this)
            this.updateEnabled = this.updateEnabled.bind(this)
            this.canOpen = this.canOpen.bind(this)
            this.inputRefs = {}
            this.getSBItemForPrint = this.getSBItemForPrint.bind(this)
            this.htmlToPDFMake = this.htmlToPDFMake.bind(this)
            this.initilize = this.initilize.bind(this)
            this.setPriorityBap = this.setPriorityBap.bind(this)
            this.getSbContactInfo = this.getSbContactInfo.bind(this)
            this.getSbWebLinkInfo = this.getSbWebLinkInfo.bind(this)
            this.handleBapError = this.handleBapError.bind(this)
            this.turnOnLayer = this.turnOnLayer.bind(this)
            this.toggleLayer = this.toggleLayer.bind(this)
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
            this.initilize()
        }

        componentDidUpdate(prevProps, prevState) {

            if (this.initilized) {
                if (prevProps.feature !== this.props.feature) {
                    this.turnOnLayer()
                }
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
        }

        initilize() {
            let newLayers = {}
            Object.keys(this.state.layers).forEach((key) => {
                newLayers[key] = this.state.layers[key]
            })
            Object.keys(newLayers).forEach((key) => {
                if (newLayers[key].sb_item) {
                    fetch(`https://www.sciencebase.gov/catalog/item/${newLayers[key].sb_item}?format=json`)
                        .then(res => res.json())
                        .then(
                            (result) => {
                                newLayers[key].sb_properties = result
                                this.setState({
                                    layers: newLayers
                                })
                            },
                            (error) => {
                                this.setState({
                                    error
                                });
                            }
                        )
                }
            })

            if (this.props.priorityBap === this.props.bapId && this.props.initLayerTitle) {
                Object.keys(this.state.layers).forEach((key) => {
                    if (this.state.layers[key].title === this.props.initLayerTitle) {
                        this.turnOnLayer(this.state.layers[key])
                    }
                })
            }

            // let the layer actualy load before we start detecting changes
            setTimeout(() => { this.initilized = true }, 3000)
        }


        turnOnLayer(layer) {
            let newLayers = {}
            if (layer) {
                Object.keys(this.state.layers).forEach((key) => {
                    newLayers[key] = this.state.layers[key]
                    if (newLayers[key].title === layer.title) {
                        newLayers[key].checked = true
                    }
                    else {
                        newLayers[key].checked = false
                    }
                })
                this.props.updateAnalysisLayers([layer], this.props.bapId)

            }
            else {
                Object.keys(this.state.layers).forEach((key) => {
                    newLayers[key] = this.state.layers[key]
                    newLayers[key].checked = false
                })
                this.props.updateAnalysisLayers([], null)
            }

            this.setState({
                layers: newLayers
            })

        }

        toggleLayer(layer) {
            if (layer) {
                if (layer.checked) {
                    this.turnOnLayer()
                }
                else (
                    this.turnOnLayer(layer)
                )
            }
            else {
                this.turnOnLayer()
            }
        }


        setPriorityBap() {
            if (this.state.canOpen) {
                if (this.props.priorityBap === this.props.bapId) {
                    this.allowPriority = !this.allowPriority
                }
                if (this.allowPriority) {
                    let avaiableLayers = Object.keys(this.state.layers)
                    if (avaiableLayers.length) {
                        this.turnOnLayer(this.state.layers[avaiableLayers[0]])
                    }
                    this.setState({
                        isOpen: true,
                        glyph: "menu-down",
                    })
                }
                else {
                    this.turnOnLayer()

                }
            }
        }

        toggleLayerDropdown() {
            this.setState({ layersOpen: !this.state.layersOpen })
        }

        setOpacity(key) {
            this.state.layers[key].layer.setOpacity(this[key + "Opacity"].value)
        }

        handleBapError(error) {
            if (error) {
                return (
                    <div className='analysis-error'>
                        <Glyphicon style={{ paddingRight: '5px', fontSize: '13px' }} className="inner-glyph" glyph="exclamation-sign" />
                        There was an error producing this analysis. Please try again.
                    </div>
                )
            }
            return []
        }

        getAnalysisLayers() {
            let that = this
            if (this.state.layers) {
                return (
                    <div className="analysis-layers">
                        <div className="analysis-layers-dropdown">
                            <span onClick={this.toggleLayerDropdown} >
                                {"Analysis Layers"}
                                <Glyphicon
                                    className="analysis-dropdown-glyph"
                                    glyph={this.state.layersOpen ? "menu-down" : "menu-right"}
                                />
                            </span>

                            <Button id={`openBapWindow${this.props.bapId}`} className='bap-window-button' style={{ display: this.state.bapWindowOpen ? "none" : "inline-block" }}
                                onClick={() => { this.setState({ bapWindowOpen: !this.state.bapWindowOpen }) }} >
                                <Glyphicon className="inner-glyph" glyph="resize-full"
                                />
                            </Button>
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
                                                onChange={function () { that.toggleLayer(that.state.layers[key]) }}
                                                checked={that.state.layers[key].checked}
                                                type="checkbox" />
                                            {' ' + (layer.titlePrefix ? layer.titlePrefix : "") + layer.title}
                                            <span id={`sbInfoLayerToolTip${that.props.bapId}${key}`} key={`sbInfoLayerToolTip${that.props.bapId}${key}`}
                                                onClick={(event) => { that.setState({ [`sbInfoLayerPopUp${key}`]: !that.state[`sbInfoLayerPopUp${key}`] }); event.preventDefault() }}
                                                className="title-info-icon">
                                                <Glyphicon glyph="info-sign" />
                                                <Tooltip
                                                    style={{ fontSize: "14px" }} isOpen={that.state[`sbInfoLayerPopUpToolTip${key}`]}
                                                    target={`sbInfoLayerToolTip${that.props.bapId}${key}`}
                                                    toggle={() => that.setState({ [`sbInfoLayerPopUpToolTip${key}`]: !that.state[`sbInfoLayerPopUpToolTip${key}`] })}
                                                    delay={0}>
                                                    Information
                                                 </Tooltip>
                                            </span>
                                            {
                                                that.state[`sbInfoLayerPopUp${key}`] &&
                                                <span onClick={(event) => event.preventDefault()}>
                                                    <CustomDialog
                                                        className="sbinfo-popout-window"
                                                        isResizable={true}
                                                        isDraggable={true}
                                                        title={' ' + (layer.titlePrefix ? layer.titlePrefix : "") + layer.title}
                                                        modal={false}
                                                        onClose={() => {
                                                            that.setState({
                                                                [`sbInfoLayerPopUpToolTip${key}`]: false,
                                                                [`sbInfoLayerPopUp${key}`]: false
                                                            })
                                                        }}
                                                        body={that.state.layers[key].sb_properties ?
                                                            <div>
                                                                <div dangerouslySetInnerHTML={{ __html: that.state.layers[key].sb_properties.body }}></div>
                                                                {that.getSbContactInfo(that.state.layers[key].sb_properties)}
                                                                {that.getSbWebLinkInfo(that.state.layers[key].sb_properties)}
                                                                <br></br>
                                                                {<div><a href={that.state.layers[key].sb_properties.link.url}>{`${that.state.layers[key].sb_properties.link.url}`}</a></div>}
                                                            </div>
                                                            :
                                                            <div>
                                                                <div>{'This item is not currently documented in ScienceBase. You may contact the Biogeographic Characterization Branch to request this information: bcb@usgs.gov'}</div>
                                                                <br></br>
                                                                <br></br>
                                                            </div>
                                                        }
                                                    />
                                                </span>
                                            }
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
                                            defaultValue={that.state.layers[key].layer.options.opacity} />
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
                    if (parent === 'EM' || parent === 'i') {
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
            // pdfDoc.push({ text: '', pageBreak: 'after' })

            return pdfDoc

        }

        getSbContactInfo(sb_properties) {
            if (!sb_properties || !sb_properties.contacts) return []
            let r = [<br key="br1-CI"></br>, <h4 key="h41-CI">Contacts:</h4>]
            let c = sb_properties.contacts
            for (let i of c) {
                r.push(<div key={i.name + i.email}>
                    <span>{i.name ? `${i.name}    ` : ''}</span>
                    <span>{i.email ? ` -  ${i.email}    ` : ''}</span>
                    <span>{i.type ? ` -  ${i.type}    ` : ''}</span>

                </div>)
            }
            return r
        }
        getSbWebLinkInfo(sb_properties) {
            if (!sb_properties || !sb_properties.webLinks) return []
            let r = [<br key="br2-CI"></br>, <h4 key="h42-CI">Web Links:</h4>]
            let c = sb_properties.webLinks
            for (let i of c) {
                if (i.type === 'citation') {
                    r.push(<div key={i.title}>
                        <div><a href={i.uri}>{i.title}</a></div>
                    </div>)
                }
            }
            return r
        }

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
                        <span className="bapTitle">
                            <span onClick={this.toggleDropdown}>{this.state.sb_properties.title}</span>
                            { <span id={`sbInfoToolTip${this.props.bapId}`}
                                onClick={() => this.setState({ sbInfoPopUp: !this.state.sbInfoPopUp })}
                                className="title-info-icon">
                                <Glyphicon glyph="info-sign" />
                                <Tooltip
                                    style={{ fontSize: "14px" }} isOpen={this.state.sbInfoPopUpToolTip}
                                    target={`sbInfoToolTip${this.props.bapId}`}
                                    toggle={() => this.setState({ sbInfoPopUpToolTip: !this.state.sbInfoPopUpToolTip })}
                                    delay={0}>
                                    Information
                                </Tooltip>
                            </span>}
                        </span>
                    </div>
                    <div className="bap-title-content" style={{ width: '20px' }}>
                        <input id={`pBapToolTip${this.props.bapId}`} className="priority-bap-raido" style={{ display: this.state.canOpen ? 'block' : 'none' }} type='radio' readOnly={true} checked={this.props.bapId === this.props.priorityBap && this.allowPriority} onClick={this.setPriorityBap} ></input>
                        <Tooltip
                            style={{ fontSize: "14px" }} isOpen={this.state.pBapToolTipOpen}
                            target={`pBapToolTip${this.props.bapId}`}
                            toggle={() => this.setState({ pBapToolTipOpen: !this.state.pBapToolTipOpen })}
                            delay={0}>
                            {this.props.bapId === this.props.priorityBap && this.allowPriority ? "Deselect Priority Bap" : "Select Priority Bap"}
                        </Tooltip>
                    </div>
                    <Collapse className="settings-dropdown" isOpen={this.state.isOpen && this.state.isEnabled}>
                        <AnalysisPackage
                            {...this.props}
                            {...this.state}
                            setOpacity={this.setOpacity}
                            toggleLayerDropdown={this.toggleLayerDropdown}
                            updateBapLayers={this.turnOnLayer}
                            resetAnalysisLayers={this.resetAnalysisLayers}
                            getAnalysisLayers={this.getAnalysisLayers}
                            getBapContents={this.getBapContents}
                            getSBItemForPrint={this.getSBItemForPrint}
                            isEnabled={this.updateEnabled}
                            canOpen={this.canOpen}
                            inputRefs={this.inputRefs}
                            layers={this.state.layers}
                            handleBapError={this.handleBapError}
                            isOpen={this.state.isOpen}
                        />
                    </Collapse>
                    {
                        this.state.sbInfoPopUp &&
                        <CustomDialog
                            className="sbinfo-popout-window"
                            isResizable={true}
                            isDraggable={true}
                            title={this.state.sb_properties.title}
                            modal={false}
                            onClose={() => {
                                this.setState({
                                    sbInfoPopUpToolTip: false,
                                    sbInfoPopUp: false
                                })
                            }
                            }
                            body={
                                <div>
                                    <div dangerouslySetInnerHTML={{ __html: this.state.sb_properties.body }}></div>
                                    {this.getSbContactInfo(this.state.sb_properties)}
                                    {this.getSbWebLinkInfo(this.state.sb_properties)}
                                    <br></br>
                                    { this.state.sb_properties.link && <div><a href={this.state.sb_properties.link.url}>{`${this.state.sb_properties.link.url}`}</a></div>}
                                </div>
                            }
                        />
                    }
                </div>
            );
        }

    }

    return HOC
}

export default withSharedAnalysisCharacteristics;
