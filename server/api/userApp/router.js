import { Router } from "express"
import UserController from "./userController.js"
import FileUploader from "../../storage.js"

const authRouter = new Router();
const userRouter = new Router();

// Authentication Router - Fixed to use UserController
authRouter.route('/register').post(UserController.signup)
authRouter.route('/signin').post(UserController.signin)
authRouter.route('/signout').get(UserController.logout)

// User Router
userRouter.route('/').get(UserController.getUsers)

userRouter.route('/:username')
  .get(UserController.getUser)
  .delete(UserController.deleteUser) // Line 35 - Fixed reference
  .put(UserController.updateUser)

userRouter.route('/:username/photos')
  .post(FileUploader.single("data"), UserController.addPhoto)

userRouter.route('/:username/photos/:id')
  .get(UserController.getPhoto)
  .delete(UserController.deletePhoto)

userRouter.route('/:username/degrees')
  .get(UserController.getDegrees)
  .post(UserController.addDegree)

userRouter.route('/:username/degrees/:id')
  .delete(UserController.deleteDegree)

userRouter.route('/:username/jobs')
  .get(UserController.getJobs)
  .post(UserController.addJob)

userRouter.route('/:username/jobs/:id')
  .delete(UserController.deleteJob)

userRouter.route('/:username/services')
  .get(UserController.getServices)
  .post(UserController.addService)

userRouter.route('/:username/services/:id')
  .delete(UserController.deleteService)

userRouter.route('/:username/insurances')
  .get(UserController.getInsurances)
  .post(UserController.addInsurance)

userRouter.route('/:username/insurances/:id')
  .delete(UserController.deleteInsurance)

userRouter.route('/:username/payments').get(UserController.getPayments)
userRouter.route('/:username/labReports').get(UserController.getReports)
userRouter.route('/:username/medications').get(UserController.getMedications)

export { authRouter, userRouter }