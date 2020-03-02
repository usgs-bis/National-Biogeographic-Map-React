/* import shp from 'shpjs' */
import './NBM.css'
import 'toasted-notes/src/styles.css'
import AppConfig from '../config'
import Control from 'react-leaflet-control'
import Dialog from 'react-dialog'
import InfoSign from '../InfoSign/InfoSign'
import L, {LatLngBoundsExpression, Layer} from 'leaflet'
import LocationOverlay from './LocationOverylays/LocationOverlay'
import React, {FunctionComponent, useState, useEffect, useRef} from 'react'
import TimeSlider from './TimeSlider/TimeSlider'
import {EditControl} from 'react-leaflet-draw'
import {Glyphicon} from 'react-bootstrap'
import {isEmpty} from 'lodash'

// @ts-ignore
import {Map, TileLayer, WMSTileLayer, Marker, Popup, GeoJSON, FeatureGroup, ZoomControl} from 'react-leaflet'
// @Matt TODO: remove
/* import toast from 'toasted-notes' */


const DEV_MODE = AppConfig.REACT_APP_DEV


const ENV = AppConfig.REACT_APP_ENV
const BUFFER = .5

//is the total range of data for slider,
// not the range of the analysis window
const YEAR_RANGES = {
  'bap1': {min: 1981, max: 2018},
  'bap2': {min: 1981, max: 2018},
  'bap3': {min: 1981, max: 2018},
  'bap10': {min: 2001, max: 2061}
}

export interface INBMProps {
  // @Matt TODO: do we need this?
  className: string
  initPoint: null | {
    lat: number,
    lng: number
  },
  feature: any
  setMap: Function
  analysisLayers: any[]
  mapDisplayYear: number
  overlay: any
  clickDrivenEvent: any
  parentClickHandler: Function
  parentDrawHandler: Function
  basemap: any
  applicationVersion: string
  bioscapeName: string
  setYearRange: Function
  setMapDisplayYear: Function
  setMapDisplayYearFade: Function
  rangeYearMax: number
  rangeYearMin: number
  priorityBap: any
}

const API_VERSION_URL = AppConfig.REACT_APP_BIS_API + '/api'

