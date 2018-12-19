import React from "react";
import "./Chart.css"

class TableChart extends React.Component {
    constructor(props) {
        super(props)
        this.createTableBody = this.createTableBody.bind(this)
        this.createTableHeader = this.createTableHeader.bind(this)
    }

    componentDidUpdate() {
    }


    createTableBody(data) {
        let table = []
        // Outer loop to create parent
        for (let i = 1; i < data.length; i++) {
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

    createTableHeader(data) {
        let headers = []
        for (let i = 0; i < data[0].length; i++) {
            headers.push(<span className="table-header" key={`${i}_header`}>{data[0][i]}</span>)
        }
        return headers
    }



    render() {
        const divs = () => {
            if (this.props.data) {
                const id = this.props.id
                return (
                    <div>
                        <div id={id + 'ChartContainer'} className="chart-container">
                            <div id={id + 'Title'} className="title">
                                <span>{this.props.config.chart.title}</span>
                            </div>
                            <div id={id + 'Subtitle'} className="subtitle">
                                <span>{this.props.config.chart.subtitle}</span>
                            </div>
                            <div id={id + 'Chart'} className="chart">
                                <div className="analysis-chart-container">
                                    <div className="table-headers">
                                        {this.createTableHeader(this.props.data)}
                                    </div>
                                    {this.createTableBody(this.props.data)}
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