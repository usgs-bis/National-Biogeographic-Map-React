import React from "react";
import "./TimeSlider.css";


const minSliderValue = 1981
const maxSliderValue = 2018



class TimeSlider extends React.Component {
    constructor(props) {
        super(props);
        
        // State in this component is used only for driving whats displayed
        // in the tooltips/summary box. The actual values, since they are 
        // used by many different components are stored in the state of app.js.
        // This also allows us to initilize this component when loading from a 
        // share url. 
        
        this.state = {
            mapDisplayYear: props.mapDisplayYear,
            rangeYearMax: props.rangeYearMax,
            rangeYearMin: props.rangeYearMin
        }


        this.setMapDisplayYear = this.setMapDisplayYear.bind(this)
        this.setYearRange = this.setYearRange.bind(this)
        this.setIntermittentYearRange = this.setIntermittentYearRange.bind(this)
        this.setIntermittentMapDisplayYear = this.setIntermittentMapDisplayYear.bind(this)
    }

    setIntermittentYearRange() {
        let inOrderRange = [this.rangeSlider1.value, this.rangeSlider2.value].sort()
        this.setState({
            rangeYearMin: inOrderRange[0],
            rangeYearMax: inOrderRange[1]
        })
    }
    setIntermittentMapDisplayYear() {
        this.setState({
            layerYear: this.mapDisplaySlider.value
        })
    }

    setYearRange() {
        this.props.setYearRange([this.rangeSlider1.value, this.rangeSlider2.value].sort())
    }

    setMapDisplayYear() {
        this.props.setMapDisplayYear(this.mapDisplaySlider.value)
    }

    render() {
        return (
            <div>
                <section className="range-input-values">
                    <span className="year-label">Map Display:</span>{this.state.mapDisplayYear},
                    <span style={{ marginLeft: "10px" }} className="year-label">Year Range:</span>
                    {this.state.rangeYearMin + "-" + this.state.rangeYearMax}
                </section>
                <section className="range-slider">
                    <span className="range-values" style={{ left: "10px" }}>{minSliderValue}</span>
                    <input
                        ref={(input) => { this.rangeSlider1 = input; }}
                        onMouseUp={this.setYearRange}
                        onKeyUp={this.setYearRange}
                        onChange={this.setIntermittentYearRange}
                        defaultValue={this.props.rangeYearMin}
                        min={minSliderValue}
                        max={maxSliderValue}
                        step="1"
                        type="range" />
                    <input
                        className="map-display-slider"
                        ref={(input) => { this.mapDisplaySlider = input; }}
                        onMouseUp={this.setMapDisplayYear}
                        onKeyUp={this.setMapDisplayYear}
                        onChange={this.setIntermittentMapDisplayYear}
                        defaultValue={this.props.mapDisplayYear}
                        min={minSliderValue}
                        max={maxSliderValue}
                        step="1"
                        type="range" />
                    <input
                        ref={(input) => { this.rangeSlider2 = input; }}
                        onMouseUp={this.setYearRange}
                        onKeyUp={this.setYearRange}
                        onChange={this.setIntermittentYearRange}
                        defaultValue={this.props.rangeYearMax}
                        min={minSliderValue}
                        max={maxSliderValue}
                        step="1"
                        type="range" />
                    <span className="range-values" style={{ right: "10px" }}>{maxSliderValue}</span>
                </section>
            </div>
        );
    }

}
export default TimeSlider;
