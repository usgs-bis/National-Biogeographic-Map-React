import './LeftPanel.css'
import Biogeography from '../Bioscapes/Biogeography'
import CustomToolTip from '../ToolTip/ToolTip'
// @ts-ignore
import Dialog from 'react-dialog'
import InfoSign from '../InfoSign/InfoSign'
import PDFReport from '../PDF/PdfReport'
import React from 'react'
import SearchBar from './SearchBar'
import TerrestrialEcosystems2011 from '../Bioscapes/TerrestrialEcosystems2011'
import loadingGif from './ajax-loader.gif'
import speechBubble from './bubble.png'

export interface ILeftPanelProps {
  results: any[],
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
  textSearchHandler: Function,
  submitHandler: Function,
  rangeYearMin: number,
  rangeYearMax: number,
  setPriorityBap: Function,
  setBapState: Function,
  overlay: any,
}

export interface ILeftPanelState {
  feature_name: string,
  results: any[],
  bioscape: any,
  loading: boolean,
  enabledLayers: any[],
  shareText: string,
  displayHelpPopup: boolean,
  showDescription: boolean,
  feature: null | any,
  feature_id: string,
  feature_class: string,
  feature_state: null | any,
  feature_area: string,
  shareToolTipOpen: boolean
}

class LeftPanel extends React.Component<ILeftPanelProps, ILeftPanelState> {

  loaderRef: React.RefObject<unknown>
  listenerAdded: boolean
  terrestrialRef: TerrestrialEcosystems2011|undefined
  biogeographyRef: Biogeography|undefined
  pdfReportRef: PDFReport|undefined

  constructor(props: ILeftPanelProps) {
    super(props)
    this.state = {
      feature: null,
      feature_name: '',
      feature_id: '',
      feature_class: '',
      feature_state: null,
      feature_area: '',
      results: props.results,
      bioscape: props.bioscape,
      loading: false,
      enabledLayers: [],
      shareText: 'Share',
      displayHelpPopup: false,
      showDescription: false,
      shareToolTipOpen: false,
    }

    this.share = this.share.bind(this)
    this.report = this.report.bind(this)
    this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
    this.loaderRef = React.createRef()
    this.listenerAdded = false
  }


  componentWillUnmount() {
    if (this.listenerAdded) {
      document.body.removeEventListener('click', () => {this.setState({displayHelpPopup: false})}, true)
      document.body.removeEventListener('keydown', () => {this.setState({displayHelpPopup: false})}, true)
    }
  }


  componentWillReceiveProps(props: ILeftPanelProps) {
    if (props.feature && props.feature.properties) {

      this.setState({
        feature: props.feature,
        feature_id: props.feature.properties.feature_id,
        feature_name: props.feature.properties.feature_name,
        feature_class: props.feature.properties.feature_class,
        feature_state: props.feature.properties.state,
        feature_area: props.feature.properties.approxArea
      })
    }

    // only add the event listner when we are ready to remove it.
    // If there is a layer or the layer is empty string then we are loading a
    // previous state and do not want to display the help popup ever. Otherwise,
    // we want to display it after a user has selected a feature but before they
    // pick a bap.
    if (!this.listenerAdded && !this.props.priorityBap && props.feature && !this.props.initBaps) {
      this.listenerAdded = true
      this.setState({displayHelpPopup: true})
      document.body.addEventListener('click', () => {this.setState({displayHelpPopup: false})}, true)
      document.body.addEventListener('keydown', () => {this.setState({displayHelpPopup: false})}, true)
    }

  }


  share() {
    this.props.shareState()
    if (!this.props.feature) {
      this.setState({
        shareText: 'Error!',
        shareToolTipOpen: true
      })
    }
    else {
      this.setState({shareText: 'Done!'})
    }
    setTimeout(() => {
      this.setState({
        shareText: 'Share',
        shareToolTipOpen: false
      })
    }, 2000)

  }

  report() {
    this.setState({
      loading: true
    })

    let charts = []
    if (this.props.bioscapeName === 'terrestrial-ecosystems-2011') {
      if (this.terrestrialRef) {
        charts = this.terrestrialRef.report()
      }
    }
    else {
      if (this.biogeographyRef) {
        charts = this.biogeographyRef.report()
      }
    }
    let name = this.state.feature_name + `${this.state.feature_state ? ', ' + this.state.feature_state.abbreviation : ''}`
    this.pdfReportRef?.generateReport(name, this.state.feature_class, this.props.point, this.state.feature_area, this.props.map.current, charts)
      .then(() => {
        setTimeout(() => {
          this.setState({
            loading: false
          })
        }, 1000)
      })
      .catch((error: any) => {
        console.log(error)
        this.setState({
          loading: false
        })
      })
  }

