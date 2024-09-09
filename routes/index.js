import express from 'express';
import authSJWT from "../middlewares/authSJWT.js";
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
router.post('/register', registerValidation, userController.registerAsync.bind(userController))
router.post('/login', loginValidation,userController.loginAsync.bind(userController))

import users_router from "./users_router.js";
router.use('/users', users_router)

import feedsRouter from "./feedsRouter.js";
import FeedController from "../controllers/FeedController.js";
import {loginValidation, registerValidation} from "../middlewares/validators/userValidator.js";
router.use('/feeds', feedsRouter);

const feedController = new FeedController();
router.get('/my-feed/:id', authSJWT, feedController.showMyFeedAsync.bind(feedController));
// Test endpoint
router.get('/protected', authSJWT, (req, res)=>{
    res.status(200).send('authenticated')
})

export default router;