import React from "react";
import NBM from "./NBM/NBM";
import Header from "./Header/Header";
import LeftPanel from "./LeftPanel/LeftPanel";
import nbmBioscape from "./Bioscapes/biogeography"
import nvcsBioscape from "./Bioscapes/terrestrial-ecosystems-2011"
import Resizable from 're-resizable';
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
            yearMax: null,
            layerYear: null,
            map: null,
            analysisLayers: null,
            initBap : {}
          
        }

        this.parseBioscape = this.parseBioscape.bind(this)
        this.handleSearchBox = this.handleSearchBox.bind(this)
        this.submitHandler = this.submitHandler.bind(this)
        this.handleMapClick = this.handleMapClick.bind(this)
        this.basemapChanged = this.basemapChanged.bind(this)
        this.updateYearRange = this.updateYearRange.bind(this)
        this.updateMapDisplay = this.updateMapDisplay.bind(this)
        this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
        this.setMap = this.setMap.bind(this)
        this.shareState = this.shareState.bind(this)
        this.loadState = this.loadState.bind(this)
    }

    componentDidMount() {
        this.parseBioscape()
        this.loadState()
    }

    shareState() {

        let state = {
            feature: { id: this.state.feature.properties.feature_id },
            basemap: this.state.basemap,
            timeSlider: { yearMin: this.state.yearMin, yearMax: this.state.yearMax, layerYear: this.state.layerYear },
            bap: { analysisLayer: this.state.analysisLayers.length ? this.state.analysisLayers[0].title : '', priorityBap : this.state.priorityBap }
        }
        let objJsonB64 = Buffer.from(JSON.stringify(state)).toString("base64");
        let copyText = document.getElementsByClassName('share-url-input')[0]
        copyText.style.display = 'inline-block'
        copyText.value = window.location.href.split('#')[0] + '#' + objJsonB64
        copyText.select()
        document.execCommand("copy")
        copyText.style.display = 'none'
    }

    loadState() {
        try {
            let loc = window.location.href
            let split = loc.split('#')
            if (split.length === 2) {
                window.location.hash = ''
                let state = JSON.parse(atob(split[1]))
                this.submitHandler(state.feature)
                this.basemapChanged(state.basemap)
                this.updateYearRange([state.timeSlider.yearMin, state.timeSlider.yearMax])
                this.updateMapDisplay(state.timeSlider.layerYear)
                this.setState({
                    initBap : {
                        priorityBap: state.bap.priorityBap,
                        initLayerTitle: state.bap.analysisLayer
                    }
                })
            }
        }
        catch (e) {

        }
    }

    basemapChanged(e) {
        this.setState({
            basemap: e
        })
    }
    setMap(map) {
        this.setState({
            map: map
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

    updateMapDisplay(year) {
        this.setState({
            layerYear: year
        })
        if (this.state.analysisLayers) {
            this.state.analysisLayers.forEach((item) => {
                if (item.timeEnabled) {
                    item.layer.setParams(
                        {
                            time: `${year}-01-01`
                        }
                    )
                }
            })
        }
    }

    updateAnalysisLayers(layers, bapId) {
        this.setState({
            analysisLayers: layers,
            priorityBap: bapId
        })
    }

    render() {
        return (
            <div className="vwrapper">
                <div id="header-area">
                    <Header title={this.state.bioscape.title} />
                </div>
                <div id="content-area">
                    <Resizable
                        className="panel-area"
                        enable={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                        defaultSize={{ width: 500 }}
                        minWidth={250}
                        maxWidth={1000}
                        onResizeStop={() => { this.state.map.leafletElement.invalidateSize() }}
                    >
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
                            shareState={this.shareState}
                            map={this.state.map}
                            initBap={this.state.initBap}
                        />
                    </Resizable>

                    <div id="map-area">
                        <NBM
                            className="relative-map"
                            basemap={this.state.basemap}
                            feature={this.state.feature}
                            parentClickHandler={this.handleMapClick}
                            updateYearRange={this.updateYearRange}
                            updateMapDisplay={this.updateMapDisplay}
                            analysisLayers={this.state.analysisLayers}
                            setMap={this.setMap}
                            yearMin={this.state.yearMin}
                            yearMax={this.state.yearMax}
                            layerYear={this.state.layerYear}

                        />
                    </div>
                </div>
            </div>

        );
    }
}
export default App;
