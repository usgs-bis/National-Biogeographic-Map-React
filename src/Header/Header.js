import React from "react";
import { Glyphicon } from "react-bootstrap";
import "./Header.css"
 
class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            title: props.title,
            showDescription : false
        }
    }

    render() {
        return (
            <div className={"nbm-header"}>
                <span className="usgs-Logo"></span>
                {this.state.title}
                <span   onClick={() => this.setState({ showDescription: !this.state.showDescription })}className="main-title-info">
                    <Glyphicon glyph="info-sign" />
                </span>
                {this.state.showDescription && <div className="main-title-desc">{this.props.description}</div>}

            </div>
         
        );
    }
}
export default Header;
