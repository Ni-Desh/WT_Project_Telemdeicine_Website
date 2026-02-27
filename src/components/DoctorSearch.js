import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { getDoctorsBySearch } from '../Actions/patient';
import { Form, FormGroup, FormLabel, FormSubmit } from './form';

export default function DoctorSearch() {
    const [name, setName] = useState('');
    const dispatch = useDispatch();

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(getDoctorsBySearch(name)); 
    };

    return (
        <div className="search-container p-3 border rounded bg-light">
            <h3>Find a Specialist</h3>
            <Form handleSubmit={handleSubmit}>
                <FormGroup>
                    <FormLabel for="doctorName">Doctor Name</FormLabel>
                    <input 
                        id="doctorName"
                        type="text" 
                        className="form-control" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Type name (e.g., Pradnya)..."
                    />
                </FormGroup>
                {/* Note: Ensure FormSubmit does NOT receive currentStep from any parent */}
                <FormSubmit className="w-100">Search</FormSubmit>
            </Form>
        </div>
    );
}