import './LeftPanel.scss'
import Biogeography from '../Bioscapes/Biogeography'
import Dialog from 'react-dialog'
import EnabledLayersContext from '../Contexts/EnabledLayersContext'
import InfoSign from '../InfoSign/InfoSign'
import React, {FunctionComponent, useState, useRef, useEffect, useContext, useCallback, Dispatch, SetStateAction} from 'react'
import SearchBar from './SearchBar'
import TerrestrialEcosystems2011 from '../Bioscapes/TerrestrialEcosystems2011'
import loadingGif from './ajax-loader.gif'
import speechBubble from './bubble.png'
import {UncontrolledTooltip, Alert} from 'reactstrap'
import {isEmpty} from 'lodash'
import generatePdfReport from '../PDF/generatePdfReport'

export interface ILeftPanelProps {
  setErrorState: Dispatch<SetStateAction<Error | undefined>>
  bioscape: any,
  priorityBap: any,
  feature: any,
  initBaps: any[],
  shareState: Function,
  bioscapeName: string,
  point: any,
  map: any,
  updateAnalysisLayers: any,
  mapClicked: boolean,
  submitHandler: Function,
  setPriorityBap: Function,
  setBapState: Function,
  overlay: any,
}

export interface ILeftPanelState {
  feature_name: string,
  bioscape: any,
  shareText: string,
  feature: null | any,
  feature_id: string,
  feature_class: string,
  feature_state: null | any,
  feature_area: string,
  shareToolTipOpen: boolean
}

