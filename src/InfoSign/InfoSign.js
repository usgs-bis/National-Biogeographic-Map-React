import React from 'react'
import {FaInfoCircle} from 'react-icons/fa'
import {Tooltip} from 'reactstrap'


import './InfoSign.css'

class InfoSign extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false
        }
        this.makeid = (length) => {
            var text = ''
            var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
            for (var i = 0; i < length; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length))
            return text
        }
        this.id = this.makeid(15)
    }


    render() {

        return (
            <React.Fragment>
                <span id={this.id} onClick={this.props.onClick} className="main-title-info">
                    <FaInfoCircle />
                </span>
                <Tooltip
                    style={{fontSize: '14px'}} isOpen={this.state.open}
                    target={this.id}
                    toggle={() => this.setState({open: !this.state.open})}
                    delay={0}>
                    Information
                </Tooltip>
            </React.Fragment>

        )
    }
}
export default InfoSign

