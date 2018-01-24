import React, { Component } from 'react';
import { Glyphicon } from 'react-bootstrap';

class OptionGroup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false
        };
    }

    toggle = () => {
        this.setState({ expanded: !this.state.expanded });
    }

    render() {
        return (
            <div className="ddbx-option-group">
                <div className="ddbx-option-group-label" onClick={this.toggle}>
                    {this.props.label}
                    <Glyphicon glyph={this.state.expanded ? "chevron-down" : "chevron-right"} />
                </div>
                <div className={"ddbx-option-group-content" + (this.state.expanded ? " expanded" : "")}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default OptionGroup;