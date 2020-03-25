import pdfFonts from 'pdfmake/build/vfs_fonts'
import AppConfig from '../config'
import USGS_LOGO from './USGSLogo'
import html2canvas from 'html2canvas'
import markerIcon from './marker-icon.png'
import pdfMake, { TDocumentDefinitions, Content } from 'pdfmake/build/pdfmake'

pdfMake.vfs = pdfFonts.pdfMake.vfs

const SUPPORT_EMAIL = AppConfig.REACT_APP_SUPPORT_EMAIL

const styles = {
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

const generatePdfReport = (name: string, type: string, point: any, area: string, map: any, charts: any[], url: string) => {

  charts.push(getTitleMap(map))
  return Promise.all(charts.flat()).then(contents => {
    var docDefinition: TDocumentDefinitions = {
      content: [
        {
          image: USGS_LOGO,
          width: 192,
          alignment: 'left',
          marginTop: -24
        },
        {
          text: `National Biogeographic Map \nSummary Report: ${name} \n ${type}`,
          style: 'titlePageHeader', alignment: 'center'
        },
        {
          image: contents.splice(contents.length - 1, 1),
          alignment: 'center',
          width: 500,
          margin: [0, 20, 0, 20],
        }
      ],
      styles,
      header: (currentPage: number) => {
        return currentPage === 1 ? '' : {
          text: 'Page: ' + currentPage.toString(),
          style: 'header'
        }
      },
      footer: () => {
        return {
          stack: [
            { text: 'U.S. Department of the Interior' },
            { text: 'U.S. Geological Survey' }
          ],
          style: 'footer'
        }
      }
    }
    if (point.lat && point.lng && point.elv) {
      (docDefinition.content as Content[]).push({
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
    (docDefinition.content as Content[]).push({
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
        { text: 'here', link: url, style: 'annotationLink' },
        {
          text: `.\n\nFor questions or comments contact: ${SUPPORT_EMAIL}.`
        }
      ],
      style: 'general'
    })

    for (let content of contents) {
      (docDefinition.content as Content[]).push(content)
    }
    pdfMake.createPdf(docDefinition).download(`National Biogeographic Map Summary Report For ${name}.pdf`)
    //clearInterval(renderInterval)
  })
}

const getTitleMap = (map: any): Promise<string> => {
  const leafletControlContainer: any = document.getElementsByClassName('leaflet-control-container')[0]
  const globalTimeSlider: any = document.getElementsByClassName('global-time-slider')[0]
  const locationOverlay: any = document.getElementsByClassName('location-overlay')[0]
  const attributes: any = document.getElementsByClassName('attribution')[0]
  //map.leafletElement.zoomControl.getContainer().hidden = true
  leafletControlContainer.hidden = true
  globalTimeSlider.hidden = true
  locationOverlay.hidden = true
  attributes.hidden = true

  return html2canvas(map.container, { useCORS: true, logging: true }).then((canvas) => {
    // map.leafletElement.zoomControl.getContainer().hidden = false
    leafletControlContainer.hidden = false
    globalTimeSlider.hidden = false
    locationOverlay.hidden = false
    attributes.hidden = false

    // create a promise so the marker image can load
    // we store the marker png locally so the canvas does not become 'tainted' (CORS)
    // calculate its position on the map and draw it to the canvas
    let p = new Promise<HTMLCanvasElement>((resolve, reject) => {
      map.leafletElement.eachLayer((layer: any) => {
        if (layer.options.name === 'mapClickedMarker') {
          const markerEl = layer.getElement()
          const markerRect = markerEl.getBoundingClientRect()
          const x = markerRect.x
          const y = markerRect.y - markerEl.height + 40

          let context = canvas.getContext('2d')!
          let img = new Image()
          img.onload = function () {
            context.drawImage(img, x, y)
            resolve(canvas)
          }
          img.src = markerIcon
        }
      })
    })

    return p.then((c: HTMLCanvasElement) => c.toDataURL())
  })
}

export default generatePdfReport
