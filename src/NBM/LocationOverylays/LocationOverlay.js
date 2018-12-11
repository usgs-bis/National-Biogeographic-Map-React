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
        }

    }

    componentWillReceiveProps(props) {
        if (props.mouseLocation) {
            this.setState({
                lat: props.mouseLocation.lat ? parseFloat(props.mouseLocation.lat).toFixed(5).toString() : 'No Data',
                lng: props.mouseLocation.lng ? parseFloat(props.mouseLocation.lng).toFixed(5).toString() : 'No Data'
            })
            this.setElevation()
        }
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
            <div className={"location-overlay"}>
                <span><label>Lat:</label>   {this.state.lat},</span>
                <span><label>Long:</label>  {this.state.lng},</span>
                <span><label>Elev:</label>  {this.state.elv}</span>
            </div>
        );
    }


}
export default LocationOverlay;
