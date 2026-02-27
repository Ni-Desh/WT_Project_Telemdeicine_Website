import React from 'react';
import { useExtendClass } from "./hooks.js";

/* Form layout components */
export function Form(props) {
    const encType = (props.encType) ? props.encType : (props.enctype ? props.enctype : "application/x-www-form-urlencoded");

    return (
        <form 
            method="post" 
            autoComplete={props.autoComplete} 
            encType={encType} 
            className={useExtendClass("", props.className)} 
            onSubmit={props.handleSubmit}
        >
            {props.children}
        </form>
    );
}

export function FormRow(props) {  
    return (
        <div className={useExtendClass("form-row", props.className)}>
            {props.children}
        </div>
    );
}

export function FormGroup(props) {  
    return (
        <div className={useExtendClass("form-group", props.className)}>
            {props.children}
        </div>
    );
}

/* Form element components. */
export function FormButton(props) {  
    return (
        <button 
            type={(props.type) ? props.type : "button"} 
            disabled={props.disabled}
            className={useExtendClass("btn", props.className)} 
            onClick={props.handleClick}
        >
            {props.children}
        </button>
    );
}

export function FormSubmit(props) {
    return (
        <FormButton 
            type="submit" 
            disabled={props.disabled}
            className={useExtendClass("btn-primary", props.className)}
            // We do not pass handleClick here so the browser triggers the 'submit' event naturally
        >
            {props.children}
        </FormButton>
    );
}

export function FormText(props) {  
    return (
        <input 
            type="text" 
            id={props.id} 
            value={props.value} 
            readOnly 
            className={useExtendClass("form-control-plaintext", props.className)}
        />
    );
}

export function FormLabel(props) {  
    return (
        <label htmlFor={props.htmlFor || props.for} className={useExtendClass("col-form-label", props.className)}>
            {props.children}
        </label>
    );
}

export function FormLegend(props) {  
    return (
        <legend className={useExtendClass("col-form-label", props.className)}>
            {props.children}
        </legend>
    );
}