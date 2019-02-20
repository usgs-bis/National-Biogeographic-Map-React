import React from "react";
import { Glyphicon } from "react-bootstrap";
import "./Header.css"
 
class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            title: props.title
        }
    }

    render() {
        return (
            <div className={"nbm-header"}>
                {this.state.title}
                <span className="main-title-info">
                    <Glyphicon glyph="info-sign" />
                </span>
            </div>
        );
    }
}
export default Header;
