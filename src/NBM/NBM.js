import './NBM.css'
import AppConfig from '../config';
import Control from 'react-leaflet-control';
import CustomDialog from "../CustomDialog/CustomDialog";
import InfoSign from '../ InfoSign/InfoSign';
import L from 'leaflet';
import LocationOverlay from './LocationOverylays/LocationOverlay';
import React from 'react'
import TimeSlider from "./TimeSlider/TimeSlider"
import loadingGif from './loading.gif';
import shp from 'shpjs';
import {EditControl} from "react-leaflet-draw"
import {Glyphicon} from 'react-bootstrap';
import {Map, TileLayer, WMSTileLayer, Marker, Popup, GeoJSON, FeatureGroup, ZoomControl} from 'react-leaflet'
import {isEmpty} from 'lodash'

const DEV_MODE = AppConfig.REACT_APP_DEV;


const ENV = AppConfig.REACT_APP_ENV;
const BUFFER = .5;

//this is the total range of data for slider,
// not the range of the analysis window
const YEAR_RANGES = {
  'bap1': {min: 1981, max: 2018},
  'bap2': {min: 1981, max: 2018},
  'bap3': {min: 1981, max: 2018},
  'bap10': {min: 2001, max: 2061}
}

class NBM extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      point: null,
      attributionOpen: false,
      showUploadDialog: false,
      uploadError: '',
      uploading: false
    }
    this.drawnpolygon = null
    this.bounds = [[21, -134], [51, -63]];
    this.key = 1;
    this.clickable = true
    this.handleClick = this.handleClick.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseOut = this.handleMouseOut.bind(this)
    this.disableDragging = this.disableDragging.bind(this)
    this.enableDragging = this.enableDragging.bind(this)
    this.userDrawnPolygonStop = this.userDrawnPolygonStop.bind(this)
    this.userDrawnPolygonStart = this.userDrawnPolygonStart.bind(this)
    this.uploadFile = this.uploadFile.bind(this)
    this.parseShapefile = this.parseShapefile.bind(this)
    this.parseGeojsonFile = this.parseGeojsonFile.bind(this)
    this.handleGeojson = this.handleGeojson.bind(this)
    this.handleShow = this.handleShow.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  componentWillReceiveProps(props) {
    if (props.feature && props.feature.properties) {
      if (!props.feature.type) {
        props.feature.type = "Feature"
      }
      let b = L.geoJSON(props.feature).getBounds()
      let northEastLng = b._northEast.lng + BUFFER
      // zooms to features that cross 180 on the right side of map
      if (northEastLng > 179) {
        northEastLng = -50
      }
      this.bounds = [
        [b._southWest.lat - BUFFER, b._southWest.lng - BUFFER],
        [b._northEast.lat + BUFFER, northEastLng]
      ]
    }
  }

  componentDidMount() {
    // this is a hack that others have suggested because react leaflet
    // does not support leaflet onLoad event.
    setTimeout(() => {
      this.refs.map.leafletElement.invalidateSize()
      this.refs.map.leafletElement.fitBounds(this.bounds)
      L.control.scale({metric: false, imperial: true, position: 'bottomleft'}).addTo(this.refs.map.leafletElement)
      this.refs.map.leafletElement.removeControl(this.refs.map.leafletElement.attributionControl);
      L.control.attribution({position: 'topleft'}).addTo(this.refs.map.leafletElement)
    }, ENV === 'Local' ? 1500 : 250)
    this.props.setMap(this.refs.map)

    if (this.props.initPoint && this.props.initPoint.elv) {
      this.setState({
        point: [this.props.initPoint.lat, this.props.initPoint.lng]
      });
    }
  }

  componentDidUpdate(prevProps) {
    let that = this;
    if (prevProps.analysisLayers !== this.props.analysisLayers) {
      let currentLayers = this.props.analysisLayers ? this.props.analysisLayers : []
      let oldLayers = prevProps.analysisLayers ? prevProps.analysisLayers : []

      oldLayers.forEach(function (item) {
        if (currentLayers.indexOf(item) === -1) {
          that.refs.map.leafletElement.removeLayer(item.layer)
        }
      })

      currentLayers.forEach(function (item) {
        if (oldLayers.indexOf(item) === -1) {
          that.refs.map.leafletElement.addLayer(item.layer)
          if (item.timeEnabled) {
            item.layer.setParams(
              {
                time: `${that.props.mapDisplayYear}-01-01`
              }
            )
          }

        }
      })
    }
    if (prevProps.overlay !== this.props.overlay) {
      if (prevProps.overlay) {
        this.refs.map.leafletElement.removeLayer(prevProps.overlay.layer)
      }
      if (this.props.overlay) {
        this.refs.map.leafletElement.addLayer(this.props.overlay.layer)
      }
    }
    if (prevProps.feature !== this.props.feature) {
      if (this.props.feature && !this.props.clickDrivenEvent) {
        let center = L.geoJSON(this.props.feature).getBounds().getCenter()
        this.setState({
          point: [center.lat, center.lng]
        });
        this.props.parentClickHandler({latlng: {lat: center.lat, lng: center.lng}}, true)
      }
    }
  }

  handleClick(e) {
    if (!this.clickable) return
    this.setState({
      point: [e.latlng.lat, e.latlng.lng]
    });

    if (this.drawnpolygon) {
      this.refs.map.leafletElement.removeLayer(this.drawnpolygon)
      this.drawnpolygon = null
    }
    this.props.parentClickHandler(e)
  };

  handleMouseMove(e) {
    if (!this.clickable) {
      this.LocationOverlay.setLocation(null, null)
    }
    else {
      this.LocationOverlay.setLocation(e.latlng.lat, e.latlng.lng)
    }
  }

  handleMouseOut(e) {
    this.LocationOverlay.setLocation(null, null)
  }

  disableDragging() {
    this.clickable = false
    this.refs.map.leafletElement.dragging.disable();
  }

  enableDragging() {
    this.clickable = true
    this.refs.map.leafletElement.dragging.enable();
  }

  userDrawnPolygonStop(e) {
    this.drawnpolygon = e.layer
    let geom = this.drawnpolygon.toGeoJSON().geometry
    geom.crs = {type: "name", properties: {name: "EPSG:4326"}}
    this.props.parentDrawHandler(geom)
  }

  userDrawnPolygonStart(e) {
    this.setState({
      point: null
    });
    this.props.parentDrawHandler(null)
    if (this.drawnpolygon) {
      this.refs.map.leafletElement.removeLayer(this.drawnpolygon)
      this.drawnpolygon = null
    }
    this.disableDragging()
  }

  uploadFile(event) {
    const file = event.target.files[0]
    if (file.size > 5000000) {
      this.setState({
        uploadError: 'File size is greater than 5MB'
      })
      return
    }
    this.setState({
      uploading: true
    })
    try {
      const fileNameArr = file.name.split('.')
      const fileExt = fileNameArr[fileNameArr.length - 1]
      if (fileExt === 'zip') {
        this.parseShapefile(file)
      } else if (fileExt === 'geojson' || fileExt === 'json') {
        this.parseGeojsonFile(file)
      } else {
        this.setState({
          uploadError: `Uploads of files with the extension ${fileExt} are not supported.`,
          uploading: false
        })
      }
    } catch (ex) {
      this.setState({
        uploadError: 'File read failure: ' + ex.message,
        uploading: false
      })
    }
    event.target.value = '' // make sure the user can upload the same file again
  }

  parseShapefile(file) {
    const fileReader = new FileReader()
    fileReader.onload = (event) => {
      shp(fileReader.result).then((geojson) => {
        this.handleGeojson(geojson)
      }).catch(ex => {
        this.setState({
          uploadError: 'Shapefile parse issue: ' + ex.message,
          uploading: false
        })
      });
    }
    fileReader.readAsArrayBuffer(file)
  }

  parseGeojsonFile(file) {
    const fileReader = new FileReader()
    fileReader.onload = (event) => {
      const result = event.target.result
      const geojson = JSON.parse(result)
      this.handleGeojson(geojson)
    }
    fileReader.readAsText(file)
  }

  handleGeojson(geojson) {
    const geometry = geojson.type === 'FeatureCollection' ? geojson = geojson.features[0].geometry : geojson.geometry
    geometry.crs = {type: "name", properties: {name: "EPSG:4326"}}
    if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
      this.setState({
        uploadError: 'Only Polygons are accepted for upload.',
        uploading: false
      })
      return
    }
    this.handleClose()
    this.userDrawnPolygonStart()
    const layer = L.geoJSON(geojson)
    this.refs.map.leafletElement.fitBounds(layer.getBounds())
    this.enableDragging()
    this.props.parentDrawHandler(geometry)
  }

  handleShow() {
    this.setState({
      showUploadDialog: true
    })
  }

  handleClose() {
    this.setState({
      showUploadDialog: false,
      uploadError: '',
      uploading: false
    })
  }

  render() {
    const geojson = () => {
      if (!isEmpty(this.props.feature)) {
        return (
          <div>
            <GeoJSON style={{color: "black", fill: false, weight: 4}} key={this.key++} data={this.props.feature} />
            <GeoJSON style={{color: "red", fill: false, weight: 2}} key={this.key++} data={this.props.feature} />
          </div>
        )
      }
    };
    const basemap = () => {
      if (this.props.basemap) {
        if (this.props.basemap.type === "TileLayer") {
          return <TileLayer url={this.props.basemap.serviceUrl} attribution={this.props.basemap.attribution} />
        } else if (this.props.basemap.type === "WMSTileLayer") {
          return <WMSTileLayer
            url={this.props.basemap.serviceUrl}
            format={this.props.basemap.leafletProperties.format}
            layers={this.props.basemap.leafletProperties.layers}
            attribution={this.props.basemap.attribution}
          />
        }
      }
    }

    const attribution = () => {

      if (!this.state.attributionOpen) return
      return (
        <CustomDialog
          className="sbinfo-popout-window"
          isResizable={true}
          isDraggable={true}
          title={'Attributions'}
          modal={false}
          onClose={() => {
            this.setState({
              attributionOpen: false
            })
          }}
          body={
            <div>

              <div className="attrDiv">
                <strong>Mapping API: </strong>
                <a href="http://leafletjs.com" title="A JS library for interactive maps">{'Leaflet'}</a> powered by
              <a href="https://www.esri.com">{` Esri`}</a>.
              </div>
              <div className="attrDiv">
                <strong>Biogeography interface </strong>heavily influenced by: UW-Macrostrat project
                    <a href="https://github.com/UW-Macrostrat/gmna-app" >{` on Github`}</a>.
              </div>
              <div className="attrDiv">
                <strong>NatureServe Species Data: </strong>Natureserve. 2008. NatureServe Web Service. Arlington, VA. U.S.A.
                  Available
                    <a href="http://services.natureserve.org" >{` http://services.natureserve.org`}</a>.
              </div>
              <div className="attrDiv">
                <strong>OpenStreetMap: </strong> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
              </div>
              <hr />
              <div className="attrDiv">
                <div id="footer-text">
                  <div>Contact Information: <a href="mailto:bcb@usgs.gov">bcb@usgs.gov</a></div>
                  <div>Application Version:
                          <span id="frontEndVersion"> {this.props.applicationVersion}</span>
                  </div>
                  <div>API Version:
                                <span id="apiVersion"> {this.props.APIVersion}</span>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      )
    }

    const uploadShapefileDialog = () => {
      return (
        this.state.showUploadDialog &&
        <CustomDialog
          className="sbinfo-popout-window"
          title={'Upload a shapefile'}
          modal={true}
          onClose={this.handleClose}
          body={
            <>
              <ul>
                <li>Only shapefile (.shp) and GeoJSON (.json , .geojson) files under 5MB are accepted.</li>
                <li>Your shapefile must be zipped into a '.zip' extension and be under 5MB.</li>
                <li>Only the first <b>polygon</b> feature in your file will be used. Point and line geometries are not accepted.</li>
                <li>Valid .shp, .shx, .dbf, and .prj files must be included.</li>
                <li>Most common coordinate systems are supported.</li>
              </ul>
              {
                this.state.uploadError &&
                <div className="text-danger"><b>Error: </b>{this.state.uploadError}</div>
              }
              <label className="mb-0 pt-1 rounded float-right" title="Upload a shp file">
                <span className="btn submit-analysis-btn">Upload</span>
                <input type="file" name="file-upload" id="file-upload" accept=".zip, .shp, json, .geojson" style={{display: 'none'}}
                  onChange={this.uploadFile} />
              </label>
              {
                this.state.uploading &&
                <img src={loadingGif} alt="Loading..."></img>
              }
            </>
          }
        />
      )
    }
    return (
      <>
        <Map ref={"map"}
          onClick={this.handleClick}
          bounds={this.bounds}
          onMouseMove={this.handleMouseMove}
          onMouseOut={this.handleMouseOut}
          attribution=""
          zoomControl={false} >
          {basemap()}
          <LocationOverlay onRef={ref => (this.LocationOverlay = ref)} map={this.refs.map} bioscapeName={this.props.bioscapeName} />
          <MapMarker point={this.state.point} />
          {geojson()}
          <div className="global-time-slider" onMouseOver={this.disableDragging} onMouseOut={this.enableDragging}>
            {this.props.bioscapeName !== "terrestrial-ecosystems-2011" && <TimeSlider
              setMapDisplayYear={this.props.setMapDisplayYear}
              setMapDisplayYearFade={this.props.setMapDisplayYearFade}
              setYearRange={this.props.setYearRange}
              rangeYearMax={this.props.rangeYearMax}
              rangeYearMin={this.props.rangeYearMin}
              mapDisplayYear={this.props.mapDisplayYear}
              priorityBap={this.props.priorityBap}
              bapYearRanges={YEAR_RANGES}
            />}
          </div>
          <div className="attribution" onClick={() => {this.setState({attributionOpen: !this.state.attributionOpen})}} onMouseOver={this.disableDragging} onMouseOut={this.enableDragging}>
            <span className="attribution-info" style={{color: 'rgb(107, 153, 197)'}}>
              <InfoSign></InfoSign>
            </span>
          </div>
          <span onMouseOver={this.disableDragging} onMouseOut={this.enableDragging} >{attribution()}</span>
          <FeatureGroup>
            <ZoomControl position='topright'></ZoomControl>
            <EditControl
              position='topright'
              //onDeleted={() => { this.props.parentDrawHandler(null) }}
              onDrawStart={this.userDrawnPolygonStart}
              // onEditStart={this.disableDragging}
              // onEdited={this.userDrawnPolygon}
              //onEditStop={this.enableDragging}

              //onDeleteStart={this.userDrawnPolygonStart}
              onDrawStop={this.enableDragging}
              //onDeleteStop={this.enableDragging}
              onCreated={this.userDrawnPolygonStop}
              edit={{edit: false, remove: false}}
              draw={{
                rectangle: false,
                marker: false,
                circlemarker: false,
                polyline: false,
                circle: false
              }}
            />
            {DEV_MODE &&
              <Control position='topright' className="leaflet-bar">
                <label className="mb-0 pt-1 rounded" title="Upload a shp file">
                  <span className="add-more-label" onClick={this.handleShow}><Glyphicon className="inner-glyph" glyph="upload" /></span>
                </label>
              </Control>
            }
          </FeatureGroup>
        </Map>
        {DEV_MODE && uploadShapefileDialog()}
      </>
    );
  }
}

function MapMarker(props) {
  if (props.point) {
    return <Marker position={props.point} name={'mapClickedMarker'}>
      <Popup>
        Area of Interest.
                                                                                                                          </Popup>
    </Marker>
  } else {
    return <div></div>
  }
}

export default NBM;
