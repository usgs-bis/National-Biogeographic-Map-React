import React from "react";
import "./Chart.css"

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

class TableChart extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            header: null,
            body: null
        }
        this.data = null

        this.createTable = this.createTable.bind(this)
        this.createTableHeader = this.createTableHeader.bind(this)
        this.sortTable = this.sortTable.bind(this)
    }

    componentDidMount() {

        this.data = this.props.data
    }

    componentDidUpdate() {
        if (this.data !== this.props.data) {
            this.data = this.props.data
            this.createTable(this.data[0], this.data.slice(1))
        }

    }

    createTable(head, body) {
        let table = []

        // Outer loop to create parent
        for (let i = 0; i < body.length; i++) {
            let children = []
            //Inner loop to create children
            for (let j = 0; j < body[0].length; j++) {
                children.push(<td key={`${i}_${j}`}>{body[i][j]}</td>)
            }
            //Create the parent and add the children
            table.push(<tr key={`${i}_row`}>{children}</tr>)
        }
        this.setState({
            header: <thead><tr>{this.createTableHeader(head)}</tr></thead>,
            body: <tbody>{table}</tbody>
        })
    }

    createTableHeader(head) {
        let headers = []
        for (let i = 0; i < head.length; i++) {
            headers.push(<th key={`${i}_head`} onClick={() => { this.sortTable(i) }} >{head[i]}</th>)
        }
        return headers
    }

    sortTable(i) {
        this.ascending = !this.ascending
        let body = this.data.slice(1)

        // if we detect numbers are formatted with commas 
        // we remove the commas and convert to float before sorting
        // then replace the commas after sorting
        let commaFormatted = false
        body.map((b) => {
            if (parseFloat(b[i]) && b[i].includes(',')) {
                commaFormatted = true
                b[i] = parseFloat(b[i].replace(',', ''))
                return b
            }
            return b
        })
        if (this.ascending) {
            body = body.sort((a, b) => (a[i] < b[i]) ? 1 : ((b[i] < a[i]) ? -1 : 0));
        }
        else {
            body = body.sort((a, b) => (a[i] > b[i]) ? 1 : ((b[i] > a[i]) ? -1 : 0));
        }

        // replacing the commas
        if (commaFormatted) {
            body.map((b) => {
                b[i] = numberWithCommas(b[i])
                return b
            })
        }
        this.createTable(this.data[0], body)
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