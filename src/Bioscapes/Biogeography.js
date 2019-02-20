import React from "react";
import "../LeftPanel/LeftPanel.css";
import NFHPAnalysis from "../AnalysisPackages/NFHPAnalysis";
import FirstLeafAnalysis from "../AnalysisPackages/FirstLeafAnalysis";
import FirstBloomAnalysis from "../AnalysisPackages/FirstBloomAnalysis";
import FirstLeafBloomComparisonAnalysis from "../AnalysisPackages/FirstLeafBloomComparisonAnalysis";
import SpeciesProtectionAnalysis from "../AnalysisPackages/SpeciesProtectionAnalysis";
import EcosystemProtectionAnalysis from "../AnalysisPackages/EcosystemProtectionAnalysis";
import PhenologyAnalysis from "../AnalysisPackages/PhenologyAnalysis";
import OBISAnalysis from "../AnalysisPackages/OBISAnalysis";

class Biogeography extends React.Component {
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
        // this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
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
        charts.push(this.FirstLeafAnalysis.print())
        charts.push(this.FirstBloomAnalysis.print())
        charts.push(this.FirstLeafBloomComparisonAnalysis.print())
        charts.push(this.NFHPAnalysis.print())
        charts.push(this.EcosystemProtectionAnalysis.print())
        charts.push(this.SpeciesProtectionAnalysis.print())
        charts.push(this.PhenologyAnalysis.print())
        charts.push(this.OBISAnalysis.print())
        
        return charts
    }

    // updateAnalysisLayers(enabledLayers, bapId) {
    //     this.setState({
    //         enabledLayers: enabledLayers
    //     })
    //
    //     this.props.updateAnalysisLayers(enabledLayers, bapId)
    // }

    render() {
        let counter = 1;
        return (
            <div>
                <div className="nbm-flex-row-no-padding">
                    <FirstLeafAnalysis
                        onRef={ref => (this.FirstLeafAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        feature={this.props.feature}
                        yearMin={this.props.rangeYearMin}
                        yearMax={this.props.rangeYearMax}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <FirstBloomAnalysis
                        onRef={ref => (this.FirstBloomAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        feature={this.props.feature}
                        yearMin={this.props.rangeYearMin}
                        yearMax={this.props.rangeYearMax}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <FirstLeafBloomComparisonAnalysis
                        onRef={ref => (this.FirstLeafBloomComparisonAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        feature={this.props.feature}
                        yearMin={this.props.rangeYearMin}
                        yearMax={this.props.rangeYearMax}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <NFHPAnalysis
                        onRef={ref => (this.NFHPAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <EcosystemProtectionAnalysis
                        onRef={ref => (this.EcosystemProtectionAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <SpeciesProtectionAnalysis
                        onRef={ref => (this.SpeciesProtectionAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <PhenologyAnalysis
                        onRef={ref => (this.PhenologyAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <OBISAnalysis
                        onRef={ref => (this.OBISAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap${counter++}`}
                        initLayerTitle={this.props.initLayerTitle}
                    />
                </div>
            </div>
        );
    }
}
export default Biogeography;
