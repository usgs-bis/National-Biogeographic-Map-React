import * as pdfFonts from 'pdfmake/build/vfs_fonts.js'
import AppConfig from '../config'
import React from 'react'
import USGS_LOGO from './USGSLogo'
import html2canvas from 'html2canvas'
import markerIcon from './marker-icon.png'
import pdfMake from 'pdfmake/build/pdfmake.js'

pdfMake.vfs = pdfFonts.pdfMake.vfs

const SUPPORT_EMAIL = AppConfig.REACT_APP_SUPPORT_EMAIL

class PDFReport extends React.Component {

    constructor(props) {
        super(props)
        this.generateReport = this.generateReport.bind(this)
        this.getStyles = this.getStyles.bind(this)
        this.getHeader = this.getHeader.bind(this)
        this.getFooter = this.getFooter.bind(this)
        this.getTitleMap = this.getTitleMap.bind(this)
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
            })
            docDefinition.content.push({
                text: `National Biogeographic Map \nSummary Report: ${name} \n ${type}`,
                style: 'titlePageHeader', alignment: 'center'
            })
            docDefinition.content.push({
                image: contents.splice(contents.length - 1, 1),
                alignment: 'center',
                width: 500,
                margin: [0, 20, 0, 20],
            })
            if (point.lat && point.lng && point.elv) {
                docDefinition.content.push({
                    text: [
                        {
                            text: 'Category: ',
                            style: 'aoiDescription',
                            alignment: 'left'
                        },
                        {
                            text: ` ${type}\n`,
                            style: 'chartSubtitle',
                            alignment: 'left'
                        },
                        {
                            text: 'Approximate Area:',
                            style: 'aoiDescription',
                            alignment: 'left'
                        },
                        {
                            text: ` ${area} \n`,
                            style: 'chartSubtitle',
                            alignment: 'left'
                        },
                        {
                            text: 'Point of Interest: ',
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
                        text: '\nThe National Biogeographic Map is a prototype application designed to bring together USGS biogeographic data and information for analysis and synthesis. Some of the software and data found in the National Biogeographic Map is considered provisional and subject to revision until it has been fully vetted through the USGS release process. They are provided here to meet the need for timely best science.\n ',
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
            pdfMake.createPdf(docDefinition).download(`National Biogeographic Map Summary Report For ${name}.pdf`)
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
                        const markerEl = layer.getElement()
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

                        let context = canvas.getContext('2d')
                        let img = new Image()
                        img.onload = function () {
                            context.drawImage(img, x, y)
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
            }
        }
    }


    render() {
        return 'Report'
    }
}


export default PDFReport
