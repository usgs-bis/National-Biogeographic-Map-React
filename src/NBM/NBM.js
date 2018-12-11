import React from 'react'
import { Map, TileLayer, WMSTileLayer, Marker, Popup, GeoJSON } from 'react-leaflet'

import './NBM.css'
import LocationOverlay from './LocationOverylays/LocationOverlay';

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
            basemap: props.basemap
        }

        this.key = 1;

        this.handleClick = this.handleClick.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
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

    handleClick (e) {
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


    render() {
        const geojson = () => {
            if(this.state.feature) {
                return <GeoJSON key={this.key++} data={this.state.feature} />
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
            <Map onClick={this.handleClick} bounds={this.state.bounds} onMouseMove={this.handleMouseMove} onMouseOut={this.handleMouseOut} >
                {basemap()}
                <LocationOverlay mouseLocation={this.state.mouseLocation} />
                <MapMarker point={this.state.point}/>
                {geojson()}
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
