import axios from 'axios';

// Ensure the port matches your backend server
const API = axios.create({ baseURL: 'http://localhost:3003' });

// We pass 'token' as an argument to every secured request
export const searchDoctors = (name, token) => 
    API.get(`/api/users?view=physician&name=${name}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const fetchLocker = (username, token) => 
    API.get(`/api/users/${username}/locker`, {
        headers: { Authorization: `Bearer ${token}` }
    });