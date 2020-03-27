import './NBM.css'
import AppConfig from '../config'
import BasemapContext from '../Contexts/BasemapContext'
import Control from 'react-leaflet-control'
import Dialog from 'react-dialog'
import InfoSign from '../InfoSign/InfoSign'
import L, {LatLngBoundsExpression, Layer} from 'leaflet'
import LegendContext from '../Contexts/LegendContext'
import LocationOverlay from './LocationOverylays/LocationOverlay'
import React, {FunctionComponent, useState, useEffect, useRef, useContext, MutableRefObject} from 'react'
import TimeSlider from './TimeSlider/TimeSlider'
import UploadShapefileDialog from './UploadShapefileDialog'
import _ from 'lodash'
import {EditControl} from 'react-leaflet-draw'
import {FaCloudUploadAlt} from 'react-icons/fa'
import {FaKey} from 'react-icons/fa'
import {isEmpty} from 'lodash'

// @ts-ignore
import {Map, TileLayer, WMSTileLayer, Marker, Popup, GeoJSON, FeatureGroup, ZoomControl} from 'react-leaflet'
import ClickDrivenContext from '../Contexts/ClickDrivenContext'

const API_VERSION_URL = AppConfig.REACT_APP_BIS_API + '/api'
const BUFFER = .5
const DEV_MODE = AppConfig.REACT_APP_DEV
const ENV = AppConfig.REACT_APP_ENV

export interface INBMProps {
  initPoint: null | {
    lat: number,
    lng: number
  },
  feature: any
  map: MutableRefObject<Map>
  analysisLayers: any[]
  mapDisplayYear: number
  overlay: any
  parentClickHandler: Function
  parentDrawHandler: Function
  applicationVersion: string
  bioscapeName: string
  priorityBap: any
}

