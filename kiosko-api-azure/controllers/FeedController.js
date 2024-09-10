import { API_NEWSPAPER } from "../config/env.js";
import controllerModel from '../models/feed.js';
import topicModel from '../models/topic.js';
import { Op } from 'sequelize';
import { errorResponse, successResponse } from "../helpers/response.js";
import User from "../models/user.js";
import sequelizeErrorHandler from "../handlers/sequelizeErrorHandler.js";
import axios from "axios";
import authSJWT from "../middlewares/authSJWT.js";

/**
 * Controller for managing feeds-related operations.
 */
export default class FeedController {

    /**
     * Creates a new feeds for the authenticated user.
     *
     * The request body is cleaned up by removing `created_at` and `updated_at`
     * and adding the user's ID (`user_id`). It also secures the topics list.
     *
     * @param {object} req - The request object, including the feeds data in `req.body`.
     * @param {object} res - The response object.
     * @returns {Promise<void>} A success response with the created feeds.
     */
    async createAsync(req, res) {

        const {user_id} = await authSJWT(req.headers.get('authorization'))
        req.userId = user_id

        try {
            const body = await req.json()

            if (!this._areUniqueTopics(body.topics)) {
                return {
                    status: 400,
                    body: JSON.stringify(
                        errorResponse('Topics must be unique within a feeds.')
                    ),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            }

            if (body.is_favorite) {
                if (!(await this._noFavoriteFeed(req.userId))) {
                    return {
                        status: 400,
                        body: JSON.stringify(
                            errorResponse('You can only have one favorite feeds.')
                        ),
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                }
            }

            delete body.created_at;
            delete body.updated_at;
            body.user_id = req.userId;

            body.topics = await this.secureTopicsAsync(body.topics);
            const newFeed = await controllerModel.create(body);


            return {
                status: 400,
                body: JSON.stringify(
                    successResponse('New Feed', newFeed)
                ),
                headers: {
                    "Content-Type": "application/json"
                }
            }
        } catch (e) {
            console.error('[FeedController]:', sequelizeErrorHandler(e));
            return {
                status: 500,
                body: JSON.stringify(
                    errorResponse()
                ),
                headers: {
                    "Content-Type": "application/json"
                }
            }
        }
    }

    /**
     * Updates an existing feeds with the provided data.
     *
     * @param {object} req - The request object, including feeds data in `req.body`.
     * @param {object} res - The response object.
     * @returns {Promise<void>} A success response with the updated feeds.
     */
    async updateAsync(req, res) {
        try {

            const {user_id} = await authSJWT(req.headers.get('authorization'))
            req.userId = user_id

            const feed = await controllerModel.findOne({
                where: {
                    id: req.params.id,
                    user_id: req.userId
                }
            });

            if (!feed) {
                return {
                    status: 404,
                    body: JSON.stringify(
                        errorResponse('Feed not found')
                    ),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            }

            const body = await req.json()
            if (body.topics && !this._areUniqueTopics(body.topics)) {

                return {
                    status: 400,
                    body: JSON.stringify(
                        errorResponse('Topics must be unique within a feeds.')
                    ),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            }

            if (body.is_favorite) {
                if (!(await this._noFavoriteFeed(req.userId, feed.id))) {

                    return {
                        status: 400,
                        body: JSON.stringify(
                            errorResponse('You can only have one favorite feeds.')
                        ),
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                }
            }

            body.topics = body.topics
                ? await this.secureTopicsAsync(body.topics)
                : feed.topics;

            await feed.update(body);

            return {
                status: 200,
                body: JSON.stringify(
                    successResponse('Feed updated successfully', feed)
                ),
                headers: {
                    "Content-Type": "application/json"
                }
            }

        } catch (error) {
            console.error('[FeedController]:', sequelizeErrorHandler(error));
            return {
                status: 500,
                body: JSON.stringify(
                    errorResponse()
                ),
                headers: {
                    "Content-Type": "application/json"
                }
            }
        }
    }

    /**
     * Lists feeds with optional filtering by topic name and pagination.
     *
     * @param clause
     * @param personalFeed
     */
    indexFeedsAsync(clause = {}, personalFeed = false) {
        return async (req, res) => {
            const {user_id} = await authSJWT(req.headers.get('authorization'))
            req.userId = user_id

            if (personalFeed) {
                clause.user_id = req.userId;
            }
            const params = Object.fromEntries(req.query.entries())
            const query = this.createClause(params,  clause);

            try {
                const { rows: feeds, count } = await controllerModel.findAndCountAll(query);

                return {
                    status: 200,
                    body: JSON.stringify(successResponse('Feeds list', {
                        totalPages: Math.ceil(count / query.limit),
                        currentPage: Number(params.page ?? 1),
                        totalFeeds: count,
                        feeds
                    })),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }

            } catch (error) {
                console.error('[FeedController]:', error);
                return {
                    status: 500,
                    body: JSON.stringify(errorResponse('Server error')),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            }
        };
    }

    /**
     * Creates the query clause for filtering feeds by topic, username and pagination.
     *
     * @param {object} params - The query parameters, including `topic` and `page`.
     * @param where
     * @returns {object} The query object to be used with Sequelize.
     */
    createClause(params, where) {
        const { topic, page = 1, name } = params;
        const limit = 10;
        const offset = (page - 1) * limit;

        let feedQuery = {
            where: where,
            limit,
            offset
        };

        if (topic) {
            feedQuery.where.topics = {
                [Op.contains]: [{ name: this.formatTopicName(topic) }]
            };
        } else {
            delete feedQuery.where.topics;
        }

        if (name) {
            feedQuery.where['$user.username$'] = {
                [Op.iLike]: name
            };
            feedQuery.include = {
                model: User,
                as: 'user',
                attributes: ['id', 'username']
            };
        } else {
            delete feedQuery.where['$user.username$'];
        }

        return feedQuery;
    }

    /**
     * Deletes a feeds by its ID.
     *
     * @param {object} req - The request object, including the feeds ID in `req.params.id`.
     * @param {object} res - The response object.
     * @returns {Promise<void>} A success response confirming the deletion or an error response.
     */
    async deleteAsync(req, res) {
        try {
            const {user_id} = await authSJWT(req.headers.get('authorization'))
            req.userId = user_id
            const feed = await controllerModel.findOne({
                where: {
                    id: req.params.id,
                    user_id: req.userId
                }
            });

            if (!feed) {
                return {
                    status: 404,
                    body: JSON.stringify(
                    errorResponse('Feed not found')
                ),
                    headers: {
                    "Content-Type": "application/json"
                    }
                }
            }

            await feed.destroy();

            return {
                status: 200,
                body: JSON.stringify(
                    successResponse('Feed deleted successfully')
                ),
                headers: {
                    "Content-Type": "application/json"
                }
            }

        } catch (error) {
            console.error('[FeedController]:', error);
            return {
                status: 500,
                body: JSON.stringify(
                    errorResponse()
                ),
                headers: {
                    "Content-Type": "application/json"
                }
            }
        }
    }


    /**
     * Fetches a feeds by its ID along with related resources from Chronicling America API.
     *
     * @param {object} req - The request object, including the feeds ID in `req.params.id`.
     * @param {object} res - The response object.
     * @returns {Promise<void>} A success response with the feeds and related resources.
     */
    async showMyFeedAsync(req, res) {
        try {
            const {user_id} = await authSJWT(req.headers.get('authorization'))
            req.userId = user_id
            const feed = await controllerModel.findOne({
                where: {
                    id: req.params.id,
                    user_id: req.userId
                }
            });

            if (!feed) {
                return {
                    status: 404,
                    body: JSON.stringify(
                        errorResponse('Feed not found')
                    ),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            }
            const { page= 1 } = Object.fromEntries(req.query.entries())
            const resources = (
                await this.fetchResourcesForFeedAsync(feed.topics, page)
            );

            const result = {
                feed: {
                    id: feed.id,
                    name: feed.name,
                    topics: feed.topics,
                    is_favorite: feed.is_favorite,
                    is_public: feed.is_public,
                    user_id: feed.user_id,
                    created_at: feed.created_at,
                    updated_at: feed.updated_at
                },
                resources
            };

            return {
                status: 200,
                body: JSON.stringify(
                    successResponse('Feed with resources', result)
                ),
                headers: {
                    "Content-Type": "application/json"
                }
            }

        } catch (error) {
            console.error('[FeedController]:', error);
            return {
                status: 500,
                body: JSON.stringify(errorResponse()),
                headers: {
                    "Content-Type": "application/json"
                }
            };
        }
    }



    /**
     * Secures a list of topics by ensuring they exist in the database or creating them if not.
     *
     * @param {string[]} topicsList - The list of topic names to be secured.
     * @returns {Promise<object[]>} A promise that resolves to a list of full topic objects.
     */
    async secureTopicsAsync(topicsList) {
        const fullTopics = [];

        const topicPromises = topicsList.map(async (topicName) => {
            const formattedTopicName = this.formatTopicName(topicName);

            let topicExists = (
                await topicModel.findOne({ where: { name: formattedTopicName } })
            )?.dataValues;

            if (!topicExists) {
                topicExists = (
                    await topicModel.create({ name: formattedTopicName })
                )?.dataValues;
            }

            delete topicExists.createdAt;
            delete topicExists.updatedAt;
            return topicExists;
        });

        const resolvedTopics = await Promise.all(topicPromises);
        fullTopics.push(...resolvedTopics);

        return fullTopics;
    }

    /**
     * Formats a topic name by capitalizing the first letter and making the rest lowercase.
     *
     * @param {string} topicName - The name of the topic to format.
     * @returns {string} The formatted topic name.
     */
    formatTopicName(topicName) {
        return topicName.charAt(0).toUpperCase() + topicName.slice(1).toLowerCase();
    }

    _areUniqueTopics(topicsList) {
        const uniqueTopics = [...new Set(topicsList)];
        return uniqueTopics.length === topicsList.length;
    }

    async _noFavoriteFeed(userId, feedId = null) {
        const existingFavoriteFeed = await controllerModel.findOne({
            where: {
                user_id: userId,
                is_favorite: true,
                id: { [Op.ne]: feedId }
            }
        });

        return !existingFavoriteFeed;
    }


    /**
     * Fetches resources from Chronicling America API based on topics.
     *
     * @param {object[]} topics - The list of topics to search for.
     * @param page
     * @returns {Promise<object[]>} A promise that resolves to a list of formatted resources related to the topics.
     */
    async fetchResourcesForFeedAsync(topics, page = 1) {
        try {

            // Create the multiple topic query string and make the request
            const topicNames = topics.map(topic => topic.name).join(' OR ');

            const response = (
                await axios.get(`${API_NEWSPAPER}=${encodeURIComponent(topicNames)}&format=json&page=${page}`)
            );

            if (response.data && response.data.items) {
                return response.data.items.map(item => ({
                    title: item.title,
                    date: item.date,
                    type: item.type,
                    edition_label: item.edition_label,
                    languages: item.language
                }));
            }
            return []

        } catch (error) {
            console.error('[FeedController]: Error fetching resources from Chronicling America API', error);
            return [];
        }
    }


}
