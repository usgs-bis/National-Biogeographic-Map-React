import React from "react";
import * as d3 from "d3";

import "./NFHPChart.css"

class NFHPChart extends React.Component {
    constructor(props) {
        super(props)
        this.drawChart = this.drawChart.bind(this);
    }

    componentDidUpdate() {
        this.drawChart()
    }

    drawChart() {
        const data = this.props.data
        if (!data) {
            return
        }
        let NFHP = d3.select("#NFHPPlot")

        NFHP.selectAll("text").remove()

        data.scored_km = parseFloat(data.scored_km);
        data.not_scored_km = parseFloat(data.not_scored_km)
        let val1 = numberWithCommas((data.scored_km).toFixed(0))
        let val2 = numberWithCommas((data.scored_km + data.not_scored_km).toFixed(0))
        let title = 'Risk to Fish Habitat Degradation in ' + data.place_name;
        let subTitle = 'Fish habitat condition was scored on ' + val1 + ' of ' + val2 + ' NHDPlusV1 stream kilometers within ' + data.place_name;

        // Title
        NFHP.select("#NFHPTitle").append("text")
            .text(title);

        // Subtitle
        NFHP.select("#NFHPSubTitle").append("text")
            .text(subTitle);

        NFHP.transition()

        function getPercent(value) {
            value = parseFloat(value)
            return parseFloat(((value / data.scored_km) * 100).toFixed(1))
        }
        let chartData = [
            { "Risk": "Very high", "Percent": getPercent(data.veryhigh_km), "color": "#FF0000" },
            { "Risk": "High", "Percent": getPercent(data.high_km), "color": "#FFAA00" },
            { "Risk": "Moderate", "Percent": getPercent(data.moderate_km), "color": "#A3FF73" },
            { "Risk": "Low", "Percent": getPercent(data.low_km), "color": "#00C5FF" },
            { "Risk": "Very low", "Percent": getPercent(data.verylow_km), "color": "#C500FF" }
        ]
        chartData.reverse()

        let margin = { top: 20, right: 20, bottom: 25, left: 75 },
            width = 480,
            height = 400 - margin.top - margin.bottom;


        let x = d3.scaleLinear().range([0, width]);
        let y = d3.scaleBand().range([height, 0]);

        let max = chartData.map(d => { return d.Percent }).sort(function (a, b) { return a - b; })[chartData.length - 1]
        x.domain([0, max]);
        y.domain(chartData.map(function(d) { return d.Risk; })).padding(0.1);

        let xAxis = d3.axisBottom(x)
            .ticks(5)
            .tickFormat(function (d) { return `${parseInt(d)}%` })

        let yAxis = d3.axisLeft(y)

        NFHP.select(".svg-container-plot").remove()

        let svg = NFHP.select(`#NFHPChart`)
            .append("div")
            .classed("svg-container-plot", true)
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
            .classed("svg-content-responsive", true)
            .attr("version", "1.1")
            .attr("baseProfile", "full")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + 0 + ")");


        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .attr("font-size", "11px")
            .call(xAxis);

        svg.append("g")
            .attr("transform", "translate(" + -1+ "," + 0 + ")")
            .attr("class", "y axis")
            .attr("font-size", "11px")
            .call(yAxis)

        let div = NFHP.select(`#NFHPChart`)
            .append("div")
            .attr("class", "chartTooltip NFHPToolTip")
            .style("opacity", 0)
            .style("border", "3px solid rgb(56, 155, 198)");

        svg.selectAll(".bar")
            .data(chartData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("fill", function (d) { return d.color })
            .attr("y", function (d) { return y(d.Risk); })
            .attr("width", function (d) { return x(d.Percent); })
            .on("mouseover", function (d) {
                // d3.select(this)
                //     .attr("fill", "rgb(45, 125, 159)");
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(toolTipLabel(d))
                    .style("left", (d3.event.layerX < 300 ? d3.event.layerX + 10 : d3.event.layerX - 100) + "px")
                    .style("top", (d3.event.layerY) + "px")
                    .style("border", `3px solid ${d.color}`);

            })
            .on("mouseout", function (d) {
                //   d3.select(this).attr("fill", function (d) { return d.color });
                div.transition()
                    .duration(500)
                    .style("opacity", 0);

            });

        // text label for the x axis
        svg.append("g")
            .append("text")
            .attr("y", height + margin.bottom + margin.top - 5)
            .attr("x", width / 2)
            .attr("fill", "rgb(0, 0, 0)")
            .attr("font-size", "14px")
            .style("text-anchor", "middle")
            .text("NFHP Scored Stream Kilometers [%]");


        // text label for the y axis
        svg.append("g")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .attr("fill", "rgb(0, 0, 0)")
            .attr("font-size", "14px")
            .style("text-anchor", "middle")
            .text("Risk To Fish Habitat Degradation");


        function toolTipLabel(d) {

            return `<p>${d.Risk}: ${d.Percent}%</p>`

        }
    }

    render() {
        const divs = () => {
            if (this.props.data) {
                return (
                    <div>
                        <div id="NFHPPlot">
                            <div id="NFHPTitle">

                            </div>
                            <div id="NFHPSubTitle">

                            </div>
                            <div id="NFHPChart">

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
export default NFHPChart;

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}