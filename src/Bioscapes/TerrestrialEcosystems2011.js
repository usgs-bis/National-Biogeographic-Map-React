import React from "react";
import "../LeftPanel/LeftPanel.css";
import NFHPAnalysis from "../AnalysisPackages/NFHPAnalysis";
import SpeciesProtectionAnalysis from "../AnalysisPackages/SpeciesProtectionAnalysis";
import EcosystemProtectionAnalysis from "../AnalysisPackages/EcosystemProtectionAnalysis";

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
        // this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
        this.loaderRef = React.createRef();
    }

    submit(e) {
        this.state.submitHandler(e)
    }

    share() {
        this.props.shareState()
    }

    report() {
        this.setState({
            loading: true
        })

        let charts = []
        charts.push(this.FirstLeafAnalysis.print())
        charts.push(this.FirstBloomAnalysis.print())
        charts.push(this.FirstLeafBloomComparisonAnalysis.print())
        charts.push(this.NFHPAnalysis.print())
        charts.push(this.EcosystemProtectionAnalysis.print())
        charts.push(this.SpeciesProtectionAnalysis.print())
        charts.push(this.PhenologyAnalysis.print())
        charts.push(this.OBISAnalysis.print())
        this.PDFReport.generateReport(this.state.feature_name, this.state.feature_class, this.props.map, charts)
            .then(() => {
                setTimeout(() => {
                    this.setState({
                        loading: false
                    })
                }, 3000);
            })
    }

    render() {
        let counter = 1;
        return (
            <div>
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
            </div>
        );
    }
}
export default TerrestrialEcosystems2011;
