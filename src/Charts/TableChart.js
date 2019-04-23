import React from "react";
import "./Chart.css"
import ReactTable from "react-table";
import "react-table/react-table.css";

class TableChart extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
        this.sortTable = this.sortTable.bind(this)
    }

    componentDidMount() {

    }

    componentDidUpdate() {

    }


    sortTable(a, b, desc) {

        if (parseFloat(a) && a.includes(',')) {
            a = parseFloat(a.replace(/,/g, ''))
        }
        if (parseFloat(b) && b.includes(',')) {
            b = parseFloat(b.replace(/,/g, ''))
        }
        return a < b ? 1 : (b < a) ? -1 : 0;

    }


    render() {

        const getTable = () => {
            let headers = this.props.data[0]
            let data = this.props.data.slice(1).sort((a,b)=>{return a[0] >= b[0] ? 1 : -1 } )
            return <ReactTable
                data={data}
                columns={
                    headers.map((h, i) => {
                        return i === 0 ?
                            {
                                Header: h,
                                id: `${h}_${i}_id`,
                                accessor: d => d[i],
                                minWidth: 225 // make the first row a bit bigger then the rest
                            }
                            :
                            {
                                Header: h,
                                id: `${h}_${i}_id`,
                                accessor: d => d[i]
                            }
                    })
                }

                showPagination={false}
                showPageSizeOptions={false}
                defaultSortMethod={this.sortTable}
                defaultPageSize={data.length}
                minRows={0}
                style={{
                    height: "600px" // This will force the table body to scroll
                }}
                className="-striped -highlight"
            />

        }
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
                                    <div className="table-container">
                                        {getTable()}
                                    </div>
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