const NBM: FunctionComponent<INBMProps> = (props) => {

  const {map} = props

  const [layerError, setLayerError] = useState<null | any>()

  useEffect(() => {
    if (!isEmpty(layerError)) {
      console.error(layerError)
    }
  }, [layerError])

  const [basemap] = useContext(BasemapContext)
  const {clickDriven} = useContext(ClickDrivenContext)
  const {toggleLegend, hasLegend} = useContext(LegendContext)

  const [point, setPoint] = useState(() => {
    if (!props.initPoint) return null
    return [props.initPoint?.lat, props.initPoint?.lng]
  })

  const [APIVersion, setAPIVersion] = useState('')
  const [attributionOpen, setAttributionOpen] = useState(false)
  const [bounds, setBounds] = useState<LatLngBoundsExpression>([[21, -134], [51, -63]])
  const [drawnpolygon, setDrawnpolygon] = useState<any>()
  const [oldLayers, setOldLayers] = useState<any[]>([])
  const [oldOverlay, setOldOverlay] = useState<Layer>()
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const locationOverlay = useRef<LocationOverlay>(null)
  let clickableRef = useRef(true)

  useEffect(() => {
    console.log('api version effect')
    fetch(API_VERSION_URL)
      .then((res) => res.json())
      .then((res) => setAPIVersion(res.Version))
      .catch(() => setAPIVersion('UNKNOWN'))
  }, [])

  useEffect(() => {
    console.log('bounds effect')
    if (isEmpty(props.feature)) {return }

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
      if (!map.current) {return }
      map.current.leafletElement.invalidateSize()
      L.control.scale({metric: false, imperial: true, position: 'bottomleft'}).addTo(map.current.leafletElement)
      map.current.leafletElement.removeControl(map.current.leafletElement.attributionControl)
      L.control.attribution({position: 'topleft'}).addTo(map.current.leafletElement)
    }, ENV === 'Local' ? 1500 : 250)

    map.current.leafletElement.createPane('summarizationPane')
    map.current.leafletElement.getPane('summarizationPane').style.zIndex = 402
    map.current.leafletElement.getPane('overlayPane').style.zIndex = 403

  }, [map])

  useEffect(() => {
    console.log('fitbounds effect')
    map?.current?.leafletElement.fitBounds(bounds)
  }, [bounds, map])

  useEffect(() => {
    console.log('layer adding/removing effect')
    const currentLayers = props.analysisLayers || []

    for (const oldItem of oldLayers) {
      map?.current?.leafletElement.removeLayer(oldItem.layer)
    }

    for (const newItem of currentLayers) {
      newItem.layer.setZIndex(2) // make sure any analysis layers have a greater z-index than the basemap for printing
      map?.current?.leafletElement.addLayer(newItem.layer)
      if (newItem.timeEnabled) {
        newItem.layer.setParams({
          time: `${props.mapDisplayYear}-01-01`
        })
      }
    }
    setOldLayers(currentLayers)
  }, [map, props.analysisLayers, props.mapDisplayYear, oldLayers])

  useEffect(() => {
    console.log('overlay effect')
    if (oldOverlay) {
      map?.current?.leafletElement.removeLayer(oldOverlay)
    }
    if (props.overlay) {
      setOldOverlay(props.overlay)
      map?.current?.leafletElement.addLayer(props.overlay)
    }
  }, [map, props.overlay, oldOverlay])

  useEffect(() => {
    console.log('NBM:handle click driven effect')
    if (!isEmpty(props.feature) && !clickDriven) {
      const center = L.geoJSON(props.feature).getBounds().getCenter()
      setPoint([center.lat, center.lng])
      props.parentClickHandler({latlng: {lat: center.lat, lng: center.lng}}, true)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.feature])

  const handleClick = (e: any) => {
    if (!clickableRef.current) return

    setPoint([e.latlng.lat, e.latlng.lng])

    if (drawnpolygon) {
      map?.current?.leafletElement.removeLayer(drawnpolygon)
      setDrawnpolygon(null)
    }
    props.parentClickHandler(e)
  }

  const handleMouseMove = (e: any) => {
    if (!clickableRef.current) {
      locationOverlay?.current?.setLocation(null, null)
    }
    else {
      locationOverlay?.current?.setLocation(e.latlng.lat, e.latlng.lng)
    }
  }

  const handleLoadError = _.debounce((err: any) => {
    setLayerError(err)
  }, 200)

  const handleMouseOut = () => {
    locationOverlay?.current?.setLocation(null, null)
  }

  const disableDragging = () => {
    clickableRef.current = false
    if (map.current) {
      map.current.leafletElement.dragging.disable()
    }
  }

  const enableDragging = () => {
    clickableRef.current = true
    map?.current?.leafletElement.dragging.enable()
  }

  const userDrawnPolygonStop = (e: any) => {
    setDrawnpolygon(e.layer)
    let geom = e.layer.toGeoJSON().geometry
    geom.crs = {type: 'name', properties: {name: 'EPSG:4326'}}
    props.parentDrawHandler(geom)
  }

  const handleUploadedGeojson = (geojson: any, geometry: any) => {
    userDrawnPolygonStart()
    const layer = L.geoJSON(geojson)
    map?.current?.leafletElement.fitBounds(layer.getBounds())
    enableDragging()
    props.parentDrawHandler(geometry)
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

  const handleShowShapefile = () => {
    setShowUploadDialog(true)
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

  const renderBasemap = () => {
    if (basemap) {
      if (basemap.type === 'TileLayer') {
        return <TileLayer url={basemap.serviceUrl} attribution={basemap.attribution} />
      } else if (basemap.type === 'WMSTileLayer') {
        return (
          <WMSTileLayer
            url={basemap.serviceUrl}
            format={basemap.leafletProperties.format}
            layers={basemap.leafletProperties.layers}
            attribution={basemap.attribution}
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

  return (
    <>
      <Map ref={map}
        onClick={handleClick}
        bounds={bounds}
        onLayerAdd={(event: any) => {
          event.layer.on('tileerror', (err: any) => {
            handleLoadError(err)
          })
        }}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseOut}
        attribution=""
        zoomControl={false} >
        {renderBasemap()}
        <LocationOverlay ref={locationOverlay} map={map} bioscapeName={props.bioscapeName} />
        <MapMarker point={point} />
        {geojson()}
        <div className="global-time-slider" onMouseOver={disableDragging} onMouseOut={enableDragging}>
          {props.bioscapeName !== 'terrestrial-ecosystems-2011' && <TimeSlider />}
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
          {hasLegend &&
            <Control position="topright">
              <div className="leaflet-bar" title="Legend">
                <button onClick={() => toggleLegend()}>
                  <FaKey />
                </button>
              </div>
            </Control>
          }
          {DEV_MODE &&
            <Control position="topright">
              <div className="leaflet-bar" title="Upload a shp file">
                <button onClick={handleShowShapefile}>
                  <FaCloudUploadAlt />
                </button>
              </div>
            </Control>
          }
        </FeatureGroup>
      </Map>
      <UploadShapefileDialog
        setShowUploadDialog={setShowUploadDialog}
        showUploadDialog={showUploadDialog}
        handleUploadedGeojson={handleUploadedGeojson}
      />
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
