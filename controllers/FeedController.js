import { API_NEWSPAPER } from "../config/env.js";
import controllerModel from '../models/feed.js';
import topicModel from '../models/topic.js';
import { Op } from 'sequelize';
import { errorResponse, successResponse } from "../helpers/response.js";
import User from "../models/user.js";
import sequelizeErrorHandler from "../handlers/sequelizeErrorHandler.js";
import axios from "axios";

/**
 * Controller for managing feed-related operations.
 */
export default class FeedController {

    /**
     * Creates a new feed for the authenticated user.
     *
     * The request body is cleaned up by removing `created_at` and `updated_at`
     * and adding the user's ID (`user_id`). It also secures the topics list.
     *
     * @param {object} req - The request object, including the feed data in `req.body`.
     * @param {object} res - The response object.
     * @returns {Promise<void>} A success response with the created feed.
     */
    async createAsync(req, res) {
        try {
            if (!this._areUniqueTopics(req.body.topics)) {
                return res.status(400).send(
                    errorResponse('Topics must be unique within a feed.')
                );
            }

            if (req.body.is_favorite) {
                if (!(await this._noFavoriteFeed(req.userId))) {
                    return res.status(400).send(
                        errorResponse('You can only have one favorite feed.')
                    );
                }
            }

            delete req.body.created_at;
            delete req.body.updated_at;
            req.body.user_id = req.userId;

            req.body.topics = await this.secureTopicsAsync(req.body.topics);
            const newFeed = await controllerModel.create(req.body);

            return res.status(201).send(
                successResponse('New Feed', newFeed)
            );
        } catch (e) {
            console.error('[FeedController]:', sequelizeErrorHandler(e));
            return res.status(500).json(errorResponse());
        }
    }

    /**
     * Updates an existing feed with the provided data.
     *
     * @param {object} req - The request object, including feed data in `req.body`.
     * @param {object} res - The response object.
     * @returns {Promise<void>} A success response with the updated feed.
     */
    async updateAsync(req, res) {
        try {
            const feed = await controllerModel.findOne({
                where: {
                    id: req.params.id,
                    user_id: req.userId
                }
            });

            if (!feed) {
                return res.status(404).send(
                    errorResponse('Feed not found')
                );
            }

            if (req.body.topics && !this._areUniqueTopics(req.body.topics)) {
                return res.status(400).send(
                    errorResponse('Topics must be unique within a feed.')
                );
            }

            if (req.body.is_favorite) {
                if (!(await this._noFavoriteFeed(req.userId, feed.id))) {
                    return res.status(400).send(
                        errorResponse('You can only have one favorite feed.')
                    );
                }
            }

            req.body.topics = req.body.topics
                ? await this.secureTopicsAsync(req.body.topics)
                : feed.topics;

            await feed.update(req.body);

            return res.status(200).send(
                successResponse('Feed updated successfully', feed)
            );

        } catch (error) {
            console.error('[FeedController]:', sequelizeErrorHandler(error));
            return res.status(500).send(
                errorResponse('Server error')
            );
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
            if (personalFeed) {
                clause.user_id = req.userId;
            }

            const query = this.createClause(req.query, clause);

            try {
                const { rows: feeds, count } = await controllerModel.findAndCountAll(query);

                return res.status(200).send(
                    successResponse('Feeds list', {
                        totalPages: Math.ceil(count / query.limit),
                        currentPage: Number(req.query.page ?? 1),
                        totalFeeds: count,
                        feeds
                    })
                );

            } catch (error) {
                console.error('[FeedController]:', error);
                return res.status(500).send(
                    errorResponse('Server error')
                );
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
     * Deletes a feed by its ID.
     *
     * @param {object} req - The request object, including the feed ID in `req.params.id`.
     * @param {object} res - The response object.
     * @returns {Promise<void>} A success response confirming the deletion or an error response.
     */
    async deleteAsync(req, res) {
        try {
            const feed = await controllerModel.findOne({
                where: {
                    id: req.params.id,
                    user_id: req.userId
                }
            });

            if (!feed) {
                return res.status(404).send(
                    errorResponse('Feed not found')
                );
            }

            await feed.destroy();

            return res.status(200).send(
                successResponse('Feed deleted successfully')
            );

        } catch (error) {
            console.error('[FeedController]:', error);
            return res.status(500).send(
                errorResponse('Server error')
            );
        }
    }


    /**
     * Fetches a feed by its ID along with related resources from Chronicling America API.
     *
     * @param {object} req - The request object, including the feed ID in `req.params.id`.
     * @param {object} res - The response object.
     * @returns {Promise<void>} A success response with the feed and related resources.
     */
    async showMyFeedAsync(req, res) {
        try {

            const feed = await controllerModel.findOne({
                where: {
                    id: req.params.id,
                    user_id: req.userId
                }
            });

            if (!feed) {
                return res.status(404).send(
                    errorResponse('Feed not found')
                );
            }
            const { page= 1 } = req.query
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

            return res.status(200).send(
                successResponse('Feed with resources', result)
            );

        } catch (error) {
            console.error('[FeedController]:', error);
            return res.status(500).send(
                errorResponse('Server error')
            );
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
