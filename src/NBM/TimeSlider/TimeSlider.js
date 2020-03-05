import './TimeSlider.css'
import React from 'react'
import {Glyphicon} from 'react-bootstrap'

// only used initial values for now
const minSliderValue = 1981
const maxSliderValue = 2018

const enableLookup = {
  'bap1': true,
  'bap2': true,
  'bap3': true,
  'bap10': true,
}

class TimeSlider extends React.Component {
  constructor(props) {
    super(props)

    // State in this component is used only for driving whats displayed
    // in the tooltips/summary box. The actual values, since they are 
    // used by many different components are stored in the state of app.js.
    // This also allows us to initilize this component when loading from a 
    // share url.

    this.state = {
      mapDisplayYear: props.mapDisplayYear,
      rangeYearMax: props.rangeYearMax,
      rangeYearMin: props.rangeYearMin,
      playGlyph: 'play-circle',
      playing: false,

    }
    this.setIntermittentYearRange = this.setIntermittentYearRange.bind(this)
    this.setIntermittentMapDisplayYear = this.setIntermittentMapDisplayYear.bind(this)
    this.initHandlePos = this.initHandlePos.bind(this)
    this.playTimeSlider = this.playTimeSlider.bind(this)
    this.playCycle = this.playCycle.bind(this)
    this.dragElement = this.dragElement.bind(this)
    this.sliderSize = 0
    this.leftPos = 0
    this.enabled = true
    this.maxSliderValue = maxSliderValue
    this.minSliderValue = minSliderValue
    this.bapYearRanges = props.bapYearRanges
  }

