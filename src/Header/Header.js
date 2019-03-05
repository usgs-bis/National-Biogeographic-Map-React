import React from "react";
import { Glyphicon } from "react-bootstrap";
import "./Header.css"
import CustomDialog from "../CustomDialog/CustomDialog";


class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            title: props.title,
            showDescription: false
        }
    }

    render() {
        return (
            <div className={"nbm-header"}>
                <span className="usgs-Logo"></span>
                <span className="bioscape-title-text">{this.state.title}</span>
                <span onClick={() => this.setState({ showDescription: !this.state.showDescription })} className="main-title-info">
                    <Glyphicon glyph="info-sign" />
                </span>
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
