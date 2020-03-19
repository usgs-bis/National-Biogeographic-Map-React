import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { select, scalePoint, scaleLinear, min, max, axisBottom, axisLeft, timeFormat, event } from 'd3'

import './Chart.css'
import { IChart, IDataSummary } from './Chart'

interface IBoxPlotData {
  key: number
  counts: number[]
  median: number
  q1: number
  q3: number
  min: number
  max: number
  outliers: {
    key: number
    value: number
  }[]
}

const BoxAndWhiskerChart = forwardRef((props: IChart, ref) => {
  const chartContainer = useRef<HTMLDivElement>(null)
  const chartSvg = useRef<SVGSVGElement>(null)
  useImperativeHandle(ref, () => ({
    print
  }), [])

  /**
   * Draw a Box and Whisker Chart
   * @param {string} id - name to prefix dom elements 
   * @param {*} config - used to style the chart
   * @param {*} data - used to build the chart
   * 
   * ex. congig = {
   *    margins:{left:1,right:10,top:1,bottom:20},
   *    chart: {title:"United States",subtitle:"Population over Time"},
   *    xAxis:{label:"Percent Population"},
   *    yAxis:{label:"State"}
   *     }
   * ex. data = {
   *    2011 : [1,2,3,4,5,6],
   *    2012 : [1,2,3,4,5,6]
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

    // This will specify the aspect ratio not the actual size of the chart.
    // The svg is responsive and will scale to fill parent.
    const width = 480,
      height = 400,
      opacityHover = 1,
      otherOpacityOnHover = .8

    const years = Object.getOwnPropertyNames(props.data)
    const reducer = (accumulator: number, currentValue: number) => accumulator + currentValue
    let dataSummary: IDataSummary = {}
    let yDomain = []

    // sort the data and produce summary statistics as well as determine y-domain 
    for (let year of years) {
      const sorted = props.data[year].sort((a: string, b: any) => (parseInt(a) < parseInt(b)) ? 1 : ((parseInt(b) < parseInt(a)) ? -1 : 0))
      yDomain.push(sorted[0])
      yDomain.push(sorted[sorted.length - 1])
      let summary = {
        mean: sorted.reduce(reducer, 0) / sorted.length,
        median: sorted[parseInt((sorted.length / 2) as any)],
        maximum: sorted[0],
        minimum: sorted[sorted.length - 1]
      }
      dataSummary[year] = summary
    }

    // Define x and y type and scales
    const x = scalePoint<number>()!
    const y = scaleLinear()

    // Set domain
    x.domain(Object.keys(props.data).map(d => parseInt(d)))
      .rangeRound([0, width])
      .padding(0.5)

    y.domain([min(yDomain) - 5, max(yDomain) + 5])
      .range([height, 0])

    // scale plot width to number of years
    const barWidth = (35 - years.length) > 5 ? (35 - years.length) : 5

    // Create the x-axis
    // sorry about the nested opps
    const xAxis = axisBottom(x)
      .tickFormat((d) => { return years.length > 20 ? d % 2 === 0 ? d.toString().slice(2) : ''  :  years.length > 10 ? d.toString().slice(2) : d.toString() })

    // Create the y-axis
    const yAxis = axisLeft(y)
      .ticks(5)
      .tickFormat((d: any) => dateFromDay(2018, d))

    // Prepare the data for the box plots
    let boxPlotData: IBoxPlotData[] = []
    for (let [key, groupCount] of Object.entries<number[]>(props.data)) {
      const keyInt = parseInt(key)
      const median = groupCount.length % 2 === 0 ? ((groupCount[(groupCount.length / 2) - 1] + groupCount[groupCount.length / 2]) / 2) : groupCount[Math.floor(groupCount.length / 2)]

      let medianIndexLT = groupCount.length % 2 === 0 ? groupCount.length / 2 : Math.floor(groupCount.length / 2)
      let q1_temp = groupCount.filter((g, i) => { return i > medianIndexLT })
      const q1 = q1_temp.length % 2 === 0 ? ((q1_temp[(q1_temp.length / 2) - 1] + q1_temp[q1_temp.length / 2]) / 2) : q1_temp[Math.floor(q1_temp.length / 2)]

      let medianIndexGT = groupCount.length % 2 === 0 ? (groupCount.length / 2 - 1) : Math.floor(groupCount.length / 2)
      let q3_temp = groupCount.filter((g, i) => { return i < medianIndexGT })
      const q3 = q3_temp.length % 2 === 0 ? ((q3_temp[(q3_temp.length / 2) - 1] + q3_temp[q3_temp.length / 2]) / 2) : q3_temp[Math.floor(q3_temp.length / 2)]

      const iqr = q3 - q1
      const cleanData = groupCount.filter(g => { return g > q1 - (1.5 * iqr) && g < q3 + (1.5 * iqr) })
      const outliersArr = groupCount.filter(g => { return g < q1 - (1.5 * iqr) || g > q3 + (1.5 * iqr) })
      const outliers = outliersArr.map((o) => { return { key: keyInt, value: o } })

      let record = {
        key: keyInt,
        counts: groupCount,
        median: median,
        q1: q1,
        q3: q3,
        min: min(cleanData)!,
        max: max(cleanData)!,
        outliers: outliers
      }
      boxPlotData.push(record)
    }

    const config = props.config
    const svg = cSvg
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 ' + (width + config.margins.left + config.margins.right) + ' ' + (height + config.margins.top + config.margins.bottom))
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

    // Setup the group the box plot elements will render in
    const g = svg.append('g')
      .attr('transform', `translate(-${parseInt((barWidth / 2) as any)},0)`)

    // Draw the box plot vertical lines
    g.selectAll('.verticalLines')!
      .data(boxPlotData)
      .enter()
      .append('line')
      .classed('bw-line', true)
      .attr('x1', datum => x(datum.key)! + barWidth / 2)
      .attr('y1', datum => y(datum.min))
      .attr('x2', datum => x(datum.key)! + barWidth / 2)
      .attr('y2', datum => y(datum.max))
      .attr('stroke', 'rgb(0,0,0)')
      .attr('stroke-width', 1)
      .attr('fill', 'none')

    // select the div inside chart for tooltips
    const tooltip = select('#d3chartTooltip')

    // Draw the boxes of the box plot on top of vertical lines
    const boxes = g.selectAll('rect')
      .data(boxPlotData)
      .enter()
      .append('rect')
      .attr('width', barWidth)
      .attr('height', datum => (y(datum.q1) - y(datum.q3)))
      .attr('x', datum => x(datum.key)!)
      .attr('y', datum => y(datum.q3))
      // .attr('fill', datum => datum.color)
      .attr('fill', 'rgb(56, 155, 198)')
      .attr('stroke', 'rgb(0,0,0)')
      .attr('stroke-width', 1)

    // Add tooltip functionality on mouseOver
    boxes.on('mouseover', function (d) {
      chart.selectAll('rect')
        .style('opacity', otherOpacityOnHover)
      select(this)
        .style('opacity', opacityHover)
      tooltip.transition()
        .duration(200)
        .style('opacity', .9)
      tooltip.html(toolTipLabel(d.key, dataSummary))
        .style('left', (event.pageX) + 'px')
        .style('top', (event.pageY - 28) + 'px')
        .style('border', '3px solid rgb(56, 155, 198)')
    })

    // Add tooltip functionality on mouseOut
    boxes.on('mouseout', () => {
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

      const xScale = {
        x1: (datum: IBoxPlotData) => x(datum.key)!,
        x2: (datum: IBoxPlotData) => x(datum.key)! + barWidth
      }

      // Now render all the horizontal lines  - the whiskers
      const horizontalLineConfigs = [
        // Top whisker
        {
          ...xScale,
          y1: (datum: IBoxPlotData) => y(datum.min),
          y2: (datum: IBoxPlotData) => y(datum.min)
        },
        // Bottom whisker
        {
          ...xScale,
          y1: (datum: IBoxPlotData) => y(datum.max),
          y2: (datum: IBoxPlotData) => y(datum.max)
        }
      ]

      horizontalLineConfigs.forEach(lineConfig => {
        // Draw the whiskers at the min for this series
        g.selectAll('.whiskers')
          .data(boxPlotData)
          .enter()
          .append('line')
          .classed('bw-line', true)
          .attr('x1', lineConfig.x1)
          .attr('y1', lineConfig.y1)
          .attr('x2', lineConfig.x2)
          .attr('y2', lineConfig.y2)
          .attr('stroke', 'rgb(0,0,0)')
          .attr('stroke-width', 1)
          .attr('fill', 'none')
      })

      g.selectAll('.whiskers')
        .data(boxPlotData)
        .enter()
        .append('g')
        .selectAll('circle')
        .data((d) => { return d.outliers })
        .enter()
        .append('circle')
        .classed('outliers', true)
        .attr('r', 2)
        .attr('cx', d => x(d.key)! + barWidth / 2)
        .attr('cy', d => y(d.value))
  
      // draw median line separate in red
      const median =
      {
        ...xScale,
        y1: (datum: IBoxPlotData) => y(datum.median),
        y2: (datum: IBoxPlotData) => y(datum.median)
      }
      g.selectAll('.whiskers')
        .data(boxPlotData)
        .enter()
        .append('line')
        .attr('x1', median.x1)
        .attr('y1', median.y1)
        .attr('x2', median.x2)
        .attr('y2', median.y2)
        .attr('stroke', 'rgb(255,0,0)')
        .attr('stroke-width', 1)
        .attr('fill', 'rgb(255, 0, 0)')
        .attr('class', ' boxAndWhiskerMedianLine')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, chartContainer.current, chartSvg.current])

  const dateFromDay = (year: number, day: number) => {
    const formatTime = timeFormat('%b %d')
    let date = new Date(year, 0)
    return formatTime(new Date(date.setDate(day)))
  }

  const toolTipLabel = (key: number, dataSummary: IDataSummary) => {
    return 'Year: <b>' + key + '</b><br>' +
      'Mean: <b>' + dateFromDay(key, dataSummary[key].mean) + '</b><br>' +
      'Median: <b>' + dateFromDay(key, dataSummary[key].median) + '</b><br>' +
      'Minimum: <b>' + dateFromDay(key, dataSummary[key].minimum) + '</b><br>' +
      'Maximum: <b>' + dateFromDay(key, dataSummary[key].maximum) + '</b><br>'
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

        const canvas: any = document.getElementById(`canvas${id}`)
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

export default BoxAndWhiskerChart