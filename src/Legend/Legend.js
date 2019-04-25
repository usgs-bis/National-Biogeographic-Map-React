import React from "react";
import { Button } from "reactstrap";
import { Glyphicon } from "react-bootstrap";
import CustomToolTip from "../ToolTip/ToolTip"
import CustomDialog from "../CustomDialog/CustomDialog";
import WmsLegend from "./WmsLegend"
import ArcgisLegend from "./ArcgisLegend"

import "./Legend.css"

class Legend extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isDialogOpen: false,
            enabledLayers: props.enabledLayers
        }
    }

    toggleDialog = () => this.setState({ isDialogOpen: !this.state.isDialogOpen });


    handleClose = () => {
        this.setState({
            toolTipOpen: false,
            isDialogOpen: false
        });
    }

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
                    <Glyphicon className="inner-glyph" glyph="th-list" />
                </Button>
                <CustomToolTip target={`LegendTooltip`} text="Legend" placement="left" ></CustomToolTip>
                {
                    this.state.isDialogOpen &&
                    <CustomDialog
                        height={450}
                        isResizable={true}
                        isDraggable={true}
                        title="Legend"
                        modal={false}
                        onClose={this.handleClose}
                        body={
                            this.props.enabledLayers.map(function (layer, idx) {
                                return (
                                    <div className="legend" key={"legend" + idx}>
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

