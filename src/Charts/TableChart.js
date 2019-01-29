import React from "react";
import "./Chart.css"

class TableChart extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            data: null,
            header: null,
            body: null
        }
        this.createTableBody = this.createTableBody.bind(this)
        this.createTableHeader = this.createTableHeader.bind(this)
    }

    componentDidUpdate() {
        if (this.state.data !== this.props.data) {
            this.setState({
                data: this.props.data,
            }, () => {
                this.createTableHeader(this.props.data)
                this.createTableBody(this.props.data)
            })
        }
    }


    createTableBody(data) {
        let table = []

        // Outer loop to create parent
        for (let i = 1; i < data.length; i++) {
            let children = []
            //Inner loop to create children
            for (let j = 0; j < data[0].length; j++) {
                children.push(<td key={`${i}_${j}`}>{data[i][j]}</td>)
            }
            //Create the parent and add the children
            table.push(<tr key={`${i}_row`}>{children}</tr>)
        }
        this.setState({
            body: <tbody>{table}</tbody>
        })
    }

    createTableHeader(data) {
        let headers = []
        for (let i = 0; i < data[0].length; i++) {
            headers.push(<th key={`${i}_head`}>{data[0][i]}</th>)
        }
        this.setState({
            header: <thead><tr>{headers}</tr></thead>
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
                                id={id + 'Title'} className="title">
                                <span>{this.props.config.chart.title}</span>
                            </div>
                            <div
                                style={{ display: this.props.config.chart.subtitle ? "block" : "none" }}
                                id={id + 'Subtitle'} className="subtitle">
                                <span>{this.props.config.chart.subtitle}</span>
                            </div>
                            <div id={id + 'Chart'} className="chart">
                                <div className="analysis-chart-container">
                                    <table>
                                        {this.state.header}
                                        {this.state.body}
                                    </table>

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