import React from "react";
import NBM from "./NBM/NBM";
import Header from "./Header/Header";
import LeftPanel from "./LeftPanel/LeftPanel";
import nbmBioscape from "./Bioscapes/biogeography"
import nvcsBioscape from "./Bioscapes/terrestrial-ecosystems-2011"
import "./App.css";

const bioscapeMap = {
    "biogeography": nbmBioscape,
    "nbm-react": nbmBioscape,
    "terrestrial-ecosystems-2011": nvcsBioscape
};


const TEXT_SEARCH_API = process.env.REACT_APP_BIS_API + "/api/v1/places/search/text?q=";
const POINT_SEARCH_API = process.env.REACT_APP_BIS_API + "/api/v1/places/search/point?";
const GET_FEATURE_API = process.env.REACT_APP_BIS_API + "/api/v1/places/search/feature?feature_id=";

class App extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            bioscape: bioscapeMap[props.bioscape],
            results: [],
            feature: null,
            yearMin: null,
            yearMax: null
        }

        this.parseBioscape = this.parseBioscape.bind(this);
        this.handleSearchBox = this.handleSearchBox.bind(this)
        this.submitHandler = this.submitHandler.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);
        this.basemapChanged = this.basemapChanged.bind(this);
        this.updateYearRange = this.updateYearRange.bind(this);
        this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
    }

    componentDidMount() {
        this.parseBioscape()
    }

    basemapChanged(e) {
        this.setState({
            basemap: e
        })
    }

    parseBioscape() {
        let basemap = this.state.bioscape.basemaps.find(function (obj) {
            return obj.selected === true;
        })

        this.setState({
            basemap: basemap
        })
    }

    submitHandler(e) {
        fetch(GET_FEATURE_API + e.id)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        feature: result.hits.hits[0]["_source"],
                        mapClicked: false
                    })
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    handleMapClick(e) {
        fetch(POINT_SEARCH_API + `lat=${e.latlng.lat}&lng=${e.latlng.lng}`)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        results: result.hits.hits.map(a => a["_source"]["properties"]),
                        mapClicked: true
                    })
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    handleSearchBox(text) {
        if (text.length < 5) {
            this.setState({
                results: []
            });
            return;
        }
        fetch(TEXT_SEARCH_API + text)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        results: result.hits.hits.map(a => a["_source"]["properties"])
                    })
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    updateYearRange(years) {
        this.setState({
            yearMin: years[0],
            yearMax: years[1]
        })
    }

    updateAnalysisLayers(layers) {
        this.setState({
            analysisLayers: layers
        })
    }

    render() {
        return (
            <div className="vwrapper">
                <div id="header-area">
                    <Header title={this.state.bioscape.title} />
                </div>
                <div id="content-area">
                   
                    <div id="panel-area" className="panel-area">
                        <LeftPanel
                            basemapChanged={this.basemapChanged}
                            bioscape={this.state.bioscape}
                            results={this.state.results}
                            textSearchHandler={this.handleSearchBox}
                            submitHandler={this.submitHandler}
                            feature={this.state.feature}
                            mapClicked={this.state.mapClicked}
                            yearMin={this.state.yearMin}
                            yearMax={this.state.yearMax}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                        />
                    </div>
                  
                    
                    <div id="map-area">
                        <NBM
                            className="relative-map"
                            basemap={this.state.basemap}
                            feature={this.state.feature}
                            parentClickHandler={this.handleMapClick}
                            updateYearRange={this.updateYearRange}
                            analysisLayers={this.state.analysisLayers}
                        />
                    </div>
                </div>
            </div>

        );
    }
}
export default App;
