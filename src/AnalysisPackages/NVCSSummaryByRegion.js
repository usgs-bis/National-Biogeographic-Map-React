import React from "react";
import { BarLoader } from "react-spinners"
import L from "leaflet";

import "./AnalysisPackages.css";

import withSharedAnalysisCharacteristics from "./AnalysisPackage"

const SB_URL = "https://www.sciencebase.gov/catalog/item/580ff6e4e4b0f497e7960b53?format=json"

let sb_properties = {
    "title": "NVCS Summary within Ecoregion III Area"
}

const layers = {
    class_service: {
        title: "Class",
        layer: L.tileLayer.wms(
            "https://www.sciencebase.gov/geoserver/nvcs/wms",
            {
                format: "image/png",
                layers: "class",
                opacity: .5,
                transparent: true
            }
        ),
        legend: {
            imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=class"
        },
        timeEnabled: true,
        checked: false
    },
    subclass_service: {
        title: "Subclass",
        layer: L.tileLayer.wms(
            "https://www.sciencebase.gov/geoserver/nvcs/wms",
            {
                format: "image/png",
                layers: "subclass",
                opacity: .5,
                transparent: true
            }
        ),
        legend: {
            imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=subclass"
        },
        timeEnabled: true,
        checked: false
    },
    formation_service: {
        title: "Formation",
        layer: L.tileLayer.wms(
            "https://www.sciencebase.gov/geoserver/nvcs/wms",
            {
                format: "image/png",
                layers: "formation",
                opacity: .5,
                transparent: true
            }
        ),
        legend: {
            imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=formation"
        },
        timeEnabled: true,
        checked: false
    },
    division_service: {
        title: "Division",
        layer: L.tileLayer.wms(
            "https://www.sciencebase.gov/geoserver/nvcs/wms",
            {
                format: "image/png",
                layers: "division",
                opacity: .5,
                transparent: true
            }
        ),
        legend: {
            imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=division"
        },
        timeEnabled: true,
        checked: false
    },
    macrogroup_service: {
        title: "Macrogroup",
        layer: L.tileLayer.wms(
            "https://www.sciencebase.gov/geoserver/nvcs/wms",
            {
                format: "image/png",
                layers: "macrogroup",
                opacity: .5,
                transparent: true
            }
        ),
        legend: {
            imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=macrogroup"
        },
        timeEnabled: true,
        checked: false
    },
    nvc_group_service: {
        title: "Group",
        layer: L.tileLayer.wms(
            "https://www.sciencebase.gov/geoserver/nvcs/wms",
            {
                format: "image/png",
                layers: "group",
                opacity: .5,
                transparent: true
            }
        ),
        legend: {
            imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=group"
        },
        timeEnabled: true,
        checked: false
    },
    ecosys_lu_service: {
        title: "Ecological System",
        layer: L.tileLayer.wms(
            "https://www.sciencebase.gov/geoserver/nvcs/wms",
            {
                format: "image/png",
                layers: "ecological_system",
                opacity: .5,
                transparent: true
            }
        ),
        legend: {
            imageUrl: "https://www.sciencebase.gov/geoserver/nvcs/wms?service=wms&request=GetLegendGraphic&format=image%2Fpng&layer=ecological_system"
        },
        timeEnabled: true,
        checked: false
    },

}

class NVCSSummaryByRegionPackage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            layersOpen: false
        }

        this.print = this.print.bind(this)
        this.fetch = this.fetch.bind(this)
        this.createUniqueBapContents = this.createUniqueBapContents.bind(this)
    }

    componentDidMount() {
        this.props.onRef(this)
        this.fetch()
    }

    componentDidUpdate(prevProps) {
        if (prevProps.feature !== this.props.feature) {
            this.fetch()
        }
    }

    fetch() {
        if (this.props.feature){
            this.props.isEnabled(true)
            this.props.canOpen(true)
        } else {
            this.props.isEnabled(true)
            this.props.canOpen(false)
        }

        this.setState({
            loading: false
        })
    }


    print() {
        return []
    }
    createUniqueBapContents() {
        return (
            <div>
                {this.props.getAnalysisLayers()}
                <div className="chartsDiv">
                    Feature ID: {this.props.feature ? this.props.feature.properties.feature_id : "Nothing"}
                    <br></br>
                    This BAP still gets value from the old API, that data needs to move to the new flask API
                </div>
            </div>
        )
    }

    render() {
        return (
            <div>
                <BarLoader width={100} widthUnit={"%"} color={"white"} loading={this.state.loading} />
                {this.props.getBapContents(this.createUniqueBapContents)}
            </div>

        )
    }

  
}
const NVCSSummaryByRegion = withSharedAnalysisCharacteristics(NVCSSummaryByRegionPackage, layers, sb_properties, SB_URL);

export default NVCSSummaryByRegion;
