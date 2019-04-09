import React from "react";
// import { Button, Tooltip } from "reactstrap";
import { Button } from "reactstrap";

import { Glyphicon } from "react-bootstrap";

import CustomDialog from "../CustomDialog/CustomDialog";
import WmsLegend from "./WmsLegend"
import ArcgisLegend from "./ArcgisLegend"

import "./Legend.css"

class Legend extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isDialogOpen: false,
            toolTipOpen:false,
            enabledLayers: props.enabledLayers
        }
    }

    toggleDialog = () => this.setState({ isDialogOpen: !this.state.isDialogOpen });

    // openDialog = () => this.setState({ isDialogOpen: true });

    handleClose = () => {
        this.setState({
            toolTipOpen: false,
            isDialogOpen: false
        });
    }

    toggleLegendTooltip = () => this.setState({
        toolTipOpen: !this.state.toolTipOpen
    });


    render() {
        const legend = (legend) => {
            if (legend.imageUrl) {
                return <WmsLegend imageUrl={legend.imageUrl} />
            } else if (legend.arcgisUrl) {
                return <ArcgisLegend layers={legend.layers} jsonUrl={legend.arcgisUrl} />
            } else {
                return <div></div>
            }
        }
        return (
            <div>
                <Button id={"LegendTooltip"} className='submit-analysis-btn placeholder-button' onClick={this.toggleDialog} >
                    <Glyphicon className="inner-glyph" glyph="th-list"
                    data-toggle="tooltip" data-placement="bottom" title="Legend" />
                </Button>
                {/* <Tooltip
                    style={{ fontSize: "14px" }} isOpen={this.state.toolTipOpen && !this.state.isDialogOpen}
                    target="LegendTooltip" toggle={this.toggleLegendTooltip} delay={0}>
                    Legend
                </Tooltip> */}
                {
                    this.state.isDialogOpen &&
                    <CustomDialog
                        height={500}
                        isResizable={true}
                        isDraggable={true}
                        title="Legend"
                        modal={false}
                        onClose={this.handleClose}
                        body={
                            this.props.enabledLayers.map(function (layer, idx) {
                                return (
                                    <div className = "legend" key={"legend" + idx}>
                                    <div className="legend-holder" >
                                        <span className="layer-title">{layer.title}</span><br></br>
                                        {
                                            layer.legend ? legend(layer.legend) : "No legend info"
                                        }
                                    </div>
                                    </div>
                                )
                            })
                        }
                    />
                }
            </div>
        );
    }
}
export default Legend;

