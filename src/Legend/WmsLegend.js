import React from "react";

import "./Legend.css"

class WmsLegend extends React.Component {
    render() {
        return (
            <img style={{maxWidth: "100%"}} src={this.props.imageUrl} alt={"Legend"}/>
        );
    }
}
export default WmsLegend;

