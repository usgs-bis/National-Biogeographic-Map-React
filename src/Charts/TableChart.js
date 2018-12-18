import React from "react";
import "./Chart.css"
import * as d3 from "d3";

class TableChart extends React.Component {
    constructor(props) {
        super(props)
        this.drawChart = this.drawChart.bind(this);
        this.createTable = this.createTable.bind(this)
    }

    componentDidUpdate() {
        this.drawChart(this.props.id, this.props.config, this.props.data)
    }


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

    }

    createTable(data) {
        let table = []

        // Outer loop to create parent
        for (let i = 0; i < data.length; i++) {
            let children = []
            //Inner loop to create children
            for (let j = 0; j < data[0].length; j++) {
                children.push(<span key={`${i}_${j}`}>{data[i][j]}</span>)
            }
            //Create the parent and add the children
            table.push(<div key={`${i}_row`}>{children}</div>)
        }
        return table
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
                            <div id={id + 'Chart'} className="chart">
                                <div className="analysis-chart-container">
                                    {this.createTable(this.props.data)}
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
export default TableChart;