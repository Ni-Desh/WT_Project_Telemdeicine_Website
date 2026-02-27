import mongodb from 'mongodb';
const { ObjectId, Binary } = mongodb;

import { UnauthorizedError, HttpBadRequestError,
  HttpUnauthorizedError, HttpInternalServerError } from "../errors.js"

import { User, Appointment, Service, Note, Payment, Medication, LabReport } from "../models.js"

import UserDAO from "../../dao/userDAO.js"
import AppointmentDAO from "../../dao/appointmentDAO.js"
import ServiceDAO from "../../dao/serviceDAO.js"
import ChatDAO from "../../dao/chatDAO.js"
import NoteDAO from "../../dao/noteDAO.js"
import PaymentDAO from "../../dao/paymentDAO.js"
import MedicationDAO from "../../dao/medicationDAO.js"
import LabReportDAO from "../../dao/labReportDAO.js"

import { ChatApi } from "../chatApp/chatController.js"

export class AppointmentApi {
  static async deleteAppointments(filter) {
    try {
      const appointments = await AppointmentDAO.getAppointments({filter: filter, page: 0, limit: 0})
      for (const appointment of appointments) {
        await AppointmentApi.deleteAppointment(appointment._id, appointment.chatId)
      }
    } catch (err) {
      throw(err)
    }
  }

  static async deleteAppointment(appointmentId, chatId) {
    try {
      const chatResponse = await ChatApi.deleteChat(chatId)
      const noteResponse = await NoteDAO.deleteNotes({ appointmentId: ObjectId(appointmentId) })
      if (!noteResponse.success) {
        throw new HttpInternalServerError(noteResponse.error)
      }
      const medicationResponse = await MedicationDAO.deleteMedications({ appointmentId: ObjectId(appointmentId) })
      if (!medicationResponse.success) {
        throw new HttpInternalServerError(medicationResponse.error)
      }
      const labReportResponse = await LabReportDAO.deleteLabReports({ appointmentId: ObjectId(appointmentId) })
      if (!labReportResponse.success) {
        throw new HttpInternalServerError(labReportResponse.error)
      }
      const appointmentResponse = await AppointmentDAO.deleteAppointment(appointmentId)
      if (!appointmentResponse.success) {
        throw new HttpInternalServerError(appointmentResponse.error)
      }
    } catch (err) {
      throw(err)
    }
  }
}

export default class AppointmentController {
  /**
   * NEW: Fetches already booked time slots for a specific physician on a specific date.
   */
  static async getBookedSlots(req, res, next) {
    try {
      const { physicianUsername, date } = req.query;
      
      if (!physicianUsername || !date) {
        throw new HttpBadRequestError("Missing physicianUsername or date");
      }

      // Define the time range for the selected day
      const dayStart = new Date(`${date}T00:00:00Z`);
      const dayEnd = new Date(`${date}T23:59:59Z`);

      const filter = {
        "physician.username": physicianUsername,
        startTime: { $gte: dayStart, $lte: dayEnd },
        status: { $ne: "Rejected" } 
      };

      const result = await AppointmentDAO.getAppointments({filter, page: 0, limit: 0});

      // Format the Date objects from the DB into strings that match the frontend (e.g., "10:00 AM")
      const bookedTimes = result.map(appt => {
        return new Date(appt.startTime).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }).replace(/^0/, '');
      });

