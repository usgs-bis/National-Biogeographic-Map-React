import React from "react";
import * as d3 from "d3";
import "./Chart.css"

function getColor(color, i) {
    const colors = d3.schemeCategory10
    const length = colors.length
    const start = Math.floor((i % (length * length))/length)
    return color === 'random' ? colors[(i + start) % length] : color
}

class PieChart extends React.Component {
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
    * Draw a Pie Chart
    * @param {string} id - name to prefix dom elements 
    * @param {*} config - used to style the chart
    * @param {*} data - used to build the chart
    * 
    * ex. congig = {
    *        margins:{left:1,right:10,top:1,bottom:20},
    *        chart: {title:"United States",subtitle:"Population over Time"},
    *        tooltip:{label:(d)=>{return 'label'}},
    *        legend:{rectSize:12,spacing:4,leftOffset:6,fontSize:'smaller'}
    *        onClick: (d)=>{this.doSomthing()}
    *        width: 200
    *        height: 200
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
        const width = config.width ? config.width : 200,
            height = config.height ? config.height : 200,
            padding = 10,
            opacity = .8,
            opacityHover = 1,
            otherOpacityOnHover = .8;

        const radius = Math.min(width - padding, height - padding) / 2;

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
            .attr('transform', 'translate(' + ((width + config.margins.left + config.margins.right) / 2) + ',' + ((height / 2) + config.margins.top) + ')');

        const arc = d3.arc()
            .innerRadius(config.innerRadius ? radius * config.innerRadius : 0)
            .outerRadius(config.outerRadius ? radius * config.outerRadius : radius);
        if (config.innerRadius) {
            arc
                .cornerRadius(1)
                .padAngle(0.01);
        }

        var outerArc = d3.arc()
            .outerRadius(radius * 1.2)
            .innerRadius(radius * 1.2);


        const pie = d3.pie()
            .value(function (d) { return d.percent; })
            .sort(null);

        const path = svg.selectAll('path')
            .data(pie(data))
            .enter()
            .append("g")
            .append('path')
            .attr('d', arc)
            .attr('fill', function (d, i) { return getColor(d.data.color, i) })
            .style('opacity', opacity);

        path.on("click", function (d) {
            config.onClick(d.data)
        })

        // Add a div inside chart for tooltips
        const tooltip = d3.select('#d3chartTooltip')

        // Add tooltip functionality on mouseOver
        path.on("mouseover", function (d) {
            chart.selectAll('path')
                .style("opacity", otherOpacityOnHover);
            d3.select(this)
                .style("opacity", opacityHover);
            if (config.tooltip.center) {
                centerTooltip(d)
                return
            }
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(config.tooltip.label(d))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("border", `3px solid ${getColor(d.data.color, d.index)}`);
        });

        function centerTooltip(d) {
            svg.append('text')
                .attr('class', 'toolCircle')
                .attr('dy', -15) // hard-coded. can adjust this to adjust text vertical alignment in tooltip
                .html(config.tooltip.label(d)) // add text to the circle.
                .style('font-size', '.7em')
                .style('text-anchor', 'middle'); // centres text in tooltip

            svg.append('circle')
                .attr('class', 'toolCircle')
                .attr('r', radius * 0.55) // radius of tooltip circle
                .style('fill', getColor(d.data.color, d.index)) // colour based on category mouse is over
                .style('fill-opacity', 0.35);
        }

        // Add tooltip functionality on mouseOut
        path.on("mouseout", function (d) {
            chart.selectAll('path')
                .style("opacity", opacityHover);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            if (config.tooltip.center) {
                d3.selectAll('.toolCircle').remove();
            }
        });

        svg.append('g').classed('labels', true);
        svg.append('g').classed('lines', true);

        if (config.lables) {

            function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

            let labelCount = 0
            const staggerAmt = [5, 15, 25, 35, 45, 55, 65, 75, 85]
            const staggerAmtLength = staggerAmt.length
            svg.select('.lines')
                .selectAll('polyline')
                .data(pie(data))
                .enter().append('polyline')
                .attr('points', (d) => {
                    let stagger = outerArc.centroid(d)
                    if (d.value < 0.1) return []
                    if (d.value < 3) {
                        stagger[1] = stagger[1] > 0 ? stagger[1] + staggerAmt[labelCount % staggerAmtLength] : stagger[1] - staggerAmt[labelCount % staggerAmtLength]
                        labelCount++
                    }
                    let finalPos = stagger[0] >= 0 ? [stagger[0] + 10, stagger[1]] : [stagger[0] - 10, stagger[1]]
                    return [arc.centroid(d), stagger, finalPos]
                })
                .style("opacity", `0.5`)
                .style("stroke", `black`)
                .style("stroke-width", `1px`)
                .style("fill", `none`);


            labelCount = 0
            const labels = svg.select('.labels').selectAll('text')
                .data(pie(data))
                .enter().append('text')
                .attr('dy', '.35em')
                .html((d) => {
                    if (d.value < 0.1) return ''
                    return config.lables.label ? config.lables.label(d) : (parseFloat(d.data.percent)).toFixed(2).toString() + '%';
                })
                .attr('transform', function (d) {
                    let stagger = outerArc.centroid(d)
                    if (d.value < 3) {
                        stagger[1] = stagger[1] > 0 ? stagger[1] + staggerAmt[labelCount % staggerAmtLength] : stagger[1] - staggerAmt[labelCount % staggerAmtLength]
                        labelCount++
                    }
                    let finalPos = stagger[0] >= 0 ? [stagger[0] + 13, stagger[1]] : [stagger[0] - 13, stagger[1]]

                    return 'translate(' + finalPos + ')';
                })
                .style('text-anchor', (d) => {
                    return (midAngle(d)) < Math.PI ? 'start' : 'end';
                })
                .style("font-size", config.lables.fontSize);

            if (config.tooltip.center) {
                labels
                    .style('cursor', 'pointer')
                    .on('click', ({data}) => config.onClick(data))
                    .on('mouseover', centerTooltip)
                    .on('mouseout', () => d3.selectAll('.toolCircle').remove());
            }
        }

        if (config.legend) {
            const legend = svg.selectAll('.legend')
                .data(data)
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', (d, i) => {
                    return 'translate(' + ((-1 * (width / config.legend.leftOffset))) + ',' + (height / 2 + 20 + ((config.legend.verticalSpacing ? config.legend.verticalSpacing : 15) * i)) + ')';
                });
            
            legend.append('rect')
                .attr('width', config.legend.rectSize)
                .attr('height', config.legend.rectSize)
                .style('fill', (d, i) => {
                    return getColor(d.color, i)
                })
            
            legend.append('text')
                .attr('x', config.legend.rectSize + config.legend.spacing + 2)
                .attr('y', config.legend.rectSize - config.legend.spacing + 2)
                .style('font-size', config.legend.fontSize)
                .text((d) => { return d.name; });
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