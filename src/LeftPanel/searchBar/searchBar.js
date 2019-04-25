import React from "react";
import "./searchBar.css";
import { Button, ButtonGroup } from "reactstrap";
import { Glyphicon } from "react-bootstrap";
import Legend from "../../Legend/Legend";
import { RadioGroup } from "../../CustomRadio/CustomRadio";
import { Collapse, CardBody, Card } from "reactstrap";
import speechBubble from '../bubble.png'
import CustomToolTip from "../../ToolTip/ToolTip"


class SearchBar extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            focused: false,
            layersDropdownOpen: false,
            displayHelp: true
        }

        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.onFocus = this.onFocus.bind(this)
        this.onBlur = this.onBlur.bind(this)
        this.submit = this.submit.bind(this)
        this.toggleBasemapDropdown = this.toggleBasemapDropdown.bind(this)
        this.basemapChanged = this.basemapChanged.bind(this)
        this.textInput = ""
    }

    componentDidMount() {
        document.body.addEventListener('click', () => { this.setState({ displayHelp: false }) }, true);
        document.body.addEventListener('keydown', () => { this.setState({ displayHelp: false }) }, true);
    }
    componentWillUnmount() {
        document.body.removeEventListener('click', () => { this.setState({ displayHelp: false }) }, true);
        document.body.removeEventListener('keydown', () => { this.setState({ displayHelp: false }) }, true);
    }

    componentWillReceiveProps(props) {
        if (props.mapClicked) {
            this.textInput.focus();
            this.setState({
                focused: true
            })
        }
    }


    handleKeyUp(e) {
        this.props.textSearchHandler(e.target.value)
    }


    onFocus() {
        this.setState({
            focused: true
        })
    }

    onBlur() {
        setTimeout(() => {
            this.setState({
                focused: false
            });
            this.textInput.value = ""
        }, 150)
    }

    submit(e) {
        this.props.submitHandler(e)
    }


    toggleBasemapDropdown() {
        this.setState({ layersDropdownOpen: !this.state.layersDropdownOpen });
    }

    basemapChanged(e) {
        // Fixes bug in FF where search bar gains focus
        this.setState({ focused: false })

        this.props.basemapChanged(e)
    }

    render() {
        let that = this;
        return (
            <div>
                <div className="nbm-flex-row">
                    <div className="settings-btn-group nbm-flex-column">
                        <Button id={"SettingsTooltip"} onClick={this.toggleBasemapDropdown} className='submit-analysis-btn placeholder-button' >
                            <Glyphicon className="inner-glyph" glyph="menu-hamburger"/>
                        </Button>
                        <CustomToolTip target={`SettingsTooltip`} text="Settings" placement="right" ></CustomToolTip>
                    </div>
                    <div className="settings-btn-group nbm-flex-column">
                        <Legend
                            enabledLayers={this.props.enabledLayers}
                        />
                    </div>
                    {/* {!this.props.bioscape.overlays && */}
                    {
                        <div className="nbm-flex-column-big">
                            {

                                <input ref={(input) => { this.textInput = input; }} onClick={this.onFocus} onBlur={this.onBlur} onKeyUp={this.handleKeyUp}
                                    className="input-box" placeholder="Search for a place of interest or click on the map" type={"text"} />
                            }
                        </div>
                    }
                </div>
                <div className="nbm-flex-row" >
                    <div className="button-group" style={this.props.results.length > 0 && this.state.focused ? {} : { height: '0px' }}>
                        {(this.props.results.length > 0 && this.state.focused) ? <ButtonGroup vertical>
                            {this.props.results.map(function (d, idx) {
                                return (
                                    <Button className="sfr-button" style={{ whiteSpace: 'normal' }}
                                        onClick={function () { that.submit(this) }}
                                        id={d.feature_id}
                                        key={d.feature_id}>
                                        {d.feature_name}{d.state ? ", " + d.state.abbreviation : ""} ({d.feature_class})
                            </Button>)
                            })}
                        </ButtonGroup> : null}
                    </div>
                </div>
                <div className="nbm-flex-row-no-padding">
                    <Collapse className="settings-dropdown" isOpen={this.state.layersDropdownOpen}>
                        <Card>
                            <span className="header">Basemaps</span>
                            <CardBody>
                                <RadioGroup style={{ width: "100%" }}
                                    options={this.props.bioscape.basemaps}
                                    onChange={this.basemapChanged}
                                    canDeselect={true}
                                />
                            </CardBody>
                        </Card>
                        {/* Terrestrial had overlays section. comment for now, may remove layer if this change sticks */}
                        {/* {this.props.bioscape.overlays &&
                            <Card>
                                <span className="header">Overlays</span>
                                <CardBody>
                                    <RadioGroup style={{ width: "100%" }}
                                        options={this.props.bioscape.overlays}
                                        onChange={this.props.overlayChanged}
                                        canDeselect={true}
                                    />
                                </CardBody>
                            </Card>
                        } */}
                    </Collapse>
                </div>


                {this.state.displayHelp && <div className="popup" id="helpPopup">
                    <img src={speechBubble} alt="Speech Bubble"></img>
                    <div className="popuptext" id="myPopup">Search for a place of interest or click on the map</div>
                </div>}
            </div>
        )
    }

}
export default SearchBar;