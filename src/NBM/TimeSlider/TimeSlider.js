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
        this.initHandelPos = this.initHandelPos.bind(this)
        this.sliderSize = 0
    }

    setIntermittentYearRange() {
        let inOrderRange = [this.rangeSlider1.value, this.rangeSlider2.value].sort()

        let leftValue = inOrderRange[0] === minSliderValue ? 0 : (inOrderRange[0] - minSliderValue) / (maxSliderValue - minSliderValue)
        let rightValue = inOrderRange[1] === minSliderValue ? 0 : (inOrderRange[1] - minSliderValue) / (maxSliderValue - minSliderValue)

        document.getElementById('leftHandelOutput').style.left = ((leftValue *  this.sliderSize) - 12) + 'px'
        document.getElementById('leftHandelOutput').value = inOrderRange[0]
        document.getElementById('rightHandelOutput').style.left = ((rightValue *  this.sliderSize) - 12) + 'px'
        document.getElementById('rightHandelOutput').value = inOrderRange[1]

        this.setState({
            rangeYearMin: inOrderRange[0],
            rangeYearMax: inOrderRange[1]
        })

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

    componentDidUpdate(){

        if(document.getElementById("rangeSliderContainer").clientWidth - 15 !== this.sliderSize){
            this.sliderSize = document.getElementById("rangeSliderContainer").clientWidth - 15
            this.initHandelPos()
        }

    }


    initHandelPos(){
        this.setIntermittentYearRange()
        this.setIntermittentMapDisplayYear()
    }

    setIntermittentMapDisplayYear() {
        let value = this.mapDisplaySlider.value === minSliderValue ? 0 : (this.mapDisplaySlider.value - minSliderValue) / (maxSliderValue - minSliderValue)

        document.getElementById('middleHandelOutput').style.left = ((value *  this.sliderSize) - 48) + 'px'
        document.getElementById('middleHandelOutput').value = 'Map Display: ' + this.mapDisplaySlider.value

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
                        <output id="leftHandelOutput" htmlFor="leftHandel" ></output>
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
                        <output id="middleHandelOutput" htmlFor="middleHandel" ></output>

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
                        <output id="rightHandelOutput" htmlFor="rightHandel" ></output>

                    </span>

                    <span className="range-values" style={{ right: "10px" }}>{maxSliderValue}</span>
                </section>
            </div >
        );
    }

}
export default TimeSlider;







// import React from "react";
// import "./TimeSlider.css";
// import * as d3 from "d3";

// const minSliderValue = 1981
// const maxSliderValue = 2018

// let rangeInitLeft = 2000
// let rangeInitRight = 2010
// let mapDisplayInit = 2005


// class TimeSlider extends React.Component {
//     constructor(props) {
//         super(props);

//         // State in this component is used only for driving whats displayed
//         // in the tooltips/summary box. The actual values, since they are 
//         // used by many different components are stored in the state of app.js.
//         // This also allows us to initilize this component when loading from a 
//         // share url. 

//         this.state = {
//             mapDisplayYear: props.mapDisplayYear,
//             rangeYearMax: props.rangeYearMax,
//             rangeYearMin: props.rangeYearMin
//         }

//         this.setMapDisplayYear = this.setMapDisplayYear.bind(this)
//         this.setYearRange = this.setYearRange.bind(this)
//         this.setIntermittentYearRange = this.setIntermittentYearRange.bind(this)
//         this.setIntermittentMapDisplayYear = this.setIntermittentMapDisplayYear.bind(this)
//         this.buildSlider = this.buildSlider.bind(this)
//         this.dragged = this.dragged.bind(this)
//         this.dragEnded = this.dragEnded.bind(this)
//     }

//     componentDidMount() {
//         this.buildSlider()
//     }

//     setIntermittentYearRange(a, b) {
//         let inOrderRange = [a, b].sort()
//         this.setState({
//             rangeYearMin: inOrderRange[0],
//             rangeYearMax: inOrderRange[1]
//         })
//     }
//     setIntermittentMapDisplayYear(v) {
//         this.setState({
//             mapDisplayYear: v
//         })
//     }

//     setYearRange(a, b) {
//         this.props.setYearRange([a, b].sort())
//     }

//     setMapDisplayYear(v) {
//         this.props.setMapDisplayYear(v)
//     }



//     dragEnded(slider, year) {
//         switch (slider) {
//             case 1:
//                 rangeInitLeft = year
//                 this.setYearRange(rangeInitLeft, rangeInitRight)
//                 break;
//             case 2:
//                 this.setMapDisplayYear(year)
//                 break;
//             case 3:
//                 rangeInitRight = year
//                 this.setYearRange(rangeInitLeft, rangeInitRight)
//                 break;
//             default:
//         }
//     }

//     dragged(slider, year) {
//         console.log('here')
//         switch (slider) {
//             case 1:
//                 this.setIntermittentYearRange(year, rangeInitRight)
//                 break;
//             case 2:
//                 this.setIntermittentMapDisplayYear(year)
//                 break;
//             case 3:
//                 this.setIntermittentYearRange(rangeInitLeft, year)
//                 break;
//             default:
//         }
//     }


//     buildSlider() {

//         let width = 1000
//         let height = 27
//         let that = this

//         let x = d3.scaleLinear()
//             .domain([minSliderValue, maxSliderValue])
//             .range([0, width])
//             .clamp(true);

//         let slider = d3.select('#Slider1')
//             .attr("preserveAspectRatio", "none")
//             .attr("viewBox", "0 0 " + (width + 30) + " " + height)
//             .classed("svg-time-slider", true)
//             .attr("version", "1.1")
//             .attr("baseProfile", "full")
//             .attr("xmlns", "http://www.w3.org/2000/svg")
//             .append("g")
//             .attr('transform', 'translate(' + 15 + ',' + 8 + ')');

