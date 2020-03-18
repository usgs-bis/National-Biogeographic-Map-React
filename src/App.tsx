import './App.scss'
import './CustomDialog/CustomDialog.css'
import * as turf from '@turf/turf'
import AlertBox from './AlertBox/AlertBox'
import AppConfig from './config'
import BasemapContext from './Contexts/BasemapContext'
import EnabledLayersContext from './Contexts/EnabledLayersContext'
import Footer from './Footer/Footer'
import Header from './Header/Header'
import L from 'leaflet'
import LeftPanel from './LeftPanel/LeftPanel'
import Legend from './Legend/Legend'
import LegendContext, {ILegendContext} from './Contexts/LegendContext'
import NBM from './NBM/NBM'
import React, {FunctionComponent, useState, useEffect, useRef} from 'react'
import Resizable from 're-resizable'
import _, {isEmpty} from 'lodash'
import cloneLayer from 'leaflet-clonelayer'
import geojsonhint from '@mapbox/geojsonhint'
import nbmBioscape from './Bioscapes/biogeography.json'
import nvcsBioscape from './Bioscapes/terrestrial-ecosystems-2011.json'
import packageJson from '../package.json'
import states from './states.json'
import useLocationHash from './Hooks/LocationHashHook'
import {TimeSliderContext, defaultTimeSliderProps, ITimeSliderContext} from './Contexts/TimeSliderContext'

// @ts-ignore
import {Map} from 'react-leaflet'

export interface IBioscapeProps {
  biogeography: any
  'nbm-react': any
  'terrestrial-ecosystems-2011': any
}

export interface IFeature {
  properties: {
    feature_id: string
    userDefined: boolean
  }
  geometry: boolean
}

export interface IShareState {
  feature?: {feature_id: string}
  basemapServiceUrl: string
  timeSlider: {
    rangeYearMin: number
    rangeYearMax: number
    mapDisplayYear: number
  }
  priorityBap: null | string
  baps: any
  point: {
    lat: number
    lng: number
    elv?: number
  }
  userDefined?: {geom: any}
}

const ELEVATION_SOURCE = 'https://nationalmap.gov/epqs/pqs.php?'
const GET_FEATURE_API = AppConfig.REACT_APP_BIS_API + '/api/v1/places/search/feature?feature_id='
const NVCS_FEATURE_LOOKUP = ['Landscape Conservation Cooperatives', 'US County', 'Ecoregion III', 'US States and Territories']
const POINT_SEARCH_API = AppConfig.REACT_APP_BIS_API + '/api/v1/places/search/point?'
const REACT_VERSION = 'v' + packageJson.version
const TEXT_SEARCH_API = AppConfig.REACT_APP_BIS_API + '/api/v1/places/search/text?q='

const bioscapeMap: IBioscapeProps = {
  'biogeography': nbmBioscape,
  'nbm-react': nbmBioscape,
  'terrestrial-ecosystems-2011': nvcsBioscape
}

