import mongodb from 'mongodb';
const { ObjectId } = mongodb;

export default class AppointmentDAO {
  static appointments

  static async injectDB(conn) {
    if (this.appointments) {
      return
    }
    try {
      // Hardcoded to "test" to remain consistent with UserDAO
      const dbName = "test";
      const db = conn.db(dbName);
      
      this.appointments = await db.collection("appointments", {
        writeConcern: { w: "majority" }
      })
      console.log(`✅ AppointmentDAO successfully connected to '${dbName}' database.`);
    } catch (err) {
      console.error(`❌ Failed to connect to DB in AppointmentDAO: ${err}`)
    }
  }

  static async getAppointments({filter={}, page=0, limit=100}) {
    try {
      const cursor = await this.appointments.find(filter).skip(page*limit).limit(limit)
      return cursor.toArray()
    } catch (err) {
      return []
    }
  }

  static async addAppointment(appointmentInfo) {
    try {
      const response = await this.appointments.insertOne(appointmentInfo)
      return { success: true, id: response.insertedId }
    } catch (err) {
      return { error: err }
    }
  }

  static async updateAppointment(id, updateQuery) {
    try {
      await this.appointments.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateQuery }
      )
      return { success: true }
    } catch (err) {
      return { error: err }
    }
  }

  static async deleteAppointments(filter) {
    try {
      await this.appointments.deleteMany(filter)
      return { success: true }
    } catch (err) {
      return { error: err }
    }
  }
}