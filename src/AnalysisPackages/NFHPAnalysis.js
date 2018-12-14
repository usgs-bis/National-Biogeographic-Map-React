import React from "react";
import { Collapse } from "reactstrap"
import { Glyphicon } from "react-bootstrap";

import NFHPChart from "../Charts/NFHPChart";

import "./AnalysisPackages.css";

const SB_URL = "https://www.sciencebase.gov/catalog/item/5aa2b21ae4b0b1c392e9d968?format=json"
const NFHP_URL = process.env.REACT_APP_BIS_API + "/api/v1/nfhpmetrics/condition?feature_id=";

let properties = {
    "title" : "Fish Habitat Condition and Disturbance Summaries default"
}

class NFHPAnalysis extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            data: null,
            title: properties.title,
            submitted: false,
            isOpen: false,
            glyph: "menu-right"
        }

        this.toggleDropdown = this.toggleDropdown.bind(this)
    }

    toggleDropdown() {
        this.setState({
            isOpen: !this.state.isOpen,
            glyph: !this.state.isOpen ? "menu-down" : "menu-right"
        })
    }

    componentDidMount() {
        fetch(SB_URL)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        title: result.title
                    })
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    componentWillReceiveProps(props) {
        if (props.feature_id) {
            fetch(NFHP_URL + props.feature_id)
                .then(res => res.json())
                .then(
                    (result) => {
                        if (result && result.hits.hits[0]) {
                            this.setState({
                                data: result.hits.hits[0]._source.properties,
                                submitted: true
                            })
                        } else {
                            this.setState({
                                data: null,
                                submitted: true
                            })
                        }
                    },
                    (error) => {
                        this.setState({
                            error
                        });
                    }
                )
        }
    }

    render() {
        return (
            <div
                style={{display: this.state.submitted && !this.state.data ? "none" : "block"}}
                className="nbm-flex-row-no-padding">
                <span onClick={this.toggleDropdown} className="bapTitle">
                {this.state.title}
                <Glyphicon style={{display: this.state.submitted ? "inline-block" : "none"}}
                           className="dropdown-glyph"
                           glyph={this.state.glyph}/>
                </span>
                    <Collapse className="settings-dropdown" isOpen={this.state.isOpen}>
                        <div className="chartsDiv">
                            <NFHPChart data={this.state.data}/>
                        </div>
                    </Collapse>
            </div>
        )
    }
}
export default NFHPAnalysis;
