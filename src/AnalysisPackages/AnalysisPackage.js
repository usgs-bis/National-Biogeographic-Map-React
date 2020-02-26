import './AnalysisPackages.css'
import CustomToolTip from '../ToolTip/ToolTip'
import Dialog from 'react-dialog'
import InfoSign from '../InfoSign/InfoSign'
import React from 'react'
import {Collapse, Button} from 'reactstrap'
import {FormGroup, Label} from 'reactstrap'
import {Glyphicon} from 'react-bootstrap'

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
        glyph: 'menu-right',
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
      this.shareState = {}
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
      this.getSbContactInfo = this.getSbContactInfo.bind(this)
      this.getSbWebLinkInfo = this.getSbWebLinkInfo.bind(this)
      this.handleBapError = this.handleBapError.bind(this)
      this.resetBap = this.resetBap.bind(this)
      this.toggle = this.toggle.bind(this)
      this.setBapJson = this.setBapJson.bind(this)
      this.toggleLayer = this.toggleLayer.bind(this)
      this.getOnLayers = this.getOnLayers.bind(this)
      this.setShareState = this.setShareState.bind(this)
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
            })
          }
        )
      this.initilize()
    }

    componentDidUpdate(prevProps, prevState) {

      if (this.initilized) {

        // feature change
        if (prevProps.feature !== this.props.feature) {
          this.resetBap()
        }

        // priorityBap has changed, this bap is not it
        if (prevProps.priorityBap !== this.props.priorityBap
          && this.props.priorityBap !== this.props.bapId) {
          this.toggleLayer(null)
        }
        // priorityBap has changed, this bap is it
        else if (prevProps.priorityBap !== this.props.priorityBap
          && this.props.priorityBap === this.props.bapId
          && !this.getOnLayers().length
          && this.state.layers.length) {
          let firstLayer = this.state.layers[0]
          this.toggleLayer(firstLayer)
          this.setState({isOpen: true})
        }

        // forcing a rerender so the bapwindow will populate
        if (prevState.bapWindowOpen !== this.state.bapWindowOpen) {
          this.forceUpdate()
        }
      }
    }

    initilize() {
      let newLayers = this.state.layers

      newLayers.forEach((layer) => {
        if (layer.sb_item) {
          fetch(`https://www.sciencebase.gov/catalog/item/${layer.sb_item}?format=json`,
            {
              headers: {
                'Cache-Control': 'no-store'
              }
            })
            .then(res => res.json())
            .then(
              (result) => {
                layer.sb_properties = result
                this.setState({
                  layers: newLayers
                })
              },
              (error) => {
                this.setState({
                  error
                })
              }
            )
        }
      })
      // turn on the layers saved in the state
      if (this.props.initBap) {
        this.setState({
          isOpen: this.props.initBap.isOpen,
          glyph: this.props.initBap.isOpen ? 'menu-down' : 'menu-right'
        })
        if (this.props.priorityBap === this.props.bapId) {
          this.state.layers.forEach((layer) => {
            let enabledLayer = this.props.initBap.enabledLayers.find((l) => {
              return l.t === layer.title
            })
            if (enabledLayer) {
              this.toggleLayer(layer, enabledLayer.o)
            }
          })

        }
      }

      // let the layers actualy load before we start detecting changes
      // Could use the on load functionaly if it becomes an issue
      setTimeout(() => {this.initilized = true}, 3000)
    }

    resetBap() {
      this.jsonData = null
      if (this.state.isOpen) {
        this.toggleDropdown()
      }
    }

    // anything common (enabledLayers) among all baps gets set here.
    // specific things get set in bap themselves
    setShareState(state) {
      this.shareState = state
      this.shareState.isOpen = this.state.isOpen
      if (this.props.bapId === this.props.priorityBap) {
        this.shareState.enabledLayers = this.getOnLayers().map(a => {return {t: a.title, o: a.layer.options.opacity}})
      }
      this.props.setBapState(this.props.bapId, this.shareState)
    }


    toggleLayer(layer, opacity) {

      let newLayers = this.state.layers
      if (layer && !layer.disabled) {
        for (let l of newLayers) {
          // always toggle the layer clicked
          if (l.title === layer.title) {
            l.checked = !l.checked
            if (opacity) {
              l.layer.options.opacity = opacity
            }
          }
          else {
            // if disableMultipleLayers then be sure to turn off all others
            if (disableMultipleLayers) {
              l.checked = false
            }
          }
        }
        // We want the bap with the layers on to be priority
        if (this.props.bapId !== this.props.priorityBap) {
          this.props.setPriorityBap(this.props.bapId)
        }
        this.props.updateAnalysisLayers(this.getOnLayers())
        this.setShareState(this.shareState)
      }
      else {
        for (let l of newLayers) {
          l.checked = false
        }
        // turning off layers, only replace on layers if priority bap
        if (this.props.bapId === this.props.priorityBap) {
          this.props.updateAnalysisLayers(this.getOnLayers())
        }
      }
      this.setState({layers: newLayers})

    }

    getOnLayers() {
      let layersOn = []
      for (let l of this.state.layers) {
        if (l.checked) {
          layersOn.push(l)
        }
      }
      return layersOn
    }


    toggleLayerDropdown() {
      this.setState({layersOpen: !this.state.layersOpen})
    }

    setOpacity(layer, event) {
      layer.layer.setOpacity(event.target.value)
      layer.layer.options.opacity = event.target.value
      let newLayers = this.state.layers
      this.setState({layers: newLayers})
      this.setShareState(this.shareState)
    }

    handleBapError(error) {
      if (error) {
        return (
          <div className='analysis-error'>
            <Glyphicon style={{paddingRight: '5px', fontSize: '13px'}} className="inner-glyph" glyph="exclamation-sign" />
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
      if (this.state.layers) {
        return (
          <div className="analysis-layers">
            <div className="analysis-layers-dropdown">
              <span onClick={this.toggleLayerDropdown} >
                {'Analysis Inputs'}
                <Glyphicon
                  className="analysis-dropdown-glyph"
                  glyph={this.state.layersOpen ? 'menu-down' : 'menu-right'}
                />
              </span>
              <span>
                <Button id={`openBapWindow${this.props.bapId}`} className='bap-window-button'
                  style={{display: this.state.bapWindowOpen ? 'none' : 'inline-block'}}
                  onClick={() => {this.setState({bapWindowOpen: !this.state.bapWindowOpen})}}>
                  <Glyphicon className="inner-glyph" glyph="resize-full"
                  />
                </Button>
                <Button id={`viewJsonWindow${this.props.bapId}`} className='bap-window-button'
                  style={{display: this.state.jsonWindowOpen || !this.jsonData ? 'none' : 'inline-block'}}
                  onClick={() => {this.setState({jsonWindowOpen: !this.state.jsonWindowOpen})}}>
                  <Glyphicon className="inner-glyph" glyph="console"
                  />
                </Button>
                <CustomToolTip placement="top" target={`openBapWindow${this.props.bapId}`} text="View Bap in new window" ></CustomToolTip>
                <CustomToolTip placement="top" target={`viewJsonWindow${this.props.bapId}`} text="View the raw JSON used for analysis" ></CustomToolTip>

              </span>
            </div>

            <Collapse className='analysis-dropdown-content' isOpen={this.state.layersOpen}>
              {this.state.layers.map((l) => {
                let layer = l
                let key = l.title
                return (
                  <FormGroup key={key} check>
                    <Label check>
                      <input
                        style={{display: layer.hideCheckbox ? 'none' : 'inline-block'}}
                        onClick={() => this.toggleLayer(layer)}
                        onChange={() => {}}
                        checked={layer.checked}
                        type="checkbox"
                        disabled={layer.disabled ? true : false} />
                      {' ' + (layer.titlePrefix ? layer.titlePrefix : '') + layer.title}
                      <InfoSign onClick={(event) => {this.setState({[`sbInfoLayerPopUp${key}`]: !this.state[`sbInfoLayerPopUp${key}`]}); event.preventDefault()}}> </InfoSign>
                      {
                        this.state[`sbInfoLayerPopUp${key}`] &&
                        <span onClick={(event) => event.preventDefault()}>
                          <Dialog
                            isResizable={true}
                            isDraggable={true}
                            title={' ' + (layer.titlePrefix ? layer.titlePrefix : '') + layer.title}
                            modal={false}
                            onClose={() => {
                              this.setState({
                                [`sbInfoLayerPopUpToolTip${key}`]: false,
                                [`sbInfoLayerPopUp${key}`]: false
                              })
                            }}
                          >
                            <div className="sbinfo-popout-window">
                              {layer.sb_properties ?
                                <div>
                                  <div dangerouslySetInnerHTML={{__html: layer.sb_properties.body}}></div>
                                  {this.getSbContactInfo(layer.sb_properties)}
                                  {this.getSbWebLinkInfo(layer.sb_properties)}
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
                            </div>
                          </Dialog>
                        </span>
                      }
                    </Label>
                    <input style={{width: '50%'}}
                      onChange={(event) => this.setOpacity(layer, event)}
                      type="range"
                      step=".05"
                      min="0"
                      max="1"
                      value={layer.layer.options.opacity}
                    />
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
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // eslint-disable-next-line
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
          var cls = 'number'
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'key'
            } else {
              cls = 'string'
            }
          } else if (/true|false/.test(match)) {
            cls = 'boolean'
          } else if (/null/.test(match)) {
            cls = 'null'
          }
          return '<span class="' + cls + '">' + match + '</span>'
        })
      }
      const getDownloadLink = () => {
        return 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.jsonData))
      }
      return (
        <div>
          {
            this.state.bapWindowOpen &&
            <Dialog
              isResizable={true}
              isDraggable={true}
              title={this.state.sb_properties.title}
              modal={false}
              onClose={() => {
                this.setState({
                  bapWindowOpen: false
                })
              }}
            >
              <div className="bap-popout-window">
                {bapContent()}
              </div>
            </Dialog>
          }
          {!this.state.bapWindowOpen && bapContent()}
          {
            this.state.jsonWindowOpen &&
            <Dialog
              isResizable={true}
              isDraggable={true}
              title={'JSON - ' + this.state.sb_properties.title}
              modal={false}
              onClose={() => {
                this.setState({
                  jsonWindowOpen: false
                })
              }}
            >
              <div className="bap-popout-window">
                <div className="JSON-container">
                  <div className="JSON-text-header">
                    <a className="download-json-link" href={getDownloadLink()} download={'JSON_' + this.state.sb_properties.title} >Download</a>
                    <label htmlFor="prettyCheckbox">{'Pretty JSON '}  </label>
                    <input checked={this.state.prettyJson}
                      onClick={() => this.setState({prettyJson: !this.state.prettyJson})}
                      onChange={() => {}}
                      type="checkbox" id="prettyCheckbox" name="prettyCheckbox" />
                  </div>
                  <div className="JSON-text-container">
                    <div className="JSON-text-area">
                      {!this.state.prettyJson && JSON.stringify(this.jsonData, undefined, 0)}
                      {this.state.prettyJson && <pre dangerouslySetInnerHTML={{__html: syntaxHighlight(JSON.stringify(this.jsonData, undefined, 4))}}></pre>}
                    </div>
                  </div>
                </div>
              </div>
            </Dialog>
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

        // We want the bap with the layers on to be priority
        if (!this.state.isOpen && this.props.priorityBap !== this.props.bapId) {
          this.props.setPriorityBap(this.props.bapId)
        }
        this.setState({
          isOpen: !this.state.isOpen,
          glyph: !this.state.isOpen ? 'menu-down' : 'menu-right'
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
      var body = document.createElement('div')
      body.innerHTML = this.state.sb_properties.body
      let contents = this.htmlToPDFMake([], body)

      let pdfDoc = []
      let text = []
      pdfDoc.push({text: this.state.sb_properties.title, style: 'analysisTitle', margin: [5, 2, 5, 20], pageBreak: 'before'})

      for (let content of contents) {
        if (content.nodeName === '#text' && content.textContent) {

          let definition = {text: content.textContent, style: 'sbProperties', margin: [10, 2, 0, 2]}
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
          text.push({text: '\n'})
        }
      }
      pdfDoc.push({text: text})
      pdfDoc.push({text: 'ScienceBase Item', style: 'sbPropertiesTitle'})
      pdfDoc.push({text: this.state.sb_properties.link.url, style: 'annotationLink', margin: [15, 10, 5, 0], link: this.state.sb_properties.link.url})
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
          style={{display: this.state.isEnabled ? 'block' : 'none'}}
          className="nbm-flex-row-no-padding small-padding">

          <div className="bap-title-content" style={{width: '20px'}}>
            <span onClick={this.toggleDropdown} className="bapTitle">
              <Glyphicon style={{display: this.state.canOpen ? 'inline-block' : 'none'}}
                className="dropdown-glyph"
                glyph={this.state.glyph} />
            </span>
          </div>
          <div className="bap-title-content" style={{width: 'calc(100% - 40px)'}}>
            <span className="bapTitle">
              <span onClick={this.state.canOpen ? () => this.toggleDropdown() : null}>
                {this.state.sb_properties.title}
              </span>
              {<InfoSign onClick={() => this.setState({sbInfoPopUp: !this.state.sbInfoPopUp})}> </InfoSign>}
            </span>
          </div>
          <div className="bap-title-content" style={{width: '20px'}}>
            <input id={`pBapToolTip${this.props.bapId}`} className="priority-bap-raido"
              style={{display: this.state.canOpen ? 'block' : 'none'}} type='radio'
              readOnly={true} checked={this.props.bapId === this.props.priorityBap}
              onClick={() => {this.props.setPriorityBap(this.props.bapId)}} ></input>
            <CustomToolTip placement="top" target={`pBapToolTip${this.props.bapId}`} text={this.props.bapId === this.props.priorityBap ? '' : 'Select Priority Bap'} ></CustomToolTip>
          </div>
          <Collapse className="settings-dropdown" isOpen={this.state.isOpen && this.state.isEnabled}>
            <AnalysisPackage
              {...this.props}
              {...this.state}
              toggleLayerDropdown={this.toggleLayerDropdown}
              toggleLayer={this.toggleLayer}
              getAnalysisLayers={this.getAnalysisLayers}
              getBapContents={this.getBapContents}
              getSBItemForPrint={this.getSBItemForPrint}
              isEnabled={this.updateEnabled}
              canOpen={this.canOpen}
              setShareState={this.setShareState}
              layers={this.state.layers}
              handleBapError={this.handleBapError}
              isOpen={this.state.isOpen}
              setBapJson={this.setBapJson}
            />
          </Collapse>
          {
            this.state.sbInfoPopUp &&
            <Dialog
              isResizable={true}
              isDraggable={true}
              title={this.state.sb_properties.title}
              modal={false}
              onClose={() => {
                this.setState({
                  sbInfoPopUpToolTip: false,
                  sbInfoPopUp: false
                })
              }}
            >
              <div className="sbinfo-popout-window">
                <div dangerouslySetInnerHTML={{__html: this.state.sb_properties.body}}></div>
                {this.getSbContactInfo(this.state.sb_properties)}
                {this.getSbWebLinkInfo(this.state.sb_properties)}
                <br></br>
                {this.state.sb_properties.link && <div><a href={this.state.sb_properties.link.url}>{`${this.state.sb_properties.link.url}`}</a></div>}
              </div>
            </Dialog>
          }
        </div>
      )
    }

  }

  return HOC
}

export default withSharedAnalysisCharacteristics
