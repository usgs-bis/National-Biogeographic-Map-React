import ArcgisLegend from './ArcgisLegend'
import Dialog from 'react-dialog'
import React, {FunctionComponent, useState, useContext, useEffect} from 'react'
import WmsLegend from './WmsLegend'

import './Legend.css'
import EnabledLayersContext from '../Contexts/EnabledLayersContext'
import LegendContext from '../Contexts/LegendContext'
import {isEmpty} from 'lodash'

// @Matt TODO: disable/hide on new feature select
const Legend: FunctionComponent = () => {

  const {enabledLayers} = useContext(EnabledLayersContext)
  const {setHasLegend, setToggleLegend} = useContext(LegendContext)

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    console.log('Legend:setToggleLegend effect')

    setToggleLegend(() => setIsDialogOpen((prev) => !prev))

    return () => {
      setToggleLegend(null)
    }
  }, [setToggleLegend])

  useEffect(() => {
    console.log('Legend:hasLegend effect')

    setHasLegend(enabledLayers.some((l) => !isEmpty(l.legend)))
  }, [enabledLayers, setHasLegend])

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

  if (isDialogOpen) {
    return (
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
                  <span className="layer-title">{layer.title}</span>
                  <br></br>
                  {
                    layer.legend ? legend(layer.legend) : 'No legend info'
                  }
                </div>
              </div>
            )
          })
        }
      </Dialog>
    )
  }

  return null

}
export default Legend

