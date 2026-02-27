import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { calculateAge } from './dates';
import { useExtendClass } from "./hooks";
import { Col, FluidContainer, Row } from './layout';
import { Loader } from './loaders';

/* --- NEW IMPORTS FOR MEMBER A --- */
import { getDoctors, getLocker } from '../Actions/patient'; 
import { SearchResultsList, MedicalLocker } from './lists';
import { HealthTrendsChart } from './widgets'; 

/* --- Generic User Information Components --- */
export function FullName(props) {
    if (props.user) {
        return props.user.isPhysician ? `Dr. ${props.user.firstName} ${props.user.lastName}` : `${props.user.firstName} ${props.user.lastName}`;
    }
    return "";
}

export function Username(props) {
    return (props.user && props.user.username) ? props.user.username : "";
}

export function Gender(props) {
    return (props.user && props.user.gender) ? props.user.gender : "";
}

export function BioData(props) {
    if (props.user) {
        const bioArray = [];
        if (props.user.isPhysician) {
            if (props.user.qualification) bioArray.push(props.user.qualification);
            if (props.user.specialization) bioArray.push(props.user.specialization);
        } else {
            if (props.user.dob) bioArray.push(calculateAge(props.user.dob));
            if (props.user.gender) bioArray.push(props.user.gender);
        }
        return bioArray.join(", ");
    }
    return "";
}

export function Email(props) {
    return (props.user && props.user.emailId) ? props.user.emailId : "";
}

export function PhoneNumber(props) {
    return (props.user && props.user.phoneNumber) ? props.user.phoneNumber : "";
}

export function Currency(props) {
    if (props.value !== undefined && props.value !== null) {
        return Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(props.value);
    }
    return "";
}

/* --- Input Components --- */
export const Genders = ["Male", "Female", "Other"];
export const Qualifications = ["MBBS", "MD", "MS", "Intern"];
export const Specializations = ["Cardiologist", "Radiologist", "Psychiatrist", "Anesthesiologist", "Pediatrician", "Neurologist", "Dermatologist", "Dentist", "Pathologist", "General Surgeon", "Orthopaedic Surgeon", "Urologist", "Nephrologist", "Oncologist", "Gynaecologist"];

export function GenderInput(props) {
    return (
        <select id={props.id} name={props.name} className={useExtendClass("custom-select", props.className)}
            value={props.value} onChange={props.handleChange} required={!!props.required}>
            {Genders.map((g, idx) => <option key={idx} value={g}>{g}</option>)}
        </select>
    );
}

export function QualificationInput(props) {
    return (
        <select id={props.id} name={props.name} className={useExtendClass("custom-select", props.className)}
            value={props.value} onChange={props.handleChange} required={!!props.required}>
            <option value="">Select Qualification</option>
            {Qualifications.sort().map((q, idx) => <option key={idx} value={q}>{q}</option>)}
        </select>
    );
}

export function SpecializationInput(props) {
    return (
        <select id={props.id} name={props.name} className={useExtendClass("custom-select", props.className)}
            value={props.value} onChange={props.handleChange} required={!!props.required}>
            <option value="">Select Specialization</option>
            {Specializations.sort().map((s, idx) => <option key={idx} value={s}>{s}</option>)}
        </select>
    );
}

/* --- Photo Rendering Components --- */
export function Photo(props) {  
    const className = useExtendClass("img-fluid md-pfl-pic", props.className);
    if (props.isLoading) return <Loader isLoading={true} />;

    const imageSource = (props.src instanceof Blob) ? URL.createObjectURL(props.src) : props.src;

    return (
        <img id={props.id} alt={props.alt || "User Profile"} className={className} 
             src={imageSource || "/default-avatar.png"} 
             onError={(e) => { e.target.src = "/default-avatar.png"; }} 
        />
    );
}

export function ProfilePhoto(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [source, setSource] = useState("");
    const session = useSelector(state => state.session);

    useEffect(() => {
        async function initialize() {
            if (!props.user?.profilePhotoId || !props.user?.username) {
                setIsLoading(false);
                return;
            }
            try {
                const token = session.authToken || session.token;
                if (!token) throw new Error("No token");
                
                const response = await fetch(`/api/users/${props.user.username}/photos/${props.user.profilePhotoId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.blob();
                    setSource(data);
                }
            } catch (err) {
                console.error(`Photo Error: ${err}`);
            } finally {
                setIsLoading(false);
            }
        }
        initialize();
    }, [props.user, session]);

    return <Photo src={source} isLoading={isLoading} />;
}

/* --- PATIENT DASHBOARD --- */
export function MemberADashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [hasSearched, setHasSearched] = useState(false); // Fix: List hidden until search
    const dispatch = useDispatch();
    const session = useSelector(state => state.session);
    const records = useSelector((state) => state.patient.locker || []);

    useEffect(() => {
        if (session.username) {
            dispatch(getLocker(session.username));
        }
    }, [dispatch, session.username]);

    const handleSearchClick = () => {
        if (searchTerm.trim()) {
            setHasSearched(true);
            dispatch(getDoctors(searchTerm));
        }
    };

    return (
        <FluidContainer className="mt-5">
            <Row>
                <Col className="col-md-10 offset-md-1">
                    <div className="card shadow-sm p-4">
                        <h2 className="text-primary mb-4 border-bottom pb-2">Patient Dashboard</h2>
                        
                        <div className="mb-5">
                            <h5 className="mb-3 font-weight-bold">Smart Doctor Search</h5>
                            <div className="input-group mb-3">
                                <input 
                                    type="text" 
                                    className="form-control form-control-lg" 
                                    placeholder="Enter specialist name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="input-group-append">
                                    <button className="btn btn-primary px-4" type="button" onClick={handleSearchClick}>
                                        Find Doctor
                                    </button>
                                </div>
                            </div>
                            {/* RESULTS ONLY SHOWN AFTER CLICK */}
                            {hasSearched && <SearchResultsList />}
                        </div>

                        <div className="mb-5">
                            <h5 className="mb-3 font-weight-bold">My Secure Medical Locker</h5>
                            <MedicalLocker />
                        </div>

                        <div>
                            <h5 className="mb-3 font-weight-bold">Predictive Health Insights</h5>
                            {records.length > 0 ? <HealthTrendsChart lockerData={records} /> : <div className="alert alert-info">No records found.</div>}
                        </div>
                    </div>
                </Col>
            </Row>
        </FluidContainer>
    );
}