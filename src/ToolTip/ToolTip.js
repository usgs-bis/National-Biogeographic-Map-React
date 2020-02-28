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
        if (this.props.text) {
            return (

                <Tooltip
                    style={{fontSize: '14px'}} isOpen={this.state.open}
                    target={this.props.target}
                    toggle={() => this.setState({open: !this.state.open})}
                    delay={0}
                    placement={this.props.placement ? this.props.placement : 'auto'}>
                    {this.props.text}
                </Tooltip>
            )
        }
        return null

    }
}
export default CustomToolTip