const LeftPanel: FunctionComponent<ILeftPanelProps> = (props) => {

  const [listenerAdded, setListenerAdded] = useState<boolean>(false)

  const [reportAlertOpen, setReportAlertOpen] = useState(false)
  const onReportAlertDismiss = () => setReportAlertOpen(false)

  const terrestrialRef = useRef<null | TerrestrialEcosystems2011>(null)
  const biogeographyRef = useRef<null | Biogeography>(null)

  const [loading, setLoading] = useState(false)
  const [showDescription, setShowDescription] = useState(false)

  // @Matt TODO: #current fix the phenology bap, it spins forever?

  const [state, setState] = useState<ILeftPanelState>({
    feature: null,
    feature_name: '',
    feature_id: '',
    feature_class: '',
    feature_state: null,
    feature_area: '',
    bioscape: props.bioscape,
    shareText: 'Share',
    shareToolTipOpen: false,
  })

  const [displayHelpPopup, setDisplayHelpPopup] = useState(false)
  const disableHelpPopup = () => setDisplayHelpPopup(false)

  const {setEnabledLayers} = useContext(EnabledLayersContext)

  useEffect(() => {
    console.log('LeftPanel:listeners')

    // only add the event listener when we are ready to remove it.
    // If there is a layer or the layer is empty string then we are loading a
    // previous state and do not want to display the help popup ever. Otherwise,
    // we want to display it after a user has selected a feature but before they
    // pick a bap.
    if (!listenerAdded && !props.priorityBap && !isEmpty(props.feature) && isEmpty(props.initBaps)) {
      setListenerAdded(true)
      setDisplayHelpPopup(true)

      document.body.addEventListener('click', disableHelpPopup, true)
      document.body.addEventListener('keydown', disableHelpPopup, true)
    }

    return () => {
      if (listenerAdded) {
        document.body.removeEventListener('click', disableHelpPopup, true)
        document.body.removeEventListener('keydown', disableHelpPopup, true)
      }
    }
  }, [listenerAdded, props.feature, props.initBaps, props.priorityBap])

  useEffect(() => {
    console.log('LeftPanel:feature stuff')
    if (props.feature && props.feature.properties) {
      setState((prev) => Object.assign({}, prev, {
        feature: props.feature,
        feature_id: props.feature.properties.feature_id,
        feature_name: props.feature.properties.feature_name,
        feature_class: props.feature.properties.feature_class,
        feature_state: props.feature.properties.state,
        feature_area: props.feature.properties.approxArea,
      })
      )
    }

  }, [props.feature])

  const share = () => {
    props.shareState()
    if (!props.feature) {
      setState((prev) => Object.assign({}, prev, {
        shareText: 'Error!',
        shareToolTipOpen: true
      })
      )
    }
    else {
      setState((prev) => Object.assign({}, prev, {shareText: 'Done!'}))
    }
    setTimeout(() => {
      setState((prev) => Object.assign({}, prev, {
        shareText: 'Share',
        shareToolTipOpen: false
      }))
    }, 2000)

  }

  const report = () => {
    setLoading(true)

    let charts = []
    if (props.bioscapeName === 'terrestrial-ecosystems-2011') {
      if (terrestrialRef.current) {
        charts = terrestrialRef.current.report()
      }
    }
    else {
      if (biogeographyRef.current) {
        charts = biogeographyRef.current.report()
      }
    }

    if (!charts.some((c: any[]) => c.length !== 0)) {
      setReportAlertOpen(true)
      setLoading(false)
      return
    }

    let name = state.feature_name + `${state.feature_state ? ', ' + state.feature_state.abbreviation : ''}`
    generatePdfReport(name, state.feature_class, props.point, roundArea(), props.map.current, charts, props.shareState())
      .then(() => {
        setTimeout(() => {
          setLoading(false)
        }, 1000)
      })
      .catch((error: any) => {
        console.log(error)
        setLoading(false)
      })
  }

  const updateAnalysisLayers = (enabledLayers: any, bapId: any) => {
    setEnabledLayers(enabledLayers)

    props.updateAnalysisLayers(enabledLayers, bapId)
  }

  const roundArea = useCallback((): string => {
    if (state.feature_area === 'Unknown') { return 'Unknown' }

    const rounded = parseInt(state.feature_area.replace(/,/g, ''))

    const postfix = (rounded === 1 ? 'acre' : 'acres')

    return `${rounded.toLocaleString('en-US')} ${postfix}`
  }, [state.feature_area])

  const featureText = () => {
    if (state.feature_name) {
      return (
        <div className="panel-header">
          <div className="panel-title">
            <span>{state.feature_name}{state.feature_state ? ', ' + state.feature_state.abbreviation : ''}</span>
          </div>
          <div className="panel-subtitle">
            <div className="category-text">Category: <span className="feature-text">  {state.feature_class}</span></div>
            <div className="category-text">Approximate Area: <span className="feature-text">{roundArea()}</span></div>
            <div className="category-text">Point of Interest: <span className="feature-text">
              {props.point && props.point.elv && props.point.lat && props.point.lng &&
                <span>
                  {`${props.point.lat.toFixed(5)}°, ${props.point.lng.toFixed(5)}° `}  {'\u00A0'}  <span> {` ${props.point.elv === 'No Data' ? 'No Data' : props.point.elv + 'ft'}.`}</span>
                </span>
              }
            </span>
            </div>
          </div>
          <div className="panel-buttons">
            <button id="ShareTooltip" className="submit-analysis-btn" onClick={share}>{state.shareText}</button>
            <UncontrolledTooltip target="ShareTooltip" placement="top" >
              Share this map by copying a url to your clipboard.
            </UncontrolledTooltip>
            <input className="share-url-input" type="text"></input>

            <button id="ReportTooltip" className="submit-analysis-btn" onClick={report}>
              Report
            </button>
            <UncontrolledTooltip target="ReportTooltip" placement="top" >
              Only expanded sections will appear in the PDF and all user selections/filters will be reflected.
            </UncontrolledTooltip>
            <Alert isOpen={reportAlertOpen} toggle={onReportAlertDismiss}>
              No report can be generated until you have expanded at least one
              section.  If you still get this error message after expanding a
              section, ensure you have run any applicable analysis in that
              section.
            </Alert>
          </div>
          {loading && <div className="pdf-loading-gif">
            <img src={loadingGif} alt="Loading..."></img>
          </div>}
        </div>
      )
    }
  }
  return (
    <div className="left-panel">
      <div id='left-panel-header' className="left-panel-header">
        <div className="nbm-flex-row">
          <div className="mx-auto text-center">
            <span className="bioscape-title-text">{state.bioscape.title}</span>
            <span className="align-self-center">
              <InfoSign onClick={() => setShowDescription(!showDescription)} />
            </span>
            {showDescription &&
              <div className="sbinfo-title">
                <Dialog
                  className="sbinfo-popout-window"
                  isResizable={true}
                  isDraggable={true}
                  title={state.bioscape.title}
                  modal={false}
                  onClose={() => setShowDescription(false)}
                >
                  <div className="sbinfo-popout-window">
                    <div className="sbinfo-body">{state.bioscape.description}</div>
                  </div>
                </Dialog>
              </div>
            }
          </div>
        </div>
        <SearchBar {...props} />
      </div>
      {displayHelpPopup && <div className="bap-popup" id="baphHelpPopup">
        <img src={speechBubble} alt="Speech Bubble"></img>
        <div className="bap-popuptext" id="myPopup">Choose an Analysis</div>
      </div>}
      <div className="analysis-area">
        {featureText()}
        <div id='analysis-package-container' className="analysis-package-container">

          {state.feature_name && <div className="section-title">Analyses available for {state.feature_name}</div>}
          {!state.feature_name && <div className="analysis-package-text">Analysis Packages {state.feature_name}</div>}
          {
            props.bioscapeName === 'terrestrial-ecosystems-2011' ?
              <TerrestrialEcosystems2011
                ref={terrestrialRef}
                {...props}
                {...state}
                updateAnalysisLayers={updateAnalysisLayers}
              />
              :
              <Biogeography
                ref={biogeographyRef}
                {...props}
                {...state}
                updateAnalysisLayers={updateAnalysisLayers}
              />
          }
          <div id="d3chartTooltip" className='chartTooltip'></div>
        </div>
      </div>

    </div>
  )
}
export default LeftPanel
