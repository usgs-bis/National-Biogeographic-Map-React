import { Parser } from 'xml2js'
import { TileLayer } from 'leaflet'
import L from 'leaflet'

export interface ITimeEnabledLayer {
  title: string
  layer: TileLayer.WMS
  legend: { imageUrl: string }
  timeEnabled: boolean
  checked: boolean
  sb_item: string
}

export interface ITimeDimension {
  minVal: number
  maxVal: number
  step: number
}

export const defaultTimeDimension = {
  minVal: 1982,
  maxVal: 2018,
  step: 1
}

export class TimeEnabledLayer implements ITimeEnabledLayer {

  title: string
  layer: TileLayer.WMS
  layerName: string
  legend: { imageUrl: string }
  timeEnabled = true
  checked = false
  sb_item: string

  private parser: Parser
  private url: string

  constructor(title: string, url: string, layer: string, sb_item: string) {
    this.title = title
    this.url = url
    this.layer = L.tileLayer.wms(url, {
      format: 'image/png',
      layers: layer,
      opacity: .5,
      transparent: true
    })
    this.layerName = layer
    this.legend = {
      imageUrl: `${url}?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=${layer}`
    }
    this.sb_item = sb_item

    this.parser = new Parser({normalizeTags: true})
  }

  getTimeDimension = async (): Promise<ITimeDimension> => {
    return await this.getLayerCapabilities()
  }

  private getLayerCapabilities = async (): Promise<ITimeDimension> => {
    const res = await fetch(`${this.url}?request=GetCapabilities`)
    const text = await res.text()
    const result = await this.parser.parseStringPromise(text)
    const [capability] = result.wms_capabilities.capability
    const [capLayer] = capability.layer
    const bapLayer = capLayer.layer.find((cl: any) => cl.name.includes(this.layerName))
    const [dimension] = bapLayer.dimension
    const props = dimension.$
    if (props.name === 'time') {
      const val = dimension._
      return this.parseTimeDimension(val)
    }
    return defaultTimeDimension
  }

  private parseTimeDimension = (timeValues: string): ITimeDimension => {
    const intervals = timeValues.split('/')
    if (intervals.length === 3) {
      const [start, end, interval] = intervals
      const startDate = new Date(start)
      const endDate = new Date(end)
      const [, period] = interval.split('P')
      const [ymd] = period.split('T')
      if (ymd) {
        const y = 'Y'
        const step = this.getValue(y, ymd)
        return {
          minVal: startDate.getUTCFullYear(),
          maxVal: endDate.getUTCFullYear(),
          step: step ? parseInt(step) : 1
        }
      }
      console.error('DEV: We currently don\'t support this type of time dimension, only annual change is supported for now', this.title)
    } else {
      const times = timeValues.split(',')
      return {
        minVal: parseInt(times[0]),
        maxVal: parseInt(times[times.length - 1]),
        step: 1
      }
    }
    return defaultTimeDimension
  }

  private getValue = (matchVal: string, str: string) => {
    const regex = new RegExp(`\\d*(?=${matchVal})`)
    const res = regex.exec(str)
    if (!res) {
      return undefined
    }
    const [val] = res
    return val
  }
}