  componentDidMount() {

    // when the other components load it changes the space avaiable for the time slider
    // looking for a better way
    for (let i = 1; i < 6; i++) {
      setTimeout(() => {
        this.initHandlePos()
      }, 1500 * i)
    }
    window.addEventListener('resize', this.initHandlePos)
    this.dragElement(document.getElementById('leftHandleOutputGlyph'))
    this.dragElement(document.getElementById('rightHandleOutputGlyph'))
    this.dragElement(document.getElementById('middleHandleOutputGlyph'))


  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.initHandlePos)
  }

  componentDidUpdate() {

    if (document.getElementById('rangeSliderContainer').clientWidth !== this.sliderSize) {
      this.sliderSize = document.getElementById('rangeSliderContainer').clientWidth
      this.initHandlePos()
    }
    // Per usability - hide slider if N/A
    if (!enableLookup[this.props.priorityBap]) {
      document.getElementById('range-slider').style.opacity = '0.0'
      this.enabled = false
      //           this.state.playing = false;
    }
    else {
      document.getElementById('range-slider').style.opacity = '1.0'
      this.enabled = true
      this.minSliderValue = this.bapYearRanges[this.props.priorityBap].min
      this.maxSliderValue = this.bapYearRanges[this.props.priorityBap].max
      this.setIntermittentYearRange()
      this.setIntermittentMapDisplayYear()
    }
  }

  setIntermittentYearRange() {
    let l = document.getElementById('leftHandleOutputGlyph').offsetLeft
    let r = document.getElementById('rightHandleOutputGlyph').offsetLeft

    let leftpos = l >= r ? r : l
    let rightpos = r > l ? r : l

    let leftWidthRatio = leftpos / this.sliderSize
    let rightWidthRatio = rightpos / this.sliderSize

    let leftYear = this.minSliderValue + parseInt((this.maxSliderValue - this.minSliderValue) * leftWidthRatio)
    let rightYear = this.minSliderValue + parseInt((this.maxSliderValue - this.minSliderValue) * rightWidthRatio)

    document.getElementById('leftHandleOutput').style.left = (leftpos - 12) + 'px'
    document.getElementById('leftHandleOutputText').innerHTML = leftYear

    document.getElementById('rightHandleOutput').style.left = (rightpos - 12) + 'px'
    document.getElementById('rightHandleOutputText').innerHTML = rightYear

    document.getElementById('sliderRangeFill').style.left = leftpos + 'px'
    document.getElementById('sliderRangeFill').style.width = (rightpos - leftpos) + 'px'

    if (this.state.rangeYearMin !== leftYear || this.state.rangeYearMax !== rightYear) {
      this.setState({
        rangeYearMin: leftYear,
        rangeYearMax: rightYear
      })
    }
  }

  setIntermittentMapDisplayYear() {

    let pos = document.getElementById('middleHandleOutputGlyph').offsetLeft
    let widthRatio = pos / this.sliderSize

    let year = this.minSliderValue + parseInt((this.maxSliderValue - this.minSliderValue) * widthRatio)

    document.getElementById('middleHandleOutput').style.left = (pos - 48) + 'px'
    document.getElementById('middleHandleOutputText').innerHTML = 'Map Display: ' + year
    if (this.state.mapDisplayYear !== year) {
      this.setState({
        mapDisplayYear: year
      })
    }
  }

  initHandlePos() {
    if (!document.getElementById('rangeSliderContainer')) { return }

    this.sliderSize = document.getElementById('rangeSliderContainer').clientWidth
    // init middle
    let left = ((this.state.mapDisplayYear - this.minSliderValue) / (this.maxSliderValue - this.minSliderValue)) * this.sliderSize
    document.getElementById('middleHandleOutputGlyph').style.left = (left + 5) + 'px'

    // init left 
    left = ((this.state.rangeYearMin - this.minSliderValue) / (this.maxSliderValue - this.minSliderValue)) * this.sliderSize
    document.getElementById('leftHandleOutputGlyph').style.left = (left + 5) + 'px'

    // init right
    left = ((this.state.rangeYearMax - this.minSliderValue) / (this.maxSliderValue - this.minSliderValue)) * this.sliderSize
    if (left >= this.sliderSize) left = this.sliderSize
    document.getElementById('rightHandleOutputGlyph').style.left = (left + 5) + 'px'

    this.setIntermittentMapDisplayYear()
    this.setIntermittentYearRange()
  }



  playTimeSlider() {
    this.setState({
      playing: !this.state.playing,
      playGlyph: this.state.playing ? 'play-circle' : 'pause'
    }, this.playCycle)

  }

  playCycle() {
    // Keep slider from moving when slider is not applicable
    if (this.enabled) {
      if (this.state.playing) {
        if ((this.state.mapDisplayYear + 1) > this.maxSliderValue) {
          this.setState({
            mapDisplayYear: this.minSliderValue
          }, () => {
            this.initHandlePos()
            this.props.setMapDisplayYearFade(this.state.mapDisplayYear)
          })
        }
        else {
          this.setState({
            mapDisplayYear: this.state.mapDisplayYear + 1
          }, () => {
            this.initHandlePos()
            this.props.setMapDisplayYearFade(this.state.mapDisplayYear)
          })
        }

        // seems to work smoother on the render
        setTimeout(() => {
          this.playCycle()
        }, 5000)
      }
    }
  }

  dragElement(elmnt) {
    let that = this
    let pos1 = 0, pos3 = 0

    elmnt.onmousedown = dragMouseDown


    function dragMouseDown(e) {
      e = e || window.event
      e.preventDefault()
      // get the mouse cursor position at startup:
      pos3 = e.clientX
      document.onmouseup = closeDragElement
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag
    }

    function elementDrag(e) {
      if (!that.enabled) return
      e = e || window.event
      e.preventDefault()
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX
      pos3 = e.clientX
      let left = elmnt.offsetLeft - pos1
      if (left > that.sliderSize) left = that.sliderSize
      if (left < 0) left = 0
      elmnt.style.left = (left) + 'px'
      that.setIntermittentMapDisplayYear()
      that.setIntermittentYearRange()
    }

    function closeDragElement() {
      /* stop moving when mouse button is released:*/
      document.onmouseup = null
      document.onmousemove = null
      if (elmnt.id.toString() === 'middleHandleOutputGlyph') {
        that.props.setMapDisplayYear(that.state.mapDisplayYear)
      }
      else {
        that.props.setYearRange([that.state.rangeYearMin, that.state.rangeYearMax])
      }
    }
  }


  render() {
    return (
      <div>

        <section id="range-slider" className="range-slider">
          <Glyphicon onClick={this.playTimeSlider} className="play-glyph inner-glyph" glyph={this.state.playGlyph}
            data-toggle="tooltip" data-placement="top" title={this.state.playing ? 'Pause' : 'Play'} />
          <span className="range-values" style={{left: '30px'}}>{this.minSliderValue}</span>
          <span id="rangeSliderContainer" className="range-slider-container">
            <span id="sliderRangeFill" className="slider-range-fill"></span>

            <span id="leftHandleOutput" className="range-handle" >
              <span id="leftHandleOutputText"></span>
            </span>
            <Glyphicon id="leftHandleOutputGlyph" className="edge-glyph-tag inner-glyph" glyph="tag" />

            <span id="middleHandleOutput" className="range-handle handle-overlap" >
              <span id="middleHandleOutputText"></span>
            </span>
            <span></span>
            <Glyphicon id="middleHandleOutputGlyph" className="center-glyph-tag inner-glyph" glyph="tag" />


            <span id="rightHandleOutput" className="range-handle" >
              <span id="rightHandleOutputText"></span>
            </span>
            <Glyphicon id="rightHandleOutputGlyph" className="edge-glyph-tag inner-glyph" glyph="tag" />

          </span>

          <span className="range-values" style={{right: '10px'}}>{this.maxSliderValue}</span>
        </section>
      </div >
    )
  }

}
export default TimeSlider
