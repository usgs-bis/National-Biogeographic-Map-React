import React from "react";
import * as d3 from "d3";
import "./Chart.css"

class RidgelinePlotChart extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            id: null,
            config: null,
            data: null,
            bucketSize: null
        }
        this.drawChart = this.drawChart.bind(this);
        this.print = this.print.bind(this)
    }

    componentDidMount() {
        this.props.onRef(this)

    }

    componentDidUpdate() {
        if (this.state.bucketSize !== parseInt(this.props.bucketSize) || this.state.data !== this.props.data) {
            this.setState({
                id: this.props.id,
                config: this.props.config,
                data: this.props.data,
                bucketSize: parseInt(this.props.bucketSize)
            }, () => {
                this.drawChart(this.props.id, this.props.config, this.props.data, parseInt(this.props.bucketSize))

            })
        }
    }

    /**
  * Draw a Ridgeline Plot
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

        const years = Object.getOwnPropertyNames(data)
        const reducer = (accumulator, currentValue) => accumulator + currentValue;
        let dataSummary = {}

        // sort the data and produce summary statistics
        for (let year of years) {
            data[year].sort((a, b) => (parseInt(a) < parseInt(b)) ? 1 : ((parseInt(b) < parseInt(a)) ? -1 : 0));
            let summary = {
                mean: data[year].reduce(reducer) / data[year].length,
                median: data[year][parseInt(data[year].length / 2)],
                maximum: data[year][0],
                minimum: data[year][parseInt(data[year].length - 1)]
            }
            dataSummary[year] = summary
        }

        const smoothData = processData(data, bucketSize);

        const dataNest = d3.nest()
            .key(function (d) { return d.year; })
            .entries(smoothData);

        dataNest.reverse();


        // This will specify the aspect ratio not the actual size of the chart.
        // The svg is responsive and will scale to fill parent.
        const width = 480,
            height = 40 * years.length,
            overlapFactor = 1.5,
            opacityHover = 1,
            otherOpacityOnHover = .8;

        // Define x and y type and scales
        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleBand().range([height, 0]);

        // Determine domain 
        let domain = getMinMax(dataNest)
        x.domain([domain.dayMin - 3, domain.dayMax + 3]);
        y.domain(years.map(function (y) { return y.toString(); }))

        // Create the x-axis
        const xAxis = d3.axisBottom(x)
            .ticks(5)
            .tickFormat(x => { return dateFromDay(2018, (x) * bucketSize) })

        // Create the y-axis
        const yAxis = d3.axisLeft(y)


        // Create a responsive svg element
        const svg = chart.select(`#${id}Svg`)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 " + parseInt(-1 * config.margins.top) + " " + (width + config.margins.left + config.margins.right) + " " + (height + config.margins.top + config.margins.bottom))
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

        // Add the horizontal bars
        const smooth = svg.selectAll("smooth")
            .data(dataNest)
            .enter()
            .append("g")
            .attr("transform", function (d, i) { return "translate(" + 0 + "," + parseInt((i * y.bandwidth()) - 39) + ")" })
            .each(function (year) {
                year.y = d3.scaleLinear()
                    .domain([0, d3.max(year.values, function (d) { return d.value; })])
                    .range([y.bandwidth() * overlapFactor, 0])
            })
        // clip rectangle
        smooth.append("defs")
            .append("clipPath")
            .attr("id", `cut-off-path${id}`)
            .append("rect")
            .attr("width", width)
            .attr("height", y.bandwidth() * overlapFactor);


        // set the gradient
        smooth.append("linearGradient")
            .attr("id", `area-gradient${id}`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", x(0)).attr("y1", 0)
            .attr("x2", x(365 / bucketSize)).attr("y2", 0)
            .selectAll("stop")
            .data([
                { offset: "0.000000000%", color: "rgb(204, 76, 3)" }, // Jan 1
                { offset: "4.166666700%", color: "rgb(236, 111, 20)" },
                { offset: "8.333333400%", color: "rgb(248, 152, 43)" }, // Feb 1
                { offset: "12.50000010%", color: "rgb(250, 196, 80)" },
                { offset: "16.66666680%", color: "rgb(252, 228, 144)" }, // Mar 1
                { offset: "20.83333350%", color: "rgb(253, 247, 188)" },
                { offset: "25.00000020%", color: "rgb(237, 248, 178)" }, // Apr 1
                { offset: "29.16666690%", color: "rgb(217, 240, 163)" },
                { offset: "33.33333360%", color: "rgb(173, 221, 142)" }, // May 1
                { offset: "37.50000030%", color: "rgb(120, 198, 120)" },
                { offset: "41.66666700%", color: "rgb(65, 171, 93)" }, // Jun 1
                { offset: "45.83333370%", color: "rgb(122, 204, 196)" },
                { offset: "50.00000040%", color: "rgb(65, 182, 197)" }, // Jly 1
                { offset: "54.16666710%", color: "rgb(48, 144, 192)" },
                { offset: "58.33333380%", color: "rgb(34, 94, 168)" }, // Aug 1
                { offset: "62.50000050%", color: "rgb(37, 52, 148)" },
                { offset: "66.66666720%", color: "rgb(9, 30, 88)" }  // Sep 1
            ])
            .enter().append("stop")
            .attr("offset", function (d) { return d.offset; })
            .attr("stop-color", function (d) { return d.color; });

        // area fill
        const path = smooth.append("path")
            .attr("fill", `url(#area-gradient${id})`)
            .attr("stroke", "rgb(0, 0, 0,.2)")
            .attr("stroke-width", "1")
            .attr("class", "area")
            .attr("clip-path", `url(#cut-off-path${id})`)
            .attr("d", function (year) {
                return d3.area()
                    .curve(d3.curveBasis)
                    .x(function (d) { return x(d.DOY); })
                    .y1(function (d) { return year.y(d.value); })
                    .y0(height)(year.values)
            })

        // Add a div inside chart for tooltips
        const tooltip = chart.select(`#${id}Chart`).select('.chartTooltip')

        // Add tooltip functionality on mouseOver
        path.on("mouseover", function (d) {
            chart.selectAll('path')
                .style("opacity", otherOpacityOnHover);
            d3.select(this)
                .style("opacity", opacityHover);
            d3.select(this)
                .attr("stroke-width", "2")
                .attr("stroke", "rgb(0, 0, 0,1)");
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(toolTipLabel(d, bucketSize))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("border", `3px solid ${d.color}`);
        });

        // Add tooltip functionality on mouseOut
        path.on("mouseout", function (d) {
            d3.select(this)
                .attr("stroke-width", "1")
                .attr("stroke", "rgb(0, 0, 0,.2)");
            chart.selectAll('path')
                .style("opacity", opacityHover);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

        // Add a label for the x-axis.
        svg.append("g")
            .append("text")
            .attr("y", height + config.margins.top + 20)
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

        function toolTipLabel(d, bucketSize) {
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



        function getMinMax(rawData) {
            let min = 365;
            let max = 0;
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

        function emptyYear() {
            let year = new Array(366)
            for (let i = 0; i < year.length; i++) {
                year[i] = 0
            }
            return year
        };


        function processData(rawData, factor) {
            let processedData = []
            for (let currentYear in rawData) {
                let days_of_year = emptyYear()
                for (let i = 0; i < rawData[currentYear].length; i++) {
                    days_of_year[rawData[currentYear][i]] += 1
                }
                let bucket_days_of_year = transformData(days_of_year, factor)
                for (let i = 0; i < bucket_days_of_year.length; i++) {
                    let v = bucket_days_of_year[i]
                    let d = i + 1;
                    processedData.push({ year: currentYear, DOY: d, value: v })
                }
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
                transformedData.push(sum / factor)
            }
            return transformedData
        };

    }

    // returns a promise with a dataURI - i.e. base 64 encoded PNG
    print(id) {
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
                                <div className='chartTooltip'></div>
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
export default RidgelinePlotChart;