import React from "react";
import { BarLoader } from "react-spinners"

import "./Legend.css"

let legendCache = {

}

class AcrgisLegend extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            legendItems: [],
            loading: false
        }

        this.processResults = this.processResults.bind(this)
    }

    addItemsToLegend(layer) {
        let legendItems = []
        for (let i = 0; i < layer["legend"].length; i++) {
            let itemInfo = layer["legend"][i]
            legendItems.push(
                <div>
                    <img src={`data:image/png;base64,${itemInfo.imageData}`} alt={itemInfo.label}/>
                    <span>{itemInfo.label}</span>
                </div>
            )
        }

        return legendItems
    }

    processResults(result) {
        let layerList = result["layers"]
        let legendItems = []
        for (let layerIdx in this.props.layers) {
            legendItems = legendItems.concat(this.addItemsToLegend(layerList[layerIdx]))
        }

        this.setState({
            legendItems: legendItems,
            loading: false
        })
    }

    setUpLegend() {
        this.setState({
            loading: true
        })

        if(legendCache[this.props.jsonUrl]) {
            this.processResults(legendCache[this.props.jsonUrl])
        } else {
            fetch(this.props.jsonUrl)
                .then(res => res.json())
                .then(
                    (result) => {
                        legendCache[this.props.jsonUrl] = result
                        this.processResults(result)
                    },
                    (error) => {
                        console.log("Error: ", error)
                        this.setState({
                            error,
                            loading: false
                        });
                    },
                )
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.jsonUrl !== this.props.jsonUrl) {
            this.setUpLegend()
        }
    }

    componentDidMount() {
        this.setUpLegend()
    }

    render() {
        return (
            <div>
                {this.state.legendItems.map(function(item, idx) {
                    return <div key={"legendItem" + idx}>{item}</div>
                })}
                <BarLoader width={100} widthUnit={"%"} color={"white"} loading={this.state.loading} />
            </div>
        );
    }
}
export default AcrgisLegend;

