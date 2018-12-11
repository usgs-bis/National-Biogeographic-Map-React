import React from "react";
import NBM from "./NBM/NBM";
import Header from "./Header/Header";
import LeftPanel from "./LeftPanel/LeftPanel";
import nbmBioscape from "./Bioscapes/biogeography"
import nvcsBioscape from "./Bioscapes/terrestrial-ecosystems-2011"

const bioscapeMap = {
    "biogeography": nbmBioscape,
    "nbm-react": nbmBioscape,
    "terrestrial-ecosystems-2011": nvcsBioscape
};

const TEXT_SEARCH_API = process.env.REACT_APP_BIS_API + "/api/v1/places/search/text?q=";
const POINT_SEARCH_API = process.env.REACT_APP_BIS_API + "/api/v1/places/search/point?";
const GET_FEATURE_API = process.env.REACT_APP_BIS_API + "/api/v1/places/search/feature?feature_id=";

class App extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            bioscape: bioscapeMap[props.bioscape],
            results: [],
            feature: null,
            textFocused: false
        }

        this.parseBioscape = this.parseBioscape.bind(this);
        this.handleSearchBox = this.handleSearchBox.bind(this)
        this.submitHandler = this.submitHandler.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);
        this.basemapChanged = this.basemapChanged.bind(this);
    }

    componentDidMount() {
        this.parseBioscape()
    }

    basemapChanged(e) {
        this.setState({
            basemap: e
        })
    }

    parseBioscape() {
        let basemap = this.state.bioscape.basemaps.find(function (obj) {
            return obj.selected === true;
        })

        this.setState({
            basemap: basemap
        })
    }

    submitHandler(e) {
        fetch(GET_FEATURE_API + e.id)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        feature: result.hits.hits[0]["_source"]
                    })
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    handleMapClick (e) {
        fetch(POINT_SEARCH_API + `lat=${e.latlng.lat}&lng=${e.latlng.lng}`)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        results: result.hits.hits.map(a => a["_source"]["properties"]),
                        textFocused: true
                    })
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    handleSearchBox(text) {
        if (text.length < 5) {
            this.setState({
                results: []
            });
            return;
        }
        fetch(TEXT_SEARCH_API + text)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        results: result.hits.hits.map(a => a["_source"]["properties"])
                    })
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    render() {
        return (
            <div>
                <Header title={this.state.bioscape.title}/>
                <LeftPanel
                    basemapChanged={this.basemapChanged}
                    bioscape={this.state.bioscape}
                    results={this.state.results}
                    focused={this.state.textFocused}
                    textSearchHandler={this.handleSearchBox}
                    submitHandler={this.submitHandler}
                />
                <NBM
                    basemap={this.state.basemap}
                    feature={this.state.feature}
                    parentClickHandler={this.handleMapClick}
                />
            </div>
        );
    }
}
export default App;
