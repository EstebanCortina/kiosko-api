import express from 'express';
const router = express.Router();


router.get('/', (req, res) => {
    res.status(200).send({
        httpStatus: 200,
        message: 'Bienvenido a Kiosko Feeds API!',
        data: null
    });
})

import UserController from "../controllers/UserController.js";
const userController = new UserController();
router.post('/register', userController.registerAsync.bind(userController))
router.post('/login', userController.loginAsync.bind(userController))

import users_router from "./users_router.js";
router.use('/users', users_router)

export default router;