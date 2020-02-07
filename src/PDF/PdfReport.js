import React from 'react'
import pdfMake from "pdfmake/build/pdfmake.js"
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';
import html2canvas from 'html2canvas';
import markerIcon from './marker-icon.png'
import AppConfig from '../config';


pdfMake.vfs = pdfFonts.pdfMake.vfs;

const SUPPORT_EMAIL = AppConfig.REACT_APP_SUPPORT_EMAIL

const USGS_LOGO = 'data:image/png;base64,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'


class PDFReport extends React.Component {

    constructor(props) {
        super(props)
        this.generateReport = this.generateReport.bind(this)
        this.getStyles = this.getStyles.bind(this)
        this.getHeader = this.getHeader.bind(this)
        this.getFooter = this.getFooter.bind(this)
        this.getTitleMap = this.getTitleMap.bind(this)
    }

    componentDidMount() {
        this.props.onRef(this)
    }

    generateReport(name, type, point, area, map, charts) {
        charts.push(this.getTitleMap(map))
        return Promise.all(charts.flat()).then(contents => {
            var docDefinition = {
                content: [],
                styles: this.getStyles(),
                header: this.getHeader(),
                footer: this.getFooter()
            }
            docDefinition.content.push({
                image: USGS_LOGO,
                width: 192,
                alignment: 'left',
                marginTop: -24
            });
            docDefinition.content.push({
                text: `National Biogeographic Map \nSummary Report: ${name} \n ${type}`,
                style: 'titlePageHeader', alignment: 'center'
            });
            docDefinition.content.push({
                image: contents.splice(contents.length - 1, 1),
                alignment: 'center',
                width: 500,
                margin: [0, 20, 0, 20],
            });
            if (point.lat && point.lng && point.elv) {
                docDefinition.content.push({
                    text: [
                        {
                            text: `Category: `,
                            style: 'aoiDescription',
                            alignment: 'left'
                        },
                        {
                            text: ` ${type}\n`,
                            style: 'chartSubtitle',
                            alignment: 'left'
                        },
                        {
                            text: `Approximate Area:`,
                            style: 'aoiDescription',
                            alignment: 'left'
                        },
                        {
                            text: ` ${area === "Unknown" ? 'Unknown' : area + " acres"} \n`,
                            style: 'chartSubtitle',
                            alignment: 'left'
                        },
                        {
                            text: `Point of Interest: `,
                            style: 'aoiDescription',
                            alignment: 'left'
                        },
                        {
                            text: ` ${point.lat.toFixed(5)}°, ${point.lng.toFixed(5)}°  ${point.elv}ft.\n`,
                            style: 'chartSubtitle',
                            alignment: 'left'
                        },
                    ]
                })
            }
            docDefinition.content.push({
                text: [
                    {
                        text: 'National Biogeographic Map\n',
                        style: 'analysisTitle',
                        alignment: 'left'
                    },
                    {
                        text: `\nThe National Biogeographic Map is a prototype application designed to bring together USGS biogeographic data and information for analysis and synthesis. Some of the software and data found in the National Biogeographic Map is considered provisional and subject to revision until it has been fully vetted through the USGS release process. They are provided here to meet the need for timely best science.\n `,
                    },
                    {
                        text: `\nThis summary report was generated on ${new Date().toUTCString()} using USGS National Biogeographic Map analytics and data assets. The analysis packages and data sources used for this synthesis are documented below. To recreate the synthesis with current data and analytical methods, click `,

                    },
                    { text: 'here', link: this.props.getShareUrl(), style: 'annotationLink' },
                    {
                        text: `.\n\nFor questions or comments contact: ${SUPPORT_EMAIL}.`
                    }
                ],
                style: 'general'
            })


            for (let content of contents) {
                docDefinition.content.push(content)

            }
            pdfMake.createPdf(docDefinition).download(`National Biogeographic Map Summary Report For ${name}.pdf`);
            //clearInterval(renderInterval)
        })
    }

