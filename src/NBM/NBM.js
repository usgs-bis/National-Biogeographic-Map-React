import React from 'react'
import { Map, TileLayer, WMSTileLayer, Marker, Popup, GeoJSON } from 'react-leaflet'

import './NBM.css'
import LocationOverlay from './LocationOverylays/LocationOverlay';
import TimeSlider from "./TimeSlider/TimeSlider"

let L = require('leaflet');
const US_BOUNDS = [[21, -134], [51, -63]];
const BUFFER = .5;

class NBM extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            point: null,
            parentClickHandler: props.parentClickHandler,
            feature: props.feature,
            bounds: US_BOUNDS,
            basemap: props.basemap,
            clickable: true,
            mapDisplay: null,
            updateYearRange: props.updateYearRange,
            setMap: props.setMap

        }

        this.key = 1;

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
        this.setState({
            feature: props.feature,
            bounds: [
                [b._southWest.lat - BUFFER, b._southWest.lng - BUFFER],
                [b._northEast.lat + BUFFER, b._northEast.lng + BUFFER]
            ]
        })
    }

    componentDidMount(){
        this.state.setMap(this.refs.map)
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
                                time: `${that.state.mapDisplay}-01-01`
                            }
                        )
                    }
                }
            })
        }
    }

    handleClick (e) {
        if (!this.state.clickable) return
        this.setState({
            point: [e.latlng.lat, e.latlng.lng]
        });

        this.state.parentClickHandler(e)
    };

    handleMouseMove(e) {
        this.setState({
            mouseLocation: {
                lat: e.latlng.lat,
                lng: e.latlng.lng
            }
        });
    }
    handleMouseOut(e) {
        this.setState({
            mouseLocation: {
                lat: null,
                lng: null
            }
        });
    }

    disableDragging() {
        this.setState({
            clickable: false
        })
        this.refs.map.leafletElement.dragging.disable();
    }

    enableDragging() {
        this.setState({
            clickable: true
        })
        this.refs.map.leafletElement.dragging.enable();
    }

    updateMapDisplay(year) {
        this.setState({
            mapDisplay: year
        });

        if (this.props.analysisLayers) {
            this.props.analysisLayers.forEach(function (item) {
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

    updateYearRange(years) {
        this.state.updateYearRange(years);
    }

    render() {
        const geojson = () => {
            if(this.state.feature) {
                return (
                    <div>
                        <GeoJSON style={{color: "black", fill: false, weight: 4}} key={this.key++} data={this.state.feature} />
                        <GeoJSON style={{color: "red", fill: false, weight: 2}} key={this.key++} data={this.state.feature} />
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
                 bounds={this.state.bounds}
                 onMouseMove={this.handleMouseMove}
                 onMouseOut={this.handleMouseOut} >
                {basemap()}
                <LocationOverlay mouseLocation={this.state.mouseLocation} />
                <MapMarker point={this.state.point}/>
                {geojson()}
                <div className="global-time-slider" onMouseOver={this.disableDragging} onMouseOut={this.enableDragging}>
                    <TimeSlider
                        updateMapDisplay={this.updateMapDisplay}
                        updateYearRange={this.updateYearRange}
                    />
                </div>
            </Map>
        );
    }
}

function MapMarker(props) {
    if (props.point) {
        return <Marker position={props.point}>
            <Popup>
                A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
        </Marker>
    } else {
        return <div></div>
    }
}

export default NBM;
