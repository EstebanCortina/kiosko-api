import express from 'express';
import FeedController from "../controllers/FeedController.js";
import authSJWT from "../middlewares/authSJWT.js";
import {createFeedValidation, updateFeedValidation} from "../middlewares/validators/feedValidator.js";
const router = express.Router();

const controller = new FeedController();

router.get('/', authSJWT, controller.indexFeedsAsync({}, true));
router.get('/public', authSJWT, controller.indexFeedsAsync({is_public: true}));

router.post('/', createFeedValidation, authSJWT, controller.createAsync.bind(controller))
router.put('/:id', updateFeedValidation, authSJWT, controller.updateAsync.bind(controller))
router.delete('/:id', authSJWT, controller.deleteAsync.bind(controller))

export default router;