    getTitleMap(map) {
        //map.leafletElement.zoomControl.getContainer().hidden = true
        document.getElementsByClassName('leaflet-control-container')[0].hidden = true
        document.getElementsByClassName('global-time-slider')[0].hidden = true
        document.getElementsByClassName('location-overlay')[0].hidden = true

        return html2canvas(map.container, { useCORS: true, logging: false }).then((canvas) => {
            // map.leafletElement.zoomControl.getContainer().hidden = false
            document.getElementsByClassName('leaflet-control-container')[0].hidden = false
            document.getElementsByClassName('global-time-slider')[0].hidden = false
            document.getElementsByClassName('location-overlay')[0].hidden = false


            // create a promise so the marker image can load
            // we store the marker png locally so the canvas does not become 'tainted' (CORS)
            // calculate its position on the map and draw it to the canvas
            let p = new Promise(function (resolve, reject) {
                map.leafletElement.eachLayer((layer) => {
                    if (layer.options.name === 'mapClickedMarker') {
                        const markerEl = layer.getElement();
                        const markerRect = markerEl.getBoundingClientRect()
                        const leftPannel = document.getElementsByClassName('panel-area')
                        let offset = 0
                        let x = 0
                        let y = 0

                        // mobile layout 
                        if (window.innerWidth <= 700) {
                            if (leftPannel.length) offset = leftPannel[0].clientHeight
                            x = markerRect.x
                            y = markerRect.y - markerEl.height - 15 - offset
                        }
                        // normal layout
                        else {
                            if (leftPannel.length) offset = leftPannel[0].clientWidth
                            x = markerRect.x - offset
                            y = markerRect.y - markerEl.height - 15
                        }

                        let context = canvas.getContext("2d");
                        let img = new Image();
                        img.onload = function () {
                            context.drawImage(img, x, y);
                            resolve(canvas)
                        }
                        img.src = markerIcon
                    }
                })
            })

            return p.then(function (c) {
                return c.toDataURL()
            })
        })
    } s

    getStyles() {
        return {
            analysisTitle: {
                fontSize: 18,
                bold: true,
                alignment: 'center',
                margin: [5, 2, 5, 20]
            },
            chartTitle: {
                fontSize: 14,
                alignment: 'center',
                margin: [5, 2, 5, 2]
            },
            chartSubtitle: {
                fontSize: 12,
                alignment: 'center',
                margin: [5, 2, 5, 10]
            },
            aoiDescription: {
                fontSize: 14,
                alignment: 'center',
                bold: true,
                margin: [5, 2, 5, 2],
            },
            annotation: {
                fontSize: 10,
                alignment: 'left'
            },
            annotationLink: {
                fontSize: 10,
                color: 'blue',
                italics: true,
                alignment: 'left'
            },
            tableStyle: {
                fontSize: 7
            },
            titlePageHeader: {
                fontSize: 24,
                bold: true,
                alignment: 'left',
                margin: [0, 72, 0, 0]
            },
            sectionHeader: {
                fontSize: 20,
                bold: true,
                alignment: 'center'
            },
            header: {
                fontSize: 10,
                margin: [48, 10, 48, 0],
                alignment: 'right'
            },
            footer: {
                fontSize: 10,
                margin: [48, 10, 48, 0]
            },
            general: {
                margin: [0, 10, 0, 0],
                fontSize: 10
            },
            sbProperties: {
                margin: [15, 2, 0, 2],
                fontSize: 10,
                alignment: 'left'
            },
            sbPropertiesTitle: {
                margin: [5, 10, 0, 2],
                fontSize: 14,
                bold: true,
                decoration: 'underline',
                alignment: 'left'
            }

        }
    }

    getHeader() {
        return (currentPage, pageCount) => {
            return currentPage === 1 ? '' : {
                text: 'Page: ' + currentPage.toString(),
                style: 'header'
            }
        }
    }

    getFooter() {
        return () => {
            return {
                stack: [
                    { text: 'U.S. Department of the Interior' },
                    { text: 'U.S. Geological Survey' }
                ],
                style: 'footer'
            };
        }
    }


    render() {
        return 'Report'
    }
}


export default PDFReport;