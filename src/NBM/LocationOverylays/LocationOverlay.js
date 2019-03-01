import React from "react";
import "./LocationOverlay.css";


let lastTimeMouseMoved = new Date().getTime();
const ELEVATION_SOURCE = 'https://nationalmap.gov/epqs/pqs.php?'

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

class LocationOverlay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lat: null,
            lng: null,
            elv: null,
            leftOffset: '100px'
        }
        this.map = null
        this.updateOffset = this.updateOffset.bind(this)

    }

    componentDidMount() {
        this.props.onRef(this)
    }

    componentWillUnmount(){
        this.map.off('zoomend', this.updateOffset)
    }

    componentDidUpdate() {
        if (!this.map && this.props.map.leafletElement) {
            this.map = this.props.map.leafletElement
            this.updateOffset()
            this.map.on('zoomend', this.updateOffset)
        }
    }

    // Pushes the lat, lng, & elev display left based on leaflet scale position
    updateOffset() {
        let offset = this.state.leftOffset
        const scale = document.getElementsByClassName('leaflet-control-scale leaflet-control')
        if (scale.length) offset = (scale[0].clientWidth + 30).toString() + 'px'
        this.setState({
            leftOffset: offset
        })
    }

    setLocation(lat, lng) {
        this.setState({
            lat: lat ? parseFloat(lat).toFixed(5).toString() : 'No Data',
            lng: lng ? parseFloat(lng).toFixed(5).toString() : 'No Data'
        })
        this.setElevation()
    }

    setElevation() {
        lastTimeMouseMoved = new Date().getTime();

        setTimeout(() => {
            let currentTime = new Date().getTime();
            if (currentTime - lastTimeMouseMoved >= 500 && this.state.lat) {
                fetch(`${ELEVATION_SOURCE}x=${this.state.lng}&y=${this.state.lat}&units=Feet&output=json`)
                    .then(res => res.json())
                    .then(
                        (result) => {
                            let identifiedElevationValue = result.USGS_Elevation_Point_Query_Service
                            let elev = identifiedElevationValue.Elevation_Query.Elevation;
                            elev = elev > -20 ? numberWithCommas(parseInt(elev)) + 'ft' : "No Data"
                            this.setState({
                                elv: elev
                            })
                        },
                        (error) => {
                            this.setState({
                                error
                            });
                        }
                    )

            }
        }, 500)
        this.setState({
            elv: 'No Data'
        })
    }


    render() {

        return (
            <div className={ this.props.bioscapeName !== "terrestrial-ecosystems-2011" ? "location-overlay" : "no-time-slider location-overlay"} style={{ left: this.state.leftOffset }}>
                <span><label>Lat:</label>   {this.state.lat},</span>
                <span><label>Long:</label>  {this.state.lng},</span>
                <span><label>Elev:</label>  {this.state.elv}</span>
            </div>
        );
    }


}
export default LocationOverlay;
