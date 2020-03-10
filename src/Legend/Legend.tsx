import ArcgisLegend from './ArcgisLegend'
import CustomToolTip from '../ToolTip/ToolTip'
import Dialog from 'react-dialog'
import React, {FunctionComponent, useState} from 'react'
import WmsLegend from './WmsLegend'
import {Button} from 'reactstrap'
import {Glyphicon} from 'react-bootstrap'

import './Legend.css'

// @Matt TODO: #current update
const Legend: FunctionComponent<{ enabledLayers: any[] }> = ({ enabledLayers }) => {

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const toggleDialog = () => setIsDialogOpen(!isDialogOpen)
  const handleClose = () => setIsDialogOpen(false)

  const legend = (legend: any) => {
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
      <Button id={'LegendTooltip'} className='submit-analysis-btn placeholder-button' onClick={toggleDialog} >
        <Glyphicon className="inner-glyph" glyph="th-list" />
      </Button>
      <CustomToolTip target={'LegendTooltip'} text="Legend" placement="left" ></CustomToolTip>
      { isDialogOpen &&
        <Dialog
          height={450}
          isResizable={true}
          isDraggable={true}
          title="Legend"
          modal={false}
          onClose={handleClose}
        >
          {
            enabledLayers.map(function (layer, idx) {
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
export default Legend

