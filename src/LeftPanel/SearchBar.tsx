import './SearchBar.scss'
import BasemapContext from '../Contexts/BasemapContext'
import React, { FunctionComponent, useState, useEffect, useContext, useRef } from 'react'
import speechBubble from './bubble.png'
import {Button, ButtonGroup, UncontrolledTooltip} from 'reactstrap'
import {Collapse, CardBody, Card} from 'reactstrap'
import {IoMdSettings, IoMdRefresh} from 'react-icons/io'
import {RadioGroup} from '../CustomRadio/CustomRadio'
import {isEmpty} from 'lodash'

export interface ISearchBarProps {
  initBaps: any[]
  point: {
    lat: number
    lng: number
  }
  mapClicked: boolean
  textSearchHandler: Function
  submitHandler: Function
  bioscape: any
  results: any[]
}

const SearchBar: FunctionComponent<ISearchBarProps> = (props) => {
  const { initBaps, point, mapClicked, textSearchHandler, submitHandler, bioscape, results } = props

  const [basemap, setBasemap] = useContext(BasemapContext)
  const [basemapOptions] = useState(() => {
    if (!isEmpty(basemap)) {
      return bioscape.basemaps.map((p: any) => {
        p.selected = (basemap?.serviceUrl === p.serviceUrl)
        return p
      })
    } else {
      return bioscape.basemaps
    }
  })

  const [focused, setFocused] = useState(false)
  const [layersDropdownOpen, setLayersDropdownOpen] = useState(false)
  const [displayHelpPopup, setDisplayHelpPopup] = useState(isEmpty(initBaps))
  const [searchWatermark, setSearchWatermark] = useState('Search for a place of interest or click on the map')

  const textInput = useRef<null|HTMLInputElement>(null)

  const hideHelpPopup = () => setDisplayHelpPopup(false)

  useEffect(() => {
    if (displayHelpPopup) {
      document.body.addEventListener('click', hideHelpPopup, true)
      document.body.addEventListener('keydown', hideHelpPopup, true)

      return () => {
        document.body.removeEventListener('click', () => hideHelpPopup, true)
        document.body.removeEventListener('keydown', () => hideHelpPopup, true)
      }
    }
  }, [displayHelpPopup])

  useEffect(() => {
    if (mapClicked) {
      textInput?.current?.focus()
      setFocused(true)
      setSearchWatermark(`Lat: ${point.lat.toFixed(5)}, Lng: ${point.lng.toFixed(5)}`)
    }
  }, [mapClicked, point.lat, point.lng, textInput])

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    textSearchHandler(e.currentTarget.value)
  }

  const onFocus = () => {
    setFocused(true)
  }

  const onBlur = () => {
    setTimeout(() => {
      setFocused(false)
      if (textInput?.current) {
        textInput.current.value = ''
      }
    }, 150)
  }

  const toggleBasemapDropdown = () => {
    setLayersDropdownOpen(!layersDropdownOpen)
  }

  const basemapChanged = (e: any) => {
    // Fixes bug in FF where search bar gains focus
    setFocused(false)
    setBasemap(e)
  }

  const reset = () => {
    window.location.hash = ''
    window.location.reload()
  }

  return (
    <div>
      <div className="nbm-flex-row">
        <div className="settings-btn-group nbm-flex-column">
          <Button id="settings-tooltip" onClick={toggleBasemapDropdown} className="submit-analysis-btn icon-btn" >
            <IoMdSettings />
          </Button>
          <UncontrolledTooltip target="settings-tooltip" >Settings</UncontrolledTooltip>
        </div>
        <div className="settings-btn-group nbm-flex-column">
          <Button id="reset-tooltip" className="submit-analysis-btn icon-btn" onClick={reset} >
            <IoMdRefresh />
          </Button>
          <UncontrolledTooltip target="reset-tooltip" >Reset Map</UncontrolledTooltip>
        </div>
        <div className="nbm-flex-column-big">
          <input
            ref={textInput}
            onClick={onFocus}
            onBlur={onBlur}
            onKeyUp={handleKeyUp}
            className="input-box px-2"
            placeholder={searchWatermark}
            type="text"
          />
        </div>
      </div>
      <div className="nbm-flex-row" >
        {(results.length === 0) && (point.lng || textInput.current?.value) && focused &&
          <>
          <div className="section-title">No locations found for analysis</div>
          { textInput.current?.value &&
            <div className="no-results-tip">Search for places including National Parks, Ecoregions, Landscape Conservation Cooperatives, Marine Protected Areas, States, Counties, National Forest and more.</div>
          }
          </>
        }
        {(results.length > 0) && focused &&
          <>
            <div className="section-title">Locations available for analysis</div>
            <div className="button-group">
              <ButtonGroup vertical>
                {results.map((d: any) => (
                  <Button
                    className="sfr-button"
                    style={{whiteSpace: 'normal'}}
                    onClick={() => {submitHandler(d)}}
                    id={d.feature_id}
                    key={d.feature_id}>
                    {d.feature_name}{d.state ? ', ' + d.state.name : ''} ({d.feature_class})
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </>
        }
      </div>
      <div className="nbm-flex-row-no-padding">
        <Collapse className="settings-dropdown" isOpen={layersDropdownOpen}>
          <Card>
            <span className="header">Basemaps</span>
            <CardBody>
              <RadioGroup style={{width: '100%'}}
                options={basemapOptions}
                onChange={basemapChanged}
                canDeselect={true}
              />
            </CardBody>
          </Card>
        </Collapse>
      </div>

      {displayHelpPopup &&
        <div className="popup" id="helpPopup">
          <img src={speechBubble} alt="Speech Bubble"></img>
          <div className="popuptext" id="myPopup">Search for a place of interest or click on the map</div>
        </div>
      }
    </div>
  )
}

export default SearchBar
