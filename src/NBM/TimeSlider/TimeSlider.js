import React from "react";
import "./TimeSlider.css";

const defaultMin = 1981
const defaultMax = 2018

const rangeVal0 = 2005
const rangeVal1 = 2015
const defaultDisplay = 2010

class TimeSlider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rangeVal0: props.rangeVal0 ? props.rangeVal0 : rangeVal0,
            rangeVal1: props.rangeVal1 ? props.rangeVal1 : rangeVal1,
            defaultDisplay: props.defaultDisplay ? props.defaultDisplay : defaultDisplay,
            defaultMin: props.defaultMin ? props.defaultMin : defaultMin,
            defaultMax: props.defaultMax ? props.defaultMax : defaultMax,
            updateYearRange: props.updateYearRange,
            updateMapDisplay: props.updateMapDisplay
        }

        this.setMapDisplay = this.setMapDisplay.bind(this)
        this.setYearRange = this.setYearRange.bind(this)
    }

    componentDidMount() {
        this.setMapDisplay()
        this.setYearRange()
    }

    setYearRange() {
        this.state.updateYearRange([this.rangeVal0.value, this.rangeVal1.value].sort())
    }

    setMapDisplay() {
        this.state.updateMapDisplay(this.mapDisplay.value)
    }

    render() {
        return (
            <section className="range-slider">
                <input
                    ref={(input) => { this.rangeVal0 = input; }}
                    onChange={this.setYearRange}
                    defaultValue={this.state.rangeVal0}
                    min={this.state.defaultMin}
                    max={this.state.defaultMax}
                    step="1"
                    type="range" />
                <input className="map-display-slider"
                       ref={(input) => { this.mapDisplay = input; }}
                       onChange={this.setMapDisplay}
                       defaultValue={this.state.defaultDisplay}
                       min={this.state.defaultMin}
                       max={this.state.defaultMax}
                       step="1"
                       type="range" />
                <input
                    ref={(input) => { this.rangeVal1 = input; }}
                    onChange={this.setYearRange}
                    defaultValue={this.state.rangeVal1}
                    min={this.state.defaultMin}
                    max={this.state.defaultMax}
                    step="1"
                    type="range" />
            </section>
        );
    }


}
export default TimeSlider;
