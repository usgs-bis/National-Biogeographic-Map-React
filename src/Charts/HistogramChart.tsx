import React, { useImperativeHandle, useEffect, useRef, forwardRef } from 'react'
import * as d3 from 'd3'
import { select } from 'd3'

import './Chart.css'
import { IChart } from './Chart'

export interface IHistogramChartProps extends IChart {
  bucketSize: number
}

const HistogramChart = forwardRef((props: IHistogramChartProps, ref) => {
  const chartContainer = useRef<HTMLDivElement>(null)
  const chartSvg = useRef<SVGSVGElement>(null)
  useImperativeHandle(ref, () => ({
    print
  }), [])
  /**
   * Draw a Histogram Chart
   * @param {string} id - name to prefix dom elements 
   * @param {*} config - used to style the chart
   * @param {*} data - used to build the chart
   * @param {*} bucketSize - used to buld histogram
   * 
   * ex. congig = {
   *        margins:{left:1,right:10,top:1,bottom:20},
   *        chart: {title:"United States",subtitle:"Population over Time"},
   *        xAxis:{label:"Percent Population"},
   *        yAxis:{label:"State"}
   *       }
   * ex. data = {
   *        2011 : [1,2,3,4,5,6],
   *        2012 : [1,2,3,4,5,6],
   *        2013 : [1,2,3,4,5,6]
   *       }
   */
  useEffect(() => {
    if (!props.id || !props.config || !props.data || !chartContainer.current || !chartSvg.current) {
      return
    }

    const chart = select(chartContainer.current)

    // Remove older renderings
    chart.selectAll('text').remove()

    const cSvg = select(chartSvg.current)
    cSvg.selectAll('g').remove()

    chart.transition()

    // This will specify the aspect ratio not the actual size of the chart.
    // The svg is responsive and will scale to fill parent.
    const width = 480,
      height = 400,
      opacityHover = 1,
      otherOpacityOnHover = .8

    // Define x and y type and scales
    const x = d3.scaleLinear().rangeRound([0, width])
    const y = d3.scaleLinear().range([height, 0])

    const years = Object.getOwnPropertyNames(props.data)

    //  TODO globals for tooltip, will want to change
    // let totalCount = 0
    const startYear = years[0]
    const endYear = years[years.length - 1]

    const {data, totalCount} = processData(props.data, props.bucketSize)

    // Get and set domain
    const domain = getDomain(data)
    x.domain([domain.xMin + 1, domain.xMax + 2])
    y.domain([0, domain.yMax])

    // Create the x-axis
    const xAxis = d3.axisBottom(x)
      .ticks(5)
      .tickFormat((x) => { return dateFromDay(2018, (x as number) * props.bucketSize) })

    // Create the y-axis
    const yAxis = d3.axisLeft(y)

    const config = props.config
    // Create a responsive svg element
    const svg = cSvg.attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', () => '0 0 ' + (width + config.margins.left + config.margins.right) + ' ' + (height + config.margins.top + config.margins.bottom))
      .classed('svg-content-responsive', true)
      .attr('version', '1.1')
      .attr('baseProfile', 'full')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g')
      .attr('transform', () => 'translate(' + config.margins.left + ',' + 0 + ')')

    // Add the x-axis to the svg
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .attr('font-size', '11px')
      .call(xAxis)

    // Add the y-axis to the svg
    svg.append('g')
      .attr('transform', 'translate(' + -1 + ',' + 0 + ')')
      .attr('class', 'y axis')
      .attr('font-size', '11px')
      .call(yAxis)

    // Add the histogram bars
    const bars = svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('fill', 'rgb(56, 155, 198)')
      .attr('stroke', 'rgb(0, 0, 0)')
      .attr('x', (d: any) => x(d.day))
      .attr('width', width / (1 + (domain.xMax - domain.xMin)))
      .attr('y', (d: any) => y(d.count))
      .attr('height', (d: any) => height - y(d.count))

    // Add a div inside chart for tooltips
    const tooltip = d3.select('#d3chartTooltip')

    // Add tooltip functionality on mouseOver
    bars.on('mouseover', function (d) {
      chart.selectAll('rect')
        .style('opacity', otherOpacityOnHover)
      d3.select(this)
        .style('opacity', opacityHover)
      tooltip.transition()
        .duration(200)
        .style('opacity', .9)
      tooltip.html(toolTipLabel(d, totalCount, props.bucketSize, startYear, endYear))
        .style('left', (d.x) + 'px')
        .style('top', (d.y - 28) + 'px')
        .style('border', '3px solid rgb(56, 155, 198)')
    })

    // Add tooltip functionality on mouseOut
    bars.on('mouseout', function (d) {
      chart.selectAll('rect')
        .style('opacity', opacityHover)
      tooltip.transition()
        .duration(500)
        .style('opacity', 0)
    })

    // Add a label for the x-axis.
    svg.append('g')
      .append('text')
      .attr('y', height + config.margins.top + 25)
      .attr('x', width / 2)
      .attr('fill', 'rgb(0, 0, 0)')
      .attr('font-size', '14px')
      .style('text-anchor', 'middle')
      .text(config.xAxis.label)

    // Add a label for the y-axis.
    svg.append('g')
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - config.margins.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .attr('fill', 'rgb(0, 0, 0)')
      .attr('font-size', '14px')
      .style('text-anchor', 'middle')
      .text(config.yAxis.label)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, chartContainer.current, chartSvg.current])

  const processData = (rawData: any, factor: number) => {
    let days_of_year = [...Array(366)].map(v => 0) // Array of 366 0's
    let data = []
    let totalCount = 0
    for (let currentYear in rawData) {
      for (let i = 0; i < rawData[currentYear].length; i++) {
        days_of_year[rawData[currentYear][i]] += 1
        totalCount++
      }
    }
    let bucket_days_of_year = transformData(days_of_year, factor)
    for (let i = 0; i < bucket_days_of_year.length; i++) {
      let c = bucket_days_of_year[i]
      data.push({ day: i + 1, count: c })
    }
    return { data, totalCount }
  }

  const transformData = (rawData: any, factor: number) => {
    let transformedData = []
    for (let i = 0; i < rawData.length - factor; i += factor) {
      let sum = 0
      for (let j = 0; j < factor; j++) {
        sum += rawData[i + j]
      }
      transformedData.push(sum)
    }
    return transformedData
  }

  const getDomain = (rawData: any) => {
    let xMin = 365
    let xMax = 0
    let yMax = 0
    for (let i = 0; i < rawData.length; i++) {
      let c = rawData[i].count
      if (c > yMax) { yMax = c }
      if (c > 0 && i < xMin) { xMin = i }
      else if (c > 0 && i > xMax) { xMax = i }
    }
    return { xMin: xMin, xMax: xMax, yMax: yMax }
  }

  const toolTipLabel = (d: any, totalCount: number, bucketSize: number, startYear: string, endYear: string) => {
    let percentage: any = parseInt((parseInt(d.count) / totalCount * 100) + '')
    if (percentage < 1) {
      percentage = '< 1'
    }
    else {
      percentage = percentage.toString()
    }
    let count = `Number of Grid Cells: <label>${parseInt(d.count)} </label> of <label>${totalCount} </label> ( ~ ${percentage}%)<br />  Number of Grid Cells = values that occur ${dateFromDay(2018, (d.day * bucketSize) + 1)} to ${dateFromDay(2018, (d.day * bucketSize) + bucketSize)} for all selected years (${startYear} to ${endYear}). <br />`
    if (bucketSize === 1) {
      return ` <p>  Day: <label> ${dateFromDay(2018, d.day)} </label><br />${count} </p>`
    }
    else {
      return `<p> Days: <label> ${dateFromDay(2018, (d.day * bucketSize) + 1)} </label> to <label> ${dateFromDay(2018, (d.day * bucketSize) + bucketSize)} </label><br />${count} </p>`
    }
  }

  const dateFromDay = (year: number, day: number) => {
    const formatTime = d3.timeFormat('%b %d')
    let date = new Date(year, 0)
    return formatTime(new Date(date.setDate(day)))
  }

  // returns a promise with a dataURI - i.e. base 64 encoded PNG
  const print = (id: string) => {
    return new Promise((resolve, reject) => {
      try {
        // firefox issue where svgs wont draw to image without a width and height
        // if we include a width and height they become unresponsive
        const chartEl: any = d3.select(`#${id}ChartContainer .svg-container-chart`).node()!
        const currentWidth = chartEl.clientWidth
        const currentHeight = chartEl.clientHeight
        d3.select(`#${id}ChartContainer .svg-container-chart svg`)
          .attr('height', currentHeight)
          .attr('width', currentWidth)

        const canvasContainer = d3.select(`#${id}ChartContainer`)
          .append('div')
          .attr('class', `${id}Class`)
          .html(`<canvas id="canvas${id}" width="${currentWidth}" height="${currentHeight}" style="position: fixed;"></canvas>`)

        const canvas: any = document.getElementById(`canvas${id}`)!
        const image = new Image()
        image.onload = () => {
          canvas.getContext('2d').drawImage(image, 0, 0, currentWidth, currentHeight)
          canvasContainer.remove()
          d3.select(`#${id}ChartContainer .svg-container-chart svg`)
            .attr('height', null)
            .attr('width', null)
          resolve(canvas.toDataURL())
        }
        const svg = 'data:image/svg+xml,' + d3.select(`#${id}ChartContainer .svg-container-chart`).html().replace(/#/g, '%23')
        image.src = svg
      }
      catch (error) {
        reject(error)
      }
    })
  }

  return (
    <div>
      { props.data && 
        <div>
          <div ref={chartContainer} id={`${props.id}ChartContainer`} className="chart-container">
            <div style={{ display: props.config.chart.title ? 'block' : 'none' }} className="title">
              <span className="text">{props.config.chart.title}</span>
            </div>
            <div style={{ display: props.config.chart.subtitle ? 'block' : 'none' }} className="subtitle">
              <span className="text">{props.config.chart.subtitle}</span>
            </div>
            <div id={`${props.id}Chart`} className="chart">
              <div className="svg-container-chart">
                <svg ref={chartSvg} width={'100%'} height={'100%'}>
                </svg>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  )
})

export default HistogramChart
