import { Router } from "express"
import { limiter, speedLimiter } from "./utils.js"

import { userRouter as UserRouter, authRouter as AuthRouter } from "./userApp/router.js"
import AuthCtrl from "./userApp/authController.js"
import AppointmentRouter from "./appointmentApp/router.js"
import ChatRouter from "./chatApp/router.js"

const router = new Router()

router.get('/', limiter, speedLimiter, (req, res) => {
    res.json({
        message: 'API - 👋🌎🌍🌏'
    });
});

// --- PUBLIC ROUTES (No session required) ---
// These must come BEFORE the authorizeSession middleware
router.use('/auth', AuthRouter);
router.use('/users', UserRouter);

// --- SECURITY MIDDLEWARE ---
// This blocks all routes below it if the user is not logged in
router.use('/', AuthCtrl.authorizeSession);

// --- PROTECTED ROUTES (Session required) ---
router.use('/appointments', AppointmentRouter);
router.use('/chats', ChatRouter);

export default router;