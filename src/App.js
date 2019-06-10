import React from "react";
import NBM from "./NBM/NBM";
import Header from "./Header/Header";
import LeftPanel from "./LeftPanel/LeftPanel";
import nbmBioscape from "./Bioscapes/biogeography.json"
import states from "./states.json"
import nvcsBioscape from "./Bioscapes/terrestrial-ecosystems-2011.json"
import Resizable from 're-resizable';
import cloneLayer from "leaflet-clonelayer"
import L from "leaflet";
import "./App.css";
import * as turf from '@turf/turf'
import packageJson from '../package.json'


const bioscapeMap = {
    "biogeography": nbmBioscape,
    "nbm-react": nbmBioscape,
    "terrestrial-ecosystems-2011": nvcsBioscape
};
const ELEVATION_SOURCE = 'https://nationalmap.gov/epqs/pqs.php?'


const NVCS_FEATURE_LOOKUP = ['Landscape Conservation Cooperatives', 'US County', 'Ecoregion III', 'US States and Territories']

const TEXT_SEARCH_API = process.env.REACT_APP_BIS_API + "/api/v1/places/search/text?q=";
const POINT_SEARCH_API = process.env.REACT_APP_BIS_API + "/api/v1/places/search/point?";
const GET_FEATURE_API = process.env.REACT_APP_BIS_API + "/api/v1/places/search/feature?feature_id=";
const API_VERSION_URL = process.env.REACT_APP_BIS_API + "/api"
const REACT_VERSION = "v" + packageJson.version

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

