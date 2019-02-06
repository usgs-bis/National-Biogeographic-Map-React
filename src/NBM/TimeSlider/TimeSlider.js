import React from "react";
import "./TimeSlider.css";


const rangeVal0 = 2005
const rangeVal1 = 2015

class TimeSlider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mapDisplay: 2010,
            range: [rangeVal0, rangeVal1],
            min: 1981,
            max: 2018
        }

        this.setMapDisplay = this.setMapDisplay.bind(this)
        this.setYearRange = this.setYearRange.bind(this)
        this.setIntermittentRange = this.setIntermittentRange.bind(this)
        this.setIntermittentDisplay = this.setIntermittentDisplay.bind(this)
    }

    componentDidMount() {

    }

    componentWillReceiveProps(props) {
        if (this.state.range[0] !== props.yearMin || this.state.range[1] !== props.yearMax || this.state.mapDisplay !== props.mapDisplay) {
            this.setState({
                mapDisplay: props.layerYear ? props.layerYear : this.state.mapDisplay,
                range: [props.yearMin ? props.yearMin : this.state.range[0], props.yearMax ? props.yearMax : this.state.range[1]]
            }, () => {
                this.setMapDisplay()
                this.setYearRange()
            })
        }
        else {
            this.setMapDisplay()
            this.setYearRange()
        }
    }

    setIntermittentRange() {
        this.setState({
            range: [this.rangeVal0.value, this.rangeVal1.value].sort()
        })
    }
    setIntermittentDisplay() {
        this.setState({
            mapDisplay: this.mapDisplay.value
        })
    }

    setYearRange() {
        this.props.updateYearRange([this.rangeVal0.value, this.rangeVal1.value].sort())
    }

    setMapDisplay() {
        this.props.updateMapDisplay(this.mapDisplay.value)
    }

    render() {
        return (
            <div>
                <section className="range-input-values">
                    <span className="year-label">Map Display:</span>{this.state.mapDisplay},
                    <span style={{ marginLeft: "10px" }} className="year-label">Year Range:</span>
                    {this.state.range[0] + "-" + this.state.range[1]}
                </section>
                <section className="range-slider">
                    <span className="range-values" style={{ left: "10px" }}>{this.state.min}</span>
                    <input
                        ref={(input) => { this.rangeVal0 = input; }}
                        onMouseUp={this.setYearRange}
                        onKeyUp={this.setYearRange}
                        onChange={this.setIntermittentRange}
                        value={this.state.range[0]}
                        min={this.state.min}
                        max={this.state.max}
                        step="1"
                        type="range" />
                    <input
                        className="map-display-slider"
                        ref={(input) => { this.mapDisplay = input; }}
                        onMouseUp={this.setMapDisplay}
                        onKeyUp={this.setMapDisplay}
                        onChange={this.setIntermittentDisplay}
                        value={this.state.mapDisplay}
                        min={this.state.min}
                        max={this.state.max}
                        step="1"
                        type="range" />
                    <input
                        ref={(input) => { this.rangeVal1 = input; }}
                        onMouseUp={this.setYearRange}
                        onKeyUp={this.setYearRange}
                        onChange={this.setIntermittentRange}
                        value={this.state.range[1]}
                        min={this.state.min}
                        max={this.state.max}
                        step="1"
                        type="range" />
                    <span className="range-values" style={{ right: "10px" }}>{this.state.max}</span>
                </section>
            </div>
        );
    }


}
export default TimeSlider;
