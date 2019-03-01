import React from "react";
import * as d3 from "d3";
import "./Chart.css"

class SpeciesCountChart extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            id: null,
            config: null,
            data: null
        }
        this.drawChart = this.drawChart.bind(this);
        this.getChartImage = this.getChartImage.bind(this)
        this.print = this.print.bind(this)
    }

    componentDidMount() {
        this.props.onRef(this)
        this.render()
        this.drawChart(this.props.id, this.props.config, this.props.data)
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
    * Draw a Species Count Chart
    * @param {string} id - name to prefix dom elements 
    * @param {*} config - used to style the chart
    * @param {*} data - used to build the chart
    * 
    * ex. congig = {
    *        margins:{left:1,right:10,top:1,bottom:20},
    *        chart: {title:"United States",subtitle:"Population over Time"},
    *        xAxis:{key:'percent',label:"Percent Population", ticks:5, tickFormat:(d)=>{return d.percent + "%"}},
    *        yAxis:{key:'state',label:"State", ticks:5, tickFormat:(d)=>{return d.name}},
    *        tooltip:{label:(d)=>{return 'label'} color:(d)=>{return 'black'}},
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
        const width = 480,
            height = 25 * data.length,
            opacityHover = 1,
            otherOpacityOnHover = .8;

        // Define x and y type and scales
        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleBand().range([height, 0]);

        data = data.sort(function (a, b) {
            return d3.ascending(a.value, b.value);
        })


        x.domain([-200, 200 + d3.max(data, function (d) { return d.value; })]);
        y.domain(data.map(function (d) { return d.name; })).padding(0.1);

        // Create the x-axis
        const xAxis = d3.axisBottom(x)
            .ticks(config.xAxis.ticks)
            .tickFormat(config.xAxis.tickFormat)

        // Create the y-axis
        const yAxis = d3.axisLeft(y)
            .ticks(config.yAxis.ticks)
            .tickFormat(config.yAxis.tickFormat)

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

        const circle = svg.selectAll(".circle")
            .data(data)
            .enter().append("circle")
            .attr("class", "circle")
            .attr("r", y.bandwidth() / 4)
            .attr("cy", function (d) { return y(d.name) + y.bandwidth() / 2; })
            .attr("cx", function (d) { return x(d.value); })
            .attr("fill", "red")

        // Add a div inside chart for tooltips
        const tooltip = d3.select('#d3chartTooltip')


        // Add tooltip functionality on mouseOver
        circle.on("mouseover", function (d) {
            chart.selectAll('circle')
                .style("opacity", otherOpacityOnHover);
            d3.select(this)
                .style("opacity", opacityHover);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(config.tooltip.label(d))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("border", `3px solid ${d.color}`);
        });

        // Add tooltip functionality on mouseOut
        circle.on("mouseout", function (d) {
            chart.selectAll('circle')
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


    }

    // returns a promise with a dataURI - i.e. base 64 encoded PNG
    getChartImage(id) {
        return new Promise((resolve, reject) => {
            try {
                const canvasContainer = d3.select(`#${id}ChartContainer`)
                    .append('div')
                    .attr("class", `${id}Class`)
                    .html(`<canvas id="canvas${id}" width="800" height="800" style="position: fixed;"></canvas>`)

                const canvas = document.getElementById(`canvas${id}`);
                const image = new Image();
                image.onload = () => {
                    canvas.getContext("2d").drawImage(image, 0, 0, 800, 800);
                    canvasContainer.remove()
                    resolve(canvas.toDataURL())
                }
                const svg = "data:image/svg+xml," + d3.select(`#${id}ChartContainer .svg-container-chart`).html()
                image.src = svg
            }
            catch (error) { reject(error) }
        })
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
                                style={{ display: this.props.config.chart.title ? "block" : "none" }}
                                id={id + 'Title'} className="title"></div>
                            <div
                                style={{ display: this.props.config.chart.subtitle ? "block" : "none" }}
                                id={id + 'Subtitle'} className="subtitle"></div>
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
export default SpeciesCountChart;