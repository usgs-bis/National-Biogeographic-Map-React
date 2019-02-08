import React from "react";
import NBM from "./NBM/NBM";
import Header from "./Header/Header";
import LeftPanel from "./LeftPanel/LeftPanel";
import nbmBioscape from "./Bioscapes/biogeography"
import nvcsBioscape from "./Bioscapes/terrestrial-ecosystems-2011"
import Resizable from 're-resizable';
import L from "leaflet";
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
            rangeYearMin: 2000,
            rangeYearMax: 2010,
            mapDisplayYear: 2005,
            map: null,
            analysisLayers: null,
            activeLayerTitle: '',
            priorityBap: null,

        }
        this.initFeatureId = null;
        this.initLayerTitle = null
        this.parseBioscape = this.parseBioscape.bind(this)
        this.handleSearchBox = this.handleSearchBox.bind(this)
        this.submitHandler = this.submitHandler.bind(this)
        this.handleMapClick = this.handleMapClick.bind(this)
        this.basemapChanged = this.basemapChanged.bind(this)
        this.setYearRange = this.setYearRange.bind(this)
        this.setMapDisplayYear = this.setMapDisplayYear.bind(this)
        this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
        this.setMap = this.setMap.bind(this)
        this.shareState = this.shareState.bind(this)
        this.loadState = this.loadState.bind(this)
        this.handelDrawnPolygon = this.handelDrawnPolygon.bind(this)
        this.overlayChanged = this.overlayChanged.bind(this)
        this.state = this.loadState(this.state)

    }

    componentDidMount() {
        this.parseBioscape()
        if (this.initFeatureId) this.submitHandler(this.initFeatureId)
    }

    shareState() {

        let state = {
            feature: { id: this.state.feature.properties.feature_id },
            basemap: this.state.basemap,
            timeSlider: { rangeYearMin: this.state.rangeYearMin, rangeYearMax: this.state.rangeYearMax, mapDisplayYear: this.state.mapDisplayYear },
            bap: { activeLayerTitle: this.state.analysisLayers && this.state.analysisLayers.length ? this.state.analysisLayers[0].title : '', priorityBap: this.state.priorityBap }
        }
        let objJsonB64 = Buffer.from(JSON.stringify(state)).toString("base64");
        let copyText = document.getElementsByClassName('share-url-input')[0]
        copyText.style.display = 'inline-block'
        copyText.value = window.location.href.split('#')[0] + '#' + objJsonB64
        copyText.select()
        document.execCommand("copy")
        copyText.style.display = 'none'
    }

    loadState(s) {

        let loc = window.location.href
        let split = loc.split('#')
        if (split.length === 2 && split[1]) {
            window.location.hash = ''
            let initState = JSON.parse(atob(split[1]))
            this.initFeatureId = initState.feature
            this.initLayerTitle = initState.bap.activeLayerTitle
            s.basemap = initState.basemap
            s.rangeYearMin = initState.timeSlider.rangeYearMin
            s.rangeYearMax = initState.timeSlider.rangeYearMax
            s.mapDisplayYear = initState.timeSlider.mapDisplayYear
            s.priorityBap = initState.bap.priorityBap
            return s
        }
        return s
    }



    basemapChanged(e) {
        this.setState({
            basemap: e
        })
    }

    overlayChanged(e) {
        this.setState({
            overlay: e
        })
    }

    setMap(map) {
        map.leafletElement.createPane('summarizationPane');
        map.leafletElement.getPane('summarizationPane').style.zIndex = 402;
        map.leafletElement.getPane('overlayPane').style.zIndex = 403;
        this.setState({
            map: map
        })
    }

    parseBioscape() {
        let basemap = this.state.bioscape.basemaps.find(function (obj) {
            return obj.selected === true;
        })

        let overlays = null
        let overlay = null
        if (this.state.bioscape.overlays) {
            overlays = []
            for (let i = 0; i < this.state.bioscape.overlays.length; i++) {
                let overlay = this.state.bioscape.overlays[i]
                overlay["layer"] = L.tileLayer.wms(
                    this.state.bioscape.overlays[i]["serviceUrl"],
                    this.state.bioscape.overlays[i]["leafletProperties"]
                )
            }

            overlay = this.state.bioscape.overlays.find(function (obj) {
                return obj.selected === true;
            })
        }

        this.setState({
            basemap: basemap,
            overlays: overlays,
            overlay: overlay
        })

    }

    handelDrawnPolygon(geom) {
        if (geom) { 
            this.setState({
                feature: {
                    geometry: geom,
                    properties: {
                        userDefined: true,
                        feature_class: "Polygon",
                        gid: null,
                        feature_name: "User Defined Polygon",
                        feature_code: null,
                        feature_id: Math.random().toString(36).substring(7),
                        feature_description: 'User Defined Polygon',
                    },
                    type: "Feature"
                }
            })
        }
        else {
            this.setState({
                feature: null
            })
        }
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

    setYearRange(years) {
        this.setState({
            rangeYearMin: years[0],
            rangeYearMax: years[1]
        })
    }

    setMapDisplayYear(year) {
        this.setState({
            mapDisplayYear: year
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
                            overlayChanged={this.overlayChanged}
                            basemapChanged={this.basemapChanged}
                            bioscape={this.state.bioscape}
                            results={this.state.results}
                            textSearchHandler={this.handleSearchBox}
                            submitHandler={this.submitHandler}
                            feature={this.state.feature}
                            mapClicked={this.state.mapClicked}
                            rangeYearMin={this.state.rangeYearMin}
                            rangeYearMax={this.state.rangeYearMax}
                            updateAnalysisLayers={this.updateAnalysisLayers}
                            shareState={this.shareState}
                            map={this.state.map}
                            initLayerTitle={this.initLayerTitle}
                            priorityBap={this.state.priorityBap}

                        />
                    </Resizable>

                    <div id="map-area">
                        <NBM
                            className="relative-map"
                            basemap={this.state.basemap}
                            overlay={this.state.overlay}
                            feature={this.state.feature}
                            parentClickHandler={this.handleMapClick}
                            parentDrawHandler={this.handelDrawnPolygon}
                            setYearRange={this.setYearRange}
                            setMapDisplayYear={this.setMapDisplayYear}
                            analysisLayers={this.state.analysisLayers}
                            setMap={this.setMap}
                            rangeYearMax={this.state.rangeYearMax}
                            rangeYearMin={this.state.rangeYearMin}
                            mapDisplayYear={this.state.mapDisplayYear}

                        />
                    </div>
                </div>
            </div>

        );
    }
}
export default App;
