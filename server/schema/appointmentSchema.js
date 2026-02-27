import mongodb from 'mongodb';
const { ObjectId } = mongodb;

/**
 * Main initialization function called by app.js
 * This fixes the "createAppointmentSchema is not a function" error.
 */
export default async function createAppointmentSchema(conn) {
    const dbName = process.env.DB_NAME || "medicus";
    const db = conn.db(dbName);

    try {
        const collections = await db.listCollections({ name: "appointments" }).toArray();
        if (collections.length === 0) {
            await db.createCollection("appointments", {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: ["title", "patient", "physician", "startTime", "endTime", "status"],
                        properties: {
                            title: { bsonType: "string" },
                            startTime: { bsonType: "date" },
                            endTime: { bsonType: "date" },
                            status: { enum: ["Pending", "Accepted", "Rejected", "Done"] }
                        }
                    }
                }
            });
            console.log("✅ Appointments collection using schema was created.");
        } else {
            console.log("ℹ️ Appointments collection already exists.");
        }
    } catch (err) {
        console.error(`❌ Error creating Appointment Schema: ${err}`);
    }
}

/**
 * DAO Logic - Keep this for your Controller to use
 */
export const appointmentDao = {
    // Save new appointment
    createAppointment: async (db, data) => {
        // Convert string date/time to formal Date objects for the Schema
        const start = new Date(`${data.startDate} ${data.startTime}`);
        const end = new Date(start.getTime() + 30 * 60000); // Default 30 mins later

        const record = {
            title: data.title,
            patient: data.patient,   // This should be an object as per your schema
            physician: data.physician, // This should be an object as per your schema
            status: "Pending",
            startTime: start,
            endTime: end,
            description: data.description,
            chatId: data.chatId ? new ObjectId(data.chatId) : null,
            vitals: {} 
        };

        return await db.collection("appointments").insertOne(record);
    },

    // Get booked slots for a specific day
    getBookedSlots: async (db, physicianUsername, dateStr) => {
        // Create range for the start and end of the chosen day (UTC format for consistency)
        const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
        const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

        const appointments = await db.collection("appointments").find({
            "physician.username": physicianUsername, 
            startTime: { $gte: dayStart, $lte: dayEnd },
            status: { $ne: "Rejected" } 
        }).toArray();

        // Convert Date objects back to "10:00 AM" strings for the frontend
        return appointments.map(appt => {
            return new Date(appt.startTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            }).replace(/^0/, ''); // Remove leading zero to match frontend format (e.g., 09:00 -> 9:00)
        });
    }
};