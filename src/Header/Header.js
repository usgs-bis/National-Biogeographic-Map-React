import React from "react";
import "./Header.css"
import CustomDialog from "../CustomDialog/CustomDialog";
import InfoSign from "../ InfoSign/InfoSign"

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
                <InfoSign onClick={() => this.setState({ showDescription: !this.state.showDescription })}> </InfoSign>
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
