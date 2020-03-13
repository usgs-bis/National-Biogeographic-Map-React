import './TimeSlider.scss'
import React, {useState, useEffect, useContext, useRef} from 'react'
import {TimeSliderContext} from '../../Contexts/TimeSliderContext'
import {FaTag, FaRegPlayCircle, FaPause} from 'react-icons/fa'

const TimeSlider: React.FunctionComponent = () => {
  const [state, setState] = useContext(TimeSliderContext)
  const [leftYear, setLeftYear] = useState(state.rangeYearMin)
  const [rightYear, setRightYear] = useState(state.rangeYearMax)
  const [playing, setPlaying] = useState(false)
  const [displayYear, setDisplayYear] = useState(state.mapDisplayYear)

  const [sliderSize, setSliderSize] = useState(0)
  let maxSliderValue = state.maxSliderValue
  let minSliderValue = state.minSliderValue

  const slider = useRef<HTMLSpanElement>(null)
  const [leftPosition, setLeftPosition] = useState(0)
  const [rightPosition, setRightPosition] = useState(0)
  const [displayYearHandlePosition, setDisplayYearHandlePosition] = useState(0)

  const [submit, setSubmit] = useState(false)

  const [windowSize, setWindowSize] = useState(window.innerWidth)
  useEffect(() => {
    window.addEventListener('resize', () => setWindowSize(window.innerWidth))
    // Remove the window event listener when this component unmounts
    return () => window.removeEventListener('resize', () => setWindowSize(window.innerWidth))
  }, [])

  useEffect(() => {
    if (!state.display) {
      return
    }
    const width = slider.current!.clientWidth
    setSliderSize(width)
    const middle = getPositionFromYear(displayYear, width)
    displayYearUpdate(middle, width)

    const left = getPositionFromYear(leftYear, width)
    leftUpdate(left, width)

    let right = getPositionFromYear(rightYear, width)
    rightUpdate(right, width)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize, state.display, state.minSliderValue, state.maxSliderValue])

  const playTimeout = useRef<any>()
  useEffect(() => {
    // Keep slider from moving when slider is not applicable
    if (!state.display || !playing) {
      clearTimeout(playTimeout.current)
      return
    }
    setState({mapDisplayYear: displayYear})
    setDisplayYearHandlePosition(getPositionFromYear(displayYear, sliderSize))
    playTimeout.current = setTimeout(() => {
      setDisplayYear(nextYear(displayYear))
    }, 5000)

    return () => clearTimeout(playTimeout.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayYear, playing])

  useEffect(() => {
    if (submit) {
      const [rangeYearMin, rangeYearMax] = [leftYear, rightYear].sort() // sort because the left and right sliders might have been reversed in position
      setState({
        rangeYearMin,
        rangeYearMax,
        mapDisplayYear: displayYear
      })
      setSubmit(false)
    }
  }, [leftYear, rightYear, displayYear, submit, setState])

  const displayYearUpdate = (position: number, width: number = sliderSize) => {
    setDisplayYearHandlePosition(position)
    const year = getYearFromPosition(position, width)
    if (displayYear !== year) {
      setDisplayYear(year)
    }
  }

  const leftUpdate = (position: number, width: number = sliderSize) => {
    setLeftPosition(position)
    const year = getYearFromPosition(position, width)
    if (leftYear !== year) {
      setLeftYear(year)
    }
  }

  const rightUpdate = (position: number, width: number = sliderSize) => {
    setRightPosition(position)
    const year = getYearFromPosition(position, width)
    if (rightYear !== year) {
      setRightYear(year)
    }
  }

  const getPositionFromYear = (year: number, width: number) => {
    if (year < minSliderValue) {
      return 0
    }
    const position = ((year - minSliderValue) / (maxSliderValue - minSliderValue)) * width
    return position >= width ? width : position
  }

  const getYearFromPosition = (position: number, width: number) => {
    const widthRatio = position / width
    return minSliderValue + parseInt(((maxSliderValue - minSliderValue) * widthRatio).toFixed(0))
  }

  const playTimeSlider = () => {
    setPlaying(!playing)
    if (!playing) { // when playing starts
      setDisplayYear(nextYear(displayYear))
    }
  }

  const nextYear = (dy: number) => {
    const nextYear = dy + 1
    const year = nextYear > maxSliderValue ? minSliderValue : nextYear
    return year
  }

  const onMouseDown = (e: React.MouseEvent, updateState: Function) => {
    let pos1 = 0, pos3 = 0
    pos3 = e.clientX
    const elmnt = e.currentTarget
    e.preventDefault()
    const doc = e.currentTarget.ownerDocument
    if (doc) {
      doc.onmouseup = () => {
        /* stop moving when mouse button is released:*/
        doc.onmouseup = null
        doc.onmousemove = null
        setSubmit(true)
      }
      doc.onmousemove = (e: MouseEvent) => {
        if (!state.display) return
        e = e || window.event
        e.preventDefault()
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX
        pos3 = e.clientX
        let left = (elmnt as any).offsetLeft - pos1
        if (left > sliderSize) left = sliderSize
        if (left < 0) left = 0
        updateState(left)
      }
    }
  }

  return !state.display ? (<div></div>) : (
    <div>
      <section className="range-slider">
        { playing ?
            <FaPause
              onClick={playTimeSlider}
              className="play-glyph inner-glyph"
              data-toggle="tooltip"
              data-placement="top"
              title="Pause"
            /> :
            <FaRegPlayCircle
              onClick={playTimeSlider}
              className="play-glyph inner-glyph"
              data-toggle="tooltip"
              data-placement="top"
              title="Play"
            />
        }
        <span className="range-values" style={{left: '30px'}}>{minSliderValue}</span>
        <span ref={slider} id="rangeSliderContainer" className="range-slider-container">
          <span className="slider-range-fill" style={{
            left: Math.min(leftPosition, rightPosition) + 'px',
            width: (Math.max(leftPosition, rightPosition) - Math.min(leftPosition, rightPosition)) + 'px'
          }}></span>

          <span onMouseDown={(e) => onMouseDown(e, leftUpdate)} className="inner-glyph" style={{left: leftPosition + 'px'}}>
            <span className="range-handle" >
              {leftYear}
            </span>
            <span className="glyph-tag edge-glyph-tag inner-glyph" >
              <FaTag />
            </span>
          </span>

          <span onMouseDown={(e) => onMouseDown(e, displayYearUpdate)} className="inner-glyph" style={{left: displayYearHandlePosition + 'px'}} >
            <span className="range-handle handle-overlap">
              {displayYear}
            </span>
            <span className="glyph-tag center-glyph-tag inner-glyph" >
              <FaTag />
            </span>
          </span>

          <span onMouseDown={(e) => onMouseDown(e, rightUpdate)} className="inner-glyph" style={{left: rightPosition + 'px'}}>
            <span className="range-handle" >
              {rightYear}
            </span>
            <span className="glyph-tag edge-glyph-tag inner-glyph" >
              <FaTag />
            </span>
          </span>
        </span>
        <span className="range-values" style={{right: '10px'}}>{maxSliderValue}</span>
      </section>
    </div>
  )
}

export default TimeSlider