      res.json(bookedTimes);
    } catch (err) {
      console.error(`Failed to get booked slots. ${err}`);
      res.status(err.statusCode || 500).json({message: err.message});
    }
  }

  static async getAppointments(req, res, next) {
    try {
      const session = req.session
      const search = (req.query.search) ? req.query.search: ""
      const view = (req.query.view) ? req.query.view: ""
      const page = (req.query.page) ? parseInt(req.query.page, 10): 0
      const limit = (req.query.limit) ? parseInt(req.query.limit, 10): 10

      let filter
      if (view === "waiting") {
        const currentTime = new Date();
        filter = {
          $and: [
            {
              $or: [
                { "patient.username": session.username },
                { "physician.username": session.username }
              ]
            },
            { startTime: {$lte: currentTime} },
            { endTime: {$gt: currentTime} },
            { status: {$ne: "Done"} }
          ]
        }
      } else if (view === "payments") {
        filter = {
          $and: [
            {
              $or: [
                { "patient.username": session.username },
                { "physician.username": session.username }
              ]
            },
            { status: "Done" }
          ]
        }
      } else {
        filter = {
          $or: [
            { "patient.username": session.username },
            { "physician.username": session.username }
          ]
        }
      }

      let result
      if (search !== "") {
        const queryRegex = new RegExp(search, 'i');
        const searchQuery = {
          $or: [
            { title: queryRegex },
            { description: queryRegex },
            { patientFullName: queryRegex },
            { physicianFullName: queryRegex }
          ]
        }
        result = await AppointmentDAO.searchAppointments({filter, searchQuery, page, limit})
      } else {
        result = await AppointmentDAO.getAppointments({filter, page, limit})
      }

      res.json(result.map(item => {
        const appointment = new Appointment(item)
        return appointment.toShortJson()
      }))
    } catch (err) {
      console.error(`Failed to get appointments. ${err}`)
      res.status(500).json({message: err.message})
    }
  }

  static async getAppointment(req, res, next) {
    try {
      const session = req.session
      const appointmentId = req.params.id
      const result = await AppointmentDAO.getAppointment(appointmentId)

      if (result && Object.keys(result).length === 0) {
        res.json({})
      }

      if (result.patient.username !== session.username &&
        result.physician.username !== session.username) {
        res.json({})
      }

      res.json(new Appointment(result).toJson())
    } catch (err) {
      console.error(`Failed to get appointment. ${err}`)
      res.status(500).json({message: err.message})
    }
  }

  static async addAppointment(req, res, next) {
    try {
      const appointmentInfo = req.body
      if (!appointmentInfo) {
        throw new HttpBadRequestError("Invalid request. Bad input parameters.")
      }

      const patientUser = await UserDAO.getUser(appointmentInfo.patient)
      const physicianUser = await UserDAO.getUser(appointmentInfo.physician)
      const service = await ServiceDAO.getService(appointmentInfo.serviceId)

      if (!patientUser || !physicianUser || !service) {
        throw new HttpBadRequestError("Invalid request. Bad input parameters.")
      }

      // Convert startTime/endTime strings into formal BSON Dates for the schema
      const startDateTime = new Date(`${appointmentInfo.startDate} ${appointmentInfo.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // Default 30 min duration

      let appointmentResponse, chatResponse
      try {
        appointmentResponse = await AppointmentDAO.addAppointment(
          { title: appointmentInfo.title,
            patient: new User(patientUser).toShortJson(),
            physician: new User(physicianUser).toShortJson(),
            status: "Pending",
            startTime: startDateTime,
            endTime: endDateTime,
            description: appointmentInfo.description,
            serviceName: service.name,
            serviceCharge: service.rate,
            paymentBalance: service.rate
          }
        )

        if (!appointmentResponse.success) throw(appointmentResponse.error)

        chatResponse = await ChatDAO.addChat(
          {
            title: appointmentInfo.title,
            host: new User(patientUser).toShortJson(),
            members: [appointmentInfo.physician],
            activeMembers: [],
            startTime: startDateTime,
            appointmentId: appointmentResponse.id
          }
        )

        if (!chatResponse.success) throw(chatResponse.error)

        await AppointmentDAO.updateAppointment(appointmentResponse.id,
          { chatId: ObjectId(chatResponse.id) }
        )

        res.status(201).json({ success: true, id: appointmentResponse.id })
      } catch (err) {
        if (appointmentResponse) await AppointmentDAO.deleteAppointment(appointmentResponse.id)
        if (chatResponse && chatResponse.success) await ChatDAO.deleteChat(chatResponse.id)
        throw new HttpInternalServerError(err)
      }
    } catch (err) {
      console.error(`Failed to add a new appointment. ${err}`);
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async deleteAppointment(req, res, next) {
    try {
      const appointmentId = req.params.id
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      if (!appointment || !Object.keys(appointment).length) {
        throw new HttpInternalServerError("Invalid request. Bad input parameters.")
      }
      await AppointmentApi.deleteAppointment(appointment._id, appointment.chatId)
      res.json({success: true})
    } catch (err) {
      console.error(`Failed to delete appointment. ${err}`);
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async updateAppointment(req, res, next) {
    try {
      const appointmentId = req.params.id
      const updateInfo = req.body
      if (!updateInfo || typeof updateInfo !== "object") {
        throw new HttpBadRequestError("Invalid request. Bad input parameters.")
      }
      const notUpdatableFields = ["_id", "id", "title", "patient", "physician", "chatId"]
      for (const field of notUpdatableFields) {
        if (updateInfo.hasOwnProperty(field)) {
          throw new HttpBadRequestError(`Invalid request. Cannot update field: '${field}'.`)
        }
      }
      const result = await AppointmentDAO.updateAppointment(appointmentId, updateInfo)
      if (!result.success) throw new HttpInternalServerError(result.error)
      res.json({ success: true })
    } catch (err) {
      console.error(`Failed to update appointment. ${err}`);
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async getNotes(req, res, next) {
    try {
      const appointmentId = req.params.appointmentId
      const page = (req.query.page) ? parseInt(req.query.page, 10): 0
      const limit = (req.query.limit) ? parseInt(req.query.limit, 10): 10
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      const filter = { appointmentId: ObjectId(appointment._id) }
      const notes = await NoteDAO.getNotes({filter, page, limit, reverse: true})
      res.json(notes.map(item => new Note(item).toJson()))
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async addNote(req, res, next) {
    try {
      const noteInfo = req.body
      const appointmentId = req.params.appointmentId
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      const response = await NoteDAO.addNote({
        fromUsername: noteInfo.fromUsername,
        appointmentId: ObjectId(appointment._id),
        title: noteInfo.title,
        content: noteInfo.content,
        date: new Date(noteInfo.date)
      })
      res.status(201).json({ success: true, id: response.id })
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async deleteNote(req, res, next) {
    try {
      const noteId = req.params.id
      const response = await NoteDAO.deleteNote(noteId)
      res.json({ success: true })
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async getPayments(req, res, next) {
    try {
      const appointmentId = req.params.appointmentId
      const page = (req.query.page) ? parseInt(req.query.page, 10): 0
      const limit = (req.query.limit) ? parseInt(req.query.limit, 10): 10
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      const filter = { appointmentId: ObjectId(appointment._id) }
      const payments = await PaymentDAO.getPayments({filter, page, limit, reverse: true})
      res.json(payments.map(item => new Payment(item).toJson()))
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async addPayment(req, res, next) {
    try {
      const paymentInfo = req.body;
      const appointmentId = req.params.appointmentId
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      const amountAsNumber = Number(paymentInfo.amount)
      const addResponse = await PaymentDAO.addPayment({
        fromUsername: paymentInfo.fromUsername,
        toUsername: paymentInfo.toUsername,
        appointmentId: ObjectId(appointment._id),
        amount: amountAsNumber,
        date: new Date(paymentInfo.date)
      })
      await AppointmentDAO.updateAppointment(appointmentId, {
        paymentBalance: (appointment.paymentBalance - amountAsNumber)
      })
      res.status(201).json({ success: true, id: addResponse.id })
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async deletePayment(req, res, next) {
    try {
      const appointmentId = req.params.appointmentId
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      const paymentId = req.params.id
      const payment = await PaymentDAO.getPayment(paymentId)
      const deleteResponse = await PaymentDAO.deletePayment(paymentId)
      if (deleteResponse.deletedCount > 0) {
        await AppointmentDAO.updateAppointment(appointmentId, {
          paymentBalance: (appointment.paymentBalance + payment.amount)
        });
      }
      res.json({ success: true })
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async getMedications(req, res, next) {
    try {
      const appointmentId = req.params.appointmentId
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      const filter = { appointmentId: ObjectId(appointment._id) }
      const medications = await MedicationDAO.getMedications({filter, page: 0, limit: 0, reverse: true})
      res.json(medications.map(item => new Medication(item).toJson()))
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async addMedication(req, res, next) {
    try {
      const medicationInfo = req.body;
      const appointmentId = req.params.appointmentId
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      const response = await MedicationDAO.addMedication({
        fromUsername: medicationInfo.fromUsername,
        toUsername: medicationInfo.toUsername,
        appointmentId: ObjectId(appointment._id),
        name: medicationInfo.name,
        dosage: medicationInfo.dosage
      })
      res.status(201).json({ success: true, id: response.id })
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async deleteMedication(req, res, next) {
    try {
      const medicationId = req.params.id
      await MedicationDAO.deleteMedication(medicationId)
      res.json({ success: true })
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async getReports(req, res, next) {
    try {
      const appointmentId = req.params.appointmentId
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      const filter = { appointmentId: ObjectId(appointment._id) }
      const labReports = await LabReportDAO.getLabReports({filter, page: 0, limit: 0, reverse: true})
      res.json(labReports.map(item => new LabReport(item).toJson()))
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async addReport(req, res, next) {
    try {
      const labReportInfo = req.body;
      const appointmentId = req.params.appointmentId
      const appointment = await AppointmentDAO.getAppointment(appointmentId)
      const response = await LabReportDAO.addLabReport({
        fromUsername: labReportInfo.fromUsername,
        appointmentId: ObjectId(appointment._id),
        name: labReportInfo.name,
        date: labReportInfo.date
      })
      res.status(201).json({ success: true, id: response.id })
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async deleteReport(req, res, next) {
    try {
      const labReportId = req.params.id
      await LabReportDAO.deleteLabReport(labReportId)
      res.json({ success: true })
    } catch (err) {
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }
}