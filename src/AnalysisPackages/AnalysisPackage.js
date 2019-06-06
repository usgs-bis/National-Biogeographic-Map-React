import React from "react";
import { Collapse, Button } from "reactstrap"
import { Glyphicon } from "react-bootstrap";
import { FormGroup, Label } from 'reactstrap';
import CustomDialog from "../CustomDialog/CustomDialog";
import InfoSign from "../ InfoSign/InfoSign"
import CustomToolTip from "../ToolTip/ToolTip"
import "./AnalysisPackages.css"

const withSharedAnalysisCharacteristics = (AnalysisPackage,
    layers,
    sb_properties,
    sb_url,
    disableMultipleLayers) => {
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
                jsonWindowOpen: false,
                layersOpen: true,
                prettyJson: false,
            }
            this.initilized = false
            this.jsonData = null
            this.inputRefs = {}
            this.toggleDropdown = this.toggleDropdown.bind(this)
            this.toggleLayerDropdown = this.toggleLayerDropdown.bind(this)
            this.setOpacity = this.setOpacity.bind(this)
            this.getAnalysisLayers = this.getAnalysisLayers.bind(this)
            this.getBapContents = this.getBapContents.bind(this)
            this.updateEnabled = this.updateEnabled.bind(this)
            this.canOpen = this.canOpen.bind(this)
            this.getSBItemForPrint = this.getSBItemForPrint.bind(this)
            this.htmlToPDFMake = this.htmlToPDFMake.bind(this)
            this.initilize = this.initilize.bind(this)
            this.updateBapLayers = this.updateBapLayers.bind(this)
            this.setPriorityBap = this.setPriorityBap.bind(this)
            this.getSbContactInfo = this.getSbContactInfo.bind(this)
            this.getSbWebLinkInfo = this.getSbWebLinkInfo.bind(this)
            this.handleBapError = this.handleBapError.bind(this)
            this.addLayer = this.addLayer.bind(this)
            this.removeLayer = this.removeLayer.bind(this)
            this.getOtherCheckedLayers = this.getOtherCheckedLayers.bind(this)
            this.turnOnLayers = this.turnOnLayers.bind(this)
            this.turnOnLayer = this.turnOnLayer.bind(this)
            this.turnOffLayer = this.turnOffLayer.bind(this)
            this.toggleLayer = this.toggleLayer.bind(this)
            this.resetBap = this.resetBap.bind(this)
            this.toggle = this.toggle.bind(this)
            this.setBapJson = this.setBapJson.bind(this)
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
                    this.resetBap()
                }
                if (prevProps.priorityBap !== this.props.priorityBap) {
                    this.turnOffLayer()
                }

                // forcing a rerender so the bapwindow will populate
                if (prevState.bapWindowOpen !== this.state.bapWindowOpen) {
                    this.forceUpdate()
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

        resetBap() {
            this.jsonData = null
            let newLayers = {}
            Object.keys(this.state.layers).forEach((key) => {
                newLayers[key] = this.state.layers[key]
                newLayers[key].checked = false
            })

            if (this.props.bapId === this.props.priorityBap) {
                this.setPriorityBap()
            }
        }

        addLayer(layer) {
            if (!layer) {
                return
            }
            const layers = this.getOtherCheckedLayers(layer)
            this.turnOnLayers([...layers, layer])
        }

        removeLayer(layer) {
            if (!layer) {
                return
            }
            const layers = this.getOtherCheckedLayers(layer)
            this.turnOnLayers(layers)
        }

        getOtherCheckedLayers(layer) {
            return Object.keys(this.state.layers)
                .map( key => this.state.layers[key])
                .reduce((layers, l) => {
                    if (l !== layer && l.checked) {
                        layers.push(l)
                    }
                    return layers
                }, [])
        }

        turnOnLayers(layers) {
            const newLayers = Object.keys(this.state.layers).reduce((newLayers, key) => {
                    newLayers[key] = this.state.layers[key]
                    const search = layers.find(layer => newLayers[key].title === layer.title)
                    if (search) {
                        newLayers[key].checked = true
                    } else {
                        newLayers[key].checked = false
                    }
                    return newLayers
                }, {})
            this.props.updateAnalysisLayers(layers)
            this.setState({
                layers: newLayers
            })
        }

        // Turns on a given layer. 
        // A Bap shoud only call this if we know it is already the pbap.
        // otherwise we should call the setPriority function with the layer param. 
        turnOnLayer(layer) {
            if (layer) {
                this.turnOnLayers([layer])
                return
            }
            this.turnOnLayers([])
        }

        turnOffLayer() {
            // when priority bap changes need to make sure all layers are off
            if (this.props.bapId !== this.props.priorityBap) {
                let newLayers = {}
                Object.keys(this.state.layers).forEach((key) => {
                    newLayers[key] = this.state.layers[key]
                    newLayers[key].checked = false
                })
                this.setState({
                    layers: newLayers
                })
            }
        }


        toggleLayer(layer) {
            if (!layer || layer.hideCheckbox) {
                //if the checkbox isn't displayed we don't want to do anything when the user clicks the label
                return
            }
            if (disableMultipleLayers) {
                if (layer.checked) {
                    this.turnOffLayer()
                    return
                }
                this.turnOnLayer(layer)
                return
            }
            if (layer.checked) {
                this.removeLayer(layer)
                return
            }
            this.addLayer(layer)
        }

        updateBapLayers(layer, layerToRemove) {
            if (!layer) {
                this.turnOnLayer()
            }
            if (layerToRemove) {
                this.removeLayer(layerToRemove)
            }
            this.addLayer(layer)
        }


        // Take an optional layer to turn on when switching priority bap 
        // if no layer is provided we will turn on the first if avaiable. 
        // Example- User trys to turn on the Bloom layer in the leaf comparison bap
        setPriorityBap(layer) {

            const layerOrDefault = (l) => {
                // If layer provided, turn it on
                // If no layer provided and the bap has layers, turn on the first by default
                if (l) {
                    this.turnOnLayer(l)
                    return
                }
                const layers = this.state.layers
                const availableLayers = Object.keys(layers)
                if (availableLayers.length) {
                    this.turnOnLayer(layers[availableLayers[0]])
                } else {
                    this.turnOnLayer()
                }
                return
            }

            if (this.props.bapId !== this.props.priorityBap) {
                // detect if we are not the priority bap and begin switching process
                this.props.setPriorityBap(this.props.bapId)
                layerOrDefault(layer)
            }
            else {
                // allready the proiority bap
                // if layer provided turn it on. 
                layerOrDefault(layer)
            }
            // open the bap 
            this.setState({
                isOpen: true,
                glyph: "menu-down",
            })
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

        setBapJson(data) {
            this.jsonData = data
        }

        getAnalysisLayers() {
            let that = this
            if (this.state.layers) {
                return (
                    <div className="analysis-layers">
                        <div className="analysis-layers-dropdown">
                            <span onClick={this.toggleLayerDropdown} >
                                {"Analysis Inputs"}
                                <Glyphicon
                                    className="analysis-dropdown-glyph"
                                    glyph={this.state.layersOpen ? "menu-down" : "menu-right"}
                                />
                            </span>
                            <span>
                                <Button id={`openBapWindow${this.props.bapId}`} className='bap-window-button'
                                    style={{ display: this.state.bapWindowOpen ? "none" : "inline-block" }}
                                    onClick={() => { this.setState({ bapWindowOpen: !this.state.bapWindowOpen }) }}>
                                    <Glyphicon className="inner-glyph" glyph="resize-full"
                                    />
                                </Button>
                                <Button id={`viewJsonWindow${this.props.bapId}`} className='bap-window-button'
                                    style={{ display: this.state.jsonWindowOpen || !this.jsonData ? "none" : "inline-block" }}
                                    onClick={() => { this.setState({ jsonWindowOpen: !this.state.jsonWindowOpen }) }}>
                                    <Glyphicon className="inner-glyph" glyph="console"
                                    />
                                </Button>
                                <CustomToolTip placement="top" target={`openBapWindow${this.props.bapId}`} text="View Bap in new window" ></CustomToolTip>
                                <CustomToolTip placement="top" target={`viewJsonWindow${this.props.bapId}`} text="View the raw JSON used for analysis" ></CustomToolTip>

                            </span>
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
                                                onChange={function () { that.toggleLayer(layer) }}
                                                onClick={function () { that.toggleLayer(layer) }}
                                                checked={layer.checked}
                                                type="checkbox" />
                                            {' ' + (layer.titlePrefix ? layer.titlePrefix : "") + layer.title}
                                            <InfoSign onClick={(event) => { that.setState({ [`sbInfoLayerPopUp${key}`]: !that.state[`sbInfoLayerPopUp${key}`] }); event.preventDefault() }}> </InfoSign>
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
                                                        body={layer.sb_properties ?
                                                            <div>
                                                                <div dangerouslySetInnerHTML={{ __html: layer.sb_properties.body }}></div>
                                                                {that.getSbContactInfo(layer.sb_properties)}
                                                                {that.getSbWebLinkInfo(layer.sb_properties)}
                                                                <br></br>
                                                                {<div><a href={layer.sb_properties.link.url}>{`${layer.sb_properties.link.url}`}</a></div>}
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
                                            defaultValue={layer.layer.options.opacity} />
                                    </FormGroup>
                                )
                            })}
                        </Collapse>


                    </div>
                )
            }
        }

        toggle(val, name) {
            this.setState({
                [name]: !val
            })
        }

        getBapContents(bapContent) {

            const syntaxHighlight = (json) => {
                json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                // eslint-disable-next-line
                return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                    var cls = 'number';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'key';
                        } else {
                            cls = 'string';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'boolean';
                    } else if (/null/.test(match)) {
                        cls = 'null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                });
            }
            const getDownloadLink = () => {
                return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.jsonData))
            }
            return (
                <div>

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
                                    bapWindowOpen: false
                                })
                            }
                            }
                            body={bapContent()}
                        />
                    }
                    {!this.state.bapWindowOpen && bapContent()}
                    {
                        this.state.jsonWindowOpen &&
                        <CustomDialog
                            className="bap-popout-window"
                            isResizable={true}
                            isDraggable={true}
                            title={"JSON - " + this.state.sb_properties.title}
                            modal={false}
                            onClose={() => {
                                this.setState({
                                    jsonWindowOpen: false
                                })
                            }
                            }
                            body={
                                <div className="JSON-container">
                                    <div className="JSON-text-header">
                                        <a className="download-json-link" href={getDownloadLink()} download={"JSON_" + this.state.sb_properties.title} >Download</a>
                                        <label htmlFor="prettyCheckbox">{"Pretty JSON "}  </label>
                                        <input checked={this.state.prettyJson}
                                            onChange={() => this.setState({ prettyJson: !this.state.prettyJson })}
                                            onClick={() => this.setState({ prettyJson: !this.state.prettyJson })}
                                            type="checkbox" id="prettyCheckbox" name="prettyCheckbox" />
                                    </div>
                                    <div className="JSON-text-container">
                                        <div className="JSON-text-area">
                                            {!this.state.prettyJson && JSON.stringify(this.jsonData, undefined, 0)}
                                            {this.state.prettyJson && <pre dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(this.jsonData, undefined, 4)) }}></pre>}
                                        </div>
                                    </div>
                                </div>
                            }
                        />
                    }
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
                            <span onClick={this.state.canOpen ? () => this.props.bapId !== this.props.priorityBap ? this.setPriorityBap() : this.toggleDropdown() : null}>
                                {this.state.sb_properties.title}
                            </span>
                            {<InfoSign onClick={() => this.setState({ sbInfoPopUp: !this.state.sbInfoPopUp })}> </InfoSign>}
                        </span>
                    </div>
                    <div className="bap-title-content" style={{ width: '20px' }}>
                        <input id={`pBapToolTip${this.props.bapId}`} className="priority-bap-raido" style={{ display: this.state.canOpen ? 'block' : 'none' }} type='radio' readOnly={true} checked={this.props.bapId === this.props.priorityBap} onClick={() => this.setPriorityBap()} ></input>
                        <CustomToolTip placement="top" target={`pBapToolTip${this.props.bapId}`} text={this.props.bapId === this.props.priorityBap ? "" : "Select Priority Bap"} ></CustomToolTip>
                    </div>
                    <Collapse className="settings-dropdown" isOpen={this.state.isOpen && this.state.isEnabled}>
                        <AnalysisPackage
                            {...this.props}
                            {...this.state}
                            setOpacity={this.setOpacity}
                            toggleLayerDropdown={this.toggleLayerDropdown}
                            updateBapLayers={this.updateBapLayers}
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
                            setBapJson={this.setBapJson}
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
                                    {this.state.sb_properties.link && <div><a href={this.state.sb_properties.link.url}>{`${this.state.sb_properties.link.url}`}</a></div>}
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
