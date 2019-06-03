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
import BadNeighborAnalysis from "../AnalysisPackages/BadNeighborAnalysis";
const ENV = process.env.REACT_APP_ENV;

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
        charts.push(this.FirstLeafAnalysis.print())
        charts.push(this.FirstBloomAnalysis.print())
        charts.push(this.FirstLeafBloomComparisonAnalysis.print())
        charts.push(this.NFHPAnalysis.print())
        charts.push(this.EcosystemProtectionAnalysis.print())
        charts.push(this.SpeciesProtectionAnalysis.print())
        charts.push(this.PhenologyAnalysis.print())
        charts.push(this.OBISAnalysis.print())
        charts.push(this.BadNeighborAnalysis.print())


        return charts
    }


    // given any feature set the default priority bap
    getDefaultPriorityBap() {
        return ""     // update BCB-1103 "default to no baps open or priority" the folling logic might still be helpful in the future
        // if (this.props.feature) {
        //     if (this.props.feature.properties.feature_id.includes('OBIS_Areas')) {
        //         return 'bap8'
        //     }
        //     else {
        //         return 'bap1'
        //     }
        // }
        // else return ""
    }



    render() {
        return (
            <div>
                <div className="nbm-flex-row-no-padding">
                    <FirstLeafAnalysis
                        onRef={ref => (this.FirstLeafAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        yearMin={this.props.rangeYearMin}
                        yearMax={this.props.rangeYearMax}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap1`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <FirstBloomAnalysis
                        onRef={ref => (this.FirstBloomAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        yearMin={this.props.rangeYearMin}
                        yearMax={this.props.rangeYearMax}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap2`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <FirstLeafBloomComparisonAnalysis
                        onRef={ref => (this.FirstLeafBloomComparisonAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        yearMin={this.props.rangeYearMin}
                        yearMax={this.props.rangeYearMax}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap3`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <NFHPAnalysis
                        onRef={ref => (this.NFHPAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap4`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <EcosystemProtectionAnalysis
                        onRef={ref => (this.EcosystemProtectionAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap5`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <SpeciesProtectionAnalysis
                        onRef={ref => (this.SpeciesProtectionAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap6`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <PhenologyAnalysis
                        onRef={ref => (this.PhenologyAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap7`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <OBISAnalysis
                        onRef={ref => (this.OBISAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap8`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                    />
                </div>
                { (!ENV || ENV === 'prod') && <div className="nbm-flex-row-no-padding">
                    <BadNeighborAnalysis
                        onRef={ref => (this.BadNeighborAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={`bap9`}
                        initLayerTitle={this.props.initLayerTitle}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                    />
                </div> }
            </div>
        );
    }
}
export default Biogeography;
