import React from "react";
import "./Chart.css"
import { Collapse, CardBody, Card } from 'reactstrap';
import { Glyphicon } from "react-bootstrap";


class AccordionChart extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            body: null,
            collapse: []
        }
        this.data = null
        this.toggle = this.toggle.bind(this)
        this.createTable = this.createTable.bind(this)
    }

    componentDidMount() {
        this.data = this.props.data
    }

    componentDidUpdate() {
        if ((this.data !== this.props.data || !this.state.body) && this.props.data) {
            this.data = this.props.data
            if (!this.state.collapse.length) {
                this.setState({
                    collapse: this.props.data.map((x) => false)
                })
            }
        }
    }

    toggle(i) {
        let collapse = this.state.collapse
        collapse[i] = !collapse[i]
        this.setState({ collapse: collapse });
    }


    createTable() {
        let data = this.props.data
        if (!data) return
        let table = []
        let collapse = []

        // Outer loop to create parent
        for (let i = 0; i < data.length; i++) {
            collapse.push(false)
            let title = Object.keys(data[i])[0]
            let body = data[i][title]
            let content = <div>
                <div className={this.props.highlight === title ? "accordion-header-highlight" : "accordion-header"} onClick={() => { this.toggle(i) }} >
                    <Glyphicon
                        style={{ marginRight: '10px' }}
                        className="analysis-dropdown-glyph"
                        glyph={this.state.collapse[i] ? "menu-down" : "menu-right"}
                    />
                    <span>{title}</span>
                </div>
                <Collapse isOpen={this.state.collapse[i]}>
                    <Card className="accordion-card">
                        <CardBody>
                            <div dangerouslySetInnerHTML={{ __html: body }} />
                        </CardBody>
                    </Card>
                </Collapse>
            </div>

            let children = [<td key={`${i}`}>{content}</td>]
            table.push(<tr key={`${i}_row`}>{children}</tr>)
        }
        return <tbody>{table}</tbody>
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
                                        {this.createTable()}
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
export default AccordionChart;