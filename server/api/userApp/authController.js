import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import mongodb from 'mongodb';
const { ObjectId} = mongodb;
import { HttpUnauthorizedError, HttpBadRequestError, HttpInternalServerError } from "../errors.js"

import UserDAO from "../../dao/userDAO.js"
import SessionDAO from "../../dao/sessionDAO.js"
import { User, Session } from "../models.js"


// Hash algorithm for user passwords.
const hashPassword = async password => await bcrypt.hash(password, 10)


export default class AuthController {
  static async register(req, res, next) {
    try {
      const userInfo = req.body
      if (!userInfo || (userInfo && !Object.keys(userInfo).length)) {
        throw new HttpBadRequestError("Invalid request. Bad input parameters.")
      }

      const user = await UserDAO.getUser(userInfo.username)
      if (user && Object.keys(user).length) {
        throw new HttpBadRequestError("Invalid request. User already exists.")
      }

      if (userInfo.password) {
        userInfo.password = await hashPassword(userInfo.password)
      }

      const addUserResponse = await UserDAO.addUser({
        username: userInfo.username,
        password: userInfo.password,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        isPhysician: userInfo.isPhysician,
        profilePhotoId: null,
        dob: new Date(userInfo.dob),
        gender: userInfo.gender,
        qualification: userInfo.qualification,
        specialization: userInfo.specialization
      })
      if (!addUserResponse.success) {
        throw new HttpInternalServerError(addUserResponse.error)
      }

      const sessionStartTime = new Date()
      const addSessionResponse = await SessionDAO.addSession(userInfo.username, sessionStartTime)
      if (!addSessionResponse.success) {
        throw new HttpInternalServerError(addSessionResponse.error)
      }

      const session = await SessionDAO.getSession(addSessionResponse.id)
      const sessionObj = new Session(session)
      const authToken = await sessionObj.encoded()
      const userObj = new User(userInfo)

      res.json({
        authToken: authToken,
        ...userObj.toShortJson()
      })
    } catch (err) {
      // FIX: Ensure status code is valid
      res.status(err.statusCode || 400).json({error: err.message})
      console.error(`Failed to register user: ${err}`)
      return
    }
  }

  static async signIn(req, res, next) {
    try {
      const userInfo = req.body
      if (!userInfo) {
        throw new HttpBadRequestError("Invalid username/password credentials.")
      }

      const user = await UserDAO.getUser(userInfo.username)
      if (!user || (user && !Object.keys(user).length)) {
        throw new HttpBadRequestError("Invalid username/password credentials.")
      }

      const userObj = new User(user)
      const passwordMatched = await userObj.comparePassword(userInfo.password)
      if (!passwordMatched) {
        throw new HttpBadRequestError("Invalid username/password credentials.")
      }

      const sessionStartTime = new Date()
      const addSessionResponse = await SessionDAO.addSession(userInfo.username, sessionStartTime)
      if (!addSessionResponse.success) {
        throw new HttpInternalServerError(addSessionResponse.error)
      }

      const session = await SessionDAO.getSession(addSessionResponse.id)
      const sessionObj = new Session(session)
      const authToken = await sessionObj.encoded()

      res.json({
        authToken: authToken,
        ...userObj.toShortJson()
      })
    } catch (err) {
      console.error(`Failed to sign-in user. ${err}`)
      // FIX: Fallback for statusCode
      res.status(err.statusCode || 500).json({ message: err.message })
    }
  }

  static async signOut(req, res, next) {
    try {
      const sessionInfo = req.session
      const response = await SessionDAO.deleteSession(sessionInfo.id)
      if (!response.success) {
        throw new HttpInternalServerError(response.error)
      }

      res.json({ success: true })
    } catch (err) {
      console.error(`Failed to sign-out user. ${err}`)
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async updatePassword(req, res, next) {
    try {
      const updateInfo = req.body
      if (!updateInfo || (updateInfo && !Object.keys(updateInfo).length)) {
        throw new HttpBadRequestError("Invalid request. Bad input parameters.")
      }

      if (!updateInfo.currentPassword || !updateInfo.newPassword) {
        throw new HttpBadRequestError("Invalid request. Bad input parameters.")
      }

      const newPasswordLength = updateInfo.newPassword.length
      if (newPasswordLength < 8 || newPasswordLength > 20) {
        throw new HttpBadRequestError("Invalid request. Bad input parameters.")
      }

      const user = await UserDAO.getUser(req.session.username)
      const userObj = new User(user)

      const passwordMatched = await userObj.comparePassword(updateInfo.currentPassword)
      if (!passwordMatched) {
        throw new HttpBadRequestError("Current password does not match.")
      }

      const newPasswordHash = await hashPassword(updateInfo.newPassword)

      const updateResponse = await UserDAO.updateUser(user.username, { password: newPasswordHash })
      if (!updateResponse.success) {
        throw new HttpInternalServerError(updateResponse.error)
      }

      res.json({ success: true })
    } catch (err) {
      console.error(`Failed to update user password. ${err}`);
      res.status(err.statusCode || 500).json({message: err.message})
    }
  }

  static async authorizeSession(req, res, next) {
    // List of public paths that DON'T need a token
    const publicPaths = ["/auth/register", "/auth/signin"];
    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));

    if (!isPublicPath) {
      try {
        const authHeader = req.get("Authorization");
        
        // FIX: Check if Authorization header exists before slicing
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
           throw new HttpUnauthorizedError("Authorization header is missing or invalid.")
        }

        const sessionJwt = authHeader.slice("Bearer ".length)
        const decodedSession = await Session.decoded(sessionJwt)

        const session = await SessionDAO.getSession(decodedSession.id)
        if (!session || (session && !Object.keys(session).length)) {
          throw new HttpUnauthorizedError("No existing session was found.")
        }

        req.session = decodedSession
        next(); // Move to next middleware
      } catch (err) {
        console.error(`Failed to authorize user session. ${err}`);
        // FIX: Critical fix to prevent server crash by providing fallback status 401
        res.status(err.statusCode || 401).json({ 
            message: "Failed to authorize user session.",
            error: err.message 
        });
        // We don't call next(err) here because we've already sent the response
      }
    } else {
        next();
    }
  }
}