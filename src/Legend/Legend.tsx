import ArcgisLegend from './ArcgisLegend'
import Dialog from 'react-dialog'
import React, {FunctionComponent, useState, useEffect, useContext} from 'react'
import WmsLegend from './WmsLegend'
import {Button, UncontrolledTooltip} from 'reactstrap'
import {FaKey} from 'react-icons/fa'

import './Legend.css'
import EnabledLayersContext from '../Contexts/EnabledLayersContext'

// @Matt TODO: #current move to map
// @Matt TODO: #current disable/hide if there is nothing in the legend
const Legend: FunctionComponent = () => {

  const {enabledLayers} = useContext(EnabledLayersContext)

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
      <Button id="LegendTooltip" className='submit-analysis-btn icon-btn' onClick={toggleDialog} >
        <FaKey />
      </Button>
      <UncontrolledTooltip target="LegendTooltip" placement="left" >Legend</UncontrolledTooltip>
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

