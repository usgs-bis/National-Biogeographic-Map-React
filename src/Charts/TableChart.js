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

        if(typeof a === 'object' && a.type === 'span' && a.props && a.props.className ==="no-sort"){
            return  0
        }
        if(typeof a === 'object' && a.type === 'span' && a.props.children ){
            return   a.props.children <  b.props.children ? 1 : ( b.props.children <  a.props.children) ? -1 : 0;
        }
        if(typeof a === 'object' && a.type === 'a' && a.props.children && a.props.children.length >=1){
            return   a.props.children[1] <  b.props.children[1] ? 1 : ( b.props.children[1] <  a.props.children[1]) ? -1 : 0;
        }
       
        if (parseFloat(a) && typeof a === 'string' && a.includes(',')) {
            a = parseFloat(a.replace(/,/g, ''))
        }
        if (parseFloat(b) && typeof b === 'string' && b.includes(',')) {
            b = parseFloat(b.replace(/,/g, ''))
        }
        return a < b ? 1 : (b < a) ? -1 : 0;

    }


    render() {

        const getTable = () => {
            let headers = this.props.data[0]
            let data = this.props.data.slice(1).sort((a, b) => { return this.sortTable(b[0],a[0])})
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
                    maxHeight: "600px" // This will force the table body to scroll
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
                                style={{ display: this.props.config.chart.title ? "block" : "none", color: this.props.config.chart.color ? this.props.config.chart.color : "white" }}
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