import './AnalysisPackages.css'
import Dialog from 'react-dialog'
import InfoSign from '../InfoSign/InfoSign'
import React, {useState, useEffect, useRef, useContext} from 'react'
import {UncontrolledTooltip, Button, Collapse, FormGroup, Label} from 'reactstrap'
import {FaCode, FaExclamationCircle, FaChevronDown, FaChevronRight} from 'react-icons/fa'
import {IoMdOpen} from 'react-icons/io'
import {TimeSliderContext} from '../Contexts/TimeSliderContext'


export interface IAnalysisPackageProps {
  onRef: Function
  initBap?: {
    isOpen: boolean
    enabledLayers: any[]
  }
  priorityBap: string
  bapId: string
  setPriorityBap: Function
  updateAnalysisLayers: Function
  setBapState: Function
  feature: any
  point: any
  yearMin: number
  yearMax: number
  devBap?: boolean
}

const withSharedAnalysisCharacteristics = (AnalysisPackage: any,
  layers_init: any[],
  sb_properties: any,
  sb_url: string,
  disableMultipleLayers = false) => {
  const AnalysisPackageInstance = React.createRef<{print: Function}>()

  const HOC: React.FunctionComponent<IAnalysisPackageProps> = (props: IAnalysisPackageProps) => {
    const [, setTimeSliderState] = useContext(TimeSliderContext)
    const [sbProperties, setSbProperties] = useState(sb_properties)
    const [error, setError] = useState()
    const [layers, setLayers] = useState(layers_init)
    const [isOpen, setIsOpen] = useState(props.priorityBap === props.bapId)
    const [canOpen, setCanOpen] = useState(false)
    const [bapWindowOpen, setBapWindowOpen] = useState(false)
    const [isEnabled, setIsEnabled] = useState(true)
    const [sbInfoPopUp, setSbInfoPopUp] = useState(false)
    const [layersOpen, setLayersOpen] = useState(true)
    const [jsonWindowOpen, setJsonWindowOpen] = useState(false)
    const [sbInfoLayerPopUp, setSbInfoLayerPopUp] = useState<{[key: string]: boolean}>({})
    const [prettyJson, setPrettyJson] = useState(false)
    const [isPriorityBap, setIsPriorityBap] = useState(props.priorityBap === props.bapId)

    let shareState: any = {}
    let initialized = useRef(false)
    let jsonData: any = null

    useEffect(() => {
      fetch(sb_url)
        .then(res => res.json())
        .then(
          (result) => {
            setSbProperties(result)
          },
          (error) => {
            setError(error)
          }
        )
      initilize()
      if (isPriorityBap) {
        setTimeSliderState({display: true})
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      console.log('AnalysisPackage featureChange effect', props.bapId)
      // feature change
      if (!initialized.current) {
        return
      }
      resetBap()

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.feature])

    useEffect(() => {
      if (!initialized.current) {
        return
      }
      console.log('prioBap Changed')
      // priorityBap has changed, this bap is not it
      if (props.priorityBap !== props.bapId) {
        toggleLayer(null)
        setIsPriorityBap(false)
      }
      // priorityBap has changed, this bap is it
      else if (props.priorityBap === props.bapId) {
        if (layers.length && !getOnLayers().length) {
          let firstLayer = layers[0]
          toggleLayer(firstLayer)
          setTimeSliderState({display: firstLayer.timeEnabled})
        } else {
          setTimeSliderState({display: false})
        }
        setIsOpen(true)
        setIsPriorityBap(true)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.priorityBap])

    useEffect(() => {
      if (error) {
        console.error(error)
      }
    }, [error])

    useEffect(() => {
      props.onRef({print})
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    const initilize = () => {
      let newLayers = [...layers]

      newLayers.forEach((layer) => {
        if (layer.sb_item) {
          fetch(`https://www.sciencebase.gov/catalog/item/${layer.sb_item}?format=json`)
            .then(res => res.json())
            .then(
              (result) => {
                layer.sb_properties = result
                setLayers(newLayers)
              },
              (error) => {
                setError(error)
              }
            )
        }
      })
      // turn on the layers saved in the state
      if (props.initBap) {
        setIsOpen(props.initBap.isOpen)
        if (isPriorityBap) {
          layers.forEach((layer) => {
            // @ts-ignore: Object is possibly 'undefined'
            let enabledLayer = props.initBap.enabledLayers.find((l) => {
              return l.t === layer.title
            })
            if (enabledLayer) {
              toggleLayer(layer, enabledLayer.o)
            }
          })
        }
      }

      // let the layers actualy load before we start detecting changes
      // Could use the on load functionaly if it becomes an issue
      setTimeout(() => {initialized.current = true}, 3000)
    }

    const toggleLayer = (layer: any, opacity?: number) => {
      let newLayers = [...layers]
      if (layer && !layer.disabled) {
        for (let l of newLayers) {
          // always toggle the layer clicked
          if (l.title === layer.title) {
            l.checked = !l.checked
            if (opacity) {
              l.layer.options.opacity = opacity
            }
          } else {
            // if disableMultipleLayers then be sure to turn off all others
            if (disableMultipleLayers) {
              l.checked = false
            }
          }
        }
        // We want the bap with the layers on to be priority
        if (props.bapId !== props.priorityBap) {
          props.setPriorityBap(props.bapId)
        }
        props.updateAnalysisLayers(getOnLayers())
        setShareState(shareState)
      } else {
        for (let l of newLayers) {
          l.checked = false
        }
        // turning off layers, only replace on layers if priority bap
        if (props.bapId === props.priorityBap) {
          props.updateAnalysisLayers(getOnLayers())
        }
      }
      setLayers(newLayers)
    }

    const getOnLayers = () => {
      return layers.filter(l => l.checked)
    }

    // anything common (enabledLayers) among all baps gets set here.
    // specific things get set in bap themselves
    const setShareState = (state: any) => {
      shareState = state
      shareState.isOpen = isOpen
      if (props.bapId === props.priorityBap) {
        shareState.enabledLayers = getOnLayers().map(a => {return {t: a.title, o: a.layer.options.opacity}})
      }
      props.setBapState(props.bapId, shareState)
    }

    const resetBap = () => {
      jsonData = null
      if (isOpen) {
        toggleDropdown()
      }
    }

    const toggleDropdown = () => {
      if (!canOpen) {
        return
      }
      // We want the bap with the layers on to be priority
      if (!isOpen && props.priorityBap !== props.bapId) {
        props.setPriorityBap(props.bapId)
      }
      setIsOpen(!isOpen)
    }

    const getSbContactInfo = (sbProps: any) => {
      if (!sbProps || !sbProps.contacts) return []
      let r = [<br key="br1-CI"></br>, <h4 key="h41-CI">Contacts:</h4>]
      let c = sbProps.contacts
      for (let i of c) {
        r.push(<div key={i.name + i.email}>
          <span>{i.name ? `${i.name}  ` : ''}</span>
          <span>{i.email ? ` -  ${i.email}  ` : ''}</span>
          <span>{i.type ? ` -  ${i.type}  ` : ''}</span>

        </div>)
      }
      return r
    }

    const getSbWebLinkInfo = (sbProps: any) => {
      if (!sbProps || !sbProps.webLinks) return []
      let r = [<br key="br2-CI"></br>, <h4 key="h42-CI">Web Links:</h4>]
      let c = sbProps.webLinks
      for (let i of c) {
        if (i.type === 'citation') {
          r.push(<div key={i.title}>
            <div><a href={i.uri}>{i.title}</a></div>
          </div>)
        }
      }
      return r
    }

    const setOpacity = (layer: any, event: any) => {
      layer.layer.setOpacity(event.target.value)
      layer.layer.options.opacity = event.target.value
      let newLayers = [...layers]
      setLayers(newLayers)
      setShareState(shareState)
    }

    const getAnalysisLayers = () => {
      return (
        <div className="analysis-layers">
          <div className="analysis-layers-dropdown">
            <span onClick={() => setLayersOpen(!layersOpen)} >
              {'Analysis Inputs'}
              {layersOpen ?
                <FaChevronDown className="analysis-dropdown-glyph" /> :
                <FaChevronRight className="analysis-dropdown-glyph" />
              }
            </span>
            <span>
              <Button id={`openBapWindow${props.bapId}`} className="icon-btn bap-window-button"
                style={{display: bapWindowOpen ? 'none' : 'inline-block'}}
                onClick={() => setBapWindowOpen(!bapWindowOpen)}
              >
                <IoMdOpen />
              </Button>
              <Button id={`viewJsonWindow${props.bapId}`} className="icon-btn bap-window-button"
                style={{display: jsonWindowOpen || !jsonData ? 'none' : 'inline-block'}}
                onClick={() => setJsonWindowOpen(!jsonWindowOpen)}
              >
                <FaCode />
              </Button>
              <UncontrolledTooltip placement="top" target={`openBapWindow${props.bapId}`} >View Bap in new window</UncontrolledTooltip>
              <UncontrolledTooltip placement="top" target={`viewJsonWindow${props.bapId}`} >View the raw JSON used for analysis</UncontrolledTooltip>

            </span>
          </div>

          <Collapse className='analysis-dropdown-content' isOpen={layersOpen}>
            {layers.map((l) => {
              let layer = l
              let key: string = l.title
              return (
                <FormGroup key={key} check>
                  <Label check>
                    <input
                      style={{display: layer.hideCheckbox ? 'none' : 'inline-block'}}
                      onClick={() => toggleLayer(layer)}
                      onChange={() => {}}
                      checked={layer.checked}
                      type="checkbox"
                      disabled={layer.disabled ? true : false} />
                    <span className={layer.disabled ? 'text-muted' : ''}>{' ' + (layer.titlePrefix ? layer.titlePrefix : '') + layer.title}</span>
                    <InfoSign onClick={(event: any) => {setSbInfoLayerPopUp({...sbInfoLayerPopUp, [key]: !sbInfoLayerPopUp[key]}); event.preventDefault()}}> </InfoSign>
                  </Label>
                  {sbInfoLayerPopUp[key] &&
                    <Dialog
                      isResizable={true}
                      isDraggable={true}
                      title={' ' + (layer.titlePrefix ? layer.titlePrefix : '') + layer.title}
                      modal={false}
                      onClose={() => setSbInfoLayerPopUp({...sbInfoLayerPopUp, [key]: false})}
                    >
                      <div className="sbinfo-popout-window">
                        {layer.sb_properties ?
                          <div>
                            <div dangerouslySetInnerHTML={{__html: layer.sb_properties.body}}></div>
                            {getSbContactInfo(layer.sb_properties)}
                            {getSbWebLinkInfo(layer.sb_properties)}
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
                  }
                  <input style={{width: '50%'}}
                    onChange={(event: any) => setOpacity(layer, event)}
                    type="range"
                    step=".05"
                    min="0"
                    max="1"
                    value={layer.layer.options.opacity}
                    disabled={layer.disabled ? true : false}
                  />
                </FormGroup>
              )
            })}
          </Collapse>
        </div>
      )
    }

    const getBapContents = (bapContent: any) => {
      const syntaxHighlight = (json: any) => {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // eslint-disable-next-line
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match: string) => {
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
        return 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonData))
      }
      return (
        <div>
          {bapWindowOpen &&
            <Dialog
              isResizable={true}
              isDraggable={true}
              title={sbProperties.title}
              modal={false}
              onClose={() => setBapWindowOpen(false)}
            >
              <div className="bap-popout-window">
                {bapContent()}
              </div>
            </Dialog>
          }
          {!bapWindowOpen && bapContent()}
          {jsonWindowOpen &&
            <Dialog
              isResizable={true}
              isDraggable={true}
              title={'JSON - ' + sbProperties.title}
              modal={false}
              onClose={() => setJsonWindowOpen(false)}
            >
              <div className="bap-popout-window">
                <div className="JSON-container">
                  <div className="JSON-text-header">
                    <a className="download-json-link" href={getDownloadLink()} download={'JSON_' + sbProperties.title} >Download</a>
                    <label htmlFor="prettyCheckbox">{'Pretty JSON '}  </label>
                    <input checked={prettyJson}
                      onClick={() => setPrettyJson(!prettyJson)}
                      onChange={() => {}}
                      type="checkbox" id="prettyCheckbox" name="prettyCheckbox" />
                  </div>
                  <div className="JSON-text-container">
                    <div className="JSON-text-area">
                      {!prettyJson && JSON.stringify(jsonData, undefined, 0)}
                      {prettyJson && <pre dangerouslySetInnerHTML={{__html: syntaxHighlight(JSON.stringify(jsonData, undefined, 4))}}></pre>}
                    </div>
                  </div>
                </div>
              </div>
            </Dialog>
          }
        </div>
      )
    }

    const getSBItemForPrint = () => {
      var body = document.createElement('div')
      body.innerHTML = sbProperties.body
      let contents = htmlToPDFMake([], body)

      let pdfDoc = []
      let text = []
      pdfDoc.push({text: sbProperties.title, style: 'analysisTitle', margin: [5, 2, 5, 20], pageBreak: 'before'})

      for (let content of contents) {
        if (content.nodeName === '#text' && content.textContent) {
          let definition: any = {text: content.textContent, style: 'sbProperties', margin: [10, 2, 0, 2]}
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
            definition.text = '   •   ' + content.textContent
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
      if (sbProperties.link) {
        pdfDoc.push({text: sbProperties.link.url, style: 'annotationLink', margin: [15, 10, 5, 0], link: sbProperties.link.url})
      }
      // pdfDoc.push({ text: '', pageBreak: 'after' })

      return pdfDoc
    }

    const canOpenFunction = (co: boolean) => {
      if (!co && isOpen) {
        toggleDropdown()
      }
      setCanOpen(co)
    }

    const htmlToPDFMake = (content: any, element: any) => {
      if (element.hasChildNodes()) {
        let children = element.childNodes
        for (let i = 0; i < children.length; i++) {
          htmlToPDFMake(content, children[i])
        }
      } else {
        element.textContent = element.textContent.replace(/↵/g, '').trim()
        content.push(element)
      }
      return content
    }

    const handleBapError = (error: any) => {
      if (error) {
        return (
          <div className='analysis-error'>
            <FaExclamationCircle />
            There was an error producing this analysis. Please try again.
          </div>
        )
      }
      return []
    }

    const print = () => {
      if (AnalysisPackageInstance.current && isOpen) {
        return AnalysisPackageInstance.current.print()
      }
    }

    return (
      <div id={props.bapId}
        style={{display: isEnabled ? 'block' : 'none'}}
        className="nbm-flex-row-no-padding small-padding"
      >
        <div className="bap-title-content" style={{width: '20px'}}>
          <span onClick={toggleDropdown} className="bapTitle">
            {isOpen ?
              <FaChevronDown style={{display: canOpen ? 'inline-block' : 'none'}} className="dropdown-glyph" /> :
              <FaChevronRight style={{display: canOpen ? 'inline-block' : 'none'}} className="dropdown-glyph" />
            }
          </span>
        </div>
        <div className="bap-title-content" style={{width: 'calc(100% - 40px)'}}>
          <span className="bapTitle">
            <span onClick={toggleDropdown}>
              {sbProperties.title}
            </span>
            {props.devBap && <i className="text-white"> (Dev Only)</i>}
            {<InfoSign onClick={() => setSbInfoPopUp(!sbInfoPopUp)}> </InfoSign>}
          </span>
        </div>
        <div className="bap-title-content" style={{width: '20px'}}>
          <input id={`pBapToolTip${props.bapId}`} className="priority-bap-raido"
            style={{display: canOpen ? 'block' : 'none'}} type='radio'
            readOnly={true} checked={props.bapId === props.priorityBap}
            onClick={() => {props.setPriorityBap(props.bapId)}} >
          </input>
          <UncontrolledTooltip placement="top" target={`pBapToolTip${props.bapId}`} >
            {props.bapId === props.priorityBap ? '' : 'Select Priority Bap'}
          </UncontrolledTooltip>
        </div>
        <Collapse className="settings-dropdown" isOpen={isOpen && isEnabled}>
          <AnalysisPackage
            ref={AnalysisPackageInstance}
            onRef={props.onRef}
            initBap={props.initBap}
            point={props.point}
            feature={props.feature}
            yearMin={props.yearMin}
            yearMax={props.yearMax}
            // {...this.props}
            // {...this.state}
            toggleLayerDropdown={() => setLayersOpen(!layersOpen)}
            toggleLayer={toggleLayer}
            getAnalysisLayers={getAnalysisLayers}
            getBapContents={getBapContents}
            getSBItemForPrint={getSBItemForPrint}
            isEnabled={(enabled: boolean) => setIsEnabled(enabled)}
            canOpen={canOpenFunction}
            setShareState={setShareState}
            layers={layers}
            handleBapError={handleBapError}
            isOpen={isOpen}
            isPriorityBap={isPriorityBap}
            setBapJson={(data: any) => jsonData = data}
          />
        </Collapse>
        {sbInfoPopUp &&
          <Dialog
            isResizable={true}
            isDraggable={true}
            title={sbProperties.title}
            modal={false}
            onClose={() => setSbInfoPopUp(false)}
          >
            <div className="sbinfo-popout-window">
              <div dangerouslySetInnerHTML={{__html: sbProperties.body}}></div>
              {getSbContactInfo(sbProperties)}
              {getSbWebLinkInfo(sbProperties)}
              <br></br>
              {sbProperties.link &&
                <div>
                  <a href={sbProperties.link.url}>{`${sbProperties.link.url}`}</a>
                </div>
              }
            </div>
          </Dialog>
        }
      </div>
    )
  }

  return HOC
}

export default withSharedAnalysisCharacteristics
