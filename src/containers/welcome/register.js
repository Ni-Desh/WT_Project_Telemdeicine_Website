import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Col } from "../../components/layout.js";
import { Form, FormRow, FormGroup, FormLabel, FormSubmit } from "../../components/form.js";
import { SelectDate, SelectMonthByName, SelectYear } from "../../components/dates.js";
import { Genders, GenderInput, Qualifications, QualificationInput,
    Specializations, SpecializationInput } from "../../components/users.js";

export default function RegisterForm(props) {
    const today = new Date();
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(false);
    const [fields, setfields] = useState({
        errorMessage: "",
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        confirmPassword: "",
        dobDay: today.getDate(),
        dobMonth: today.getMonth() + 1,
        dobYear: today.getFullYear(),
        gender: (Genders && Genders.length > 0) ? Genders[0] : "",
        isPhysician: "No",
        qualification: (Qualifications && Qualifications.length > 0) ? Qualifications[0] : "",
        specialization: (Specializations && Specializations.length > 0) ? Specializations[0] : ""
    });

    function handleChange(e) {
        setfields({
            ...fields,
            [e.target.name]: e.target.value
        });
    }

    async function handleSubmit(e) {
        if (e) e.preventDefault();
        console.log("Register Attempted:", fields.username);
        
        if (fields.password !== fields.confirmPassword) {
            setfields({ ...fields, errorMessage: "Passwords do not match!" });
            return;
        }

        setLoading(true);
        try {
            const dob = new Date(fields.dobYear, fields.dobMonth - 1, fields.dobDay);

            const registerResponse = await fetch(`/api/auth/register`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: fields.username,
                    password: fields.password,
                    firstName: fields.firstName.trim(),
                    lastName: fields.lastName.trim(),
                    isPhysician: (fields.isPhysician === "Yes"),
                    dob: dob,
                    gender: fields.gender,
                    qualification: (fields.isPhysician === "Yes") ? fields.qualification : "",
                    specialization: (fields.isPhysician === "Yes") ? fields.specialization : ""
                })
            });

            const registerData = await registerResponse.json();
            if (!registerResponse.ok) {
                throw new Error(registerData.message || "Registration failed");
            }

            const signInResponse = await fetch(`/api/auth/signin`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: fields.username,
                    password: fields.password
                })
            });

            const signInData = await signInResponse.json();
            if (!signInResponse.ok) {
                throw new Error(signInData.message || "Login failed after registration");
            }

            dispatch({
                type: "session/set",
                payload: { ...signInData }
            });

        } catch (err) {
            console.error(`Register Error: ${err.message}`);
            setfields({ ...fields, errorMessage: err.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form handleSubmit={handleSubmit}>
            {fields.errorMessage && (
                <FormRow className="justify-content-center">
                    <div className="alert alert-danger p-2 w-100 text-center" role="alert">
                        {fields.errorMessage}
                    </div>
                </FormRow>
            )}

            <FormRow>
                <FormGroup className="col-sm-6">
                    <input name="firstName" className="form-control" placeholder="First name" 
                        value={fields.firstName} onChange={handleChange} required />
                </FormGroup>
                <FormGroup className="col-sm-6">
                    <input name="lastName" className="form-control" placeholder="Last name" 
                        value={fields.lastName} onChange={handleChange} required />
                </FormGroup>
            </FormRow>

            <FormGroup>
                <input name="username" className="form-control" placeholder="Username" 
                    value={fields.username} onChange={handleChange} autoComplete="off" required />
            </FormGroup>

            <FormRow className="my-sm-3">
                <FormGroup className="col-sm-6">
                    <input type="password" name="password" className="form-control" placeholder="Password" 
                        value={fields.password} onChange={handleChange} minLength="8" required />
                </FormGroup>
                <FormGroup className="col-sm-6">
                    <input type="password" name="confirmPassword" className="form-control" placeholder="Confirm Password" 
                        value={fields.confirmPassword} onChange={handleChange} minLength="8" required />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup className="col-sm-6">
                    <FormLabel className="md-font-sm text-muted">Birthday</FormLabel>
                    <FormRow>
                        <Col><SelectMonthByName name="dobMonth" value={fields.dobMonth} handleChange={handleChange} shortForm={true} /></Col>
                        <Col><SelectDate name="dobDay" value={fields.dobDay} handleChange={handleChange} /></Col>
                        <Col>
                            <SelectYear name="dobYear" value={fields.dobYear} handleChange={handleChange} 
                                startYear={today.getFullYear() - 100} endYear={today.getFullYear()} />
                        </Col>
                    </FormRow>
                </FormGroup>
                <FormGroup className="col-sm-6">
                    <FormLabel className="md-font-sm text-muted">Gender</FormLabel>
                    <GenderInput name="gender" value={fields.gender} handleChange={handleChange} required />
                </FormGroup>
            </FormRow>

            <FormGroup>
                <FormLabel className="md-font-sm text-muted">Are you a physician?</FormLabel>
                <FormRow>
                    <Col>
                        <div className="custom-control custom-radio border rounded p-2 text-center">
                            <input type="radio" id="physicianYes" name="isPhysician" value="Yes" 
                                checked={fields.isPhysician === "Yes"} onChange={handleChange} className="custom-control-input" />
                            <label htmlFor="physicianYes" className="custom-control-label">Yes</label>
                        </div>
                    </Col>
                    <Col>
                        <div className="custom-control custom-radio border rounded p-2 text-center">
                            <input type="radio" id="physicianNo" name="isPhysician" value="No" 
                                checked={fields.isPhysician === "No"} onChange={handleChange} className="custom-control-input" />
                            <label htmlFor="physicianNo" className="custom-control-label">No</label>
                        </div>
                    </Col>
                </FormRow>
            </FormGroup>

            {fields.isPhysician === "Yes" && (
                <FormRow>
                    <Col><QualificationInput name="qualification" value={fields.qualification} handleChange={handleChange} /></Col>
                    <Col><SpecializationInput name="specialization" value={fields.specialization} handleChange={handleChange} /></Col>
                </FormRow>
            )}

            <FormRow className="justify-content-center mt-3">
                <FormSubmit disabled={loading} className="btn-success col-6">
                    {loading ? "Registering..." : "Register"}
                </FormSubmit>
            </FormRow>
        </Form>
    );
}