import React from "react";
import "./LeftPanel.css";
import {Button, Container, Row, Col} from "reactstrap";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';


class LeftPanel extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            results: props.results,
            textSearchHandler: props.textSearchHandler,
            submitHandler: props.submitHandler,
            textFocus: false
        }
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.toggle = this.toggle.bind(this)
        this.onFocus = this.onFocus.bind(this)
        this.onBlur = this.onBlur.bind(this)
        this.submit = this.submit.bind(this)
    }

    componentWillReceiveProps(props) {
        if (props.focused) {
            this.refs.textInput.focus()
            this.setState({
                focused: props.focused
            })
        }
    }

    handleKeyUp(e) {
        this.state.textSearchHandler(e.target.value)
    }

    toggle() {
    }

    onFocus() {
        this.setState({
            focused: true
        })
    }

    onBlur () {
        let that = this;
        setTimeout(function() {
            that.setState({
                focused: false
            })
        }, 100)
    }

    submit(e) {
        this.state.submitHandler(e)
    }

    render() {
        let that = this;
        return (
            <div className={"left-panel"}>
                <Container>
                    <Row className={"top-row"}>
                        <Col xs="1">
                            <Button className={'placeholder-button'} />
                        </Col>
                        <Col xs="1">
                            <Button className={'placeholder-button'} />
                        </Col>
                        <Col xs="10">
                            <div className={"search-box"}>
                                <input ref={"textInput"} onFocus={this.onFocus} onBlur={this.onBlur} onKeyUp={this.handleKeyUp}
                                       className={"input-box"} type={"text"} />
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs="1">
                        </Col>
                        <Col xs="1">
                        </Col>
                        <Col xs="10">
                            <Dropdown
                                className={"dropdown-results"}
                                isOpen={this.props.results.length > 0 && this.state.focused}
                                toggle={this.toggle}>
                                <DropdownToggle className={"no-show"}>
                                    X
                                </DropdownToggle>
                                <DropdownMenu right className={"dropdown-results"}
                                              modifiers={{
                                                  setMaxHeight: {
                                                      enabled: true,
                                                      order: 890,
                                                      fn: (data) => {
                                                          return {
                                                              ...data,
                                                              styles: {
                                                                  ...data.styles,
                                                                  overflow: 'auto',
                                                                  maxHeight: 200
                                                              },
                                                          };
                                                      },
                                                  },
                                              }}
                                >
                                    {this.props.results.map(function(d, idx){
                                        return (
                                            <DropdownItem
                                                onClick={function(){that.submit(this)}}
                                                id={d.feature_id}
                                                key={d.feature_id}>
                                                {d.feature_name} ({d.feature_class})
                                            </DropdownItem>)
                                    })}
                                </DropdownMenu>
                            </Dropdown>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}
export default LeftPanel;
