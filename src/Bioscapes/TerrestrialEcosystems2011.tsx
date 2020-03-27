import React, {RefObject} from 'react'

import NVCSHierarchyByPixel from '../AnalysisPackages/NVCSHierarchyByPixel'
import NVCSSummaryByRegion from '../AnalysisPackages/NVCSSummaryByRegion'

export interface ITerrestrialEcosystems2011Props {
  point: any,
  submitHandler: Function,
  bioscape: any,
  updateAnalysisLayers: Function,
  shareState: Function,
  setPriorityBap: Function,
  feature: any,
  priorityBap: any,
  initBaps: any,
  setBapState: Function,
  overlay: any,
}

export interface ITerrestrialEcosystems2011State {
  submitHandler: Function,
  layersDropdownOpen: boolean,
  bioscape: any,
  updateAnalysisLayers: Function,
  loading: boolean,
  enabledLayers: any[],
  basemapTooltipOpen: boolean,
}

class TerrestrialEcosystems2011 extends React.Component<ITerrestrialEcosystems2011Props, ITerrestrialEcosystems2011State> {

  loaderRef: RefObject<unknown>
  nvcsHierarchRef: any
  nvcsSummaryRef: any

  constructor(props: ITerrestrialEcosystems2011Props) {
    super(props)
    this.state = {
      submitHandler: props.submitHandler,
      layersDropdownOpen: false,
      bioscape: props.bioscape,
      updateAnalysisLayers: props.updateAnalysisLayers,
      loading: false,
      enabledLayers: [],
      basemapTooltipOpen: false

    }
    this.submit = this.submit.bind(this)
    this.share = this.share.bind(this)
    this.report = this.report.bind(this)
    this.getDefaultPriorityBap = this.getDefaultPriorityBap.bind(this)
    this.loaderRef = React.createRef()
  }

  submit(e: Event) {
    this.state.submitHandler(e)
  }

  share() {
    this.props.shareState()
  }

  report() {

    let charts = []
    charts.push(this.nvcsHierarchRef.print())
    charts.push(this.nvcsSummaryRef.print())

    return charts
  }

  // given any feature set the default priority bap
  getDefaultPriorityBap() {
    return ''     // update BCB-1103 "default to no baps open or priority" the folling logic might still be helpful in the future

    // if (this.props.feature) {
    //     return 'bap1'
    // }
    // else return ""
  }

  render() {
    return (
      <div>
        <div className="nbm-flex-row-no-padding">
          <NVCSHierarchyByPixel
            onRef={(ref: any) => (this.nvcsHierarchRef = ref)}
            updateAnalysisLayers={this.props.updateAnalysisLayers}
            setPriorityBap={this.props.setPriorityBap}
            feature={this.props.feature}
            priorityBap={this.props.priorityBap}
            bapId={'bap1'}
            initBap={(this.props.initBaps || {})['bap1']}
            setBapState={this.props.setBapState}
            point={this.props.point}
            yearMin={2001}
            yearMax={2061}
          />
          <NVCSSummaryByRegion
            point={this.props.point}
            onRef={(ref: any) => (this.nvcsSummaryRef = ref)}
            updateAnalysisLayers={this.props.updateAnalysisLayers}
            setPriorityBap={this.props.setPriorityBap}
            feature={this.props.feature}
            priorityBap={this.props.priorityBap}
            bapId={'bap2'}
            initBap={(this.props.initBaps || {})['bap2']}
            setBapState={this.props.setBapState}
            yearMin={2001}
            yearMax={2061}
          />
        </div>
      </div>
    )
  }
}
export default TerrestrialEcosystems2011
