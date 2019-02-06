import React from 'react'
import { Map, TileLayer, WMSTileLayer, Marker, Popup, GeoJSON } from 'react-leaflet'

import './NBM.css'
import LocationOverlay from './LocationOverylays/LocationOverlay';
import TimeSlider from "./TimeSlider/TimeSlider"

let L = require('leaflet');
const BUFFER = .5;

class NBM extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            point:null
        }
        this.bounds = [[21, -134], [51, -63]];
        this.key = 1;
        this.clickable = true
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.disableDragging = this.disableDragging.bind(this);
        this.enableDragging = this.enableDragging.bind(this);
        this.updateMapDisplay = this.updateMapDisplay.bind(this);
        this.updateYearRange = this.updateYearRange.bind(this);
    }

    componentWillReceiveProps(props) {
        if (!props.feature) return;
        let b = L.geoJSON(props.feature).getBounds()
        this.bounds = [
            [b._southWest.lat - BUFFER, b._southWest.lng - BUFFER],
            [b._northEast.lat + BUFFER, b._northEast.lng + BUFFER]
        ]
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

    updateMapDisplay(year) {
        this.props.updateMapDisplay(year);
    }

    updateYearRange(years) {
        this.props.updateYearRange(years);
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
                        updateMapDisplay={this.updateMapDisplay}
                        updateYearRange={this.updateYearRange}
                        yearMax={this.props.yearMax}
                        yearMin={this.props.yearMin}
                        layerYear={this.props.layerYear}
                    />
                </div>
                <div className="attribution" onMouseOver={this.disableDragging} onMouseOut={this.enableDragging}>
                </div>
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
