import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// 1. DATABASE CONNECTION
const atlasURI = "mongodb+srv://niharikadeshmukh231_db_user:VU4iVIDQtOrm4l9u@cluster0.bya1xdm.mongodb.net/medicus?appName=Cluster0";

mongoose.connect(atlasURI)
  .then(() => console.log("✅ Atlas Connected!"))
  .catch(err => console.log("❌ Connection Error:", err));

// 2. HOME ROUTE
app.get('/', (req, res) => {
  res.send("<h1>Medicus Backend is Live</h1><p>Check Search: /api/search-doctors?name=Pradnya</p>");
});

// 3. SMART SEARCH (Feature: Core Patient Search)
app.get('/api/search-doctors', async (req, res) => {
  try {
    const { name } = req.query;
    let query = {}; 

    if (name) {
      query.firstName = { $regex: name, $options: 'i' };
    }

    const doctors = await mongoose.connection.db.collection('users')
      .find(query)
      .project({ password: 0 }) 
      .toArray();

    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. MY LOCKER / EHR (Feature: Patient Medical History)
app.get('/api/my-locker', async (req, res) => {
  try {
    const { patientName } = req.query; 
    
    if (!patientName) {
      return res.status(400).json({ message: "Please provide a patient name" });
    }

    const records = await mongoose.connection.db.collection('appointments').aggregate([
        {
          $lookup: {
            from: "users",
            let: { pt_id: "$patient.id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$pt_id" }] } } }
            ],
            as: "patient_info"
          }
        },
        { $unwind: "$patient_info" },
        { $match: { "patient_info.firstName": patientName } }, 
        {
          $project: {
            title: 1,
            status: 1,
            startTime: 1, // Changed from 'date' to match your schema
            patient_name: "$patient_info.firstName"
          }
        }
    ]).toArray();

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. APPOINTMENT SUMMARY (General admin view)
app.get('/api/appointment-summary', async (req, res) => {
  try {
    const summary = await mongoose.connection.db.collection('appointments').aggregate([
      {
        $lookup: {
          from: "users",
          let: { dr_id: "$physician.id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$dr_id" }] } } }
          ],
          as: "doctor_details"
        }
      },
      { $unwind: { path: "$doctor_details", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          let: { pt_id: "$patient.id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$pt_id" }] } } }
          ],
          as: "patient_details"
        }
      },
      { $unwind: { path: "$patient_details", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: 1,
          status: 1,
          doctor_name: "$doctor_details.firstName",
          patient_name: "$patient_details.firstName"
        }
      }
    ]).toArray();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. DIGITAL PRESCRIPTION GENERATOR (Updated to pass Atlas Validation)
app.get('/api/create-prescription', async (req, res) => {
    try {
      const { title, patientId, doctorId } = req.query;
  
      const newAppointment = {
        title: title || "New Consultation",
        patient: { id: patientId },
        physician: { id: doctorId },
        status: "Pending", // Matches Enum: 'Pending', 'Accepted', 'Rejected', 'Completed'
        startTime: new Date(), // BSON Date
        endTime: new Date(new Date().getTime() + 30*60000), // 30 mins later
        description: "Routine checkup and prescription update", // Required string
        chatId: null // Allowed null
      };
  
      const result = await mongoose.connection.db.collection('appointments').insertOne(newAppointment);
      
      res.json({ 
          message: "Success! Prescription added.", 
          appointmentId: result.insertedId 
      });
    } catch (err) {
      console.error("DEBUG ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  });

// 7. START SERVER
app.listen(5000, () => {
  console.log("🚀 Medicus Server running on http://localhost:5000");
});