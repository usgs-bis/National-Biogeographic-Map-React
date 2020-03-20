import './Chart.css'
import 'react-table/react-table.css'
import React, {FunctionComponent} from 'react'
import ReactTable from 'react-table'

export interface ITableChart {
  data: any[]
  id: string
  config: any
}

const TableChart: FunctionComponent<ITableChart> = (props) => {

  const sortTable = (a: any, b: any) => {
    if (typeof a === 'object' && a.type === 'span' && a.props && a.props.className === 'no-sort') {
      return 0
    }
    if (typeof a === 'object' && a.type === 'span' && a.props.children) {
      return a.props.children < b.props.children ? 1 : (b.props.children < a.props.children) ? -1 : 0
    }
    if (typeof a === 'object' && a.type === 'a' && a.props.children && a.props.children.length >= 1) {
      return a.props.children[1] < b.props.children[1] ? 1 : (b.props.children[1] < a.props.children[1]) ? -1 : 0
    }
    a = getNumberOrOriginalValue(a)
    b = getNumberOrOriginalValue(b)

    return a < b ? 1 : (b < a) ? -1 : 0
  }

  const getNumberOrOriginalValue = (val: string) => {
    if (isNaN(parseFloat(val))) {
      return val
    }

    if (typeof val !== 'string') {
      return val
    }

    if (val.includes(',')) {
      return parseFloat(val.replace(/,/g, ''))
    }

    return parseFloat(val)
  }

  const getTable = () => {
    let headers = props.data[0]
    let data = props.data.slice(1).sort((a, b) => {return sortTable(b[0], a[0])})
    return <ReactTable
      data={data}
      columns={
        headers.map((h: string, i: number) => {
          return i === 0 ?
            {
              Header: h,
              id: `${h}_${i}_id`,
              accessor: (d: any[]) => d[i],
              minWidth: 225 // make the first row a bit bigger then the rest
            }
            :
            {
              Header: h,
              id: `${h}_${i}_id`,
              accessor: (d: any[])=> d[i]
            }
        })
      }
      showPagination={false}
      showPageSizeOptions={false}
      defaultSortMethod={sortTable}
      pageSize={data.length}
      defaultPageSize={data.length}
      minRows={0}
      style={{
        maxHeight: '600px' // This will force the table body to scroll
      }}
      className="-striped -highlight"
    />

  }

  const divs = () => {
    if (props.data) {
      const id = props.id
      return (
        <div>
          <div id={id + 'ChartContainer'} className="chart-container">
            <div
              style={{display: props.config.chart.title ? 'block' : 'none', color: props.config.chart.color ? props.config.chart.color : 'white'}}
              id={id + 'Title'} className="title">
              <span>{props.config.chart.title}</span>
            </div>
            <div
              style={{display: props.config.chart.subtitle ? 'block' : 'none'}}
              id={id + 'Subtitle'} className="subtitle">
              <span>{props.config.chart.subtitle}</span>
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
      )
    }
  }

  return (
    <div>
      {divs()}
    </div>
  )
}

export default TableChart
