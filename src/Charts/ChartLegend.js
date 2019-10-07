import React from "react";

class ChartLegend extends React.Component {
    constructor(props) {
      super(props);
      this.border = props.border

      this.state = {
        items: props.items
      }
    }

    componentDidUpdate() {
        if (this.state.items !== this.props.items) {
            this.setState({
                items: this.props.items,
            })
        }
    }

    render() {
      const items = this.state.items
      return items.length ? (
        <div className="m-4 p-2" style={this.border ? {border: '1px solid gray'} : {}}>
            {items.map(item => {
              return (
                <div key={`${item.key}`} className="mb-2">
                  <div className="d-inline-block mr-2" style={{width:'20px', height:'20px', backgroundColor: item.color}}>&nbsp;</div>
                  <div className="d-inline">{item.label}</div>
                </div>
              )
            })}
        </div>
      ) : ''
    }
}
export default ChartLegend;