const numberWithCommas = (x: number) => {
  const parts = x.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

const App: FunctionComponent<{bioscape: keyof IBioscapeProps}> = ({bioscape}) => {

  const [errorState, setErrorState] = useState<Error>()

  const [hashState, setHash] = useLocationHash()

  const [baps, setBaps] = useState(hashState?.baps)
  const [basemap, setBasemap] = useState(() => {
    return bioscapeMap[bioscape].basemaps.find((m: any) => m.serviceUrl === hashState?.basemapServiceUrl)
  })

  const map = useRef<Map>(null)

  const [enabledLayers, setEnabledLayers] = useState([])

  const [legendState, setLegendState] = useState<ILegendContext>({
    hasLegend: false,
    setHasLegend: (state: boolean) => setLegendState((prev) => Object.assign({}, prev, {hasLegend: state})),
    toggleLegend: () => {},
    setToggleLegend: (_toggle: Function) => setLegendState((prev) => Object.assign({}, prev, {toggleLegend: _toggle}))
  })

  const [state, setState] = useState(() => {

    const s = {
      bioscape: bioscapeMap[bioscape],
      bioscapeName: bioscape,
      results: [],
      feature: {} as IFeature,
      map: null as any,
      analysisLayers: [] as any[],
      priorityBap: null,
      clickDrivenEvent: false,
      lat: 0,
      lng: 0,
      elv: 0,
      overlay: null as any,
      mapClicked: null as any,
    }

    if (hashState) {
      s.priorityBap = hashState.priorityBap
      s.lat = hashState.point.lat
      s.lng = hashState.point.lng
      s.elv = hashState.point.elv
      s.clickDrivenEvent = hashState.point.lat ? true : false
    }

    return s
  })

  const [timeSlider, setTimeSlider] = useState(() => {
    let initTsState = defaultTimeSliderProps
    if (hashState) {
      const {rangeYearMax, rangeYearMin, mapDisplayYear} = hashState.timeSlider
      initTsState = {
        ...initTsState,
        rangeYearMin,
        rangeYearMax,
        mapDisplayYear,
      }
    }
    return initTsState
  })
  const updateTimeSliderState = (newState: Partial<ITimeSliderContext>) => {
    setTimeSlider((prev) => Object.assign({}, prev, {...newState}))
  }

  useEffect(() => {
    console.log('bioscape effect')

    const bm = basemap || state.bioscape.basemaps[0]

    let overlay: any = null
    if (state.bioscape.overlays) {
      for (let i = 0; i < state.bioscape.overlays.length; i++) {
        let overlay = state.bioscape.overlays[i]
        overlay['layer'] = L.tileLayer.wms(
          state.bioscape.overlays[i]['serviceUrl'],
          state.bioscape.overlays[i]['leafletProperties']
        )
      }

      overlay = state.bioscape.overlays.find((obj: any) => obj.selected === true)
    }

    setBasemap(bm)
    setState((prev) => Object.assign({}, prev, {
      overlay: overlay,
    }))
    document.title = state.bioscape.title

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bioscape.title, state.feature])

  const hashTimeout = useRef<any>()

  useEffect(() => {
    hashTimeout.current = setTimeout(() => {
      console.log('set hash effect')

      if (_.isEmpty(state.feature)) {return }

      let tmpState: IShareState = {
        basemapServiceUrl: basemap.serviceUrl,
        timeSlider: {rangeYearMin: timeSlider.rangeYearMin, rangeYearMax: timeSlider.rangeYearMax, mapDisplayYear: timeSlider.mapDisplayYear},
        priorityBap: state.priorityBap,
        baps,
        point: {lat: state.lat, lng: state.lng, elv: state.elv}
      }
      if (state.feature?.properties) {
        tmpState.feature = {feature_id: state.feature.properties.feature_id}
      }
      if (state.feature?.properties?.userDefined) {
        tmpState.userDefined = {geom: state.feature.geometry}
      }

      setHash(tmpState)
    }, 1000)

    return () => {
      clearTimeout(hashTimeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baps, state, basemap, timeSlider])

  useEffect(() => {
    console.log('initState effect')

    if (hashState?.userDefined) {
      handleDrawnPolygon(hashState.userDefined.geom, true)
    } else if (hashState?.feature) {
      submitHandler(hashState.feature, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashState])

  // changes the map display year.
  useEffect(() => {
    console.log('Timeslider year effect')

    const analysisLayers = state.analysisLayers
    if (!analysisLayers.length) {
      return
    }
    analysisLayers.forEach((item: any) => {
      if (!item.timeEnabled) {
        return
      }
      if (!timeSlider.play) {
        item.layer.setParams({
          time: `${timeSlider.mapDisplayYear}-01-01`
        })
        return
      }
      // when the time slider is playing
      // unfortunate that we need to use timeouts to acount for rendering time
      // for a smooth transition. on 'load' is network only, not time it takes to paint
      const currentOpacity = Number(item.layer.options.opacity).toFixed(2)
      const clone = cloneLayer(item.layer)
      clone.setParams({time: item.layer.wmsParams.time})
      clone.setOpacity(0)
      clone.addTo(map.current.leafletElement)
      // weird case where layer 'load' doesent fire and clone doesnt get removed.
      setTimeout(() => {map.current.leafletElement.removeLayer(clone)}, 5000)

      clone.on('load', () => {
        setTimeout(() => {
          clone.setOpacity(currentOpacity)
          item.layer.setOpacity(0)
          item.layer.setParams({time: `${timeSlider.mapDisplayYear}-01-01`})
        }, 150)
        clone.off('load')
      })

      item.layer.on('load', () => {
        setTimeout(() => {
          layerTransitionFade(item.layer, clone, currentOpacity)
        }, 250)
        item.layer.off('load')
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlider.mapDisplayYear, timeSlider.play])

  const shareState = () => {
    if (state.feature) {
      let copyText = document.getElementsByClassName('share-url-input')[0] as HTMLInputElement
      copyText.style.display = 'inline-block'
      copyText.value = window.location.href
      copyText.select()
      document.execCommand('copy')
      copyText.style.display = 'none'
      return copyText.value
    }
    return window.location.href
  }

  const setBapState = (bapId: string, bapState: any) => {
    if (!_.isEqual(baps?.[bapId], bapState)) {
      setBaps((prev: any) => Object.assign({}, prev, {[bapId]: bapState}))
    }
  }

  const handleDrawnPolygon = (geom: any, init: any) => {
    if (geom) {
      setState((prev) => Object.assign({}, prev, {
        feature: {
          geometry: geom,
          properties: {
            approxArea: getApproxArea(geom),
            userDefined: true,
            feature_class: 'Polygon',
            gid: null,
            feature_name: 'User Defined Polygon',
            feature_code: null,
            feature_id: Math.random().toString(36).substring(7),
            feature_description: 'User Defined Polygon',
          },
          type: 'Feature'
        }
      }))

      if (!init) {
        setState((prev) => Object.assign({}, prev, {
          priorityBap: null,
          analysisLayers: [],
        }))
      }
    } else {
      setState((prev) => Object.assign({}, prev, {feature: null}))
    }
  }

  // turns geometries into line collections
  // draws lines that cross the 180 on both sides of the map
  // ex 'Alaska' or 'Aleutian and Bering Sea Islands'
  const parseGeom = (geometry: any) => {

    let edgeOfMap = 10
    let leftEdge = false // close to left edge
    let polyLineCollection: any[] = []
    let polyLineCollectionOtherWorld: any[] = []
    let rightEdge = false // close to right edge

    // convert
    geometry.coordinates.forEach((feature: any) => {
      feature.forEach((polygon: any) => {
        let lineCoord = {
          'type': 'LineString',
          'coordinates': [] as any[],
        }

        let lineCoordCopy = {
          'type': 'LineString',
          'coordinates': [] as any[]
        }

        let crossed22 = false

        for (let i = 0; i < polygon.length; i++) {
          let coordinates = polygon[i]
          if ((coordinates[0] < -179.99 || coordinates[0] > 179.99) && lineCoord.coordinates.length) {
            if (lineCoord.coordinates.length > 1) {
              polyLineCollection.push(lineCoord)
              if (crossed22) {
                lineCoordCopy = {
                  'type': 'LineString',
                  'coordinates': []
                }
                // eslint-disable-next-line
                lineCoord.coordinates.forEach((coordinates) => {
                  lineCoordCopy.coordinates.push([coordinates[0] - 360, coordinates[1]])
                })

                polyLineCollectionOtherWorld.push(lineCoordCopy)
              }
            }
            lineCoord = {
              'type': 'LineString',
              'coordinates': []
            }
          }
          if (coordinates[0] > -179.99 && coordinates[0] < 179.99) {
            lineCoord.coordinates.push(coordinates)
            if (coordinates[0] > 22.5) crossed22 = true
            if (coordinates[0] > 180 - edgeOfMap) rightEdge = true
            if (coordinates[0] < -180 + edgeOfMap) leftEdge = true
          }
          else {
            if (i + 1 < polygon.length && polygon[i + 1][0] > -179.99 && polygon[i + 1][0] < 179.99) {
              lineCoord.coordinates.push(coordinates)
            }
          }

        }

        polyLineCollection.push(lineCoord)
        if (crossed22) {
          lineCoordCopy = {
            'type': 'LineString',
            'coordinates': []
          }
          lineCoord.coordinates.forEach(coordinates => {
            lineCoordCopy.coordinates.push([coordinates[0] - 360, coordinates[1]])
          })
          polyLineCollectionOtherWorld.push(lineCoordCopy)
        }
      })
    })

    if (rightEdge && leftEdge) { // if its close to both edges draw on both sides of map
      polyLineCollectionOtherWorld.forEach(line => {
        polyLineCollection.push(line)
      })
    }
    let lines = polyLineCollection.map((p) => {
      return p.coordinates
    })
    let result = {
      type: 'MultiLineString',
      coordinates: lines
    }
    return result
  }

  const getApproxArea = (geom: any) => {
    let approxArea = 'Unknown'
    try {
      let area = 0
      if (geom.type === 'MultiPolygon') {
        for (let poly of geom.coordinates) {
          area += turf.area(turf.polygon(poly))
        }
      }
      else {
        area = turf.area(turf.polygon(geom.coordinates))
      }
      // @ts-ignore
      approxArea = numberWithCommas(turf.convertArea(area, 'meters', 'acres'))
    }
    catch (e) {
      console.log(e)
    }
    return approxArea
  }

  const submitHandler = (feature: any, init: boolean) => {
    if (!feature.feature_id) return
    fetch(GET_FEATURE_API + feature.feature_id)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hits.hits.length && data.hits.hits[0]['_source']) {
          let result = data.hits.hits[0]['_source']
          result.properties.approxArea = getApproxArea(result.geometry)
          result.geometry = parseGeom(result.geometry)
          result.properties = countyStateLookup([result.properties])[0]

          if (!result.type) { result.type = 'Feature' }

          try {
            // To ensure we don't crash the app if it is invalid
            L.geoJSON(result)

            setState((prev) => Object.assign({}, prev, {
              feature: result,
              mapClicked: false
            }))
          } catch (err) {
            const hints = geojsonhint.hint(result)
            if (!isEmpty(hints)) {
              console.log('GeoJSON validation errors:')
              console.log(hints)
              setErrorState(new Error(`GeoJSON validation error: ${hints[0].message}`))
              return
            }

            setErrorState(err)
          }

        }
        else {
          setState((prev) => Object.assign({}, prev, {
            feature: null,
            mapClicked: false
          }))
        }
        if (!init) {
          setState((prev) => Object.assign({}, prev, {
            priorityBap: null,
            analysisLayers: []
          }))
        }
      })
      .catch(setErrorState)
  }

  const sendFeatureRequestFromOverlay = (results: any) => {
    let overlay = state.overlay
    if (!overlay) {return }

    for (let i = 0; i < results.length; i++) {
      let feature = results[i]
      if (feature['feature_class'] === overlay.featureClass) {
        i = results.length
        submitHandler({
          feature_id: feature.feature_id
        }, false)
      }
    }
  }

  const handleMapClick = (e: any, ignore: boolean) => {
    getElevationFromPoint(e.latlng.lat, e.latlng.lng)
    fetch(POINT_SEARCH_API + `lat=${e.latlng.lat}&lng=${e.latlng.lng}`)
      .then(res => res.json())
      .then((result) => {
        if (!result || !result.hits) {return }

        if (state.overlay) {
          sendFeatureRequestFromOverlay(result.hits.hits.map((a: any) => a['_source']['properties']))
          setState((prev) => Object.assign({}, prev, {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            clickDrivenEvent: true
          }))
        }

        else if (state.bioscape.overlays) {
          let r = result.hits.hits.map((a: any) => a['_source']['properties'])

          r = countyStateLookup(r)
          r = r.filter((a: any) => {
            return NVCS_FEATURE_LOOKUP.includes(a.feature_class)
          })

          setState((prev) => Object.assign({}, prev, {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            results: r,
            mapClicked: !ignore,
            clickDrivenEvent: true
          }))
        } else {
          let r = result.hits.hits.map((a: any) => a['_source']['properties'])
          r = countyStateLookup(r)
          setState((prev) => Object.assign({}, prev, {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            results: r,
            mapClicked: !ignore,
            clickDrivenEvent: true
          }))
        }
      })
      .catch(setErrorState)
  }

  // given a list of results look up the state if applicable
  const countyStateLookup = (rlist: any) => {
    return rlist.map((a: any) => {
      if (a.feature_class === 'US County') {
        let stateFips = a.feature_id.substring(15, 17)
        let state = states.find(s => {
          return s.fips === stateFips
        })
        a.state = state
      }
      return a
    })
  }

  const getElevationFromPoint = (lat: any, lng: any) => {

    fetch(`${ELEVATION_SOURCE}x=${lng}&y=${lat}&units=Feet&output=json`)
      .then(res => res.json())
      .then((result) => {
        let identifiedElevationValue = result.USGS_Elevation_Point_Query_Service
        let elev = identifiedElevationValue.Elevation_Query.Elevation
        elev = elev > -400 ? numberWithCommas(parseInt(elev)) : 'No Data'
        setState((prev) => Object.assign({}, prev, {elv: elev}))
      })
      .catch(setErrorState)
  }

  // @Matt TODO: refactor to leftpanel
  const handleSearchBox = _.debounce((text: any) => {

    if (text.length < 5) {
      setState((prev) => Object.assign({}, prev, {
        results: []
      }))

      return
    }

    fetch(TEXT_SEARCH_API + text)
      .then(res => res.json())
      .then((result) => {
        let r = result.hits.hits.map((a: any) => a['_source']['properties'])

        r = countyStateLookup(r)

        if (state.bioscape.overlays) {
          r = r.filter((a: any) => {
            return NVCS_FEATURE_LOOKUP.includes(a.feature_class)
          })
        }

        setState((prev) => Object.assign({}, prev, {
          results: r,
          clickDrivenEvent: false
        }))

      })
      .catch(setErrorState)

  }, 250)

  // brings layer 1 up and layer 2 down; removes layer 2.
  const layerTransitionFade = (layer: any, layer2: any, targetOpacity: any) => {
    let currentOpacityLayer = Math.round((layer.options.opacity + Number.EPSILON) * 100) / 100
    let currentOpacitylayer2 = Math.round((layer2.options.opacity + Number.EPSILON) * 100) / 100
    let recurse = false

    if (currentOpacitylayer2 > .11) {
      layer2.setOpacity(currentOpacitylayer2 - 0.10)
      recurse = true
    }

    if (currentOpacityLayer < targetOpacity) {
      layer.setOpacity(currentOpacityLayer + 0.10)
      recurse = true
    }

    if (recurse) {
      setTimeout(() => {layerTransitionFade(layer, layer2, targetOpacity)}, 100)
    }

    // Idealy we would only remove clone here but about 5% of the time layer 'load' doesnt fire
    // see comment in setMapDisplayYear above
    else {
      map.current.leafletElement.removeLayer(layer2)
    }

    // This shouldn't happen, but does when cycling the map. this is crude, but
    //   prevents the map from going blank if going thru a long progression
    if ((currentOpacityLayer < .11)) {
      //         console.log('Failsafe setting opacity to .5 currentOpacityLayer '+ currentOpacityLayer + ' targetOpacity= '+targetOpacity);
      layer.setOpacity(.50)
    }
  }

  const updateAnalysisLayers = (layers: any) => {
    setState((prev) => Object.assign({}, prev, {analysisLayers: layers, }))
  }

  const setPriorityBap = (bapId: any) => {
    setState((prev) => Object.assign({}, prev, {priorityBap: bapId}))
  }

  return (
    <div className="vwrapper">
      <Header title={state.bioscape.title} description={state.bioscape.description} />
      <AlertBox error={errorState} />
      <div id="content-area">
        <LegendContext.Provider value={legendState}>
          <EnabledLayersContext.Provider value={{enabledLayers, setEnabledLayers}}>
            <BasemapContext.Provider value={[basemap, setBasemap]} >
              <TimeSliderContext.Provider value={[timeSlider, updateTimeSliderState]}>
                <Resizable
                  className="panel-area"
                  enable={{top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false}}
                  defaultSize={{width: 540}}
                  minWidth={250}
                  maxWidth={1000}
                  onResizeStop={() => {map.current.leafletElement.invalidateSize()}}
                >
                  <LeftPanel
                    bioscape={state.bioscape}
                    bioscapeName={state.bioscapeName}
                    feature={state.feature}
                    initBaps={hashState?.baps}
                    map={map}
                    mapClicked={state.mapClicked}
                    overlay={state.overlay}
                    point={{lat: state.lat, lng: state.lng, elv: state.elv}}
                    priorityBap={state.priorityBap}
                    results={state.results}
                    setBapState={setBapState}
                    setPriorityBap={setPriorityBap}
                    shareState={shareState}
                    submitHandler={submitHandler}
                    textSearchHandler={handleSearchBox}
                    updateAnalysisLayers={updateAnalysisLayers}
                  />
                </Resizable>

                <div id="map-area">
                  <NBM
                    analysisLayers={state.analysisLayers}
                    applicationVersion={REACT_VERSION}
                    bioscapeName={state.bioscapeName}
                    clickDrivenEvent={state.clickDrivenEvent}
                    feature={state.feature}
                    initPoint={hashState?.point}
                    map={map}
                    mapDisplayYear={timeSlider.mapDisplayYear}
                    overlay={state.overlay}
                    parentClickHandler={handleMapClick}
                    parentDrawHandler={handleDrawnPolygon}
                    priorityBap={state.priorityBap}
                  />
                </div>
                <Legend />
              </TimeSliderContext.Provider>
            </BasemapContext.Provider>
          </EnabledLayersContext.Provider>
        </LegendContext.Provider>
      </div>
      <Footer />
    </div>
  )
}

export default App
