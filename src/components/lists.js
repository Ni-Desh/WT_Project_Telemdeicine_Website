import React from 'react';
import { useSelector } from 'react-redux';
import { useExtendClass } from "./hooks.js";

export function List(props) {
    return <ul className={useExtendClass("list-group", props.className)}>{props.children}</ul>;
}

export function ListItem(props) {
    return <li className={useExtendClass("list-group-item", props.className)}>{props.children}</li>;
}

export function ListButton(props) {
    return (
        <button 
            type="button" 
            name={props.name} 
            value={props.value}
            className={useExtendClass("list-group-item list-group-item-action", props.className)}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    );
}

export function ListLink(props) {
    return (
        <a href={props.href || "#"} className={useExtendClass("list-group-item list-group-item-action", props.className)} onClick={props.onClick}>
            {props.children}
        </a>
    );
}

export function SearchResultsList({ onSelectDoctor }) {
    const doctors = useSelector((state) => state.patient.doctors || []);
    return (
        <div className="mt-3">
            <List>
                {doctors.length > 0 ? doctors.map((doc) => (
                    <ListButton 
                        key={doc._id} 
                        name="physician"
                        value={`${doc.firstName} ${doc.lastName}`}
                        onClick={(e) => onSelectDoctor && onSelectDoctor(e)}
                    >
                        <strong>Dr. {doc.firstName} {doc.lastName}</strong>
                    </ListButton>
                )) : <ListItem className="text-muted text-center">No doctors found.</ListItem>}
            </List>
        </div>
    );
}

export function MedicalLocker() {
    const records = useSelector((state) => state.patient.locker || []);
    return (
        <List>
            {records.length > 0 ? records.map((record, index) => (
                <ListItem key={index}><strong>{record.title}</strong></ListItem>
            )) : <ListItem className="text-muted text-center">No records.</ListItem>}
        </List>
    );
}