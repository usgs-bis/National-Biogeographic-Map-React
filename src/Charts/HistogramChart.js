import React from "react";
import * as d3 from "d3";

import "./Chart.css"

class HistogramChart extends React.Component {
    constructor(props) {
        super(props)
        this.drawChart = this.drawChart.bind(this);
    }

    componentDidUpdate() {
        console.log(this.props.bucketSize)
        this.drawChart(this.props.id, this.props.config, this.props.data, parseInt(this.props.bucketSize))
    }

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
    drawChart(id, config, data, bucketSize) {

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

        // Define x and y type and scales
        const x = d3.scaleLinear().rangeRound([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

        const years = Object.getOwnPropertyNames(data)

        //  TODO globals for tooltip, will want to change
        let totalCount = 0;
        const startYear = years[0];
        const endYear = years[years.length - 1];

        data = processData(data, bucketSize)

        // Get and set domain
        const domain = getDomain(data)
        x.domain([domain.xMin + 1, domain.xMax + 2]);
        y.domain([0, domain.yMax]);

        // Create the x-axis
        const xAxis = d3.axisBottom(x)
            .ticks(5)
            .tickFormat(x => { return dateFromDay(2018, (x) * bucketSize) })

        // Create the y-axis
        const yAxis = d3.axisLeft(y)

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

        // Add the histogram bars
        const bars = svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("fill", "rgb(56, 155, 198)")
            .attr("stroke", "rgb(0, 0, 0)")
            .attr("x", function (d) { return x(d.day); })
            .attr("width", width / (1 + (domain.xMax - domain.xMin)))
            .attr("y", function (d) { return y(d.count); })
            .attr("height", function (d) { return height - y(d.count); })

        // Add a div inside chart for tooltips
        const tooltip = chart.select(`#${id}Chart`)
            .append("div")
            .attr("class", "chartTooltip")
            .style("opacity", 0);

        // Add tooltip functionality on mouseOver
        bars.on("mouseover", function (d) {
            chart.selectAll('rect')
                .style("opacity", otherOpacityOnHover);
            d3.select(this)
                .style("opacity", opacityHover);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(toolTipLabel(d, bucketSize))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("border", `3px solid ${d.color}`);
        });

        // Add tooltip functionality on mouseOut
        bars.on("mouseout", function (d) {
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

        function emptyYear() {
            let year = new Array(366)
            for (let i = 0; i < year.length; i++) {
                year[i] = 0
            }
            return year
        };

        function processData(rawData, factor) {
            let days_of_year = emptyYear()
            let processedData = []
            totalCount = 0;
            for (let currentYear in rawData) {
                for (let i = 0; i < rawData[currentYear].length; i++) {
                    days_of_year[rawData[currentYear][i]] += 1
                    totalCount++;
                }
            }
            let bucket_days_of_year = transformData(days_of_year, factor)
            for (let i = 0; i < bucket_days_of_year.length; i++) {
                let c = bucket_days_of_year[i]
                processedData.push({ day: i + 1, count: c })
            }
            return processedData
        };


        function transformData(rawData, factor) {
            let transformedData = []
            for (let i = 0; i < rawData.length - factor; i += factor) {
                let sum = 0
                for (let j = 0; j < factor; j++) {
                    sum += rawData[i + j]
                }
                transformedData.push(sum)
            }
            return transformedData
        };

        function getDomain(rawData) {
            let xMin = 365;
            let xMax = 0;
            let yMax = 0;
            for (let i = 0; i < rawData.length; i++) {
                let c = rawData[i].count
                if (c > yMax) { yMax = c; }
                if (c > 0 && i < xMin) { xMin = i; }
                else if (c > 0 && i > xMax) { xMax = i; }
            }
            return { xMin: xMin, xMax: xMax, yMax: yMax };
        };


        function toolTipLabel(d, bucketSize) {
            var percentage = parseInt(parseInt(d.count) / parseInt(totalCount) * 100);
            if (percentage < 1) {
                percentage = '< 1';
            }
            else {
                percentage = percentage.toString();
            }
            let count = `Number of Grid Cells: <label>${parseInt(d.count)} </label> of <label>${parseInt(totalCount)} </label> ( ~ ${percentage}%)<br />  Number of Grid Cells = values that occur ${dateFromDay(2018, (d.day * bucketSize) + 1)} to ${dateFromDay(2018, (d.day * bucketSize) + bucketSize)} for all selected years (${startYear} to ${endYear}). <br />`
            if (bucketSize === 1) {
                return ` <p>  Day: <label> ${dateFromDay(2018, d.day)} </label><br />${count} </p>`
            }
            else {
                return `<p> Days: <label> ${dateFromDay(2018, (d.day * bucketSize) + 1)} </label> to <label> ${dateFromDay(2018, (d.day * bucketSize) + bucketSize)} </label><br />${count} </p>`
            }
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
export default HistogramChart;
