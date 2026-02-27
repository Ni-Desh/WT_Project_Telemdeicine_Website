import { configureStore } from '@reduxjs/toolkit';

import { saveSession } from "./sessionStorage.js";
import sessionSlice from './slices/sessionSlice';
import profilePhotoSlice from './slices/profilePhotoSlice';

// 1. Import the patient slice and the actions needed by your charts/lists
import patientSlice, { setDoctors, setLocker } from './slices/patientSlice';

export const store = configureStore({
    reducer: {
        session: sessionSlice,
        profilePhoto: profilePhotoSlice,
        // 2. Add patient to the reducer so useSelector((state) => state.patient) works
        patient: patientSlice 
    },
});

// 3. Export these so 'src/Actions/patient.js' can import them without errors
export { setDoctors, setLocker };

export const unsubscribe = store.subscribe(() => {
    const currentSession = store.getState().session;
    saveSession(currentSession);
});