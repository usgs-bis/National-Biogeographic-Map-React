import React from "react";
import NBM from "./NBM/NBM";
import Header from "./Header/Header";
import LeftPanel from "./LeftPanel/LeftPanel";
import nbmBioscape from "./Bioscapes/biogeography"
import nvcsBioscape from "./Bioscapes/terrestrial-ecosystems-2011"

const bioscapeMap = {
    "biogeography": nbmBioscape,
    "terrestrial-ecosystems-2011": nvcsBioscape
};

class App extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            bioscape: bioscapeMap[props.bioscape]
        }
    }

    handleMapClick(e) {
        console.log("We can send this click event anywhere!", e.latlng);
    }

    render() {
        return (
            <div>
                <Header title={this.state.bioscape.title} />
                <LeftPanel />
                <NBM parentClickHandler={this.handleMapClick} />
            </div>
        );
    }
}
export default App;
