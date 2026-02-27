import React, { useState } from 'react';
import PhysicianSection from './physicianSection';
import InfoSection from './infoSection';

export default function NewAppointmentForm(props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [errorMessage, setErrorMessage] = useState("");
    const [fields, setFields] = useState({
        physician: props.physician || "",
        title: "",
        description: "",
        startDate: "", 
        startTime: "",
        endDate: "",
        endTime: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFields(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClick = (e) => {
        const name = e.currentTarget.name; 
        const value = e.currentTarget.value;

        if (name && value) {
            setFields(prev => ({
                ...prev,
                [name]: value
            }));

            if (name === "physician") {
                setCurrentStep(2);
            }
        }
    };

    const handleFinalize = async (e) => {
        if (e) e.preventDefault();
        
        if (!fields.startDate || !fields.startTime) {
            setErrorMessage("Please select both a date and a time slot.");
            return;
        }

        try {
            // BACKEND POST CALL
            const response = await fetch('/api/appointments/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields)
            });

            if (response.ok) {
                alert(`Success! Appointment confirmed for ${fields.title}.`);
                // Reset or redirect after success
                window.location.reload(); 
            } else {
                const errorData = await response.json();
                setErrorMessage(errorData.error || "Booking failed.");
            }
        } catch (err) {
            setErrorMessage("Unable to connect to the server.");
        }
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="md-new-appt-form p-3">
            {currentStep === 1 && (
                <PhysicianSection
                    session={props.session}
                    currentStep={currentStep}
                    name="physician"
                    handleClick={handleClick} 
                />
            )}

            {currentStep === 2 && (
                <div className="animation-fade-in">
                    <div className="text-center mb-4">
                        <h5 className="mb-1">Appointment Details</h5>
                        <p className="text-muted small">Fill in the information below</p>
                    </div>

                    <div className="alert alert-info d-flex justify-content-between align-items-center py-2 px-3">
                        <span>Selected Physician: <strong>Dr. {fields.physician}</strong></span>
                        <button className="btn btn-sm btn-link p-0" onClick={() => setCurrentStep(1)}>Change</button>
                    </div>
                    
                    <form onSubmit={handleFinalize} noValidate>
                        <InfoSection 
                            currentStep={currentStep}
                            physician={fields.physician}
                            title={fields.title}
                            description={fields.description}
                            startDate={fields.startDate}
                            startTime={fields.startTime}
                            endDate={fields.endDate}
                            endTime={fields.endTime}
                            handleChange={handleChange}
                            errorMessage={errorMessage}
                        />
                    </form>

                    <div className="mt-4 d-flex justify-content-start">
                        <button type="button" className="btn btn-outline-secondary" onClick={prevStep}>Back</button>
                    </div>
                </div>
            )}
        </div>
    );
}