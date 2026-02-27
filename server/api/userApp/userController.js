import mongodb from 'mongodb';
const { ObjectId } = mongodb;
import bcrypt from 'bcryptjs';

import { HttpBadRequestError, HttpUnauthorizedError, HttpInternalServerError } from "../errors.js"
import { User, Degree, Job, Service, Insurance, Payment, Medication, LabReport } from "../models.js"

import UserDAO from "../../dao/userDAO.js"
import SessionDAO from "../../dao/sessionDAO.js"
import DegreeDAO from "../../dao/degreeDAO.js"
import JobDAO from "../../dao/jobDAO.js"
import ServiceDAO from "../../dao/serviceDAO.js"
import InsuranceDAO from "../../dao/insuranceDAO.js"
import PaymentDAO from "../../dao/paymentDAO.js"
import LabReportDAO from "../../dao/labReportDAO.js"
import MedicationDAO from "../../dao/medicationDAO.js"

import { AppointmentApi } from "../appointmentApp/controller.js"

export class UserApi {
  static async deleteUser(username, profilePhotoId) {
    try {
      await AppointmentApi.deleteAppointments({ "patient.username": username })
      await UserDAO.deleteUser(username)
      if (profilePhotoId) await UserDAO.deletePhoto(profilePhotoId)
      return { success: true }
    } catch (err) { throw err }
  }
}

export default class UserController {
  
