import { createSlice } from '@reduxjs/toolkit';
const patientSlice = createSlice({
    name: 'patient',
    initialState: { doctors: [], locker: [] },
    reducers: {
        setDoctors: (state, action) => { state.doctors = action.payload; },
        setLocker: (state, action) => { state.locker = action.payload; },
    },
});
export const { setDoctors, setLocker } = patientSlice.actions;
export default patientSlice.reducer;