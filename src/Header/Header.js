import React from "react";
import { Glyphicon } from "react-bootstrap";
import "./Header.css"
import CustomDialog from "../CustomDialog/CustomDialog";
import {Tooltip } from "reactstrap"


class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            title: props.title,
            showDescription: false,
            infoToolTip:false
        }
    }

    render() {
        return (
            <div className={"nbm-header"}>
                <span className="usgs-Logo"></span>
                <span className="bioscape-title-text">{this.state.title}</span>
                <span id ="HeaderInfoToolTip" onClick={() => this.setState({ showDescription: !this.state.showDescription })} className="main-title-info">
                    <Glyphicon glyph="info-sign" />
                </span>
                <Tooltip
                    style={{ fontSize: "14px" }} isOpen={this.state.infoToolTip}
                    target={`HeaderInfoToolTip`}
                    toggle={() => this.setState({ infoToolTip: !this.state.infoToolTip })}
                    delay={0}>
                    Information
                </Tooltip>
                {this.state.showDescription &&
                    <div className="sbinfo-title">
                        <CustomDialog
                            className="sbinfo-popout-window"
                            isResizable={true}
                            isDraggable={true}
                            title={this.state.title}
                            modal={false}
                            onClose={() => this.setState({ showDescription: !this.state.showDescription })}
                            body={
                                <div className="sbinfo-body sbinfo-popout-window">{this.props.description}</div>
                            }
                        /> </div>}

            </div>

        );
    }
}
export default Header;
