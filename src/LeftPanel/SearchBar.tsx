import './SearchBar.scss'
import AppConfig from '../config'
import BasemapContext from '../Contexts/BasemapContext'
import ClickDrivenContext from '../Contexts/ClickDrivenContext'
import React, { FunctionComponent, useState, useEffect, useContext, useRef, Dispatch, SetStateAction } from 'react'
import ResultsContext from '../Contexts/ResultsContext'
import SearchingContext from '../Contexts/SearchingContext'
import _ from 'lodash'
import speechBubble from './bubble.png'
import {Button, ButtonGroup, UncontrolledTooltip, Spinner} from 'reactstrap'
import {Collapse, CardBody, Card} from 'reactstrap'
import {IoMdSettings, IoMdRefresh} from 'react-icons/io'
import {NVCS_FEATURE_LOOKUP} from '../App'
import {RadioGroup} from '../CustomRadio/CustomRadio'
import {countyStateLookup} from '../Utils/Utils'

const TEXT_SEARCH_API = AppConfig.REACT_APP_BIS_API + '/api/v1/places/search/text?q='
const MIN_SEARCH_LENGTH = 4

export interface ISearchBarProps {
  setErrorState: Dispatch<SetStateAction<Error | undefined>>
  initBaps: any[]
  point: {
    lat: number
    lng: number
  }
  mapClicked: boolean
  submitHandler: Function
  bioscape: any
}

const SearchBar: FunctionComponent<ISearchBarProps> = (props) => {
  const { initBaps, point, mapClicked, submitHandler, bioscape, setErrorState } = props


  const [displayHelpPopup, setDisplayHelpPopup] = useState(_.isEmpty(initBaps))
  const [focused, setFocused] = useState(false)
  const [layersDropdownOpen, setLayersDropdownOpen] = useState(false)
  const [searchWatermark, setSearchWatermark] = useState('Search for National Parks, Ecoregions, Landscapes, States, Counties...')

  const {searching, isSearching} = useContext(SearchingContext)
  const [basemap, setBasemap] = useContext(BasemapContext)
  const {isClickDriven} = useContext(ClickDrivenContext)
  const {results, setResults} = useContext(ResultsContext)

  const [basemapOptions] = useState(() => {
    if (!_.isEmpty(basemap)) {
      return bioscape.basemaps.map((p: any) => {
        p.selected = (basemap?.serviceUrl === p.serviceUrl)
        return p
      })
    } else {
      return bioscape.basemaps
    }
  })

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

  const handleSearchBox = _.debounce((text: any) => {

    if (text.length < MIN_SEARCH_LENGTH) {
      setResults([])

      return
    }

    isSearching(true)
    fetch(TEXT_SEARCH_API + text)
      .then(res => res.json())
      .then((result) => {
        let r = result.hits.hits.map((a: any) => a['_source']['properties'])

        r = countyStateLookup(r)

        if (bioscape.overlays) {
          r = r.filter((a: any) => {
            return NVCS_FEATURE_LOOKUP.includes(a.feature_class)
          })
        }

        setResults(r)
        isClickDriven(false)
      })
      .catch(setErrorState)
      .then(() => isSearching(false))

  }, 250)

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleSearchBox(e.currentTarget.value)
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

  const searchResults = () => {
    if (!focused || searching) return

    if (results.length > 0) {
      return (
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
      )
    }

    const searchLen = textInput?.current?.value?.length || 0
    if (searchLen > 0  && searchLen < MIN_SEARCH_LENGTH) {
      return <div className="section-title">Please enter at least {MIN_SEARCH_LENGTH} characters</div>
    }

    if (results.length === 0 && (point.lng || textInput.current?.value)) {
      return (
          <>
            <div className="section-title">No locations found for analysis</div>
            { textInput.current?.value &&
              <div className="no-results-tip">Search for places including National Parks, Ecoregions, Landscape Conservation Cooperatives, Marine Protected Areas, States, Counties, National Forest and more.</div>
            }
          </>
      )
    }
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
        { searching &&
          <>
            <div className="section-title">Searching...</div>
            <div className="search-loading">
              <Spinner color="secondary" />
            </div>
          </>
        }
        {searchResults()}
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
