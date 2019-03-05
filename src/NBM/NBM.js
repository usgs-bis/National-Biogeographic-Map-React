import React from 'react'
import { Map, TileLayer, WMSTileLayer, Marker, Popup, GeoJSON, FeatureGroup } from 'react-leaflet'
import CustomDialog from "../CustomDialog/CustomDialog";
import './NBM.css'
import LocationOverlay from './LocationOverylays/LocationOverlay';
import TimeSlider from "./TimeSlider/TimeSlider"
import { EditControl } from "react-leaflet-draw"
import L from 'leaflet';
import { Glyphicon } from "react-bootstrap";



const BUFFER = .5;

class NBM extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            point: null,
            attributionOpen: false
        }
        this.drawnpolygon = null
        this.bounds = [[21, -134], [51, -63]];
        this.key = 1;
        this.clickable = true
        this.handleClick = this.handleClick.bind(this)
        this.handleMouseMove = this.handleMouseMove.bind(this)
        this.handleMouseOut = this.handleMouseOut.bind(this)
        this.disableDragging = this.disableDragging.bind(this)
        this.enableDragging = this.enableDragging.bind(this)
        this.userDrawnPolygonStop = this.userDrawnPolygonStop.bind(this)
        this.userDrawnPolygonStart = this.userDrawnPolygonStart.bind(this)
    }


    componentWillReceiveProps(props) {
        if (props.feature && props.feature.properties) {
            let b = L.geoJSON(props.feature).getBounds()
            this.bounds = [
                [b._southWest.lat - BUFFER, b._southWest.lng - BUFFER],
                [b._northEast.lat + BUFFER, b._northEast.lng + BUFFER]
            ]
        }
    }

    componentDidMount() {
        setTimeout(() => {
            this.refs.map.leafletElement.invalidateSize()
            this.refs.map.leafletElement.fitBounds(this.bounds)
            L.control.scale({ metric: false, imperial: true, position: 'bottomleft' }).addTo(this.refs.map.leafletElement)
            this.refs.map.leafletElement.removeControl(this.refs.map.leafletElement.attributionControl);
        }, 250)

        this.props.setMap(this.refs.map)

    }

    componentDidUpdate(prevProps) {
        let that = this;
        if (prevProps.analysisLayers !== this.props.analysisLayers) {
            let currentLayers = this.props.analysisLayers ? this.props.analysisLayers : []
            let oldLayers = prevProps.analysisLayers ? prevProps.analysisLayers : []

            oldLayers.forEach(function (item) {
                if (currentLayers.indexOf(item) === -1) {
                    that.refs.map.leafletElement.removeLayer(item.layer)
                }
            })

            currentLayers.forEach(function (item) {
                if (oldLayers.indexOf(item) === -1) {
                    that.refs.map.leafletElement.addLayer(item.layer)
                    if (item.timeEnabled) {
                        item.layer.setParams(
                            {
                                time: `${that.props.mapDisplayYear}-01-01`
                            }
                        )
                    }

                }
            })
        }
        if (prevProps.overlay !== this.props.overlay) {
            if (prevProps.overlay) {
                this.refs.map.leafletElement.removeLayer(prevProps.overlay.layer)
            }
            if (this.props.overlay) {
                this.refs.map.leafletElement.addLayer(this.props.overlay.layer)
            }
        }
    }

    handleClick(e) {
        if (!this.clickable) return
        this.setState({
            point: [e.latlng.lat, e.latlng.lng]
        });

        if (this.drawnpolygon) {
            this.refs.map.leafletElement.removeLayer(this.drawnpolygon)
            this.drawnpolygon = null
        }
        this.props.parentClickHandler(e)
    };

    handleMouseMove(e) {
        if (!this.clickable) {
            this.LocationOverlay.setLocation(null, null)
        }
        else {
            this.LocationOverlay.setLocation(e.latlng.lat, e.latlng.lng)
        }
    }
    handleMouseOut(e) {
        this.LocationOverlay.setLocation(null, null)
    }

    disableDragging() {
        this.clickable = false
        this.refs.map.leafletElement.dragging.disable();
    }

    enableDragging() {
        this.clickable = true
        this.refs.map.leafletElement.dragging.enable();
    }

    userDrawnPolygonStop(e) {
        this.drawnpolygon = e.layer
        let geom = this.drawnpolygon.toGeoJSON().geometry
        geom.crs = { type: "name", properties: { name: "EPSG:4326" } }
        this.props.parentDrawHandler(geom)
    }

    userDrawnPolygonStart(e) {
        this.setState({
            point: null
        });
        this.props.parentDrawHandler(null)
        if (this.drawnpolygon) {
            this.refs.map.leafletElement.removeLayer(this.drawnpolygon)
            this.drawnpolygon = null
        }
        this.disableDragging()
    }

    render() {
        const geojson = () => {
            if (this.props.feature) {
                return (
                    <div>
                        <GeoJSON style={{ color: "black", fill: false, weight: 4 }} key={this.key++} data={this.props.feature} />
                        <GeoJSON style={{ color: "red", fill: false, weight: 2 }} key={this.key++} data={this.props.feature} />
                    </div>
                )
            }
        };
        const basemap = () => {
            if (this.props.basemap) {
                if (this.props.basemap.type === "TileLayer") {
                    return <TileLayer url={this.props.basemap.serviceUrl} />
                } else if (this.props.basemap.type === "WMSTileLayer") {
                    return <WMSTileLayer
                        url={this.props.basemap.serviceUrl}
                        format={this.props.basemap.leafletProperties.format}
                        layers={this.props.basemap.leafletProperties.layers}
                    />
                }
            }
        }

        const attribution = () => {

            if (!this.state.attributionOpen) return
            return (

                <CustomDialog
                    className="sbinfo-popout-window"
                    isResizable={true}
                    isDraggable={true}
                    title={'Attributions'}
                    modal={false}
                    onClose={() => {
                        this.setState({
                            attributionOpen: false
                        })
                    }}
                    body={
                        <div>

                            <div className="attrDiv">
                                <strong>Mapping API: </strong>
                                <a href="http://leafletjs.com" title="A JS library for interactive maps">{'Leaflet '}</a>
                                powered by
                                    <a href="https://www.esri.com">{` Esri`}</a>.
                                </div>
                            <div className="attrDiv">
                                <strong>Black & white tiles: </strong>
                                <a href="http://stamen.com" >Stamen Design</a>, under
                                    <a href="http://creativecommons.org/licenses/by/3.0" >CC BY 3.0</a>. Data by
                                    <a href="http://openstreetmap.org" >{` OpenStreetMap`}</a>, under
                                    <a href="http://www.openstreetmap.org/copyright" >{` ODbL`}</a>.
                                </div>
                            <div className="attrDiv">
                                <strong>Satellite tiles: </strong>
                                <a href="https://www.mapbox.com/about/maps/" >Mapbox</a>. Data by
                                    <a href="http://openstreetmap.org" >{` OpenStreetMap`}</a>, under
                                    <a href="http://www.openstreetmap.org/copyright" >{` ODbL`}</a>.
                                </div>
                            <div className="attrDiv">
                                <strong>Biogeography interface </strong>heavily influenced by: UW-Macrostrat project
                                    <a href="https://github.com/UW-Macrostrat/gmna-app" >{` on Github`}</a>.
                                </div>
                            <div className="attrDiv">
                                <strong>NatureServe Species Data: </strong>Natureserve. 2008. NatureServe Web Service. Arlington, VA. U.S.A.
                                Available
                                    <a href="http://services.natureserve.org" >{` http://services.natureserve.org`}</a>.
                                </div>
                            <div className="attrDiv">
                                <div className="popup-footer-bar">
                                    <ul>
                                        <li>
                                            <a href="https://www2.usgs.gov/laws/accessibility.html" >Accessibility</a>
                                        </li>
                                        <li>
                                            <a href="https://www2.usgs.gov/foia/" >FOIA</a>
                                        </li>
                                        <li>
                                            <a href="https://www2.usgs.gov/laws/privacy.html" >Privacy</a>
                                        </li>
                                        <li>
                                            <a href="https://www2.usgs.gov/laws/policies_notices.html" >Policies and Notices</a>
                                        </li>
                                    </ul>
                                </div>
                                <div id="footer-text">
                                    <a href="https://www.doi.gov/" >U.S. Department of the Interior</a> |
                                        <a href="https://www.usgs.gov/" >{` U.S. Geological Survey`}</a>
                                    <div>Contact Information:
                                                <a href="mailto:bcb@usgs.gov" >bcb@usgs.gov</a>
                                    </div>
                                    <div>Application Version:
                                            <span id="frontEndVersion"> {this.props.applicationVersion}</span>
                                    </div>
                                    <div>API Version:
                                            <span id="apiVersion"> {this.props.APIVersion}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                />
            )


        }
        return (
            <Map ref={"map"}
                onClick={this.handleClick}
                bounds={this.bounds}
                onMouseMove={this.handleMouseMove}
                onMouseOut={this.handleMouseOut}
                attribution="" >
                {basemap()}
                <LocationOverlay onRef={ref => (this.LocationOverlay = ref)} map={this.refs.map} bioscapeName={this.props.bioscapeName} />
                <MapMarker point={this.state.point} />
                {geojson()}
                <div className="global-time-slider" onMouseOver={this.disableDragging} onMouseOut={this.enableDragging}>
                    {this.props.bioscapeName !== "terrestrial-ecosystems-2011" && <TimeSlider
                        setMapDisplayYear={this.props.setMapDisplayYear}
                        setMapDisplayYearFade={this.props.setMapDisplayYearFade}
                        setYearRange={this.props.setYearRange}
                        rangeYearMax={this.props.rangeYearMax}
                        rangeYearMin={this.props.rangeYearMin}
                        mapDisplayYear={this.props.mapDisplayYear}
                    />}
                </div>
                <div className="attribution" onClick={() => { this.setState({ attributionOpen: !this.state.attributionOpen }) }} onMouseOver={this.disableDragging} onMouseOut={this.enableDragging}>
                    <span className="attribution-info" style={{color: 'rgb(107, 153, 197)'}}><Glyphicon glyph="info-sign" /></span>
                </div>
                <span onMouseOver={this.disableDragging} onMouseOut={this.enableDragging} >{attribution()}</span>
                <FeatureGroup>
                    <EditControl
                        position='topright'
                        onDeleted={() => { this.props.parentDrawHandler(null) }}
                        onDrawStart={this.userDrawnPolygonStart}
                        // onEditStart={this.disableDragging}
                        // onEdited={this.userDrawnPolygon}
                        //onEditStop={this.enableDragging}

                        onDeleteStart={this.userDrawnPolygonStart}
                        onDrawStop={this.enableDragging}
                        onDeleteStop={this.enableDragging}
                        onCreated={this.userDrawnPolygonStop}
                        edit={{ edit: false }}
                        draw={{
                            rectangle: false,
                            marker: false,
                            circlemarker: false,
                            polyline: false,
                            circle: false
                        }}
                    />
                </FeatureGroup>
            </Map>
        );
    }
}

function MapMarker(props) {
    if (props.point) {
        return <Marker position={props.point} name={'mapClickedMarker'}>
            <Popup>
                Area of Interest.
            </Popup>
        </Marker>
    } else {
        return <div></div>
    }
}

export default NBM;