const NBM: FunctionComponent<INBMProps> = (props) => {

  const {setMap} = props

  const [point, setPoint] = useState(() => {
    if (!props.initPoint) return null
    return [props.initPoint?.lat, props.initPoint?.lng]
  })
  const [attributionOpen, setAttributionOpen] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  // @Matt TODO: do something with the uploading?
  /* const [uploadError, setUploadError] = useState('') */
  /* const [uploading, setUploading] = useState(false) */
  const [oldOverlay, setOldOverlay] = useState<Layer>()
  const [bounds, setBounds] = useState<LatLngBoundsExpression>([[21, -134], [51, -63]])
  const [locationOverlay, setLocationOverlay] = useState()
  const [oldLayers, setOldLayers] = useState<any[]>([])
  const [APIVersion, setAPIVersion] = useState('')
  const [drawnpolygon, setDrawnpolygon] = useState<any>()

  const map = useRef<Map>()

  // @Matt TODO: #next all things in functioncomponents can't do it this way
  let clickable = true
  let layerError = false

  useEffect(() => {
    console.log('api version effect')
    fetch(API_VERSION_URL)
      .then((res) => res.json())
      .then((res) => setAPIVersion(res.Version))
      .catch(() => setAPIVersion('UNKNOWN'))
  }, [])

  useEffect(() => {
    console.log('bounds effect')
    if (isEmpty(props.feature)) { return }

    if (!props.feature.type) {
      props.feature.type = 'Feature'
    }
    let b = L.geoJSON(props.feature).getBounds()

    let northEastLng = b.getNorthEast().lng + BUFFER
    // zooms to features that cross 180 on the right side of map
    if (northEastLng > 179) {
      northEastLng = -50
    }

    const sw = b.getSouthWest()
    setBounds([
      [sw.lat - BUFFER, sw.lng - BUFFER],
      [b.getNorthEast().lat + BUFFER, northEastLng]
    ])
  }, [props.feature])

  useEffect(() => {
    console.log('setMap effect')
    // is a hack that others have suggested because react leaflet
    // does not support leaflet onLoad event.
    setTimeout(() => {
      if (!map.current) { return }
      map.current.leafletElement.invalidateSize()
      L.control.scale({metric: false, imperial: true, position: 'bottomleft'}).addTo(map.current.leafletElement)
      map.current.leafletElement.removeControl(map.current.leafletElement.attributionControl)
      L.control.attribution({position: 'topleft'}).addTo(map.current.leafletElement)
    }, ENV === 'Local' ? 1500 : 250)

    setMap(map)

  // @Matt TODO: need a better fix then ignore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    console.log('fitbounds effect')
    map?.current?.leafletElement.fitBounds(bounds)
  }, [bounds])

  // @Matt TODO: basemap not updating
  useEffect(() => {
    console.log('layer adding/removing effect')
    const currentLayers = props.analysisLayers || []

    for (const oldItem of oldLayers) {
      map?.current?.leafletElement.removeLayer(oldItem.layer)
    }

    for (const newItem of currentLayers) {
      map?.current?.leafletElement.addLayer(newItem.layer)
      if (newItem.timeEnabled) {
        newItem.layer.setParams(
          {
            time: `${props.mapDisplayYear}-01-01`
          }
        )
      }
    }
    setOldLayers(currentLayers)
  }, [props.analysisLayers, props.mapDisplayYear, oldLayers])

  useEffect(() => {
    console.log('overlay effect')
    if (oldOverlay) {
      map?.current?.leafletElement.removeLayer(oldOverlay)
    }
    if (props.overlay) {
      setOldOverlay(props.overlay)
      map?.current?.leafletElement.addLayer(props.overlay)
    }
  }, [props.overlay, oldOverlay])

  useEffect(() => {
    console.log('feature effect')
    if (!isEmpty(props.feature) && !props.clickDrivenEvent) {
      const center = L.geoJSON(props.feature).getBounds().getCenter()
      setPoint([center.lat, center.lng])
      props.parentClickHandler({latlng: {lat: center.lat, lng: center.lng}}, true)
    }

  // @Matt TODO: need a better fix then ignore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.feature])

  const handleClick = (e: any) => {
    if (!clickable) return

    setPoint([e.latlng.lat, e.latlng.lng])

    if (drawnpolygon) {
      map?.current?.leafletElement.removeLayer(drawnpolygon)
      setDrawnpolygon(null)
    }
    props.parentClickHandler(e)
  }

  const handleMouseMove = (e: any) => {
    if (!clickable) {
      locationOverlay.setLocation(null, null)
    }
    else {
      locationOverlay.setLocation(e.latlng.lat, e.latlng.lng)
    }
  }

  // @Matt TODO: #next user drawn polygons still load the single data, need to disallow that
  const handleLoadError = () => {
    let prevErr = layerError
    layerError = true
    // sometimes reduces the bounce on a hard refresh.
    if (!prevErr && layerError) {
      // @Matt TODO: #next this toast isn't very performant, need to replace with a better version
      /* toast.notify( */
      /*   <div> */
      /*     <h4>Error loading layer <i>{e.target.options.layers}</i> from <br /> <br />{e.target._url}</h4> */
      /*   </div>, {duration: 15000, position: 'top'} */
      /* ) */
    }
  }

  const handleMouseOut = () => {
    locationOverlay.setLocation(null, null)
  }

  const disableDragging = () => {
    clickable = false
    if (map.current) {
      map.current.leafletElement.dragging.disable()
    }
  }

  const enableDragging = () => {
    clickable = true
    map?.current?.leafletElement.dragging.enable()
  }

  const userDrawnPolygonStop = (e: any) => {
    setDrawnpolygon(e.layer)
    let geom = e.layer.toGeoJSON().geometry
    geom.crs = {type: 'name', properties: {name: 'EPSG:4326'}}
    props.parentDrawHandler(geom)
  }

  const userDrawnPolygonStart = () => {
    setPoint(null)
    props.parentDrawHandler(null)
    if (drawnpolygon) {
      map?.current?.leafletElement.removeLayer(drawnpolygon)
      setDrawnpolygon(null)
    }
    disableDragging()
  }

  /* const uploadFile = (event: any) => { */
  /*   const file = event.target.files[0] */
  /*   if (file.size > 5000000) { */
  /*     setUploadError('File size is greater than 5MB') */

  /*     return */
  /*   } */

  /*   setUploading(true) */

  /*   try { */
  /*     const fileNameArr = file.name.split('.') */
  /*     const fileExt = fileNameArr[fileNameArr.length - 1] */
  /*     if (fileExt === 'zip') { */
  /*       parseShapefile(file) */
  /*     } else if (fileExt === 'geojson' || fileExt === 'json') { */
  /*       parseGeojsonFile(file) */
  /*     } else { */
  /*       setUploadError(`Uploads of files with the extension ${fileExt} are not supported.`) */
  /*       setUploading(false) */
  /*     } */
  /*   } catch (ex) { */
  /*     setUploadError('File read failure: ' + ex.message) */
  /*     setUploading(false) */
  /*   } */
  /*   event.target.value = '' // make sure the user can upload the same file again */
  /* } */

  /* const parseShapefile = (file: Blob) => { */
  /*   const fileReader = new FileReader() */
  /*   fileReader.onload = () => { */
  /*     shp(fileReader.result as string) */
  /*       .then((geojson: any) => { */
  /*         handleGeojson(geojson) */
  /*       }) */
  /*       .catch((ex: any) => { */
  /*         setUploadError('Shapefile parse issue: ' + ex.message) */
  /*         setUploading(false) */
  /*       }) */
  /*   } */
  /*   fileReader.readAsArrayBuffer(file) */
  /* } */

  /* const parseGeojsonFile = (file: Blob) => { */
  /*   const fileReader = new FileReader() */
  /*   fileReader.onload = (event) => { */
  /*     const result = event?.target?.result as string */
  /*     const geojson = JSON.parse(result) */
  /*     handleGeojson(geojson) */
  /*   } */
  /*   fileReader.readAsText(file) */
  /* } */

  /* const handleGeojson = (geojson: any) => { */
  /*   const geometry = geojson.type === 'FeatureCollection' ? geojson = geojson.features[0].geometry : geojson.geometry */
  /*   geometry.crs = {type: 'name', properties: {name: 'EPSG:4326'}} */
  /*   if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') { */
  /*     setUploadError('Only Polygons are accepted for upload.') */
  /*     setUploading(false) */
  /*     return */
  /*   } */
  /*   handleClose() */
  /*   userDrawnPolygonStart() */
  /*   const layer = L.geoJSON(geojson) */
  /*   map?.current?.leafletElement.fitBounds(layer.getBounds()) */
  /*   enableDragging() */
  /*   props.parentDrawHandler(geometry) */
  /* } */

  const handleShow = () => {
    setShowUploadDialog(true)
  }

  const handleClose = () => {
    setShowUploadDialog(false)
    /* setUploadError('') */
    /* setUploading(false) */
  }

  const geojson = () => {
    if (!isEmpty(props.feature)) {
      const key = props.feature.properties.feature_id
      return (
        <div>
          <GeoJSON style={{color: 'black', fill: false, weight: 4}} key={key + 'black'} data={props.feature} />
          <GeoJSON style={{color: 'red', fill: false, weight: 2}} key={key + 'red'} data={props.feature} />
        </div>
      )
    }
  }

  const basemap = () => {
    if (props.basemap) {
      if (props.basemap.type === 'TileLayer') {
        return <TileLayer url={props.basemap.serviceUrl} attribution={props.basemap.attribution} />
      } else if (props.basemap.type === 'WMSTileLayer') {
        return (
          <WMSTileLayer
            url={props.basemap.serviceUrl}
            format={props.basemap.leafletProperties.format}
            layers={props.basemap.leafletProperties.layers}
            attribution={props.basemap.attribution}
          />
        )
      }
    }
  }

  const attribution = () => {

    if (!attributionOpen) return
    return (
      <Dialog
        className=""
        isResizable={true}
        isDraggable={true}
        title={'Attributions'}
        modal={false}
        onClose={() => setAttributionOpen(false)}
      >
        <div className="sbinfo-popout-window">
          <div>
            <div className="attrDiv">
              <strong>Mapping API: </strong>
              <a href="http://leafletjs.com" title="A JS library for interactive maps">{'Leaflet'}</a> powered by
              <a href="https://www.esri.com">Esri</a>.
            </div>
            <div className="attrDiv">
              <strong>Biogeography interface </strong>heavily influenced by: UW-Macrostrat project
              <a href="https://github.com/UW-Macrostrat/gmna-app" >on Github</a>.
            </div>
            <div className="attrDiv">
              <strong>NatureServe Species Data: </strong>Natureserve. 2008. NatureServe Web Service. Arlington, VA. U.S.A.  Available
              <a href="http://services.natureserve.org">http://services.natureserve.org</a>.
            </div>
            <div className="attrDiv">
              <strong>OpenStreetMap: </strong> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
            </div>
            <hr />
            <div className="attrDiv">
              <div id="footer-text">
                <div>Contact Information: <a href="mailto:bcb@usgs.gov">bcb@usgs.gov</a></div>
                <div>Application Version:
                  <span id="frontEndVersion"> {props.applicationVersion}</span>
                </div>
                <div>API Version:
                  <span id="apiVersion"> {APIVersion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    )
  }

  const uploadShapefileDialog = () => {
    if (showUploadDialog) {
      return (
        <Dialog
          className="sbinfo-popout-window"
          title={'Upload a shapefile'}
          modal={true}
          onClose={handleClose}
        >
          <Map ref={map}
            onClick={handleClick}
            bounds={bounds}
            onLayerAdd={(event: any) => {
              event.layer.on('tileerror', () => {
                handleLoadError()
              })
            }}
            onLayerRemove={() => {
              layerError = false
            }}
            onMouseMove={handleMouseMove}
            onMouseOut={handleMouseOut}
            attribution=""
            zoomControl={false} >
            {basemap()}
            <LocationOverlay onRef={(ref: any) => setLocationOverlay(ref)} map={map} bioscapeName={props.bioscapeName} />
            <MapMarker point={point} />
            {geojson()}
            <div className="global-time-slider" onMouseOver={disableDragging} onMouseOut={enableDragging}>
              {props.bioscapeName !== 'terrestrial-ecosystems-2011' && <TimeSlider
                setMapDisplayYear={props.setMapDisplayYear}
                setMapDisplayYearFade={props.setMapDisplayYearFade}
                setYearRange={props.setYearRange}
                rangeYearMax={props.rangeYearMax}
                rangeYearMin={props.rangeYearMin}
                mapDisplayYear={props.mapDisplayYear}
                priorityBap={props.priorityBap}
                bapYearRanges={YEAR_RANGES}
              />}
            </div>
            <div className="attribution" onClick={() => {setAttributionOpen(!attributionOpen)}} onMouseOver={disableDragging} onMouseOut={enableDragging}>
              <span className="attribution-info" style={{color: 'rgb(107, 153, 197)'}}>
                <InfoSign></InfoSign>
              </span>
            </div>
            <span onMouseOver={disableDragging} onMouseOut={enableDragging} >{attribution()}</span>
            <FeatureGroup>
              <ZoomControl position='topright'></ZoomControl>
              <EditControl
                position='topright'
                //onDeleted={() => { props.parentDrawHandler(null) }}
                onDrawStart={userDrawnPolygonStart}
                // onEditStart={disableDragging}
                // onEdited={userDrawnPolygon}
                //onEditStop={enableDragging}

                //onDeleteStart={userDrawnPolygonStart}
                onDrawStop={enableDragging}
                //onDeleteStop={enableDragging}
                onCreated={userDrawnPolygonStop}
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
                <Control position="topright">
                  <label className="mb-0 pt-1 rounded" title="Upload a shp file">
                    <span className="add-more-label" onClick={handleShow}><Glyphicon className="inner-glyph" glyph="upload" /></span>
                  </label>
                </Control>
              }
            </FeatureGroup>
          </Map>

        </Dialog>
      )
    }
  }

  return (
    <>
      <Map ref={map}
        onClick={handleClick}
        bounds={bounds}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseOut}
        attribution=""
        zoomControl={false} >
        {basemap()}
        <LocationOverlay onRef={(ref: LocationOverlay) => setLocationOverlay(ref)} map={map} bioscapeName={props.bioscapeName} />
        <MapMarker point={point} />
        {geojson()}
        <div className="global-time-slider" onMouseOver={disableDragging} onMouseOut={enableDragging}>
          {props.bioscapeName !== 'terrestrial-ecosystems-2011' && <TimeSlider
            setMapDisplayYear={props.setMapDisplayYear}
            setMapDisplayYearFade={props.setMapDisplayYearFade}
            setYearRange={props.setYearRange}
            rangeYearMax={props.rangeYearMax}
            rangeYearMin={props.rangeYearMin}
            mapDisplayYear={props.mapDisplayYear}
            priorityBap={props.priorityBap}
            bapYearRanges={YEAR_RANGES}
          />}
        </div>
        <div className="attribution" onClick={() => {setAttributionOpen(!attributionOpen)}} onMouseOver={disableDragging} onMouseOut={enableDragging}>
          <span className="attribution-info" style={{color: 'rgb(107, 153, 197)'}}>
            <InfoSign></InfoSign>
          </span>
        </div>
        <span onMouseOver={disableDragging} onMouseOut={enableDragging} >{attribution()}</span>
        <FeatureGroup>
          <ZoomControl position='topright'></ZoomControl>
          <EditControl
            position='topright'
            //onDeleted={() => { props.parentDrawHandler(null) }}
            onDrawStart={userDrawnPolygonStart}
            // onEditStart={disableDragging}
            // onEdited={userDrawnPolygon}
            //onEditStop={enableDragging}

            //onDeleteStart={userDrawnPolygonStart}
            onDrawStop={enableDragging}
            //onDeleteStop={enableDragging}
            onCreated={userDrawnPolygonStop}
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
            <Control position="topright">
              <label className="mb-0 pt-1 rounded" title="Upload a shp file">
                <span className="add-more-label" onClick={handleShow}><Glyphicon className="inner-glyph" glyph="upload" /></span>
              </label>
            </Control>
          }
        </FeatureGroup>
      </Map>
      {DEV_MODE && uploadShapefileDialog()}
    </>
  )
}

function MapMarker(props: any) {
  if (props.point) {
    return (
      <Marker position={props.point} name={'mapClickedMarker'}>
        <Popup>
          Area of Interest.
          </Popup>
      </Marker>
    )
  } else {
    return <div></div>
  }
}

export default NBM
