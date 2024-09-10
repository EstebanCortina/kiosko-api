import { app } from '@azure/functions';
import FeedController from "../../controllers/FeedController.js";

const controller = new FeedController()


app.http('CreateFeedFunction', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'feeds',
    handler: controller.createAsync.bind(controller),
});