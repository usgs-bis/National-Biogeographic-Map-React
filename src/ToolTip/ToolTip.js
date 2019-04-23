import React from "react";
import { Tooltip } from "reactstrap"


import "./ToolTip.css"

class CustomToolTip extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false
        }
    }


    render() {

        return (
                <Tooltip
                    style={{ fontSize: "14px" }} isOpen={this.state.open}
                    target={this.props.target}
                    toggle={() => this.setState({ open: !this.state.open })}
                    delay={0}>
                    {this.props.text}
                </Tooltip>
        );
    }
}
export default CustomToolTip;

