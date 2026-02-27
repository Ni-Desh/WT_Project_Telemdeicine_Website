import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, FormButton, FormGroup, FormLabel, FormRow, FormSubmit } from '../../../components/form';
import { Col, FluidContainer, Row } from '../../../components/layout';
import { Photo } from '../../../components/users';
import { TitleBar, TitleButton, Widget, WidgetBody } from '../../../components/widgets';

function EditSection(props) {
    const session = useSelector(s => s.session);
    const [errorMessage, setErrorMessage] = useState("");
    const [fields, setFields] = useState({
        name: "",
        data: null
    });

    async function handleChange(e) {
        if (e.target.files[0]) {
            setFields({
                ...fields,
                name: e.target.value,
                data: e.target.files[0]
            });
        }
    }

    async function handleSubmit(e) {
        if (e) e.preventDefault();
        try {
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
            const username = session.username || loggedInUser.username;
            const token = session.authToken || session.token || loggedInUser.token;

            if (!fields.data) return;

            let formData = new FormData();
            formData.append('data', fields.data);
            formData.append('isProfilePhoto', true);

            const response = await fetch(`/api/users/${username}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            let data = await response.json();
            if (!response.ok) throw new Error(data.message || "Upload failed");

            // UPDATED: Dynamically update the global state
            if (props.updateProfilePhotoId) {
                props.updateProfilePhotoId(data.id);
            }
            alert("Photo updated!");
        } catch (err) {
            setErrorMessage(err.message);
        }
    }

    async function clickedDelete(e) {
        e.preventDefault();
        try {
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
            const username = session.username || loggedInUser.username;
            const profilePhotoId = session.profilePhotoId || loggedInUser.profilePhotoId;
            const token = session.authToken || session.token || loggedInUser.token;

            if (!profilePhotoId) return;

            const response = await fetch(`/api/users/${username}/photos/${profilePhotoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Delete failed");
            }

            if (props.updateProfilePhotoId) {
                props.updateProfilePhotoId(null);
            }
        } catch (err) {
            setErrorMessage(err.message);
        }
    }

    return (
        <Form className="container-fluid" handleSubmit={handleSubmit}>
            {errorMessage && (
                <FormRow className="justify-content-center">
                    <div className="alert alert-danger w-100 text-center" role="alert">{errorMessage}</div>
                </FormRow>
            )}
            <FormRow>
                <FormLabel htmlFor="profilePhoto01" className="col-12 col-sm-4">Select new photo</FormLabel>
                <FormGroup className="col-12 col-sm-8">
                    <div className="custom-file">
                        <input id="profilePhoto01" type="file" className="custom-file-input" onChange={handleChange}/>
                        <label className="custom-file-label" htmlFor="profilePhoto01">
                            {fields.name ? fields.name.split('\\').pop().split('/').pop() : "Choose a file..."}
                        </label>
                    </div>
                    {fields.data && (
                        <div className="mt-2 text-center">
                             <img src={URL.createObjectURL(fields.data)} alt="Preview" style={{width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover'}} />
                        </div>
                    )}
                    <FormRow className="mt-3">
                        <FormSubmit className="btn-primary">Set as Profile photo</FormSubmit>
                    </FormRow>
                </FormGroup>
            </FormRow>
            <hr />
            <FormRow>
                <FormLabel className="col-12 col-sm-4">Remove photo</FormLabel>
                <FormGroup className="col-12 col-sm-8">
                    <FormButton className="btn-outline-danger" handleClick={clickedDelete}>Delete Current Photo</FormButton>
                </FormGroup>
            </FormRow>
        </Form>
    );
}

export default function ProfilePhotoWidget(props) {
    const dispatch = useDispatch();
    const [editMode, setEditMode] = useState(false);

    function toggleEditMode(e) {
        if (e) e.preventDefault();
        setEditMode(!editMode);
    }

    function updateProfilePhotoId(newProfilePhotoId) {
        // Updated dispatch to ensure the whole app knows the photo changed
        dispatch({
            type: "session/set",
            payload: { profilePhotoId: newProfilePhotoId }
        });
        setEditMode(false);
    }

    return (
        <Widget>
            <TitleBar title="Change Profile Photo">
                <TitleButton 
                    name={editMode ? "Cancel" : "Edit"} 
                    icon={editMode ? "clear" : "edit"} 
                    handleClick={toggleEditMode} 
                />
            </TitleBar>
            {editMode && (
                <WidgetBody>
                    <EditSection updateProfilePhotoId={updateProfilePhotoId} />
                </WidgetBody>
            )}
        </Widget>
    );
}