//         slider.append("line")
//             .attr("class", "track")
//             .attr("x1", x.range()[0])
//             .attr("x2", x.range()[1])
//             .style("stroke-width", "10")


//         slider.insert("circle", ".track-overlay")
//             .attr("class", "handle")
//             .attr("r", 8)
//             .attr("cx", x(rangeInitLeft))
//             .call(d3.drag()
//                 .on("drag", function () {
//                     that.dragged(1, yearFromEventXValue(d3.event.x))
//                     d3.select(this).attr("cx", x(x.invert(d3.event.x)))
//                     leftHandelToolTip.attr("x", x(x.invert(d3.event.x)) - 20)
//                     leftHandelToolTipText.attr("x", x(x.invert(d3.event.x)) - 19)
//                 })
//                 .on("end", () => { this.dragEnded(1, yearFromEventXValue(d3.event.x)) }));


//         slider.insert("circle", ".track-overlay")
//             .attr("class", "handle")
//             .attr("r", 8)
//             .attr("cx", x(rangeInitRight))
//             .call(d3.drag()
//                 .on("drag", function () {
//                     that.dragged(3, yearFromEventXValue(d3.event.x))
//                     d3.select(this).attr("cx", x(x.invert(d3.event.x)))
//                     rightHandelToolTip.attr("x", x(x.invert(d3.event.x)) - 20)
//                 })
//                 .on("end", () => { this.dragEnded(3, yearFromEventXValue(d3.event.x)) }));

//         slider.insert("circle", ".track-overlay")
//             .attr("class", "handle")
//             .attr("r", 10)
//             .attr("cx", x(mapDisplayInit))
//             .call(d3.drag()
//                 .on("drag", function () {
//                     that.dragged(2, yearFromEventXValue(d3.event.x))
//                     d3.select(this).attr("cx", x(x.invert(d3.event.x)))
//                     mapDisplayHandelToolTip.attr("x", x(x.invert(d3.event.x)) - 20)
//                 })
//                 .on("end", () => { this.dragEnded(2, yearFromEventXValue(d3.event.x)) }));

//         let left = slider.append("g")
//         let leftHandelToolTip = left
//             .append('rect')
//             .attr('width', 44)
//             .attr('height', 17)
//             .attr("y", -32)
//             .attr("x", x(rangeInitLeft) - 22)
//             .attr("rx", 5)
//             .attr("ry", 5)
//             .attr("fill", "rgba(10,10,15,.6)")


//         let leftHandelToolTipText = left.append("text")
//             .attr("y", -33)
//             .attr("x", x(rangeInitLeft) - 16)
//             .attr("dy", "1em")
//             .attr("font-size", "15px")
//             .attr("font-weight", "bold")
//             .text(rangeInitLeft);


//         let mapDisplayHandelToolTip = slider.append("g")
//             .append('rect')
//             .attr('width', 40)
//             .attr('height', 15)
//             .attr("y", -30)
//             .attr("x", x(mapDisplayInit) - 20)
//             .attr("rx", 5)
//             .attr("ry", 5)

//         let rightHandelToolTip = slider.append("g")
//             .append('rect')
//             .attr('width', 40)
//             .attr('height', 15)
//             .attr("y", -30)
//             .attr("x", x(rangeInitRight) - 20)
//             .attr("rx", 5)
//             .attr("ry", 5)

//         function yearFromEventXValue(event) {
//             let val = parseInt(x(x.invert(event)))
//             if (val === 0) {
//                 return minSliderValue
//             }
//             else {
//                 return parseInt(minSliderValue + ((val / 1000) * (maxSliderValue - minSliderValue)))
//             }
//         }


//     }

//     render() {
//         return (
//             <div>
//                 <section className="range-input-values">
//                     <span className="year-label">Map Display:</span>{this.state.mapDisplayYear},
//                     <span style={{ marginLeft: "10px" }} className="year-label">Year Range:</span>
//                     {this.state.rangeYearMin + "-" + this.state.rangeYearMax}
//                 </section>

//                 <section className="range-slider">
//                     <span className="range-values" style={{ left: "10px" }}>{minSliderValue}</span>
//                     <span className="slider-span">
//                         <svg id={'Slider1'}
//                             width={'100%'} height={'100%'}>

//                         </svg></span>
//                     {/* <input
//                         ref={(input) => { this.rangeSlider1 = input; }}
//                         onMouseUp={this.setYearRange}
//                         onKeyUp={this.setYearRange}
//                         onChange={this.setIntermittentYearRange}
//                         defaultValue={this.props.rangeYearMin}
//                         min={minSliderValue}
//                         max={maxSliderValue}
//                         step="1"
//                         type="range" />
//                     <input
//                         className="map-display-slider"
//                         ref={(input) => { this.mapDisplaySlider = input; }}
//                         onMouseUp={this.setMapDisplayYear}
//                         onKeyUp={this.setMapDisplayYear}
//                         onChange={this.setIntermittentMapDisplayYear}
//                         defaultValue={this.props.mapDisplayYear}
//                         min={minSliderValue}
//                         max={maxSliderValue}
//                         step="1"
//                         type="range" />
//                     <input
//                         ref={(input) => { this.rangeSlider2 = input; }}
//                         onMouseUp={this.setYearRange}
//                         onKeyUp={this.setYearRange}
//                         onChange={this.setIntermittentYearRange}
//                         defaultValue={this.props.rangeYearMax}
//                         min={minSliderValue}
//                         max={maxSliderValue}
//                         step="1"
//                         type="range" /> */}

//                     <span className="range-values" style={{ right: "10px" }}>{maxSliderValue}</span>
//                 </section>
//             </div>
//         );
//     }

// }
// export default TimeSlider;





