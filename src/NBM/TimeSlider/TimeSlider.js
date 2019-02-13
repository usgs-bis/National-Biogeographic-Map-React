import React from "react";
import "./TimeSlider.css";
// import { Glyphicon } from "react-bootstrap";


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
        this.initHandelPos = this.initHandelPos.bind(this)
        this.checkOverlap = this.checkOverlap.bind(this)
        this.sliderSize = 0
    }

    componentDidMount() {

        // when the other components load it changes the space avaiable for the time slider
        for (let i = 1; i < 6; i++) {
            setTimeout(() => {
                this.initHandelPos()
            }, 500 * i)
        }
        window.addEventListener("resize", this.initHandelPos)
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.initHandelPos)
    }

    componentDidUpdate() {

        if (document.getElementById("rangeSliderContainer").clientWidth - 15 !== this.sliderSize) {
            this.sliderSize = document.getElementById("rangeSliderContainer").clientWidth - 15
            this.initHandelPos()
        }
    }

    setIntermittentYearRange() {
        this.checkOverlap()
        let inOrderRange = [this.rangeSlider1.value, this.rangeSlider2.value].sort()

        let leftValue = inOrderRange[0] === minSliderValue ? 0 : (inOrderRange[0] - minSliderValue) / (maxSliderValue - minSliderValue)
        let rightValue = inOrderRange[1] === minSliderValue ? 0 : (inOrderRange[1] - minSliderValue) / (maxSliderValue - minSliderValue)

        document.getElementById('leftHandelOutput').style.left = ((leftValue * this.sliderSize) - 12) + 'px'
        document.getElementById('leftHandelOutputText').innerHTML = inOrderRange[0]
        document.getElementById('rightHandelOutput').style.left = ((rightValue * this.sliderSize) - 12) + 'px'
        document.getElementById('rightHandelOutputText').innerHTML = inOrderRange[1]

        this.setState({
            rangeYearMin: inOrderRange[0],
            rangeYearMax: inOrderRange[1]
        })

    }

    checkOverlap(){
        let left = parseInt(document.getElementById('leftHandelOutput').style.left)
        let middle = parseInt(document.getElementById('middleHandelOutput').style.left)
        let right = parseInt(document.getElementById('rightHandelOutput').style.left)

        if ((left + 40 > middle && left < middle + 120 ) || (right + 40 > middle && right < middle + 120)) {
            if (!document.getElementById('middleHandelOutput').className.includes('handel-overlap')) {
                document.getElementById('middleHandelOutput').className = 'range-handle handel-overlap'
            }
        }
        else {
            document.getElementById('middleHandelOutput').className = 'range-handle'
        }
    }

    setIntermittentMapDisplayYear() {
        this.checkOverlap()
        let value = this.mapDisplaySlider.value === minSliderValue ? 0 : (this.mapDisplaySlider.value - minSliderValue) / (maxSliderValue - minSliderValue)

        document.getElementById('middleHandelOutput').style.left = ((value * this.sliderSize) - 48) + 'px'
      
        document.getElementById('middleHandelOutputText').innerHTML = 'Map Display: ' + this.mapDisplaySlider.value

        this.setState({
            layerYear: this.mapDisplaySlider.value
        })
    }

    initHandelPos() {
        this.setIntermittentYearRange()
        this.setIntermittentMapDisplayYear()
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
                {/* <section className="range-input-values">
                    <span className="year-label">Map Display:</span>{this.state.mapDisplayYear},
                    <span style={{ marginLeft: "10px" }} className="year-label">Year Range:</span>
                    {this.state.rangeYearMin + "-" + this.state.rangeYearMax}
                </section> */}
                <section className="range-slider">
                    <span className="range-values" style={{ left: "10px" }}>{minSliderValue}</span>
                    <span id="rangeSliderContainer" className="range-slider-container">

                        <input
                            ref={(input) => { this.rangeSlider1 = input; }}
                            onMouseUp={this.setYearRange}
                            onKeyUp={this.setYearRange}
                            onChange={this.setIntermittentYearRange}
                            defaultValue={this.props.rangeYearMin}
                            min={minSliderValue}
                            max={maxSliderValue}
                            step="1"
                            type="range"
                            name="leftHandel"
                            id="leftHandel" />
                        <span id="leftHandelOutput" className="range-handle" >
                            <span id="leftHandelOutputText"></span>
                            {/* <Glyphicon className="inner-glyph" glyph="tag" /> */}
                        </span>
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
                            type="range"
                            name="middleHandel"
                            id="middleHandel" />
                        <span id="middleHandelOutput" className="range-handle" >
                            <span id="middleHandelOutputText"></span>
                            {/* <Glyphicon className="inner-glyph" glyph="tag" /> */}
                        </span>

                        <input
                            ref={(input) => { this.rangeSlider2 = input; }}
                            onMouseUp={this.setYearRange}
                            onKeyUp={this.setYearRange}
                            onChange={this.setIntermittentYearRange}
                            defaultValue={this.props.rangeYearMax}
                            min={minSliderValue}
                            max={maxSliderValue}
                            step="1"
                            type="range"
                            name="rightHandel"
                            id="rightHandel" />
                        <span id="rightHandelOutput" className="range-handle" >
                            <span id="rightHandelOutputText"></span>
                            {/* <Glyphicon className="inner-glyph" glyph="tag" /> */}
                        </span>

                    </span>

                    <span className="range-values" style={{ right: "10px" }}>{maxSliderValue}</span>
                </section>
            </div >
        );
    }

}
export default TimeSlider;