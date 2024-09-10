import { app } from '@azure/functions';
import UserController from "../../controllers/UserController.js";

const controller = new UserController();


app.http('RegisterFunction', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'register',
    handler: controller.registerAsync.bind(controller),
});