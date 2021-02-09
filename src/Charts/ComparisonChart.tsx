import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react'
import './Chart.css'
import { IChart } from './Chart'
import { select, nest, scaleLinear, scaleBand, axisBottom, timeFormat, axisLeft, max } from 'd3'

interface IComparisonChartData {
  year: number
  DOY: number
  value: number
  min: number
  max: number
}

const ComparisonChart = forwardRef((props: IChart, ref) => {
  const chartContainer = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => ({
    print
  }), [])

  /**
  * Draw a Comparison Plot
  * @param {string} id - name to prefix dom elements 
  * @param {*} config - used to style the chart
  * @param {*} data - used to build the chart
  * 
  * ex. config = {
  *    margins:{left:1,right:10,top:1,bottom:20},
  *    chart: {title:"United States",subtitle:"Population over Time"},
  *    xAxis:{label:"Percent Population"},
  *    yAxis:{label:"State"}
  * }
  * ex. data = { 
  *     leaf: {
  *       2011 : [1,2,3,4,5,6],
  *       2012 : [1,2,3,4,5,6],
  *       2013 : [1,2,3,4,5,6]
  *     },
  *     bloom: {
  *       2011 : [1,2,3,4,5,6],
  *       2012 : [1,2,3,4,5,6],
  *       2013 : [1,2,3,4,5,6]
  *     }
  * }
  */
  useEffect(() => {
    if (!props.id || !props.config || !props.data || !props.data.leaf || !props.data.bloom || !chartContainer.current || !chartRef.current) {
      return
    }

    const chart = select(chartContainer.current)

    // Remove older renderings
    chart.selectAll('text').remove()

    const chartDiv = select(chartRef.current)
    chartDiv.selectAll('div').remove()
    chart.select('.svg-container-chart').remove()

    chart.transition()

    const years = Object.getOwnPropertyNames(props.data.leaf)

    const data = processData(props.data.leaf, props.data.bloom)

    const dataNest = nest()
      .key((d: any) => d.year)
      .entries(data)

    dataNest.reverse()

    // This will specify the aspect ratio not the actual size of the chart.
    // The svg is responsive and will scale to fill parent.
    const width = 480,
      height = 40 * years.length,
      opacityHover = 1,
      otherOpacityOnHover = .8

    // Define x and y type and scales
    const x = scaleLinear().range([0, width])
    const y = scaleBand().range([height, 0])

    // Determine domain 
    let domain = getMinMax(dataNest)
    x.domain([domain.dayMin - 3, domain.dayMax + 3])
    y.domain(years.map(function (y) { return y.toString() }))

    // Create the x-axis
    const xAxis = axisBottom(x)
      .ticks(5)
      .tickFormat((x: any) => dateFromDay(2018, x))

    // Create the y-axis
    const yAxis = axisLeft(y)

    const config = props.config
    // Create a responsive svg element
    const svg = chartDiv
      .append('div')
      .classed('svg-container-chart', true)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 ' + -1 * config.margins.top + ' ' + (width + config.margins.left + config.margins.right) + ' ' + (height + config.margins.top + config.margins.bottom))
      .classed('svg-content-responsive', true)
      .attr('version', '1.1')
      .attr('baseProfile', 'full')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g')
      .attr('transform', 'translate(' + config.margins.left + ',' + 0 + ')')

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

    // Add the horizontal bars
    const compare = svg.selectAll('smooth')
      .data(dataNest)
      .enter()
      .append('g')
      .attr('transform', function (d, i) { return 'translate(' + 0 + ',' + parseInt(((i * y.bandwidth()) - 16) as any) + ')' })
      .each((year: any) => {
        year.y = scaleLinear()
          .domain([0, parseInt(max(year.values, (d: any) => d.value) as any)])
          .range([y.bandwidth(), 0])
      })
    
    // add the line
    compare.append('line')
      .attr('stroke', 'rgb(56, 155, 198)')
      .attr('stroke-width', '3')
      .attr('x1', function (d) { return x(d.values[0].DOY) })
      .attr('x2', function (d) { return x(d.values[1].DOY) })
      .attr('y1', 37)
      .attr('y2', 37)

    // add left leaf circle
    const leaf = compare.append('circle')
      .attr('r', 8)
      .attr('cx', function (d) {
        return x(d.values[0].DOY)
      })
      .attr('cy', 37)
      .attr('fill', 'green')

    // add right bloom circle
    const bloom = compare.append('circle')
      .attr('r', 8)
      .attr('cx', function (d) {
        return x(d.values[1].DOY)
      })
      .attr('cy', 37)
      .attr('fill', 'yellow')

    // Add a div inside chart for tooltips
    const tooltip = select('#d3chartTooltip')

    compare.append('text')
      .attr('x', function (d) {
        return x(((d.values[1].DOY + d.values[0].DOY) / 2) - 4)
      })
      .attr('y', 27)
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .text(function (d) { return parseInt((d.values[1].DOY - d.values[0].DOY) as any) + ' Days' })

    // Add tooltip functionality on mouseOver
    leaf.on('mouseover', function (d) {
      chart.selectAll('circle')
        .style('opacity', otherOpacityOnHover)
      select(this)
        .style('opacity', opacityHover)
      tooltip.transition()
        .duration(200)
        .style('opacity', .9)
      tooltip.html(toolTipLabel(d, 'LEAF'))
        .style('left', (d.x) + 'px')
        .style('top', (d.y - 28) + 'px')
        .style('border', '3px solid green')
    })

    // Add tooltip functionality on mouseOut
    leaf.on('mouseout', function (d) {
      select(this)
        .attr('stroke-width', '1')
        .attr('stroke', 'rgb(0, 0, 0,.2)')
      chart.selectAll('circle')
        .style('opacity', opacityHover)
      tooltip.transition()
        .duration(500)
        .style('opacity', 0)
    })

    // Add tooltip functionality on mouseOver
    bloom.on('mouseover', function (d) {
      chart.selectAll('circle')
        .style('opacity', otherOpacityOnHover)
      select(this)
        .style('opacity', opacityHover)
      tooltip.transition()
        .duration(200)
        .style('opacity', .9)
      tooltip.html(toolTipLabel(d, 'BLOOM'))
        .style('left', (d.x) + 'px')
        .style('top', (d.y - 28) + 'px')
        .style('border', '3px solid yellow')
    })

    // Add tooltip functionality on mouseOut
    bloom.on('mouseout', function (d) {
      select(this)
        .attr('stroke-width', '1')
        .attr('stroke', 'rgb(0, 0, 0,.2)')
      chart.selectAll('circle')
        .style('opacity', opacityHover)
      tooltip.transition()
        .duration(500)
        .style('opacity', 0)
    })

    // Add a label for the x-axis.
    svg.append('g')
      .append('text')
      .attr('y', height + config.margins.top + 20)
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
  }, [props, chartContainer.current, chartRef.current])

  const processData = (leaf: {[key: string]: number[]}, bloom: {[key: number]: number[]}): IComparisonChartData[] => {
    let processedData = []
    const getSum = (total: number, num: number) => total + num
    for (let currentYear in leaf) {
      let adv = leaf[currentYear].reduce(getSum, 0) / leaf[currentYear].length
      let min = leaf[currentYear].reduce((a, b) => Math.min(a, b), 0)
      let max = leaf[currentYear].reduce((a, b) => Math.max(a, b), 0)
      processedData.push({ year: parseInt(currentYear), DOY: adv, value: 15, min: min, max: max })
    }
    for (let currentYear in bloom) {
      let adv = bloom[currentYear].reduce(getSum, 0) / bloom[currentYear].length
      let min = bloom[currentYear].reduce((a, b) => Math.min(a, b), 0)
      let max = bloom[currentYear].reduce((a, b) => Math.max(a, b), 0)
      processedData.push({ year: parseInt(currentYear), DOY: adv, value: 15, min: min, max: max })
    }
    return processedData
  }

  const getMinMax = (rawData: any) => {
    let min = 365
    let max = 0
    for (let i = 0; i < rawData.length; i++) {
      for (let j = 0; j < rawData[i].values.length; j++) {
        let v = rawData[i].values[j].DOY
        if (v < min) {
          min = v
        }
        else if (v > max) {
          max = v
        }
      }
    }

    return { dayMin: min, dayMax: max }
  }

  const dateFromDay = (year: number, day: number) => {
    const formatTime = timeFormat('%b %d')
    let date = new Date(year, 0)
    return formatTime(new Date(date.setDate(day)))
  }

  const toolTipLabel = (d: any, type: string) => {
    const idx = type === 'LEAF' ? 0 : 1
    const title = type === 'LEAF' ? 'First Leaf' : 'First Bloom'

    return `
        <b>${title}</b><br>
        Year: <b>${d.key}</b><br>
        Mean: <b>${dateFromDay(d.key, d.values[idx].DOY)} </b><br>
        Minimum: <b>${dateFromDay(d.key, d.values[idx].min)} </b><br>
        Maximum: <b>${dateFromDay(d.key, d.values[idx].max)} </b><br>
        `
  }

  // returns a promise with a dataURI - i.e. base 64 encoded PNG
  const print = (id: string) => {
    return new Promise((resolve, reject) => {
      try {
        const canvasContainer = select(`#${id}ChartContainer`)
          .append('div')
          .attr('class', `${id}Class`)
          .html(`<canvas id="canvas${id}" width="800" height="800" style="position: fixed;"></canvas>`)

        //firefox issue where svgs wont draw to image without a width and height
        // if we include a with and height they become unresponsive
        const chartEl: any = select(`#${id}ChartContainer .svg-container-chart`).node()!
        const currentWidth = chartEl.clientWidth
        const currentHeight = chartEl.clientHeight
        select(`#${id}ChartContainer .svg-container-chart svg`)
          .attr('height', currentHeight)
          .attr('width', currentWidth)

        const canvas: any = document.getElementById(`canvas${id}`)!
        const image = new Image()
        image.onload = () => {
          canvas.getContext('2d').drawImage(image, 0, 0, 800, 800)
          canvasContainer.remove()
          select(`#${id}ChartContainer .svg-container-chart svg`)
            .attr('height', null)
            .attr('width', null)
          resolve(canvas.toDataURL())
        }
        const svg = 'data:image/svg+xml,' + select(`#${id}ChartContainer .svg-container-chart`).html()
        image.src = svg
      }
      catch (error) { reject(error) }
    })
  }

  return (
    <div>
      { props.data &&
        <div>
          <div ref={chartContainer} id={props.id + 'ChartContainer'} className="chart-container">
            <div style={{ display: props.config.chart.title ? 'block' : 'none' }} className="title">
              <span className="text">{props.config.chart.title}</span>
            </div>
            <div style={{ display: props.config.chart.subtitle ? 'block' : 'none' }} className="subtitle">
              <span className="text">{props.config.chart.subtitle}</span>
            </div>
            <div ref={chartRef} id={props.id + 'Chart'} className="chart"></div>
          </div>
        </div>
      }
    </div>
  )
})

export default ComparisonChart