  updateAnalysisLayers(enabledLayers: any, bapId: any) {
    this.setState({
      enabledLayers: enabledLayers
    })

    this.props.updateAnalysisLayers(enabledLayers, bapId)
  }


  render() {

    const featureText = () => {
      if (this.state.feature_name) {
        return (
          <div className="panel-header">
            <div className="panel-title">
              <span>{this.state.feature_name}{this.state.feature_state ? ', ' + this.state.feature_state.abbreviation : ''}</span>
            </div>
            <div className="panel-subtitle">
              <div className="category-text">Category: <span className="feature-text">  {this.state.feature_class}</span></div>
              <div className="category-text">Approximate Area: <span className="feature-text">  {this.state.feature_area === 'Unknown' ? 'Unknown' : this.state.feature_area + ' acres'} </span></div>
              <div className="category-text">Point of Interest: <span className="feature-text">
                {this.props.point && this.props.point.elv && this.props.point.lat && this.props.point.lng &&
                  <span>
                    {`${this.props.point.lat.toFixed(5)}°, ${this.props.point.lng.toFixed(5)}° `}  {'\u00A0'}  <span> {` ${this.props.point.elv === 'No Data' ? 'No Data' : this.props.point.elv + 'ft'}.`}</span>
                  </span>
                }
              </span>
              </div>
            </div>
            <div className="panel-buttons">
              <button id="ShareTooltip" className="submit-analysis-btn" onClick={this.share}>{this.state.shareText}</button>
              <input className="share-url-input" type="text"></input>
              <CustomToolTip target="ShareTooltip" placement="top" text={'Share this map by copying a url to your clipboard.'} > </CustomToolTip>

              <button id="ReportTooltip" className="submit-analysis-btn" onClick={this.report}>
                <PDFReport onRef={(ref: PDFReport) => (this.pdfReportRef = ref)} getShareUrl={this.props.shareState}></PDFReport>
              </button>
              <CustomToolTip target="ReportTooltip" placement="top" text={'Only expanded sections will appear in the PDF and all user selections/filters will be reflected.'} > </CustomToolTip>
            </div>
            {this.state.loading && <div className="pdf-loading-gif">
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
              <span className="bioscape-title-text">{this.state.bioscape.title}</span>
              <span className="align-self-center">
                <InfoSign onClick={() => this.setState({showDescription: !this.state.showDescription})}> </InfoSign>
              </span>
              {this.state.showDescription &&
                <div className="sbinfo-title">
                  <Dialog
                    className="sbinfo-popout-window"
                    isResizable={true}
                    isDraggable={true}
                    title={this.state.bioscape.title}
                    modal={false}
                    onClose={() => this.setState({showDescription: !this.state.showDescription})}
                  >
                    <div className="sbinfo-popout-window">
                      <div className="sbinfo-body">{this.state.bioscape.description}</div>
                    </div>
                  </Dialog>
                </div>
              }
            </div>
          </div>
          <SearchBar
            {...this.props}
            enabledLayers={this.state.enabledLayers}>
          </SearchBar>
        </div>
        {this.state.displayHelpPopup && <div className="bap-popup" id="baphHelpPopup">
          <img src={speechBubble} alt="Speech Bubble"></img>
          <div className="bap-popuptext" id="myPopup">Choose an Analysis</div>
        </div>}
        <div className="analysis-area">
          {featureText()}
          <div id='analysis-package-container' className="analysis-package-container">

            {this.state.feature_name && <div className="analysis-available">Analyses available for {this.state.feature_name}</div>}
            {!this.state.feature_name && <div className="analysis-package-text">Analysis Packages {this.state.feature_name}</div>}
            {
              this.props.bioscapeName === 'terrestrial-ecosystems-2011' ?
                <TerrestrialEcosystems2011
                  onRef={(ref: TerrestrialEcosystems2011) => (this.terrestrialRef = ref)}
                  {...this.props}
                  {...this.state}
                  updateAnalysisLayers={this.updateAnalysisLayers}
                />
                :
                <Biogeography
                  onRef={(ref: Biogeography) => (this.biogeographyRef = ref)}
                  {...this.props}
                  {...this.state}
                  updateAnalysisLayers={this.updateAnalysisLayers}
                />
            }
            <div id="d3chartTooltip" className='chartTooltip'></div>
          </div>
        </div>

      </div>
    )
  }
}
export default LeftPanel
