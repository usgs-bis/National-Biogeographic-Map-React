import ArcgisLegend from './ArcgisLegend'
import CustomToolTip from '../ToolTip/ToolTip'
import Dialog from 'react-dialog'
import React from 'react'
import WmsLegend from './WmsLegend'
import {Button} from 'reactstrap'
import {Glyphicon} from 'react-bootstrap'

import './Legend.css'

class Legend extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isDialogOpen: false,
      enabledLayers: props.enabledLayers
    }
  }

  toggleDialog = () => this.setState({isDialogOpen: !this.state.isDialogOpen});

  handleClose = () => {
    this.setState({
      toolTipOpen: false,
      isDialogOpen: false
    })
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
        <Button id={'LegendTooltip'} className='submit-analysis-btn placeholder-button' onClick={this.toggleDialog} >
          <Glyphicon className="inner-glyph" glyph="th-list" />
        </Button>
        <CustomToolTip target={'LegendTooltip'} text="Legend" placement="left" ></CustomToolTip>
        {
          this.state.isDialogOpen &&
          <Dialog
            height={450}
            isResizable={true}
            isDraggable={true}
            title="Legend"
            modal={false}
            onClose={this.handleClose}
          >
            {
              this.props.enabledLayers.map(function (layer, idx) {
                return (
                  <div className="legend" key={'legend' + idx}>
                    <div className="legend-holder" >
                      <span className="layer-title">{layer.title}</span><br></br>
                      {
                        layer.legend ? legend(layer.legend) : 'No legend info'
                      }
                    </div>
                  </div>
                )
              })
            }
          </Dialog>
        }
      </div>
    )
  }
}
export default Legend

