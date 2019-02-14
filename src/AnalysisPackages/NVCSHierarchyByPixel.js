import React from "react";
import { BarLoader } from "react-spinners"
import L from "leaflet";

import "./AnalysisPackages.css";

import withSharedAnalysisCharacteristics from "./AnalysisPackage"

const SB_URL = "https://www.sciencebase.gov/catalog/item/582a1819e4b01fad8726554a?format=json"
const PIXEL_URL = "https://www.sciencebase.gov/geoserver/nvcs/wms"

let sb_properties = {
    "title": "NVCS Hierarchy by Pixel"
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

class NVCSHierarchyByPixelPackage extends React.Component {
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
        if (prevProps.point !== this.props.point) {
            this.fetch()
        }
    }

    fetch() {
        if (!this.props.point.lat || !this.props.point.lng) return

        this.setState({
            loading: true
        })
        let buffer = .01;
        var parameters = {
            service: 'WMS',
            version: '1.3',
            request: 'GetFeatureInfo',
            layers: "ecological_system",
            query_layers: "ecological_system",
            feature_count: 50,
            info_format: 'application/json',
            CRS: 'EPSG:4326',
            buffer: 1,
            width: 101,
            height: 101,
            x: 50,
            y: 50,
            bbox: (this.props.point.lng - buffer) + ',' + (this.props.point.lat - buffer) + ',' +
            (this.props.point.lng + buffer) + ',' + (this.props.point.lat + buffer)
        }
        var url = new URL(PIXEL_URL)
        Object.keys(parameters).forEach(key => url.searchParams.append(key, parameters[key]))
        fetch(url)
            .then(res => res.json())
            .then(
                (result) => {
                    let pixelValue = null
                    if (result["features"]) {
                        pixelValue = result["features"][0]["properties"]["pixel_value"]
                    }
                    this.setState({
                        loading: false,
                        pixelValue: pixelValue
                    })
                    this.props.isEnabled(true)
                    this.props.canOpen(true)
                },
                (error) => {
                    this.setState({
                        error,
                        loading: false
                    });
                }
            )
    }


    print() {
        return []
    }

    createUniqueBapContents() {
        return (
            <div>
                {this.props.getAnalysisLayers()}
                <div className="chartsDiv">
                    Pixel Value: {this.state.pixelValue}
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
const NVCSHierarchyByPixel = withSharedAnalysisCharacteristics(NVCSHierarchyByPixelPackage, layers, sb_properties, SB_URL);

export default NVCSHierarchyByPixel;
