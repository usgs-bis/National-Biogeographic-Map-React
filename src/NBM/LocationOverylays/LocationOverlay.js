import React from "react";
import "./LocationOverlay.css";


let lastTimeMouseMoved = new Date().getTime();

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
        this.setState({
            lat: props.mouseLocation.lat ? parseFloat(props.mouseLocation.lat).toFixed(5).toString() : 'No Data',
            lng: props.mouseLocation.lng ? parseFloat(props.mouseLocation.lng).toFixed(5).toString() : 'No Data'
            // elv: props.mouseLocation.elv ? parseFloat(props.mouseLocation.elv).toString() : 'No Data'
        })
        this.startElevationTimer()
    }

    startElevationTimer() {
        lastTimeMouseMoved = new Date().getTime();

        setTimeout(()=>{
            let currentTime = new Date().getTime();
            if (currentTime - lastTimeMouseMoved >= 500) {
                this.setState({
                    elv: 24
                })
            }
        },500)
        this.setState({
            elv: 'No Data'
        })
    }


    render() {
        return (
            <div className={"location-overlay"}>
                <span>Lat: {this.state.lat},</span>
                <span> Long: {this.state.lng},</span>
                <span> Elev: {this.state.elv}</span>
            </div>
        );
    }


}
export default LocationOverlay;
