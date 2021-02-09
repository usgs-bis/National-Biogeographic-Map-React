import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react'
import { select, nest, scaleLinear, scaleBand, axisBottom, axisLeft, timeFormat, max, area, curveBasis } from 'd3'
import './Chart.css'
import { IChart, IDataSummary } from './Chart'

export interface IRidgelinePlotChartProps extends IChart {
  bucketSize: number
}

const RidgelinePlotChart = forwardRef((props: IRidgelinePlotChartProps, ref) => {
  const chartContainer = useRef<HTMLDivElement>(null)
  const chartSvg = useRef<SVGSVGElement>(null)
  useImperativeHandle(ref, () => ({
    print
  }), [])

  /**
  * Draw a Ridgeline Plot
  * @param {string} id - name to prefix dom elements 
  * @param {*} config - used to style the chart
  * @param {*} data - used to build the chart
  * @param {*} bucketSize - used to buld histogram
  * 
  * ex. congig = {
  *    margins:{left:1,right:10,top:1,bottom:20},
  *    chart: {title:"United States",subtitle:"Population over Time"},
  *    xAxis:{label:"Percent Population"},
  *    yAxis:{label:"State"}
  *     }
  * ex. data = {
  *    2011 : [1,2,3,4,5,6],
  *    2012 : [1,2,3,4,5,6],
  *    2013 : [1,2,3,4,5,6]
  *     }
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

    const years = Object.getOwnPropertyNames(props.data)
    const reducer = (accumulator: number, currentValue: number) => accumulator + currentValue
    let dataSummary: IDataSummary = {}

    // sort the data and produce summary statistics
    for (let year of years) {
      const sorted = props.data[year].sort((a: string, b: any) => (parseInt(a) < parseInt(b)) ? 1 : ((parseInt(b) < parseInt(a)) ? -1 : 0))
      let summary = {
        mean: sorted.reduce(reducer, 0) / sorted.length,
        median: sorted[parseInt((sorted.length / 2) as any)],
        maximum: sorted[0],
        minimum: sorted[sorted.length - 1]
      }
      dataSummary[year] = summary
    }

    const smoothData = processData(props.data, props.bucketSize)

    const dataNest = nest()
      .key((d: any) => d.year )
      .entries(smoothData)

    dataNest.reverse()

    // This will specify the aspect ratio not the actual size of the chart.
    // The svg is responsive and will scale to fill parent.
    const width = 480,
      height = 40 * years.length,
      overlapFactor = 1.5,
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
      .tickFormat(x => { return dateFromDay(2018, (x as number) * props.bucketSize) })

    // Create the y-axis
    const yAxis = axisLeft(y)

    const config = props.config
    // Create a responsive svg element
    const svg = cSvg
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
    const smooth = svg.selectAll('smooth')
      .data(dataNest)
      .enter()
      .append('g')
      .attr('transform', function (d, i) { return 'translate(' + 0 + ',' + parseInt(((i * y.bandwidth()) - 39) as any) + ')' })
      .each((year: any) => {
        year.y = scaleLinear()
          .domain([0, parseInt(max(year.values, (d: any) => d.value) as any)])
          .range([y.bandwidth() * overlapFactor, 0])
      })

    // clip rectangle
    smooth.append('defs')
      .append('clipPath')
      .attr('id', `cut-off-path${props.id}`)
      .append('rect')
      .attr('width', width)
      .attr('height', y.bandwidth() * overlapFactor)


    // set the gradient
    smooth.append('linearGradient')
      .attr('id', `area-gradient${props.id}`)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', x(0)).attr('y1', 0)
      .attr('x2', x(365 / props.bucketSize)).attr('y2', 0)
      .selectAll('stop')
      .data([
        { offset: '0.000000000%', color: 'rgb(204, 76, 3)' }, // Jan 1
        { offset: '4.166666700%', color: 'rgb(236, 111, 20)' },
        { offset: '8.333333400%', color: 'rgb(248, 152, 43)' }, // Feb 1
        { offset: '12.50000010%', color: 'rgb(250, 196, 80)' },
        { offset: '16.66666680%', color: 'rgb(252, 228, 144)' }, // Mar 1
        { offset: '20.83333350%', color: 'rgb(253, 247, 188)' },
        { offset: '25.00000020%', color: 'rgb(237, 248, 178)' }, // Apr 1
        { offset: '29.16666690%', color: 'rgb(217, 240, 163)' },
        { offset: '33.33333360%', color: 'rgb(173, 221, 142)' }, // May 1
        { offset: '37.50000030%', color: 'rgb(120, 198, 120)' },
        { offset: '41.66666700%', color: 'rgb(65, 171, 93)' }, // Jun 1
        { offset: '45.83333370%', color: 'rgb(122, 204, 196)' },
        { offset: '50.00000040%', color: 'rgb(65, 182, 197)' }, // Jly 1
        { offset: '54.16666710%', color: 'rgb(48, 144, 192)' },
        { offset: '58.33333380%', color: 'rgb(34, 94, 168)' }, // Aug 1
        { offset: '62.50000050%', color: 'rgb(37, 52, 148)' },
        { offset: '66.66666720%', color: 'rgb(9, 30, 88)' }  // Sep 1
      ])
      .enter().append('stop')
      .attr('offset', function (d) { return d.offset })
      .attr('stop-color', function (d) { return d.color })

    // area fill
    const path = smooth.append('path')
      .attr('fill', `url(#area-gradient${props.id})`)
      .attr('stroke', 'rgb(0, 0, 0,.2)')
      .attr('stroke-width', '1')
      .attr('class', 'area')
      .attr('clip-path', `url(#cut-off-path${props.id})`)
      .attr('d', (year: any) => {
        return area()
          .curve(curveBasis)
          .x((d: any) => x(d.DOY))
          .y1((d: any) => year.y(d.value))
          .y0(height)(year.values)
      })

    // Add a div inside chart for tooltips
    const tooltip = select('#d3chartTooltip')

    // Add tooltip functionality on mouseOver
    path.on('mouseover', function (d) {
      chart.selectAll('path')
        .style('opacity', otherOpacityOnHover)
      select(this)
        .style('opacity', opacityHover)
      select(this)
        .attr('stroke-width', '2')
        .attr('stroke', 'rgb(0, 0, 0,1)')
      tooltip.transition()
        .duration(200)
        .style('opacity', .9)
      tooltip.html(toolTipLabel(d, dataSummary))
        .style('left', (d.x) + 'px')
        .style('top', (d.y - 28) + 'px')
        .style('border', '3px solid rgb(217, 240, 163)')
    })

    // Add tooltip functionality on mouseOut
    path.on('mouseout', function (d) {
      select(this)
        .attr('stroke-width', '1')
        .attr('stroke', 'rgb(0, 0, 0,.2)')
      chart.selectAll('path')
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
  }, [props, chartContainer.current, chartSvg.current])

  const processData = (rawData: any, factor: number) => {
    let processedData = []
    for (let currentYear in rawData) {
      let days_of_year = [...Array(366)].map(v => 0) // Array of 366 0's
      for (let i = 0; i < rawData[currentYear].length; i++) {
        days_of_year[rawData[currentYear][i]] += 1
      }
      let bucket_days_of_year = transformData(days_of_year, factor)
      for (let i = 0; i < bucket_days_of_year.length; i++) {
        let v = bucket_days_of_year[i]
        let d = i + 1
        processedData.push({ year: currentYear, DOY: d, value: v })
      }
    }
    return processedData
  }

  const transformData = (rawData: any, factor: number) => {
    let transformedData = []
    for (let i = 0; i < rawData.length - factor; i += factor) {
      let sum = 0
      for (let j = 0; j < factor; j++) {
        sum += rawData[i + j]
      }
      transformedData.push(sum / factor)
    }
    return transformedData
  }

  const getMinMax = (rawData: any) => {
    let min = 365
    let max = 0
    for (let i = 0; i < rawData.length; i++) {
      for (let j = 0; j < rawData[i].values.length; j++) {
        let v = rawData[i].values[j].value
        if (v > 0 && j < min) {
          min = j
        }
        else if (v > 0 && j > max) {
          max = j
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

  const toolTipLabel = (d: any, dataSummary: IDataSummary) => {
    return 'Year: <b>' + d.key + '</b><br>' +
      'Mean: <b>' + dateFromDay(d.key, dataSummary[d.key].mean) + '</b><br>' +
      'Median: <b>' + dateFromDay(d.key, dataSummary[d.key].median) + '</b><br>' +
      'Minimum: <b>' + dateFromDay(d.key, dataSummary[d.key].minimum) + '</b><br>' +
      'Maximum: <b>' + dateFromDay(d.key, dataSummary[d.key].maximum) + '</b><br>'
  }

  // returns a promise with a dataURI - i.e. base 64 encoded PNG
  const print = (id: string) => {
    return new Promise((resolve, reject) => {
      try {
        // firefox issue where svgs wont draw to image without a width and height
        // if we include a with and height they become unresponsive
        const chartEl: any = select(`#${id}ChartContainer .svg-container-chart`).node()!
        const currentWidth = chartEl.clientWidth
        const currentHeight = chartEl.clientHeight
        select(`#${id}ChartContainer .svg-container-chart svg`)
          .attr('height', currentHeight)
          .attr('width', currentWidth)

        const canvasContainer = select(`#${id}ChartContainer`)
          .append('div')
          .attr('class', `${id}Class`)
          .html(`<canvas id="canvas${id}" width="${currentWidth}" height="${currentHeight}" style="position: fixed;"></canvas>`)

        const canvas: any = document.getElementById(`canvas${id}`)!
        const image = new Image()
        image.onload = () => {
          canvas.getContext('2d').drawImage(image, 0, 0, currentWidth, currentHeight)
          canvasContainer.remove()
          select(`#${id}ChartContainer .svg-container-chart svg`)
            .attr('height', null)
            .attr('width', null)
          resolve(canvas.toDataURL())
        }
        const svg = 'data:image/svg+xml,' + select(`#${id}ChartContainer .svg-container-chart`).html().replace(/#/g, '%23')
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
          <div ref={chartContainer} id={props.id + 'ChartContainer'} className="chart-container">
            <div style={{ display: props.config.chart.title ? 'block' : 'none' }} className="title">
              <span className="text">{props.config.chart.title}</span>
            </div>
            <div style={{ display: props.config.chart.subtitle ? 'block' : 'none' }} className="subtitle">
              <span className="text">{props.config.chart.subtitle}</span>
            </div>
            <div id={props.id + 'Chart'} className="chart">
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

export default RidgelinePlotChart