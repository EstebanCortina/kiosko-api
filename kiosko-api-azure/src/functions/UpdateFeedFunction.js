import { app } from '@azure/functions';
import FeedController from "../../controllers/FeedController.js";

const controller = new FeedController()


app.http('UpdateFeedFunction', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'feeds/{id}',
    handler: controller.updateAsync.bind(controller),
});