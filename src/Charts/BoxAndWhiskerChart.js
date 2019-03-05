import React from "react";
import * as d3 from "d3";

import "./Chart.css"

class BoxAndWhiskerChart extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            id: null,
            config: null,
            data: null
        }
        this.drawChart = this.drawChart.bind(this);
        this.print = this.print.bind(this)
    }

    componentDidMount() {
        this.props.onRef(this)

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
   * Draw a Box and Whisker Chart
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
   *        2011 : [1,2,3,4,5,6],
   *        2012 : [1,2,3,4,5,6]
   *        2013 : [1,2,3,4,5,6]
   *       }
   */
    drawChart(id, config, data) {

        const chart = d3.select(`#${id}ChartContainer`)

        // Remove older renderings
        chart.selectAll("text").remove()
        chart.select(`#${id}Svg`).selectAll("g").remove()

        if (!id || !config || !data) return


        // Title
        chart.select(`#${id}Title`).append("text")
            .text(config.chart.title);

        // Subtitle
        chart.select(`#${id}Subtitle`).append("text")
            .text(config.chart.subtitle);

        chart.transition()

        // This will specify the aspect ratio not the actual size of the chart.
        // The svg is responsive and will scale to fill parent.
        const width = 480,
            height = 400,
            opacityHover = 1,
            otherOpacityOnHover = .8;

        const years = Object.getOwnPropertyNames(data)
        const reducer = (accumulator, currentValue) => accumulator + currentValue;
        let dataSummary = {}
        let yDomain = []

        // sort the data and produce summary statistics as well as determine y-domain 
        for (let year of years) {
            data[year].sort((a, b) => (parseInt(a) < parseInt(b)) ? 1 : ((parseInt(b) < parseInt(a)) ? -1 : 0));
            yDomain.push(data[year][0])
            yDomain.push(data[year][data[year].length - 1])
            let summary = {
                mean: data[year].reduce(reducer, 0) / data[year].length,
                median: data[year][parseInt(data[year].length / 2)],
                maximum: data[year][0],
                minimum: data[year][parseInt(data[year].length - 1)]
            }
            dataSummary[year] = summary
        }

        // Define x and y type and scales
        const x = d3.scalePoint();
        const y = d3.scaleLinear();

        // Set domain
        x.domain(Object.keys(data))
            .rangeRound([0, width])
            .padding([0.5]);

        y.domain([d3.min(yDomain) - 5, d3.max(yDomain) + 5])
            .range([height, 0]);

        // scale plot width to number of years
        const barWidth = (35 - years.length) > 5 ? (35 - years.length) : 5

        // Create the x-axis
        // sorry about the nested opps
        const xAxis = d3.axisBottom(x)
            .tickFormat((d) => { return years.length > 20 ? parseInt(d) % 2 === 0 ? d.toString().slice(2) : ''  :  years.length > 10 ? d.toString().slice(2) : d });

        // Create the y-axis
        const yAxis = d3.axisLeft(y)
            .ticks(5)
            .tickFormat((d) => { return dateFromDay(2018, (d)) });

        // Prepare the data for the box plots
        let boxPlotData = [];
        for (let [key, groupCount] of Object.entries(data)) {
            const median = groupCount.length % 2 === 0 ? ((groupCount[(groupCount.length / 2) - 1] + groupCount[groupCount.length / 2]) / 2) : groupCount[Math.floor(groupCount.length / 2)]

            let medianIndexLT = groupCount.length % 2 === 0 ? groupCount.length / 2 : Math.floor(groupCount.length / 2)
            let q1_temp = groupCount.filter((g, i) => { return i > medianIndexLT })
            const q1 = q1_temp.length % 2 === 0 ? ((q1_temp[(q1_temp.length / 2) - 1] + q1_temp[q1_temp.length / 2]) / 2) : q1_temp[Math.floor(q1_temp.length / 2)]

            let medianIndexGT = groupCount.length % 2 === 0 ? (groupCount.length / 2 - 1) : Math.floor(groupCount.length / 2)
            let q3_temp = groupCount.filter((g, i) => { return i < medianIndexGT })
            const q3 = q3_temp.length % 2 === 0 ? ((q3_temp[(q3_temp.length / 2) - 1] + q3_temp[q3_temp.length / 2]) / 2) : q3_temp[Math.floor(q3_temp.length / 2)]

            const iqr = q3 - q1
            const cleanData = groupCount.filter(g => { return g > q1 - (1.5 * iqr) && g < q3 + (1.5 * iqr) })
            let outliers = groupCount.filter(g => { return g < q1 - (1.5 * iqr) || g > q3 + (1.5 * iqr) })
            outliers = outliers.map((o) => { return { key: key, value: o } })

            let record = {
                key: key,
                counts: groupCount,
                median: median,
                q1: q1,
                q3: q3,
                min: d3.min(cleanData),
                max: d3.max(cleanData),
                outliers: outliers
            }
            boxPlotData.push(record);
        }

        const svg = chart.select(`#${id}Svg`)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + (width + config.margins.left + config.margins.right) + " " + (height + config.margins.top + config.margins.bottom))
            .classed("svg-content-responsive", true)
            .attr("version", "1.1")
            .attr("baseProfile", "full")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .append("g")
            .attr("transform", "translate(" + config.margins.left + "," + 0 + ")");

        // Add the x-axis to the svg
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .attr("font-size", "11px")
            .call(xAxis);

        // Add the y-axis to the svg
        svg.append("g")
            .attr("transform", "translate(" + -1 + "," + 0 + ")")
            .attr("class", "y axis")
            .attr("font-size", "11px")
            .call(yAxis);

        // Setup the group the box plot elements will render in
        const g = svg.append("g")
            .attr("transform", `translate(-${parseInt(barWidth / 2)},0)`);

        // Draw the box plot vertical lines
        g.selectAll(".verticalLines")
            .data(boxPlotData)
            .enter()
            .append("line")
            .classed("bw-line", true)
            .attr("x1", function (datum) { return x(datum.key) + barWidth / 2; })
            .attr("y1", function (datum) { return y(datum.min); })
            .attr("x2", function (datum) { return x(datum.key) + barWidth / 2; })
            .attr("y2", function (datum) { return y(datum.max); })
            .attr("stroke", "rgb(0,0,0)")
            .attr("stroke-width", 1)
            .attr("fill", "none");

        // select the div inside chart for tooltips
        const tooltip = d3.select('#d3chartTooltip')

        // Draw the boxes of the box plot on top of vertical lines
        const boxes = g.selectAll("rect")
            .data(boxPlotData)
            .enter()
            .append("rect")
            .attr("width", barWidth)
            .attr("height", function (datum) {
                return y(datum.q1) - y(datum.q3);
            })
            .attr("x", function (datum) { return x(datum.key); })
            .attr("y", function (datum) { return y(datum.q3); })
            .attr("fill", function (datum) { return datum.color; })
            .attr("fill", "rgb(56, 155, 198)")
            .attr("stroke", "rgb(0,0,0)")
            .attr("stroke-width", 1);

        // Add tooltip functionality on mouseOver
        boxes.on("mouseover", function (d) {
            chart.selectAll('rect')
                .style("opacity", otherOpacityOnHover);
            d3.select(this)
                .style("opacity", opacityHover);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(toolTipLabel(d))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("border", `3px solid rgb(56, 155, 198)`);

        });

        // Add tooltip functionality on mouseOut
        boxes.on("mouseout", function (d) {
            chart.selectAll('rect')
                .style("opacity", opacityHover);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

        // Add a label for the x-axis.
        svg.append("g")
            .append("text")
            .attr("y", height + config.margins.top + 25)
            .attr("x", width / 2)
            .attr("fill", "rgb(0, 0, 0)")
            .attr("font-size", "14px")
            .style("text-anchor", "middle")
            .text(config.xAxis.label);

        // Add a label for the y-axis.
        svg.append("g")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - config.margins.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .attr("fill", "rgb(0, 0, 0)")
            .attr("font-size", "14px")
            .style("text-anchor", "middle")
            .text(config.yAxis.label);

        // Now render all the horizontal lines  - the whiskers
        const horizontalLineConfigs = [
            // Top whisker
            {
                x1: (datum) => { return x(datum.key) },
                y1: (datum) => { return y(datum.min) },
                x2: (datum) => { return x(datum.key) + barWidth },
                y2: (datum) => { return y(datum.min) }
            },

            // Bottom whisker
            {
                x1: (datum) => { return x(datum.key) },
                y1: (datum) => { return y(datum.max) },
                x2: (datum) => { return x(datum.key) + barWidth },
                y2: (datum) => { return y(datum.max) }
            }
        ];

        for (let i = 0; i < horizontalLineConfigs.length; i++) {
            let lineConfig = horizontalLineConfigs[i];

            // Draw the whiskers at the min for this series
            g.selectAll(".whiskers")
                .data(boxPlotData)
                .enter()
                .append("line")
                .classed("bw-line", true)
                .attr("x1", lineConfig.x1)
                .attr("y1", lineConfig.y1)
                .attr("x2", lineConfig.x2)
                .attr("y2", lineConfig.y2)
                .attr("stroke", "rgb(0,0,0)")
                .attr("stroke-width", 1)
                .attr("fill", "none");
        }

        g.selectAll(".whiskers")
            .data(boxPlotData)
            .enter()
            .append('g')
            .selectAll('circle')
            .data((d) => { return d.outliers; })
            .enter()
            .append("circle")
            .classed("outliers", true)
            .attr("r", 2)
            .attr("cx", (d) => {
                return x(d.key) + barWidth / 2
            })
            .attr("cy", (d) => {
                return y(d.value);
            });

        // draw median line separate in red
        const median =
        {
            x1: (datum) => { return x(datum.key) },
            y1: (datum) => { return y(datum.median) },
            x2: (datum) => { return x(datum.key) + barWidth },
            y2: (datum) => { return y(datum.median) }
        }
        g.selectAll(".whiskers")
            .data(boxPlotData)
            .enter()
            .append("line")
            .attr("x1", median.x1)
            .attr("y1", median.y1)
            .attr("x2", median.x2)
            .attr("y2", median.y2)
            .attr("stroke", "rgb(255,0,0)")
            .attr("stroke-width", 1)
            .attr("fill", "rgb(255, 0, 0)")
            .attr("class", " boxAndWhiskerMedianLine");


        function toolTipLabel(d) {
            return "Year: <b>" + d.key + "</b><br>" +
                "Mean: <b>" + dateFromDay(d.key, dataSummary[d.key].mean) + "</b><br>" +
                "Median: <b>" + dateFromDay(d.key, dataSummary[d.key].median) + "</b><br>" +
                "Minimum: <b>" + dateFromDay(d.key, dataSummary[d.key].minimum) + "</b><br>" +
                "Maximum: <b>" + dateFromDay(d.key, dataSummary[d.key].maximum) + "</b><br>"
        }

        function dateFromDay(year, day) {
            const formatTime = d3.timeFormat("%b %d");
            let date = new Date(year, 0);
            return formatTime(new Date(date.setDate(day)));
        }

    }

    // returns a promise with a dataURI - i.e. base 64 encoded PNG
    print(id) {
        return new Promise((resolve, reject) => {
            try {
                // firefox issue where svgs wont draw to image without a width and height
                // if we include a with and height they become unresponsive
                const currentWidth = d3.select(`#${id}ChartContainer .svg-container-chart`).node().clientWidth
                const currentHeight = d3.select(`#${id}ChartContainer .svg-container-chart`).node().clientHeight
                d3.select(`#${id}ChartContainer .svg-container-chart svg`)
                    .attr("height", currentHeight)
                    .attr("width", currentWidth)

                const canvasContainer = d3.select(`#${id}ChartContainer`)
                    .append('div')
                    .attr("class", `${id}Class`)
                    .html(`<canvas id="canvas${id}" width="${currentWidth}" height="${currentHeight}" style="position: fixed;"></canvas>`)

                const canvas = document.getElementById(`canvas${id}`);
                const image = new Image();
                image.onload = () => {
                    canvas.getContext("2d").drawImage(image, 0, 0, currentWidth, currentHeight);
                    canvasContainer.remove()
                    d3.select(`#${id}ChartContainer .svg-container-chart svg`)
                        .attr("height", null)
                        .attr("width", null)
                    resolve(canvas.toDataURL())
                }
                const svg = "data:image/svg+xml," + d3.select(`#${id}ChartContainer .svg-container-chart`).html().replace(/#/g, '%23')
                image.src = svg
            }
            catch (error) {
                reject(error)
            }
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
                                style={{ display: this.props.config.chart.title ? "block" : "none" }}
                                id={id + 'Title'} className="title"></div>
                            <div
                                style={{ display: this.props.config.chart.subtitle ? "block" : "none" }}
                                id={id + 'Subtitle'} className="subtitle"></div>
                            <div id={id + 'Chart'} className="chart">
                                <div className="svg-container-chart">
                                    <svg id={id + 'Svg'}
                                        width={'100%'} height={'100%'}>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }
        return (
            <div>
                {divs()}
            </div>
        );
    }
}
export default BoxAndWhiskerChart;
