import React from 'react'
import pdfMake from "pdfmake/build/pdfmake.js"
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

class PDFReport extends React.Component {

    constructor(props) {
        super(props)
        this.generateReport = this.generateReport.bind(this)
    }

    componentDidMount() {
        this.props.onRef(this)
    }

    generateReport(name,charts) {

        Promise.all(charts.flat()).then(contents => {
            var docDefinition = {
                content: [],
                styles: {
                    analysisTitle: {
                        fontSize: 18,
                        bold: true,
                        alignment: 'center'
                    },
                    chartTitle: {
                        fontSize: 14,
                        alignment: 'center'
                    },
                    chartSubtitle: {
                        fontSize: 12,
                        alignment: 'center'
                    },
                    annotation: {
                        fontSize: 10,
                        alignment: 'center'
                    },
                    annotationLink: {
                        fontSize: 10,
                        color: 'blue',
                        italics: true,
                        alignment: 'center'
                    },
                    tableStyle: {
                        fontSize: 7
                    }

                }
            }
            for (let content of contents) {
                docDefinition.content.push(content)

            }
            pdfMake.createPdf(docDefinition).download(`${name}.pdf`);
        })
    }

    render() {
        return 'Report'
    }
}

export default PDFReport;