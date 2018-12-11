import React from 'react'
import { Map, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet'

import './NBM.css'

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
            bounds: US_BOUNDS
        }

        this.key = 1;

        this.handleClick = this.handleClick.bind(this);
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

    render() {
        const geojson = () => {
            if(this.state.feature) {
                return <GeoJSON key={this.key++} data={this.state.feature} />
            }
        };
        return (
            <Map onClick={this.handleClick} bounds={this.state.bounds}>
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url='https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'
                />
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
                A pretty CSS3 popup. <br/> Easily customizable.
            </Popup>
        </Marker>
    } else {
        return <div></div>
    }
}

export default NBM;
