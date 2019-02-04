import React from "react";
import Dialog from "react-dialog";

import "./CustomDialog.css"

class CustomDialog extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isDraggable: props.isDraggable,
            isResizable: props.isResizable,
            title: props.title,
            modal: props.modal,
            onClose: props.onClose
        }
    }

    render() {
        return (
            <Dialog
                isResizable={this.state.isResizable}
                isDraggable={this.state.isDraggable}
                title={this.state.title}
                modal={this.state.modal}
                onClose={this.state.onClose}
            >
                {this.props.body}
            </Dialog>
        );
    }
}
export default CustomDialog;

