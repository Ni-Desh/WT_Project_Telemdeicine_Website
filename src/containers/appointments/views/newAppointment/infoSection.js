import React, { useState, useEffect, useCallback } from 'react';
import { DateInput } from '../../../../components/dates';
import { FormGroup, FormLabel, FormRow, FormSubmit } from '../../../../components/form';

export default function InfoSection(props) {
    const [slots, setSlots] = useState([]);

    const generateTimeSlots = useCallback(() => {
        const times = [];
        for (let hour = 9; hour < 18; hour++) {
            for (let min of ["00", "30"]) {
                if (hour === 12 && min === "30") continue; 
                let period = hour >= 12 ? "PM" : "AM";
                let displayHour = hour > 12 ? hour - 12 : hour;
                if (displayHour === 0) displayHour = 12;
                times.push(`${displayHour}:${min} ${period}`);
            }
        }
        return times;
    }, []);

    // FETCH REAL-TIME DATA FROM BACKEND
    useEffect(() => {
        const updateAvailability = async () => {
            if (!props.startDate || !props.physician) return;

            try {
                // physician in props is the username string based on your form logic
                const response = await fetch(`/api/appointment/booked?physicianUsername=${props.physician}&date=${props.startDate}`);
                const bookedTimes = await response.json(); 

                const allPossibleSlots = generateTimeSlots();
                const statusSlots = allPossibleSlots.map(time => ({
                    time,
                    status: bookedTimes.includes(time) ? "booked" : "available"
                }));

                setSlots(statusSlots);
            } catch (err) {
                console.error("Error fetching availability:", err);
            }
        };

        updateAvailability();
    }, [props.startDate, props.physician, generateTimeSlots]);

    if (props.currentStep !== 2) return null;

    return (
        <>
            {props.errorMessage && (
                <FormRow className="justify-content-center">
                    <div className="alert alert-danger w-100" role="alert">{props.errorMessage}</div>
                </FormRow>
            )}

            <FormGroup>
                <FormLabel htmlFor="newApptInput3" className="text-muted">Appointment Title</FormLabel>
                <input id="newApptInput3" type="text" name="title" className="form-control"
                    placeholder="e.g. Regular Consultation" value={props.title} onChange={props.handleChange}
                    maxLength="75" />
            </FormGroup>

            <FormRow>
                <FormGroup className="col-12">
                    <DateInput
                        id="newApptInput4"
                        className="form-control"
                        name="startDate"
                        label="Select Date"
                        value={props.startDate}
                        handleChange={props.handleChange}
                    />
                </FormGroup>
            </FormRow>

            <FormGroup>
                <FormLabel className="text-muted">Select an Available Slot (9:00 AM - 6:00 PM)</FormLabel>
                <div className="row no-gutters">
                    {slots.map((slot, index) => (
                        <div key={index} className="col-4 col-md-3 p-1">
                            <button
                                type="button"
                                className={`btn btn-block btn-sm py-2 ${
                                    slot.status === "booked" 
                                    ? "btn-danger disabled" 
                                    : props.startTime === slot.time 
                                        ? "btn-success shadow border-dark" 
                                        : "btn-outline-success"
                                }`}
                                onClick={() => {
                                    if (slot.status !== "booked") {
                                        props.handleChange({ target: { name: 'startTime', value: slot.time }});
                                    }
                                }}
                                style={{ cursor: slot.status === "booked" ? "not-allowed" : "pointer" }}
                            >
                                {slot.time}
                            </button>
                        </div>
                    ))}
                </div>
            </FormGroup>

            <FormGroup>
                <FormLabel htmlFor="newApptInput11" className="text-muted">Description</FormLabel>
                <textarea id="newApptInput11" name="description" className="form-control"
                    placeholder="Add a brief description..." value={props.description} 
                    onChange={props.handleChange} rows="3" maxLength="300">
                </textarea>
            </FormGroup>

            <FormRow className="d-flex justify-content-center m-2">
                <FormSubmit disabled={!props.startTime || !props.title || !props.startDate}>
                    Request Appointment
                </FormSubmit>
            </FormRow>
        </>
    );
}