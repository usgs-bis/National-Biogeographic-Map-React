import React from 'react'
import { Map, TileLayer, WMSTileLayer, Marker, Popup, GeoJSON, FeatureGroup } from 'react-leaflet'
import './NBM.css'
import LocationOverlay from './LocationOverylays/LocationOverlay';
import TimeSlider from "./TimeSlider/TimeSlider"
import { EditControl } from "react-leaflet-draw"
import L from 'leaflet';


const BUFFER = .5;

class NBM extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            point: null,
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
                }
            })
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
        return (
            <Map ref={"map"}
                onClick={this.handleClick}
                bounds={this.bounds}
                onMouseMove={this.handleMouseMove}
                onMouseOut={this.handleMouseOut} >
                {basemap()}
                <LocationOverlay onRef={ref => (this.LocationOverlay = ref)} />
                <MapMarker point={this.state.point} />
                {geojson()}
                <div className="global-time-slider" onMouseOver={this.disableDragging} onMouseOut={this.enableDragging}>
                    <TimeSlider
                        setMapDisplayYear={this.props.setMapDisplayYear}
                        setYearRange={this.props.setYearRange}
                        rangeYearMax={this.props.rangeYearMax}
                        rangeYearMin={this.props.rangeYearMin}
                        mapDisplayYear={this.props.mapDisplayYear}
                    />
                </div>
                <div className="attribution" onMouseOver={this.disableDragging} onMouseOut={this.enableDragging}>
                </div>
                <FeatureGroup>
                    <EditControl
                        position='topright'
                        onDeleted={this._onDeleted}
                        onDrawStart={this.userDrawnPolygonStart}
                        // onEditStart={this.disableDragging}
                        // onEdited={this.userDrawnPolygon}
                        onDeleteStart={this.userDrawnPolygonStart}
                        onDrawStop={this.enableDragging}
                        onEditStop={this.enableDragging}
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
