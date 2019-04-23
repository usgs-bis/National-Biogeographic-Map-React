import React from "react";
import "../LeftPanel/LeftPanel.css";
import NVCSHierarchyByPixel from "../AnalysisPackages/NVCSHierarchyByPixel";
import NVCSSummaryByRegion from "../AnalysisPackages/NVCSSummaryByRegion";

class TerrestrialEcosystems2011 extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            results: props.results,
            textSearchHandler: props.textSearchHandler,
            basemapChanged: props.basemapChanged,
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
        if (this.props.feature) {
            return 'bap1'
        }
        else return ""
    }

    render() {
        let counter = 1;
        return (
            <div>
                <div className="nbm-flex-row-no-padding">
                    <NVCSHierarchyByPixel
                        onRef={ref => (this.NVCSHierarchyByPixel = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        point={this.props.point}
                        overlay={this.props.overlay}
                    />
                    <NVCSSummaryByRegion
                        onRef={ref => (this.NVCSSummaryByRegion = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        overlay={this.props.overlay}
                    />
                </div>
            </div>
        );
    }
}
export default TerrestrialEcosystems2011;
