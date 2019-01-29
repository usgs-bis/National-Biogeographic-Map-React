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
            updateMapDisplay: props.updateMapDisplay,
            range:[props.rangeVal0 ? props.rangeVal0 : rangeVal0,props.rangeVal1 ? props.rangeVal1 : rangeVal1]
        }

        this.setMapDisplay = this.setMapDisplay.bind(this)
        this.setYearRange = this.setYearRange.bind(this)
        this.setIntermittentRange = this.setIntermittentRange.bind(this)
    }

    componentDidMount() {
        this.setMapDisplay()
        this.setYearRange()
    }

    setIntermittentRange() {
        this.setState({
            range: [this.rangeVal0.value, this.rangeVal1.value].sort()
        })
    }

    setYearRange() {
        this.state.updateYearRange([this.rangeVal0.value, this.rangeVal1.value].sort())
    }

    setMapDisplay() {
        this.state.updateMapDisplay(this.mapDisplay.value)
    }

    render() {
        return (
            <div>
                <section className="range-input-values">
                    <span className="year-label">Map Display:</span>{this.mapDisplay ? this.mapDisplay.value : 0},
                    <span style={{marginLeft: "10px"}} className="year-label">Year Range:</span>
                    {this.state.range[0] + "-" + this.state.range[1]}
                </section>
                <section className="range-slider">
                    <span className="range-values" style={{left: "10px"}}>{this.state.defaultMin}</span>
                    <input
                        ref={(input) => { this.rangeVal0 = input; }}
                        onMouseUp={this.setYearRange}
                        onKeyUp={this.setYearRange}
                        onChange={this.setIntermittentRange}
                        defaultValue={this.state.rangeVal0}
                        min={this.state.defaultMin}
                        max={this.state.defaultMax}
                        step="1"
                        type="range" />
                    <input
                        className="map-display-slider"
                        ref={(input) => { this.mapDisplay = input; }}
                        onMouseUp={this.setMapDisplay}
                        onKeyUp={this.setMapDisplay}
                        defaultValue={this.state.defaultDisplay}
                        min={this.state.defaultMin}
                        max={this.state.defaultMax}
                        step="1"
                        type="range" />
                    <input
                        ref={(input) => { this.rangeVal1 = input; }}
                        onMouseUp={this.setYearRange}
                        onKeyUp={this.setYearRange}
                        onChange={this.setIntermittentRange}
                        defaultValue={this.state.rangeVal1}
                        min={this.state.defaultMin}
                        max={this.state.defaultMax}
                        step="1"
                        type="range" />
                    <span className="range-values" style={{right: "10px"}}>{this.state.defaultMax}</span>
                </section>
            </div>
        );
    }


}
export default TimeSlider;