  // --- SIGNUP LOGIC ---
  static async signup(req, res) {
    try {
      const userInfo = req.body
      const existingUser = await UserDAO.getUser(userInfo.username)
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists." })
      }

      const result = await UserDAO.addUser(userInfo)
      
      if (result.success) {
        const newUser = await UserDAO.getUser(userInfo.username)
        
        if (req.session) {
            req.session.username = userInfo.username
            req.session.isPhysician = Boolean(userInfo.isPhysician)
            // Essential for some session stores to persist before redirect
            await new Promise((resolve) => req.session.save(resolve));
        }

        return res.status(201).json({ 
            success: true, 
            message: "User registered successfully",
            username: newUser.username,
            isPhysician: newUser.isPhysician,
            user: new User(newUser).toJson() 
        })
      } else {
        return res.status(500).json({ message: "Failed to save user in database." })
      }
    } catch (err) { 
      console.error("Signup Error:", err);
      return res.status(500).json({ message: err.message }) 
    }
  }

  // --- SIGNIN LOGIC ---
  static async signin(req, res) {
    try {
      const { username, password } = req.body
      const userDoc = await UserDAO.getUser(username)
      
      console.log("---------- LOGIN DEBUG ----------");
      if (!userDoc) {
        console.log(`❌ USER NOT FOUND: ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      let isMatch = false;
      const dbPassword = userDoc.password.toString().trim();
      const typedPassword = password.toString().trim();

      if (dbPassword.startsWith('$2')) {
          // Bcrypt Hash Comparison
          isMatch = await bcrypt.compare(typedPassword, dbPassword);
      } else {
          // Plain Text Comparison
          isMatch = (dbPassword === typedPassword);
      }

      if (!isMatch) {
        console.log(`❌ PASSWORD MISMATCH for ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log(`✅ LOGIN SUCCESS: ${username}`);
      console.log("---------------------------------");

      await SessionDAO.addSession(username)
      
      if (req.session) {
        req.session.username = username
        req.session.isPhysician = userDoc.isPhysician
        await new Promise((resolve) => req.session.save(resolve));
      }

      return res.status(200).json({ 
        success: true, 
        username: userDoc.username,
        isPhysician: userDoc.isPhysician,
        user: new User(userDoc).toJson() 
      })
    } catch (err) { 
        console.error("Signin Error:", err);
        return res.status(400).json({ message: err.message }) 
    }
  }

  static async logout(req, res) {
    if (req.session && req.session.username) {
        await SessionDAO.deleteSession(req.session.username)
        req.session.destroy()
    }
    return res.json({ success: true })
  }

  // --- PROFILE & DATA LOGIC ---
  // UPDATED LOGIC to handle new DAO structure
  static async getUsers(req, res) {
    try {
      // Create filter based on query parameters
      const filter = { isPhysician: req.query.view === "physician" };
      
      // If a search query exists, add it to the filter
      if (req.query.search) {
          // Using regex for partial name matching, case-insensitive
          filter.name = { $regex: req.query.search, $options: 'i' };
      }

      // Call UserDAO with the filter object
      const result = await UserDAO.getUsers({ filter: filter }) || []; 
      
      return res.json(result.map(u => new User(u).toShortJson()))
    } catch (err) {
      console.error("getUsers Error:", err);
      return res.status(500).json({ message: err.message }) 
    }
  }

  static async getUser(req, res) {
    const result = await UserDAO.getUser(req.params.username)
    if (!result) return res.status(404).json({ message: "User not found" });
    return res.json(new User(result).toJson())
  }

  static async deleteUser(req, res) {
    try {
      const user = await UserDAO.getUser(req.params.username)
      await UserApi.deleteUser(user.username, user.profilePhotoId)
      return res.json({ success: true })
    } catch (err) { return res.status(500).json({ message: err.message }) }
  }

  static async updateUser(req, res) {
    await UserDAO.updateUser(req.params.username, req.body)
    return res.json({ success: true })
  }

  static async addPhoto(req, res) {
    await UserDAO.updateUser(req.params.username, { profilePhotoId: new ObjectId(req.file.id) })
    return res.json({ success: true, id: req.file.id })
  }

  static async getPhoto(req, res) {
    const stream = await UserDAO.getPhoto(req.params.id)
    return stream ? stream.pipe(res) : res.redirect('/public/imgs/person.png')
  }

  static async deletePhoto(req, res) {
    await UserDAO.deletePhoto(req.params.id)
    return res.json({ success: true })
  }

  static async getDegrees(req, res) {
    const result = await DegreeDAO.getDegrees({ filter: { username: req.params.username } })
    return res.json(result.map(d => new Degree(d).toJson()))
  }
  static async addDegree(req, res) {
    const resp = await DegreeDAO.addDegree({ username: req.params.username, ...req.body })
    return res.status(201).json(resp)
  }
  static async deleteDegree(req, res) {
    await DegreeDAO.deleteDegree(req.params.id)
    return res.json({ success: true })
  }

  static async getJobs(req, res) {
    const result = await JobDAO.getJobs({ filter: { username: req.params.username } })
    return res.json(result.map(j => new Job(j).toJson()))
  }
  static async addJob(req, res) {
    const resp = await JobDAO.addJob({ username: req.params.username, ...req.body })
    return res.status(201).json(resp)
  }
  static async deleteJob(req, res) {
    await JobDAO.deleteJob(req.params.id)
    return res.json({ success: true })
  }

  static async getServices(req, res) {
    const result = await ServiceDAO.getServices({ filter: { username: req.params.username } })
    return res.json(result.map(s => new Service(s).toJson()))
  }
  static async addService(req, res) {
    const resp = await ServiceDAO.addService({ username: req.params.username, ...req.body })
    return res.status(201).json(resp)
  }
  static async deleteService(req, res) {
    await ServiceDAO.deleteService(req.params.id)
    return res.json({ success: true })
  }

  static async getInsurances(req, res) {
    const result = await InsuranceDAO.getInsurances({ filter: { username: req.params.username } })
    return res.json(result.map(i => new Insurance(i).toJson()))
  }
  static async addInsurance(req, res) {
    const resp = await InsuranceDAO.addInsurance({ username: req.params.username, ...req.body })
    return res.status(201).json(resp)
  }
  static async deleteInsurance(req, res) {
    await InsuranceDAO.deleteInsurance(req.params.id)
    return res.json({ success: true })
  }

  static async getPayments(req, res) {
    const result = await PaymentDAO.getPayments({ filter: { fromUsername: req.params.username } })
    return res.json(result.map(p => new Payment(p).toJson()))
  }
  static async getReports(req, res) {
    const result = await LabReportDAO.getLabReports({ filter: { fromUsername: req.params.username } })
    return res.json(result.map(r => new LabReport(r).toJson()))
  }
  static async getMedications(req, res) {
    const result = await MedicationDAO.getMedications({ filter: { toUsername: req.params.username } })
    return res.json(result.map(m => new Medication(m).toJson()))
  }
}