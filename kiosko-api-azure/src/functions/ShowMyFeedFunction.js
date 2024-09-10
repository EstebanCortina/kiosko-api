import { app } from '@azure/functions';
import FeedController from "../../controllers/FeedController.js";

const controller = new FeedController()


app.http('ShowMyFeedFunction', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'my-feed/{id}',
    handler: controller.showMyFeedAsync.bind(controller)
});
