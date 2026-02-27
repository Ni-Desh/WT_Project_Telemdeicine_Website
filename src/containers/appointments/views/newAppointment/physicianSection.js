import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FormGroup, FormLabel } from '../../../../components/form';
import { List, ListButton } from '../../../../components/lists';
import { Username } from '../../../../components/users';
import { PhysicianItem } from './utils';

export default function PhysicianSection(props) {
    const { id, name, handleClick, currentStep, ...otherProps } = props;
    const session = useSelector(state => state.session);

    const [state, setState] = useState({
        query: "",
        physicians: [],
        limit: 25
    });

    const getPhysicians = useCallback(async ({ search = '', page = 0, limit = 10 }) => {
        try {
            // UPDATED LOGIC: Fallback to localStorage if Redux session is empty
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
            const token = session.authToken || session.token || loggedInUser.token;

            if (!token) {
                console.warn("No token found!");
                return [];
            }

            const url = `/api/users`;
            const searchParams = new URLSearchParams({ view: 'physician', search, page, limit });
            
            const response = await fetch(`${url}?${searchParams.toString()}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            // Ensure we always return an array
            return response.ok ? (Array.isArray(data) ? data : (data.physicians || [])) : [];
        } catch (err) {
            console.error("Fetch error:", err);
            return [];
        }
    }, [session]);

    useEffect(() => {
        if (currentStep === 1) {
            getPhysicians({ search: state.query, page: 0, limit: state.limit })
                .then(data => {
                    if (Array.isArray(data)) {
                        setState(s => ({ ...s, physicians: data }));
                    }
                });
        }
    }, [state.query, state.limit, getPhysicians, currentStep]);

    if (currentStep !== 1) return null;

    return (
        <>
            <FormGroup>
                <FormLabel className="text-muted">Select a Physician</FormLabel>
                <input 
                    id={id} 
                    type="text" 
                    className="form-control"
                    name="query" 
                    value={state.query} 
                    onChange={(e) => setState({...state, query: e.target.value})}
                    placeholder="Search by name or username..." 
                    {...otherProps}
                />
            </FormGroup>
            
            {state.physicians.length > 0 && (
                <FormGroup>
                    <List className="md-list mt-2">
                        {state.physicians.map((physician, index) => (
                            <ListButton
                                key={physician.id || index}
                                name={name} 
                                value={Username({ user: physician })} 
                                onClick={handleClick}
                            >
                                <PhysicianItem
                                    session={session} 
                                    user={physician} 
                                    clickable={false} 
                                />
                            </ListButton>
                        ))}
                    </List>
                </FormGroup>
            )}
        </>
    );
}