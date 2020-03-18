import React from "react";
import NVCSHierarchyByPixel from "../AnalysisPackages/NVCSHierarchyByPixel";
import NVCSSummaryByRegion from "../AnalysisPackages/NVCSSummaryByRegion";

class TerrestrialEcosystems2011 extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            results: props.results,
            textSearchHandler: props.textSearchHandler,
            submitHandler: props.submitHandler,
            layersDropdownOpen: false,
            bioscape: props.bioscape,
            updateAnalysisLayers: props.updateAnalysisLayers,
            loading: false,
            enabledLayers: [],
            basemapTooltipOpen: false

        }
        this.submit = this.submit.bind(this)
        this.share = this.share.bind(this);
        this.report = this.report.bind(this);
        this.getDefaultPriorityBap = this.getDefaultPriorityBap.bind(this);
        this.loaderRef = React.createRef();
    }
    componentDidMount() {
        this.props.onRef(this)
    }

    submit(e) {
        this.state.submitHandler(e)
    }

    share() {
        this.props.shareState()
    }

    report() {

        let charts = []
        charts.push(this.NVCSHierarchyByPixel.print())
        charts.push(this.NVCSSummaryByRegion.print())

        return charts
    }

    // given any feature set the default priority bap
    getDefaultPriorityBap() {
        return ""     // update BCB-1103 "default to no baps open or priority" the folling logic might still be helpful in the future

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
                        onRef={ref => (this.NVCSHierarchyByPixel = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap1`}
                        initBap={(this.props.initBaps || {})['bap1']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                        point={this.props.point}
                        overlay={this.props.overlay}
                    />
                    <NVCSSummaryByRegion
                        onRef={ref => (this.NVCSSummaryByRegion = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap2`}
                        initBap={(this.props.initBaps || {})['bap2']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                        overlay={this.props.overlay}
                    />
                </div>
            </div>
        );
    }
}
export default TerrestrialEcosystems2011;