class App extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            bioscape: bioscapeMap[props.bioscape],
            bioscapeName: props.bioscape,
            results: [],
            feature: null,
            rangeYearMin: 2000,
            rangeYearMax: 2010,
            mapDisplayYear: 2005,
            map: null,
            analysisLayers: null,
            activeLayerTitle: '',
            priorityBap: null,
            APIVersion: '',
            clickDrivenEvent: false

        }
        this.initState = null
        this.parseBioscape = this.parseBioscape.bind(this)
        this.handleSearchBox = this.handleSearchBox.bind(this)
        this.submitHandler = this.submitHandler.bind(this)
        this.handleMapClick = this.handleMapClick.bind(this)
        this.basemapChanged = this.basemapChanged.bind(this)
        this.setYearRange = this.setYearRange.bind(this)
        this.setMapDisplayYear = this.setMapDisplayYear.bind(this)
        this.setMapDisplayYearFade = this.setMapDisplayYearFade.bind(this)
        this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
        this.setMap = this.setMap.bind(this)
        this.getHash = this.getHash.bind(this)
        this.shareState = this.shareState.bind(this)
        this.loadState = this.loadState.bind(this)
        this.handelDrawnPolygon = this.handelDrawnPolygon.bind(this)
        this.overlayChanged = this.overlayChanged.bind(this)
        this.layerTransitionFade = this.layerTransitionFade.bind(this)
        this.parseGeom = this.parseGeom.bind(this)
        this.setPriorityBap = this.setPriorityBap.bind(this)
        this.getElevationFromPoint = this.getElevationFromPoint.bind(this)
        this.countyStateLookup = this.countyStateLookup.bind(this)
        this.getApproxArea = this.getApproxArea.bind(this)
        this.state = this.loadState(this.state)

    }

    componentDidMount() {
        this.parseBioscape()
        document.title = this.state.bioscape.title
        if (this.initState && this.initState.userDefined) {
            this.handelDrawnPolygon(this.initState.userDefined.geom, true)
        }
        else if (this.initState) this.submitHandler(this.initState.feature, true)
        fetch(API_VERSION_URL)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        APIVersion: result.Version
                    })
                },
                (error) => {
                    this.setState({
                        APIVersion: 'UNKNOWN'
                    })
                }
            )
    }

    componentDidUpdate() {
        if (this.state.feature) {
            window.location.hash = this.getHash()
        }
    }

    getHash() {
        let state = {
            feature: { feature_id: this.state.feature.properties.feature_id },
            basemap: this.state.basemap,
            timeSlider: { rangeYearMin: this.state.rangeYearMin, rangeYearMax: this.state.rangeYearMax, mapDisplayYear: this.state.mapDisplayYear },
            bap: { activeLayerTitle: this.state.analysisLayers && this.state.analysisLayers.length ? this.state.analysisLayers[0].title : '', priorityBap: this.state.priorityBap },
            point: { lat: this.state.lat, lng: this.state.lng, elv: this.state.elv }
        }
        if (this.state.feature.properties.userDefined) {
            state.userDefined = { geom: this.state.feature.geometry }
        }
        return Buffer.from(JSON.stringify(state)).toString("base64")
    }

    shareState() {
        if (this.state.feature && !this.state.feature.properties.userDefined) {
            let copyText = document.getElementsByClassName('share-url-input')[0]
            copyText.style.display = 'inline-block'
            copyText.value = window.location
            copyText.select()
            document.execCommand("copy")
            copyText.style.display = 'none'
            return copyText.value
        }
        return window.location.href
    }

    loadState(s) {

        let loc = window.location.href
        let split = loc.split('#')
        if (split.length === 2 && split[1]) {
            this.initState = JSON.parse(atob(split[1]))
            s.basemap = this.initState.basemap
            s.rangeYearMin = this.initState.timeSlider.rangeYearMin
            s.rangeYearMax = this.initState.timeSlider.rangeYearMax
            s.mapDisplayYear = this.initState.timeSlider.mapDisplayYear
            s.priorityBap = this.initState.bap.priorityBap
            s.lat = this.initState.point.lat
            s.lng = this.initState.point.lng
            s.elv = this.initState.point.elv
            s.clickDrivenEvent = this.initState.point.lat ? true : false

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

        if (this.state.lat && this.state.lng) {
            this.handleMapClick({
                latlng: {
                    lat: this.state.lat,
                    lng: this.state.lng
                }
            })
        }
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
        let basemap = this.state.basemap ? this.state.basemap : this.state.bioscape.basemaps.find(function (obj) {
            return obj.selected === true;
        })

        let overlay = null
        if (this.state.bioscape.overlays) {
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
            overlay: overlay
        })

    }

    handelDrawnPolygon(geom, init) {
        if (geom) {
            this.setState({
                feature: {
                    geometry: geom,
                    properties: {
                        approxArea: this.getApproxArea(geom),
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
            if (!init) {
                this.setState({
                    priorityBap: null,
                    analysisLayers: []
                })
            }
        }
        else {
            this.setState({
                feature: null
            })
        }
    }

    // turns geometries into line collections
    // draws lines that cross the 180 on both sides of the map
    // ex 'Alaska' or 'Aleutian and Bering Sea Islands'
    parseGeom(geometry) {
        let polyLineCollection = [];
        let polyLineCollectionOtherWorld = [];
        let edgeOfMap = 10
        let leftEdge = false // close to left edge
        let rightEdge = false // close to right edge

        // convert 
        geometry.coordinates.forEach(feature => {
            feature.forEach(polygon => {
                let lineCoord = {
                    "type": "LineString",
                    "coordinates": []
                }
                let lineCoordCopy = {
                    "type": "LineString",
                    "coordinates": []
                }
                let crossed22 = false
                for (let i = 0; i < polygon.length; i++) {
                    let coordinates = polygon[i]
                    if ((coordinates[0] < -179.99 || coordinates[0] > 179.99) && lineCoord.coordinates.length) {
                        if (lineCoord.coordinates.length > 1) {
                            polyLineCollection.push(lineCoord)
                            if (crossed22) {
                                lineCoordCopy = {
                                    "type": "LineString",
                                    "coordinates": []
                                }
                                // eslint-disable-next-line 
                                lineCoord.coordinates.forEach((coordinates) => {
                                    lineCoordCopy.coordinates.push([coordinates[0] - 360, coordinates[1]])
                                })
                                polyLineCollectionOtherWorld.push(lineCoordCopy)
                            }
                        }
                        lineCoord = {
                            "type": "LineString",
                            "coordinates": []
                        }
                    }
                    if (coordinates[0] > -179.99 && coordinates[0] < 179.99) {
                        lineCoord.coordinates.push(coordinates)
                        if (coordinates[0] > 22.5) crossed22 = true
                        if (coordinates[0] > 180 - edgeOfMap) rightEdge = true
                        if (coordinates[0] < -180 + edgeOfMap) leftEdge = true
                    }
                    else {
                        if (i + 1 < polygon.length && polygon[i + 1][0] > -179.99 && polygon[i + 1][0] < 179.99) {
                            lineCoord.coordinates.push(coordinates)
                        }
                    }

                }

                polyLineCollection.push(lineCoord)
                if (crossed22) {
                    lineCoordCopy = {
                        "type": "LineString",
                        "coordinates": []
                    }
                    lineCoord.coordinates.forEach(coordinates => {
                        lineCoordCopy.coordinates.push([coordinates[0] - 360, coordinates[1]])
                    })
                    polyLineCollectionOtherWorld.push(lineCoordCopy)
                }
            })
        });

        if (rightEdge && leftEdge) { // if its close to both edges draw on both sides of map
            polyLineCollectionOtherWorld.forEach(line => {
                polyLineCollection.push(line)
            })
        }
        let lines = polyLineCollection.map((p) => {
            return p.coordinates
        })
        let result = {
            type: 'MultiLineString',
            coordinates: lines
        }
        return result
    }


    getApproxArea(geom) {
        let approxArea = 'Unknown'
        try {
            let area = 0
            if (geom.type === 'MultiPolygon') {
                for (let poly of geom.coordinates) {
                    area += turf.area(turf.polygon(poly))
                }
            }
            else {
                area = turf.area(turf.polygon(geom.coordinates))
            }
            approxArea = numberWithCommas(parseInt(turf.convertArea(area, 'meters', 'acres')))
        }
        catch (e) {
            console.log(e)
        }
        return approxArea
    }

    submitHandler(feature, init) {
        if (!feature.feature_id) return
        fetch(GET_FEATURE_API + feature.feature_id)
            .then(res => res.json())
            .then(
                (data) => {
                    if (data && data.hits.hits.length && data.hits.hits[0]["_source"]) {
                        let result = data.hits.hits[0]["_source"]
                        result.properties.approxArea = this.getApproxArea(result.geometry)
                        result.geometry = this.parseGeom(result.geometry)
                        result.properties = this.countyStateLookup([result.properties])[0]
                        this.setState({
                            feature: result,
                            mapClicked: false
                        })

                    }
                    else {
                        this.setState({
                            feature: null,
                            mapClicked: false
                        })
                    }
                    if (!init) {
                        this.setState({
                            priorityBap: null,
                            analysisLayers: []
                        })
                    }
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    sendFeatureRequestFromOverlay(results) {
        let overlay = this.state.overlay;
        if (!overlay) {
            //overlay = this.state.bioscape.overlays[0]
            return
        }
        for (let i = 0; i < results.length; i++) {
            let feature = results[i]
            if (feature["feature_class"] === overlay.featureClass) {
                i = results.length
                this.submitHandler({
                    id: feature.feature_id
                })
            }
        }
    }

    handleMapClick(e, ignore) {
        this.getElevationFromPoint(e.latlng.lat, e.latlng.lng)
        fetch(POINT_SEARCH_API + `lat=${e.latlng.lat}&lng=${e.latlng.lng}`)
            .then(res => res.json())
            .then(
                (result) => {
                    if (!result || !result.hits) {
                        return
                    }
                    if (this.state.overlay) {
                        this.sendFeatureRequestFromOverlay(result.hits.hits.map(a => a["_source"]["properties"]))
                        this.setState({
                            lat: e.latlng.lat,
                            lng: e.latlng.lng,
                            clickDrivenEvent: true
                        })
                    }
                    else if (this.state.bioscape.overlays) {
                        let r = result.hits.hits.map(a => a["_source"]["properties"])
                        r = this.countyStateLookup(r)
                        r = r.filter((a) => {
                            return NVCS_FEATURE_LOOKUP.includes(a.feature_class)
                        })
                        this.setState({
                            lat: e.latlng.lat,
                            lng: e.latlng.lng,
                            results: r,
                            mapClicked: !ignore,
                            clickDrivenEvent: true
                        })
                    }
                    else {
                        let r = result.hits.hits.map(a => a["_source"]["properties"])
                        r = this.countyStateLookup(r)
                        this.setState({
                            lat: e.latlng.lat,
                            lng: e.latlng.lng,
                            results: r,
                            mapClicked: !ignore,
                            clickDrivenEvent: true

                        })
                    }
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }


    // given a list of results look up the state if applicable
    countyStateLookup(rlist) {
        return rlist.map(a => {
            if (a.feature_class === 'US County') {
                let stateFips = a.feature_id.substring(15, 17)
                let state = states.find(s => {
                    return s.fips === stateFips
                })
                a.state = state
            }
            return a
        })
    }

    getElevationFromPoint(lat, lng) {

        fetch(`${ELEVATION_SOURCE}x=${lng}&y=${lat}&units=Feet&output=json`)
            .then(res => res.json())
            .then(
                (result) => {
                    let identifiedElevationValue = result.USGS_Elevation_Point_Query_Service
                    let elev = identifiedElevationValue.Elevation_Query.Elevation;
                    elev = elev > -400 ? numberWithCommas(parseInt(elev)) : "No Data"
                    this.setState({
                        elv: elev
                    })
                },
                (error) => {
                    this.setState({
                        error: error
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
                    let r = result.hits.hits.map(a => a["_source"]["properties"])
                    r = this.countyStateLookup(r)
                    if (this.state.bioscape.overlays) {
                        r = r.filter((a) => {
                            return NVCS_FEATURE_LOOKUP.includes(a.feature_class)
                        })
                    }
                    this.setState({
                        results: r,
                        clickDrivenEvent: false
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

    // changes the map display year.
    // unfortunate that we need to use timeouts to acount for rendering time
    // for a smooth transition. on 'load' is network only, not time it takes to paint
    setMapDisplayYearFade(year) {
        this.setState({
            mapDisplayYear: year
        })
        if (this.state.analysisLayers) {
            this.state.analysisLayers.forEach((item) => {
                if (item.timeEnabled) {
                    let currentOpacity = Number(item.layer.options.opacity)
                    let clone = cloneLayer(item.layer);
                    clone.setParams({ time: item.layer.wmsParams.time })
                    clone.setOpacity(0)
                    clone.addTo(this.state.map.leafletElement)
                    // weird case where layer 'lode' doesent fire and clone doesnt get removed. 
                    setTimeout(() => { this.state.map.leafletElement.removeLayer(clone) }, 2000)
                    clone.on('load', (event) => {
                        setTimeout(() => {
                            clone.setOpacity(currentOpacity)
                            item.layer.setOpacity(0)
                            item.layer.setParams({ time: `${year}-01-01` })
                        }, 150)
                        clone.off('load')
                    })
                    item.layer.on('load', (event) => {
                        setTimeout(() => {
                            this.layerTransitionFade(item.layer, clone, currentOpacity)
                        }, 150)
                        item.layer.off('load')
                    })
                }
            })
        }
    }

    // brings layer 1 up and layer 2 down; removes layer 2.
    layerTransitionFade(layer, layer2, targetOpacity) {
        let currentOpacityLayer = Number(layer.options.opacity)
        let currentOpacitylayer2 = Number(layer2.options.opacity)
        let recurse = false

        if (currentOpacitylayer2 > .06) {
            layer2.setOpacity(currentOpacitylayer2 - 0.05);
            recurse = true
        }

        if (currentOpacityLayer < targetOpacity) {
            layer.setOpacity(currentOpacityLayer + 0.05);
            recurse = true
        }
        if (recurse) {
            setTimeout(() => { this.layerTransitionFade(layer, layer2, targetOpacity) }, 50)
        }
        // Idealy we would only remove clone here but about 5% of the time layer 'load' doesnt fire
        // see comment in setMapDisplayYear above
        else {
            this.state.map.leafletElement.removeLayer(layer2)
        }
    }

    updateAnalysisLayers(layers, bapId) {
        this.setState({
            analysisLayers: layers,
            // priorityBap: bapId
        })
    }

    setPriorityBap(bapId) {
        this.setState({
            priorityBap: bapId
        })
    }

    render() {
        return (
            <div className="vwrapper">
                <div id="header-area">
                    <Header title={this.state.bioscape.title} description={this.state.bioscape.description} />
                </div>
                <div id="content-area">
                    <Resizable
                        className="panel-area"
                        enable={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                        defaultSize={{ width: 540 }}
                        minWidth={250}
                        maxWidth={1000}
                        onResizeStop={() => { this.state.map.leafletElement.invalidateSize(); this.setMapDisplayYear(this.state.mapDisplayYear + 1); this.setMapDisplayYear(this.state.mapDisplayYear - 1) }}
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
                            setPriorityBap={this.setPriorityBap}
                            shareState={this.shareState}
                            map={this.state.map}
                            initLayerTitle={((this.initState || {}).bap || {}).activeLayerTitle}
                            priorityBap={this.state.priorityBap}
                            bioscapeName={this.state.bioscapeName}
                            point={{ lat: this.state.lat, lng: this.state.lng, elv: this.state.elv }}
                            overlay={this.state.overlay}
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
                            setMapDisplayYearFade={this.setMapDisplayYearFade}
                            analysisLayers={this.state.analysisLayers}
                            setMap={this.setMap}
                            rangeYearMax={this.state.rangeYearMax}
                            rangeYearMin={this.state.rangeYearMin}
                            mapDisplayYear={this.state.mapDisplayYear}
                            bioscapeName={this.state.bioscapeName}
                            applicationVersion={REACT_VERSION}
                            APIVersion={this.state.APIVersion}
                            priorityBap={this.state.priorityBap}
                            clickDrivenEvent={this.state.clickDrivenEvent}
                            initPoint={(this.initState || {}).point}


                        />
                    </div>
                </div>
            </div>

        );
    }
}
export default App;
