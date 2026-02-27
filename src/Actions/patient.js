import * as api from '../api';
import { setDoctors, setLocker } from '../store/index'; 

// HELPER: Grabs the "Key" (token) so the backend allows the search
const getAuthToken = (state) => {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    return state.session?.token || user.token || localStorage.getItem('token');
};

// FEATURE: Search Physician & Shared Time Slots
export const getDoctors = (name) => async (dispatch, getState) => {
    try {
        const token = getAuthToken(getState());
        
        // This call fetches the doctor list AND the red/green status for slots
        const { data } = await api.searchDoctors(name, token); 
        
        dispatch(setDoctors(data)); 
        console.log("✅ Physician list and shared time slots loaded successfully.");
    } catch (error) {
        console.error("Authorization Error - Search blocked:", error.response?.data || error.message);
    }
};

// FEATURE: Profile Photo & Medical Records
export const getLocker = (username) => async (dispatch, getState) => {
    try {
        const token = getAuthToken(getState());
        const { data } = await api.fetchLocker(username, token);
        dispatch(setLocker(data)); 
    } catch (error) {
        console.error("Locker/Profile Error:", error.message);
    }
};