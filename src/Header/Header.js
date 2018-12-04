import React from "react";
import "./Header.css";

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
            </div>
        );
    }
}
export default Header;
