import React from "react";
import { Collapse } from "reactstrap"
import { Glyphicon } from "react-bootstrap";
import { FormGroup, Label } from 'reactstrap';

import "./AnalysisPackages.css"

const withSharedAnalysisCharacteristics = (AnalysisPackage,
    layers,
    sb_properties,
    sb_url) => {
    class HOC extends React.Component {
        constructor(props) {
            super(props)
            this.state = {
                sb_properties: sb_properties,
                submitted: false,
                canOpen: false,
                isOpen: false,
                glyph: "menu-right",
                updateAnalysisLayers: props.updateAnalysisLayers,
                value: [],
                layers: layers,
                bapId: props.bapId,
                isEnabled: true,
            }
            this.toggleDropdown = this.toggleDropdown.bind(this)
            this.toggleLayerDropdown = this.toggleLayerDropdown.bind(this)
            this.updateAnalysisLayers = this.updateAnalysisLayers.bind(this)
            this.setOpacity = this.setOpacity.bind(this)
            this.getAnalysisLayers = this.getAnalysisLayers.bind(this)
            this.resetAnalysisLayers = this.resetAnalysisLayers.bind(this)
            this.updateEnabled = this.updateEnabled.bind(this)
            this.canOpen = this.canOpen.bind(this)
            this.inputRefs = {}
            this.getSBItemForPrint = this.getSBItemForPrint.bind(this)
            this.htmlToPDFMake = this.htmlToPDFMake.bind(this)
        }

        componentDidMount() {
            fetch(sb_url)
                .then(res => res.json())
                .then(
                    (result) => {
                        this.setState({
                            sb_properties: result
                        })
                    },
                    (error) => {
                        this.setState({
                            error
                        });
                    }
                )
        }

        componentDidUpdate(prevProps) {
            if (prevProps.priorityBap !== this.props.priorityBap) {
                if (this.props.priorityBap !== this.state.bapId) {
                    let l = layers;
                    let that = this;
                    Object.keys(l).forEach(function (key) {
                        l[key].checked = false
                        that.inputRefs[key].checked = false
                    })

                    this.setState({
                        layers: l
                    })
                }
            }
        }

        resetAnalysisLayers() {
            this.props.updateAnalysisLayers([])
            let l = this.state.layers
            Object.keys(l).forEach(function (key) {
                l[key].checked = false
            })

            return l
        }

        updateAnalysisLayers() {
            let that = this
            let enabledLayers = []
            Object.keys(this.state.layers).forEach(function (key) {
                if (that[key].checked) {
                    let obj = that.state
                    let l = obj.layers
                    l[key].checked = true
                    obj.layers = l
                    that.setState(obj)
                    enabledLayers.push(that.state.layers[key])
                } else {
                    let obj = that.state
                    let l = obj.layers
                    l[key].checked = false
                    obj.layers = l
                    that.setState(obj)
                }
            })

            this.state.updateAnalysisLayers(enabledLayers, this.state.bapId)
        }

        toggleLayerDropdown() {
            this.setState({ layersOpen: !this.state.layersOpen })
        }

        setOpacity(key) {
            this.state.layers[key].layer.setOpacity(this[key + "Opacity"].value)
        }

        getAnalysisLayers() {
            let that = this
            if (this.state.layers) {
                return (
                    <div className="analysis-layers">
                        <span onClick={that.toggleLayerDropdown} className="analysis-layers-dropdown">
                            {"Analysis Layers"}
                            <Glyphicon
                                className="analysis-dropdown-glyph"
                                glyph={that.state.layersOpen ? "menu-down" : "menu-right"}
                            />
                        </span>
                        <Collapse isOpen={that.state.layersOpen}>
                            {Object.keys(this.state.layers).map(function (key) {
                                let layer = that.state.layers[key]
                                return (
                                    <FormGroup key={key} check>
                                        <Label check>
                                            <input
                                                style={{ display: layer.hideCheckbox ? "none" : "inline-block" }}
                                                ref={(input) => { that[key] = input; that["inputRefs"][key] = input }}
                                                onChange={function () { that.updateAnalysisLayers() }}
                                                checked={that.state.layers[key].checked}
                                                type="checkbox" />
                                            {' ' + layer.title}
                                        </Label>
                                        <input style={{ width: "50%" }}
                                            ref={(input) => { that[key + "Opacity"] = input; }}
                                            onChange={function () {
                                                that.setOpacity(key)
                                            }}
                                            type="range"
                                            step=".05"
                                            min="0"
                                            max="1"
                                            defaultValue={.5} />
                                    </FormGroup>
                                )
                            })}
                        </Collapse>
                    </div>
                )
            }
        }

        updateEnabled(enabled) {
            this.setState({
                isEnabled: enabled
            })
        }

        canOpen(canOpen) {
            this.setState({
                canOpen: canOpen
            })
        }

        toggleDropdown() {
            if (this.state.canOpen) {
                this.setState({
                    isOpen: !this.state.isOpen,
                    glyph: !this.state.isOpen ? "menu-down" : "menu-right"
                })
            }
        }

        htmlToPDFMake(content, element) {
            if (element.hasChildNodes()) {
                let children = element.childNodes
                for (let i = 0; i < children.length; i++) {
                    this.htmlToPDFMake(content, children[i])
                }
            }
            else {
                element.textContent = element.textContent.replace(/↵/g, '').trim()
                content.push(element)
            }
            return content
        }


        getSBItemForPrint() {
            //console.log(this.state.sb_properties.body)
            var body = document.createElement("div");
            body.innerHTML = this.state.sb_properties.body
            let contents = this.htmlToPDFMake([], body)
            //console.log(contents)

            let pdfDoc = []
            pdfDoc.push({ text: this.state.sb_properties.title, style: 'analysisTitle', margin: [5, 2, 5, 20], pageBreak: 'before' })

            for (let content of contents) {
                if (content.nodeName === '#text') {
                    switch (content.parentElement.nodeName) {
                        case 'H1':
                        case 'H2':
                        case 'H3':
                        case 'H4':
                            pdfDoc.push([{ text: content.textContent, style: 'sbPropertiesTitle' }])
                            break;
                        case 'UL':
                            pdfDoc.push({ text: content.textContent, style: 'sbProperties', decoration: 'underline', bold: true, margin: [10, 0, 0, 0] })
                            break;
                        case 'LI':
                            pdfDoc.push({ text: '•  ' + content.textContent, style: 'sbProperties', margin: [20, 0, 0, 0] })
                            break;
                        case 'A':
                            pdfDoc.push({ text: content.textContent, style: 'annotationLink', margin: [15, 10, 5, 0], link: content.textContent })
                            break;
                        default:
                            pdfDoc.push({ text: content.textContent, style: 'sbProperties', })

                    }

                    //WIP 
                    // let definition = { text: content.textContent,margin: [20, 0, 0, 0]}
                    // let parent = content.parentElement.nodeName
                    // let grandparent = content.parentElement.parentElement.nodeName

                    // if(parent === 'H1' || parent === 'H2' || parent === 'H3' || parent === 'H4' ){
                    //     definition.style='sbPropertiesTitle'
                    // }
                    // if(parent === 'UL' || grandparent === 'UL' ){
                    //     definition.decoration= 'underline'
                    // }
                    // if(parent === 'UL'){
                    //     definition.decoration= 'underline'
                    // }
                    // if(grandparent === 'UL' ){
                    //     definition.decoration= 'underline'
                    // }
                    
                    // switch (content.parentElement.nodeName) {
                    //     case 'H1':
                    //     case 'H2':
                    //     case 'H3':
                    //     case 'H4':
                    //         pdfDoc.push([{ text: content.textContent, style: 'sbPropertiesTitle' }])
                    //         break;
                    //     case 'UL':
                    //         pdfDoc.push({ text: content.textContent, style: 'sbProperties', decoration: 'underline', bold: true, margin: [10, 0, 0, 0] })
                    //         break;
                    //     case 'LI':
                    //         pdfDoc.push({ text: '•  ' + content.textContent, style: 'sbProperties', margin: [20, 0, 0, 0] })
                    //         break;
                    //     case 'A':
                    //         pdfDoc.push({ text: content.textContent, style: 'annotationLink', margin: [15, 10, 5, 0], link: content.textContent })
                    //         break;
                    //     default:
                    //         pdfDoc.push({ text: content.textContent, style: 'sbProperties', })

                    // }
                    
                    // pdfDoc.push(definition)

                }
            }
            pdfDoc.push({ text: 'ScienceBase Item', style: 'sbPropertiesTitle' })
            pdfDoc.push({ text: this.state.sb_properties.link.url, style: 'annotationLink', margin: [15, 10, 5, 0], link: this.state.sb_properties.link.url })
            pdfDoc.push({ text: '', pageBreak: 'after' })

            return pdfDoc

        }
        // try {
        //     let stack = []
        //     stack.push({ text: this.state.sb_properties.title, style: 'analysisTitle', margin: [5, 2, 5, 20], pageBreak: 'before' })
        //     let sections = this.state.sb_properties.body.split(/<h[1-9]>/g)
        //     sections = sections.map(s => s.split(/<\/h[1-9]>/g))
        //     for (let section of sections) {
        //         if (section.length === 2) {
        //             stack.push({ text: section[0], style: 'sbPropertiesTitle' })
        //             section[1] = section[1].replace(/<li>/g, '     • ')
        //             section[1] = section[1].replace(/<[^>]*>/g, '')
        //             section[1] = section[1].replace(/&nbsp;/g, '')
        //             // section[1] = section[1].replace(/<p>/g, '')
        //             // section[1] = section[1].replace(/<\/p>/g, '')
        //             if (section[1].includes('<u>')) {
        //                 let s = section[1].split('<u>')
        //                 s = s.map(t => t.split('</u>'))
        //                 for (let u of s) {
        //                     if (u.length === 2) {
        //                         stack.push({ text: u[0], style: 'sbProperties', decoration: 'underline', bold: true, margin: [10, 0, 0, 0] })
        //                         stack.push({ text: u[1], style: 'sbProperties' })
        //                     }
        //                     else {
        //                         stack.push({ text: u[0], style: 'sbProperties' })
        //                     }
        //                 }
        //             }
        //             else {
        //                 stack.push({ text: section[1], style: 'sbProperties', })
        //             }
        //         }
        //         else if (section.length === 1){
        //             stack.push({ text: 'Summary', style: 'sbPropertiesTitle' })
        //             stack.push({ text: section[0], style: 'sbProperties', })
        //         }
        //     }
        //     stack.push({ text: 'ScienceBase Item', style: 'sbPropertiesTitle' })
        //     stack.push({ text: this.state.sb_properties.link.url, style: 'annotationLink', margin: [15, 10, 5, 0], link: this.state.sb_properties.link.url })
        //     stack.push({ text: '', pageBreak: 'after' })
        //     return stack
        // }
        // catch (e) {
        //     return []
        // }
        //}

        render() {
            return (
                <div
                    style={{ display: this.state.isEnabled ? 'block' : 'none' }}
                    className="nbm-flex-row-no-padding">
                    <span onClick={this.toggleDropdown} className="bapTitle">
                        {this.state.sb_properties.title}
                        <Glyphicon style={{ display: this.state.canOpen ? "inline-block" : "none" }}
                            className="dropdown-glyph"
                            glyph={this.state.glyph} />
                    </span>
                    <Collapse className="settings-dropdown" isOpen={this.state.isOpen && this.state.isEnabled}>
                        <AnalysisPackage
                            {...this.props}
                            {...this.state}
                            setOpacity={this.setOpacity}
                            toggleLayerDropdown={this.toggleLayerDropdown}
                            updateBapLayers={this.updateAnalysisLayers}
                            resetAnalysisLayers={this.resetAnalysisLayers}
                            getAnalysisLayers={this.getAnalysisLayers}
                            getSBItemForPrint={this.getSBItemForPrint}
                            isEnabled={this.updateEnabled}
                            canOpen={this.canOpen}
                            inputRefs={this.inputRefs}
                        />
                    </Collapse>
                </div>
            );
        }

    }

    return HOC
}

export default withSharedAnalysisCharacteristics;
