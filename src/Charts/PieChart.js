import React from "react";
import * as d3 from "d3";
import "./Chart.css"

class PieChart extends React.Component {
    constructor(props) {
        super(props)
        this.drawChart = this.drawChart.bind(this);
    }

    componentDidUpdate() {
        this.drawChart(this.props.id, this.props.config, this.props.data)
    }

    /**
    * Draw a Pie Chart
    * @param {string} id - name to prefix dom elements 
    * @param {*} config - used to style the chart
    * @param {*} data - used to build the chart
    * 
    * ex. congig = {
    *        margins:{left:1,right:10,top:1,bottom:20},
    *        chart: {title:"United States",subtitle:"Population over Time"},
    *        tooltip:{label:(d)=>{return 'label'}},
    *        onClick: (d)=>{this.doSomthing()}
    *       }
    * ex. data = [
    *        { "name": "Delaware", "percent": 10.4, "color": "#FF0000" },
    *        { "name": "Colorado", "percent": 18.7, "color": "#FFAA00" },
    *        { "name": "Kansas", "percent": 72.8, "color": "#A3FF73" }
    *       ]
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
        const width = 200,
            height = 200,
            padding = 10,
            opacity = .8,
            opacityHover = 1,
            otherOpacityOnHover = .8,
            legendRectSize = 12,
            legendSpacing = 4;

        const radius = Math.min(width - padding, height - padding) / 2;

        // Create a responsive svg element
        const svg = chart.select(`#${id}Chart`)
            .append("div")
            .classed("svg-container-chart", true)
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + (width) + " " + (height + config.margins.top + config.margins.bottom))
            .classed("svg-content-responsive", true)
            .attr("version", "1.1")
            .attr("baseProfile", "full")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .append("g")
            .attr('transform', 'translate(' + ((width / 2)) + ',' + (height / 2) + ')');

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const pie = d3.pie()
            .value(function (d) { return d.percent; })
            .sort(null);

        const path = svg.selectAll('path')
            .data(pie(data))
            .enter()
            .append("g")
            .append('path')
            .attr('d', arc)
            .attr('fill', function (d) { return d.data.color })
            .style('opacity', opacity)
            .style('stroke', 'white');

        path.on("click", function (d) {
            config.onClick(d.data)
        })

        // Add a div inside chart for tooltips
        const tooltip = chart.select(`#${id}Chart`)
            .append("div")
            .attr("class", "chartTooltip")
            .style("opacity", 0);

        // Add tooltip functionality on mouseOver
        path.on("mouseover", function (d) {
            chart.selectAll('path')
                .style("opacity", otherOpacityOnHover);
            d3.select(this)
                .style("opacity", opacityHover);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(config.tooltip.label(d))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("border", `3px solid ${d.data.color}`);
        });

        // Add tooltip functionality on mouseOut
        path.on("mouseout", function (d) {
            chart.selectAll('path')
                .style("opacity", opacityHover);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

        const legend = svg.selectAll('.legend')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function (d, i) {
                return 'translate(' + ((-1 * (width / 6)) ) + ',' + (height / 2 + 20 + (15 * i)) + ')';
            });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', function (d, i) {
                return d.color
            })
            .style("stroke", "black")
            .style("stroke-width", "1px");

        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .attr('font-size', 'smaller')
            .text(function (d) { return d.name; });


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
export default PieChart;