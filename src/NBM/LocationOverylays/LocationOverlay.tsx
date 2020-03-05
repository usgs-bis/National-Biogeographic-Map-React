import React from 'react'
import './LocationOverlay.css'


let lastTimeMouseMoved = new Date().getTime()
const ELEVATION_SOURCE = 'https://nationalmap.gov/epqs/pqs.php?'

const numberWithCommas = (x: number) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export interface ILocationOverlayProps {
  onRef: any,
  map: any,
  bioscapeName: string,
}

export interface ILocationOverlayState {
  leftOffset: string,
  lat: null|string,
  lng: null|string,
  elv: null|string,
  error: null|string,
}

class LocationOverlay extends React.Component<ILocationOverlayProps, ILocationOverlayState> {
  map: null|{
    off: Function
    on: Function
  }

  constructor(props: ILocationOverlayProps) {
    super(props)
    this.state = {
      lat: null,
      lng: null,
      elv: null,
      leftOffset: '100px',
      error: null,
    }
    this.map = null
    this.updateOffset = this.updateOffset.bind(this)
  }

  componentDidMount() {
    this.props.onRef(this)
  }

  componentWillUnmount() {
    this.map?.off('zoomend', this.updateOffset)
  }

  componentDidUpdate() {
    if (!this.map && this.props.map.current.leafletElement) {
      this.map = this.props.map.current.leafletElement
      this.map?.on('zoomend', this.updateOffset)
      this.updateOffset()
    }
  }

  // Pushes the lat, lng, & elev display left based on leaflet scale position
  updateOffset() {
    let offset = this.state.leftOffset
    const scale = document.getElementsByClassName('leaflet-control-scale leaflet-control')
    if (scale.length) offset = (scale[0].clientWidth + 30).toString() + 'px'

    if (offset !== this.state.leftOffset) {
      this.setState({
        leftOffset: offset
      })
    }
  }

  setLocation(lat: null|string, lng: null|string) {
    this.setState({
      lat: lat ? parseFloat(lat).toFixed(5).toString() : 'No Data',
      lng: lng ? parseFloat(lng).toFixed(5).toString() : 'No Data'
    })
    this.setElevation()
  }

  setElevation() {
    lastTimeMouseMoved = new Date().getTime()

    setTimeout(() => {
      let currentTime = new Date().getTime()
      if (currentTime - lastTimeMouseMoved >= 500 && this.state.lat) {
        fetch(`${ELEVATION_SOURCE}x=${this.state.lng}&y=${this.state.lat}&units=Feet&output=json`)
          .then(res => res.json())
          .then((result) => {
            let identifiedElevationValue = result.USGS_Elevation_Point_Query_Service
            let elev = identifiedElevationValue.Elevation_Query.Elevation
            elev = elev > -400 ? numberWithCommas(parseInt(elev)) + 'ft' : 'No Data'
            this.setState({
              elv: elev
            })
          })
          .catch((error) => {
            this.setState({
              error
            })
          })

      }
    }, 500)
    this.setState({
      elv: 'No Data'
    })
  }


  render() {

    return (
      <div className={this.props.bioscapeName !== 'terrestrial-ecosystems-2011' ? 'location-overlay' : 'no-time-slider location-overlay'} style={{left: this.state.leftOffset}}>
        {this.state.lat && this.state.lat !== 'No Data' && <span>{this.state.lat}°,</span>}
        {this.state.lng && this.state.lng !== 'No Data' && <span>{this.state.lng}°,</span>}
        {this.state.elv && <span>{this.state.elv}.</span>}
      </div>
    )
  }

}
export default LocationOverlay
