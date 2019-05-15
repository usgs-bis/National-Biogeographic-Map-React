import React from "react";
import "./Header.css"
import CustomDialog from "../CustomDialog/CustomDialog";
import InfoSign from "../ InfoSign/InfoSign"

const ENV = process.env.REACT_APP_ENV

class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            title: props.title,
            showDescription: false,
            infoToolTip: false,
            showBetaBanner: false,
            betaBannerText: 'Beta'
        }
    }

    // display the beta banner for non production deploys
    componentDidMount() {
        if (ENV && ENV !== 'prod') {
            this.setState({
                showBetaBanner: true,
                betaBannerText: ENV
            })
        }
    }

    render() {
        return (
            <div className={"nbm-header"}>
                <span className="usgs-Logo"></span>
                {this.state.showBetaBanner && <span className="beta-banner">
                    <span className="beta-banner-text">{this.state.betaBannerText}</span>
                </span>
                }
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
