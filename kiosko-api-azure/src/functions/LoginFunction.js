import { app } from '@azure/functions';
import UserController from "../../controllers/UserController.js";

const controller = new UserController();


app.http('LoginFunction', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'login',
    handler: controller.loginAsync
});