import React from "react"
import PieChart from "./PieChart"

class DonutChart extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      id: null,
      config: null,
      data: null
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
  }

  getConfig() {
    const config = {...this.props.config}
    config.innerRadius = 0.6
    config.outerRadius = 0.8

    function getLabel(key) {
      return key ? key + ': ' : ''
    }

    const tooltip = config.tooltip
    config.tooltip = {
      ...config.tooltip,
      center: true,
      label: ({data}) => {
        var tip = '',
            i   = 0;
        for (var key in tooltip.data) {
            var value = key === 'percent' ? `${(parseFloat(data[key])).toFixed(2).toString()}%` : data[key];

            // leave off 'dy' attr for first tspan so the 'dy' attr on text element works. The 'dy' attr on
            // tspan effectively imitates a line break.
            // Used from https://bl.ocks.org/mbhall88/b2504f8f3e384de4ff2b9dfa60f325e2
            if (i === 0) tip += `<tspan x="0">${getLabel(tooltip.data[key])} ${value}</tspan>`;
            else tip += `<tspan x="0" dy="1.2em">${getLabel(tooltip.data[key])} ${value}</tspan>`;
            i++;
        }

        return tip;
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
        config={this.state.config} />
    );
  }
}

export default DonutChart;
