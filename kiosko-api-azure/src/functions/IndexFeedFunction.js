import { app } from '@azure/functions';
import FeedController from "../../controllers/FeedController.js";

const controller = new FeedController()


app.http('IndexFeedFunction', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'feeds',
    handler: controller.indexFeedsAsync({}, true)
});