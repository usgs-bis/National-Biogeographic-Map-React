import React from "react"
import PieChart from "./PieChart"

class DonutChart extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      id: null,
      config: null,
      data: null,
      displayLabel: null
    }

    this.pieChart = React.createRef()
    this.print = this.print.bind(this)
    this.getConfig = this.getConfig.bind(this)
  }

  componentDidMount() {
    this.setState({
      config: this.getConfig()
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id) {
      this.setState({
        id: this.props.id + '_PieChart'
      })
    }

    if (this.props.config !== prevProps.config) {
      this.setState({
        config: this.getConfig()
      })
    }
    if (this.props.data !== prevProps.data) {
      this.setState({
        data: this.props.data
      })
    }
    if (this.props.displayLabel !== prevProps.displayLabel) {
      this.setState({
        displayLabel: this.props.displayLabel
      })
    }
    if (this.state.data !== this.props.data) {
      this.setState({
        id: this.props.id + '_PieChart',
        config: this.getConfig(),
        data: this.props.data,
        displayLabel: this.props.displayLabel 
      })
    }
  }

  getConfig() {
    const config = {...this.props.config}
    config.innerRadius = config.innerRadius ? config.innerRadius : 0.6
    config.outerRadius = config.outerRadius ? config.outerRadius : 0.8

    function getLabel(key) {
      return key ? key + ': ' : ''
    }

    const tooltip = config.tooltip
    config.tooltip = {
      ...config.tooltip,
      center: true,
      label: ({data}) => {
        var tip = '<div xmlns="http://www.w3.org/1999/xhtml" style="display:table;width:100%;"><div style="display:table-cell;">';
        for (var key in tooltip.data) {
            var value = key === 'percent' ? `${(parseFloat(data[key])).toFixed(2).toString()}%` : data[key];
            tip += `<div>${getLabel(tooltip.data[key])} ${value}</div>`
        }

        return tip += '</div></div>';
      }
    }
    return config
  }

  print() {
    return this.pieChart.print(this.state.id)
  }

  render() {
    return (
      <PieChart
        onRef={ref => (this.pieChart = ref)}
        data={this.state.data}
        id={this.state.id}
        config={this.state.config}
        displayLabel={this.state.displayLabel} />
    );
  }
}

export default DonutChart;
