import * as turf from '@turf/turf'
import states from './states.json'

// @ts-ignore
import {Map} from 'react-leaflet'

export function getApproxArea (geom: any): string {
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

export function numberWithCommas(x: number): string {
  const parts = x.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

// given a list of results look up the state if applicable
export function countyStateLookup(rlist: any) {
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

// turns geometries into line collections
// draws lines that cross the 180 on both sides of the map
// ex 'Alaska' or 'Aleutian and Bering Sea Islands'
export function parseGeom(geometry: any) {

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

  const lines = polyLineCollection.map((p) => {
    return p.coordinates
  })

  const result = {
    type: 'MultiLineString',
    coordinates: lines
  }
  return result
}


// brings layer 1 up and layer 2 down; removes layer 2.
export function layerTransitionFade(layer: any, layer2: any, targetOpacity: any, map: Map) {
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
    setTimeout(() => {layerTransitionFade(layer, layer2, targetOpacity, map)}, 100)
  }

  // Idealy we would only remove clone here but about 5% of the time layer 'load' doesnt fire
  // see comment in setMapDisplayYear above
  else {
    map.leafletElement.removeLayer(layer2)
  }

  // This shouldn't happen, but does when cycling the map. this is crude, but
  //   prevents the map from going blank if going thru a long progression
  if ((currentOpacityLayer < .11)) {
    //         console.log('Failsafe setting opacity to .5 currentOpacityLayer '+ currentOpacityLayer + ' targetOpacity= '+targetOpacity);
    layer.setOpacity(.50)
  }
}
