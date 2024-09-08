import express from 'express';
import UserController from "../controllers/UserController.js";

const router = express.Router();
const controllerModel = new UserController()


export default router;