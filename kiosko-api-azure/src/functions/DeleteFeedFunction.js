import { app } from '@azure/functions';
import FeedController from "../../controllers/FeedController.js";

const controller = new FeedController()


app.http('DeleteFeedFunction', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'feeds/{id}',
    handler: controller.deleteAsync.bind(controller),
});