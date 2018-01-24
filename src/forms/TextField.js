import { FormControl, FormGroup } from 'react-bootstrap';
import React, { Component } from "react";

import FieldLabel from "./FieldLabel";
import FieldService from "../services/FieldService";

class TextField extends Component {
    changeHandler = this.props.onChange || FieldService.onChangeFunc(this.props.valuePropName, this.props.container);

    render() {
        return (
            <span className={this.props.className}>
                <FieldLabel label={this.props.label} />
                <FormGroup bsSize="small" validationState={this.props.validationState}>
                    <FormControl
                        type="text"
                        style={{ height: "32px" }}
                        value={this.props.value}
                        onChange={this.changeHandler}
                        onKeyDown={FieldService.onEnterFunc(this.props.onEnter, this.props.container)}
                        placeholder={this.props.placeholder}
                        maxLength={this.props.maxLength}
                    />
                </FormGroup>
            </span>
        );
    }
}

export default TextField;