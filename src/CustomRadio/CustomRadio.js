import React from 'react'
import { Glyphicon } from "react-bootstrap";

import "./CustomRadio.css"

class Radio extends React.Component{

    handleClick(){
        this.props.handler(this.props.index);
    }

    render() {
        return (
            <div onClick={this.handleClick.bind(this)}>
                <div className="nbm-flex-row-no-padding radio-option">
                    <span className="nbm-flex-column-big">{this.props.text}</span>
                    <Glyphicon
                        style={{textAlign: "right"}}
                        className="nbm-flex-column"
                        glyph={this.props.isChecked ? "check" : "unchecked"}
                    />
                </div>
            </div>
        );
    }
}

class RadioGroup extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            selectedIndex: 0,
            selectedValue: null,
            options: props.options
        };
    }

    toggleRadioBtn(index){
        this.setState({
            selectedIndex: index,
            selectedValue: this.state.options[index],
            options: this.state.options
        });
        this.props.onChange(this.state.options[index])
    }

    render() {

        const { options } = this.state;

        const allOptions = options.map((option, i) => {
            return (
                <div key={i}>
                    <Radio
                        isChecked={(this.state.selectedIndex === i)}
                        text={option.title}
                        value={option.title}
                        index={i}
                        handler={this.toggleRadioBtn.bind(this)} />
                    {/*<br/>*/}
                </div>
            )
        });

        return (
            <div>{allOptions}</div>
        );
    }
}

export {
    RadioGroup,
    Radio
}
