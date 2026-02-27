import dotenv from "dotenv"
import express from "express"
import http from "http"
import cors from "cors"
import helmet from "helmet"
import session from "express-session" 
import { Server } from "socket.io"
import mongodb from 'mongodb';
const { MongoClient } = mongodb;
import path from "path"
import { fileURLToPath } from 'url'

// Schemas & DAOs
import createUserSchema from "./schema/userSchema.js"
import createSessionSchema from "./schema/sessionSchema.js"
import createAppointmentSchema from "./schema/appointmentSchema.js"
import createChatSchema from "./schema/chatSchema.js"
import createMessageSchema from "./schema/messageSchema.js"

import UserDAO from "./dao/userDAO.js"
import SessionDAO from "./dao/sessionDAO.js"
import AppointmentDAO from "./dao/appointmentDAO.js"
import ChatDAO from "./dao/chatDAO.js"
import MessageDAO from "./dao/messageDAO.js"
import DegreeDAO from "./dao/degreeDAO.js"
import JobDAO from "./dao/jobDAO.js"
import ServiceDAO from "./dao/serviceDAO.js"
import InsuranceDAO from "./dao/insuranceDAO.js"
import PaymentDAO from "./dao/paymentDAO.js"
import LabReportDAO from "./dao/labReportDAO.js"
import MedicationDAO from "./dao/medicationDAO.js"
import NoteDAO from "./dao/noteDAO.js"

import { notFound, errorHandler } from "./middlewares.js"
import AppRouter from "./api/appRouter.js"
import ChatInterface from "./api/chatApp/chatInterface.js"

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

// 1. Security & Core Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}))

app.use(cors())
app.use(express.json())
app.set('trust proxy', 1)

// 2. SESSION MIDDLEWARE (Must be before Routes)
app.use(session({
    secret: process.env.SESSION_SECRET || "medicus_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}))

// 3. Static Files
const rootPath = path.resolve(); 
const publicPath = path.join(rootPath, '..', 'public');
app.use('/public', express.static(publicPath));
app.use(express.static(publicPath));

// 4. API Routes
app.use('/api', AppRouter);

// 5. Catch-all for React
app.get('*', (req, res, next) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (req.url.startsWith('/api') || req.url.includes('.')) {
        return next();
    }
    res.sendFile(indexPath, (err) => {
        if (err) res.status(404).send("Frontend assets not found");
    });
});

app.use(notFound)
app.use(errorHandler)

// 6. DB Connection
MongoClient.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 100
}).then(async client => {
    console.log("✅ MongoDB Connected")
    try {
        await createUserSchema(client)
        await createSessionSchema(client)
        await createAppointmentSchema(client)
        await createChatSchema(client)
        await createMessageSchema(client)

        await UserDAO.injectDB(client)
        await SessionDAO.injectDB(client)
        await AppointmentDAO.injectDB(client)
        await ChatDAO.injectDB(client)
        await MessageDAO.injectDB(client)
        await DegreeDAO.injectDB(client)
        await JobDAO.injectDB(client)
        await ServiceDAO.injectDB(client)
        await InsuranceDAO.injectDB(client)
        await PaymentDAO.injectDB(client)
        await LabReportDAO.injectDB(client)
        await MedicationDAO.injectDB(client)
        await NoteDAO.injectDB(client)
        
        console.log("✅ DAO Layer Initialized")
    } catch (err) {
        console.error(`❌ Initialization Error: ${err}`)
    }

    const port = process.env.PORT || 3003
    const httpServer = http.createServer(app)
    const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } })

    io.on('connection', (socket) => {
        ChatInterface.register(io, socket)
    })

    httpServer.listen(port, () => {
        console.log(`🚀 Server running on port ${port}...`)
    })
})