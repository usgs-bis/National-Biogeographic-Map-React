import React from "react";
import * as d3 from "d3";

import "./Chart.css"

class BoxAndWhiskerChart extends React.Component {
    constructor(props) {
        super(props)
        this.drawChart = this.drawChart.bind(this);
    }

    componentDidUpdate() {
        this.drawChart(this.props.id, this.props.config, this.props.data)
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

        if (!id || !config || !data) return

        const chart = d3.select(`#${id}ChartContainer`)

        // Remove older renderings
        chart.selectAll("text").remove()
        chart.select(`#${id}Chart`).selectAll("div").remove()
        chart.select(".svg-container-chart").remove()

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
                mean: data[year].reduce(reducer) / data[year].length,
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
        const xAxis = d3.axisBottom(x);

        // Create the y-axis
        const yAxis = d3.axisLeft(y)
            .ticks(5)
            .tickFormat((d) => { return dateFromDay(2018, (d)) });

        // Prepare the data for the box plots
        let boxPlotData = [];
        for (let [key, groupCount] of Object.entries(data)) {

            let record = {};
            let localMin = d3.min(groupCount);
            let localMax = d3.max(groupCount);

            record["key"] = key;
            record["counts"] = groupCount;
            record["quartile"] = boxQuartiles(groupCount);
            record["whiskers"] = [localMin, localMax];

            boxPlotData.push(record);
        }

        // Create a responsive svg element
        const svg = chart.select(`#${id}Chart`)
            .append("div")
            .classed("svg-container-chart", true)
            .append("svg")
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
            .attr("x1", function (datum) {return x(datum.key) + barWidth / 2;})
            .attr("y1", function (datum) {let whisker = datum.whiskers[0];return y(whisker);})
            .attr("x2", function (datum) {return x(datum.key) + barWidth / 2;})
            .attr("y2", function (datum) {return y(datum.whiskers[1]);})
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("fill", "none");

        // Add a div inside chart for tooltips
        const tooltip = chart.select(`#${id}Chart`)
            .append("div")
            .attr("class", "chartTooltip")
            .style("opacity", 0);

        // Draw the boxes of the box plot on top of vertical lines
        const boxes = g.selectAll("rect")
            .data(boxPlotData)
            .enter()
            .append("rect")
            .attr("width", barWidth)
            .attr("height", function (datum) {
                let quartiles = datum.quartile;
                let height = y(quartiles[2]) - y(quartiles[0]);
                return height;
            })
            .attr("x", function (datum) {return x(datum.key);})
            .attr("y", function (datum) {return y(datum.quartile[0]);})
            .attr("fill", function (datum) {return datum.color;})
            .attr("fill", "rgb(56, 155, 198)")
            .attr("stroke", "#000")
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
                .style("border", `3px solid ${d.color}`);
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
                x1: function (datum) { return x(datum.key) },
                y1: function (datum) { return y(datum.whiskers[0]) },
                x2: function (datum) { return x(datum.key) + barWidth },
                y2: function (datum) { return y(datum.whiskers[0]) }
            },

            // Bottom whisker
            {
                x1: function (datum) { return x(datum.key) },
                y1: function (datum) { return y(datum.whiskers[1]) },
                x2: function (datum) { return x(datum.key) + barWidth },
                y2: function (datum) { return y(datum.whiskers[1]) }
            }
        ];

        for (let i = 0; i < horizontalLineConfigs.length; i++) {
            let lineConfig = horizontalLineConfigs[i];

            // Draw the whiskers at the min for this series
            g.selectAll(".whiskers")
                .data(boxPlotData)
                .enter()
                .append("line")
                .attr("x1", lineConfig.x1)
                .attr("y1", lineConfig.y1)
                .attr("x2", lineConfig.x2)
                .attr("y2", lineConfig.y2)
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .attr("fill", "none");
        }

        // draw median line separate in red
        const median =
        {
            x1: function (datum) { return x(datum.key) },
            y1: function (datum) { return y(datum.quartile[1]) },
            x2: function (datum) { return x(datum.key) + barWidth },
            y2: function (datum) { return y(datum.quartile[1]) }
        }
        g.selectAll(".whiskers")
            .data(boxPlotData)
            .enter()
            .append("line")
            .attr("x1", median.x1)
            .attr("y1", median.y1)
            .attr("x2", median.x2)
            .attr("y2", median.y2)
            .attr("stroke", "#FF0000")
            .attr("stroke-width", 1)
            .attr("fill", "rgb(255, 0, 0)")
            .attr("class", " boxAndWhiskerMedianLine");

        function boxQuartiles(d) {
            return [
                d3.quantile(d, .25),
                d3.quantile(d, .5),
                d3.quantile(d, .75)
            ];
        }

        function toolTipLabel(d) {
            return "Year: <b>" + d.key + "</b><br>" +
                "Mean: <b>" + dateFromDay(2018, dataSummary[d.key].mean, d.key) + "</b><br>" +
                "Median: <b>" + dateFromDay(2018, dataSummary[d.key].median, d.key) + "</b><br>" +
                "Minimum: <b>" + dateFromDay(2018, dataSummary[d.key].minimum, d.key) + "</b><br>" +
                "Maximum: <b>" + dateFromDay(2018, dataSummary[d.key].maximum, d.key) + "</b><br>"
        }

        function dateFromDay(year, day) {
            const formatTime = d3.timeFormat("%b %d");
            let date = new Date(year, 0);
            return formatTime(new Date(date.setDate(day)));
        }

    }
    render() {
        const divs = () => {
            if (this.props.data) {
                const id = this.props.id
                return (
                    <div>
                        <div id={id + 'ChartContainer'} className="chart-container">
                            <div id={id + 'Title'} className="title"></div>
                            <div id={id + 'Subtitle'} className="subtitle"></div>
                            <div id={id + 'Chart'} className="chart"></div>
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
