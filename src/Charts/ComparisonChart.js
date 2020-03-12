import React from 'react'
import * as d3 from 'd3'
import './Chart.css'

class ComparisonChart extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            id: null,
            config: null,
            data: null
        }
        this.drawChart = this.drawChart.bind(this)
        this.print = this.print.bind(this)
    }

    componentDidUpdate() {
        if (this.state.data !== this.props.data) {
            this.setState({
                id: this.props.id,
                config: this.props.config,
                data: this.props.data,
            }, () => {
                this.drawChart(this.props.id, this.props.config, this.props.data)

            })
        }
    }

    /**
  * Draw a Comparison Plot
  * @param {string} id - name to prefix dom elements 
  * @param {*} config - used to style the chart
  * @param {*} data - used to build the chart
  * 
  * ex. congig = {
  *        margins:{left:1,right:10,top:1,bottom:20},
  *        chart: {title:"United States",subtitle:"Population over Time"},
  *        xAxis:{label:"Percent Population"},
  *        yAxis:{label:"State"}
  *       }
  * ex. data = { 
  *         leaf: {
  *             2011 : [1,2,3,4,5,6],
  *             2012 : [1,2,3,4,5,6],
  *             2013 : [1,2,3,4,5,6]
  *         },
  *         bloom: {
  *             2011 : [1,2,3,4,5,6],
  *             2012 : [1,2,3,4,5,6],
  *             2013 : [1,2,3,4,5,6]
  *         }
  *       }
  */
    drawChart(id, config, data) {

        const chart = d3.select(`#${id}ChartContainer`)

        // Remove older renderings
        chart.selectAll('text').remove()
        chart.select(`#${id}Chart`).selectAll('div').remove()
        chart.select('.svg-container-chart').remove()

        if (!id || !config || !data || !data.leaf || !data.bloom) return

        // Title
        chart.select(`#${id}Title`).append('text')
            .text(config.chart.title)

        // Subtitle
        chart.select(`#${id}Subtitle`).append('text')
            .text(config.chart.subtitle)

        chart.transition()

        const years = Object.getOwnPropertyNames(data.leaf)

        data = processData([data.leaf, data.bloom])

        const dataNest = d3.nest()
            .key(function (d) { return d.year })
            .entries(data)

        dataNest.reverse()

        // This will specify the aspect ratio not the actual size of the chart.
        // The svg is responsive and will scale to fill parent.
        const width = 480,
            height = 40 * years.length,
            opacityHover = 1,
            otherOpacityOnHover = .8

        // Define x and y type and scales
        const x = d3.scaleLinear().range([0, width])
        const y = d3.scaleBand().range([height, 0])

        // Determine domain 
        let domain = getMinMax(dataNest)
        x.domain([domain.dayMin - 3, domain.dayMax + 3])
        y.domain(years.map(function (y) { return y.toString() }))

        // Create the x-axis
        const xAxis = d3.axisBottom(x)
            .ticks(5)
            .tickFormat(x => { return dateFromDay(2018, (x)) })

        // Create the y-axis
        const yAxis = d3.axisLeft(y)

        // Create a responsive svg element
        const svg = chart.select(`#${id}Chart`)
            .append('div')
            .classed('svg-container-chart', true)
            .append('svg')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', '0 ' + parseInt(-1 * config.margins.top) + ' ' + (width + config.margins.left + config.margins.right) + ' ' + (height + config.margins.top + config.margins.bottom))
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
            .attr('transform', function (d, i) { return 'translate(' + 0 + ',' + parseInt((i * y.bandwidth()) - 16) + ')' })
            .each(function (year) {
                year.y = d3.scaleLinear()
                    .domain([0, d3.max(year.values, function (d) { return d.value })])
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
        const tooltip = d3.select('#d3chartTooltip')

        compare.append('text')
            .attr('x', function (d) {
                return x(((d.values[1].DOY + d.values[0].DOY) / 2) - 4)
            })
            .attr('y', 27)
            .attr('dy', '.35em')
            .attr('font-size', '12px')
            .text(function (d) { return parseInt((d.values[1].DOY - d.values[0].DOY)) + ' Days' })


        // Add tooltip functionality on mouseOver
        leaf.on('mouseover', function (d) {
            chart.selectAll('circle')
                .style('opacity', otherOpacityOnHover)
            d3.select(this)
                .style('opacity', opacityHover)
            tooltip.transition()
                .duration(200)
                .style('opacity', .9)
            tooltip.html(toolTipLabel(d, 'LEAF'))
                .style('left', (d3.event.pageX) + 'px')
                .style('top', (d3.event.pageY - 28) + 'px')
                .style('border', '3px solid green')
        })

        // Add tooltip functionality on mouseOut
        leaf.on('mouseout', function (d) {
            d3.select(this)
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
            d3.select(this)
                .style('opacity', opacityHover)
            tooltip.transition()
                .duration(200)
                .style('opacity', .9)
            tooltip.html(toolTipLabel(d, 'BLOOM'))
                .style('left', (d3.event.pageX) + 'px')
                .style('top', (d3.event.pageY - 28) + 'px')
                .style('border', '3px solid yellow')
        })

        // Add tooltip functionality on mouseOut
        bloom.on('mouseout', function (d) {
            d3.select(this)
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

        function toolTipLabel(d, type) {
            let idx = type === 'LEAF' ? 0 : 1
            let title = type === 'LEAF' ? 'First Leaf' : 'First Bloom'

            return `
                    <b>${title}</b><br>
                    Year: <b>${d.key}</b><br>
                    Mean: <b>${dateFromDay(d.key, d.values[idx].DOY)} </b><br>
                    Minimum: <b>${dateFromDay(d.key, d.values[idx].min)} </b><br>
                    Maximum: <b>${dateFromDay(d.key, d.values[idx].max)} </b><br>
                    `
        }

        function dateFromDay(year, day) {
            const formatTime = d3.timeFormat('%b %d')
            let date = new Date(year, 0)
            return formatTime(new Date(date.setDate(day)))
        }

        function processData(rawData) {
            let processedData = []
            for (let currentYear in rawData[0]) {
                let adv = rawData[0][currentYear].reduce(getSum, 0) / rawData[0][currentYear].length
                let min = rawData[0][currentYear].reduce((a, b) => Math.min(a, b), 0)
                let max = rawData[0][currentYear].reduce((a, b) => Math.max(a, b), 0)
                processedData.push({ year: currentYear, DOY: adv, value: 15, min: min, max: max })
            }
            for (let currentYear in rawData[1]) {
                let adv = rawData[1][currentYear].reduce(getSum, 0) / rawData[1][currentYear].length
                let min = rawData[1][currentYear].reduce((a, b) => Math.min(a, b), 0)
                let max = rawData[1][currentYear].reduce((a, b) => Math.max(a, b), 0)
                processedData.push({ year: currentYear, DOY: adv, value: 15, min: min, max: max })
            }
            return processedData

            function getSum(total, num) {
                return total + num
            }
        };

        function getMinMax(rawData) {
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

    }

    // returns a promise with a dataURI - i.e. base 64 encoded PNG
    print(id) {
        return new Promise((resolve, reject) => {
            try {
                const canvasContainer = d3.select(`#${id}ChartContainer`)
                    .append('div')
                    .attr('class', `${id}Class`)
                    .html(`<canvas id="canvas${id}" width="800" height="800" style="position: fixed;"></canvas>`)

                //firefox issue where svgs wont draw to image without a width and height
                // if we include a with and height they become unresponsive
                const currentWidth = d3.select(`#${id}ChartContainer .svg-container-chart`).node().clientWidth
                const currentHeight = d3.select(`#${id}ChartContainer .svg-container-chart`).node().clientHeight
                d3.select(`#${id}ChartContainer .svg-container-chart svg`)
                    .attr('height', currentHeight)
                    .attr('width', currentWidth)

                const canvas = document.getElementById(`canvas${id}`)
                const image = new Image()
                image.onload = () => {
                    canvas.getContext('2d').drawImage(image, 0, 0, 800, 800)
                    canvasContainer.remove()
                    d3.select(`#${id}ChartContainer .svg-container-chart svg`)
                        .attr('height', null)
                        .attr('width', null)
                    resolve(canvas.toDataURL())
                }
                const svg = 'data:image/svg+xml,' + d3.select(`#${id}ChartContainer .svg-container-chart`).html()
                image.src = svg
            }
            catch (error) { reject(error) }
        })
    }

    render() {
        const divs = () => {
            if (this.props.data) {
                const id = this.props.id
                return (
                    <div>
                        <div id={id + 'ChartContainer'} className="chart-container">
                            <div
                                style={{ display: this.props.config.chart.title ? 'block' : 'none' }}
                                id={id + 'Title'} className="title"></div>
                            <div
                                style={{ display: this.props.config.chart.subtitle ? 'block' : 'none' }}
                                id={id + 'Subtitle'} className="subtitle"></div>
                            <div id={id + 'Chart'} className="chart"></div>
                        </div>
                    </div>
                )
            }
        }
        return (
            <div>
                {divs()}
            </div>
        )
    }
}
export default ComparisonChart