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
            defaultMax: props.defaultMax ? props.defaultMax : defaultMax
        }

        this.stopProp = this.stopProp.bind(this)
    }

    stopProp(e) {
        e.stopPropagation();
    }

    render() {
        return (
            <section onClick={this.stopProp} className="range-slider">
                <input
                    onClick={this.stopProp}
                    defaultValue={this.state.rangeVal0}
                    min={this.state.defaultMin}
                    max={this.state.defaultMax}
                    step="1"
                    type="range" />
                <input
                    defaultValue={this.state.defaultDisplay}
                    min={this.state.defaultMin}
                    max={this.state.defaultMax}
                    step="1"
                    type="range" />
                <input
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
