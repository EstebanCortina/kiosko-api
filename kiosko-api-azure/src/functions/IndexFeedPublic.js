import { app } from '@azure/functions';
import FeedController from "../../controllers/FeedController.js";

const controller = new FeedController()


app.http('IndexFeedPublicFunction', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'feeds/public',
    handler: controller.indexFeedsAsync({is_public: true})
});