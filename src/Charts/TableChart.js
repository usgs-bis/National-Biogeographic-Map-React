import React from "react";
import "./Chart.css"

class TableChart extends React.Component {
    constructor(props) {
        super(props)
        this.createTable = this.createTable.bind(this)
    }

    componentDidUpdate() {
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
                            <div id={id + 'Title'} className="title">
                                <text>{this.props.config.chart.title}</text>
                            </div>
                            <div id={id + 'Subtitle'} className="subtitle">
                                <text>{this.props.config.chart.title}</text>
                            </div>
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