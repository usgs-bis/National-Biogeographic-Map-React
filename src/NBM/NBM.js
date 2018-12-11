import React from 'react'
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'

import './NBM.css'
import LocationOverlay from './LocationOverylays/LocationOverlay';

const usBounds = [[21, -134], [51, -63]]
let lastTimeMouseMoved = new Date().getTime();

class NBM extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            bounds: usBounds,
            point: null,
            mouseLocation: { lat: null, lng: null, elv: null },
            parentClickHandler: props.parentClickHandler,
        }
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.parentClickHandler = this.state.parentClickHandler
    }

    handleClick(e) {
        console.log("Map clicked! We could add the marker here probably, then send the click up to the parent");

        this.setState({
            point: [e.latlng.lat, e.latlng.lng]
        });

        this.parentClickHandler(e)
    };

    handleMouseMove(e) {
        let elv = this.getElevation(e.latlng.lat, e.latlng.lng)
        this.setState({
            mouseLocation: {
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                elv: elv
            }
        });
    }
    handleMouseOut(e) {
        this.setState({
            mouseLocation: {
                lat: null,
                lng: null,
                elv: null
            }
        });
    }

    getElevation(lat, lng) { 
        let currentTime = new Date().getTime();
        if (currentTime - lastTimeMouseMoved >= 500) {
            console.log("would get elv")
            lastTimeMouseMoved = new Date().getTime();
            return 24
        }
        lastTimeMouseMoved = new Date().getTime();
        return null
    }

    render() {
        return (
            <Map onClick={this.handleClick} bounds={this.state.bounds} onMouseMove={this.handleMouseMove} onMouseOut={this.handleMouseOut} >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                />
                <MapMarker point={this.state.point} />
                <LocationOverlay mouseLocation={this.state.mouseLocation} ></LocationOverlay>
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
