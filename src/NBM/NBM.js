import React from 'react'
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'

import './NBM.css'

const usBounds = [[21, -134], [51, -63]]

class NBM extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            bounds: usBounds,
            point: null,
            parentClickHandler: props.parentClickHandler
        }

        this.handleClick = this.handleClick.bind(this);
        this.parentClickHandler = this.state.parentClickHandler
    }

    handleClick (e) {
        console.log("Map clicked! We could add the marker here probably, then send the click up to the parent");

        this.setState({
            point: [e.latlng.lat, e.latlng.lng]
        });

        this.parentClickHandler(e)
    };

    render() {
        return (
            <Map onClick={this.handleClick} bounds={this.state.bounds}>
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                />
                <MapMarker point={this.state.point}/>
            </Map>
        );
    }
}

function MapMarker(props) {
    if (props.point) {
        return <Marker position={props.point}>
            <Popup>
                A pretty CSS3 popup. <br/> Easily customizable.
            </Popup>
        </Marker>
    } else {
        return <div></div>
    }
}

export default NBM;
