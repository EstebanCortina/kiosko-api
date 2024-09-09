import { expect } from 'chai';
import sinon from 'sinon';
import FeedController from '../controllers/FeedController.js';
import controllerModel from '../models/feed.js';
import User from '../models/user.js';
import { successResponse, errorResponse } from '../helpers/response.js';

describe('FeedController', () => {
    let feedController;
    let createStub;
    let findOneStub;
    let findAndCountAllStub;
    let secureTopicsStub;
    let findOneUserStub;
    let destroyStub;

    beforeEach(() => {
        feedController = new FeedController();
        createStub = sinon.stub(controllerModel, 'create');
        findOneStub = sinon.stub(controllerModel, 'findOne');
        findAndCountAllStub = sinon.stub(controllerModel, 'findAndCountAll');
        secureTopicsStub = sinon.stub(feedController, 'secureTopicsAsync');
        findOneUserStub = sinon.stub(User, 'findOne');
        destroyStub = sinon.stub();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('createAsync', () => {
        it('should create a new feed', async () => {
            const mockFeed = {
                id: 1,
                name: 'Test Feed',
                topics: [{id: 1, name: 'Topic1' }, {id: 2, name: 'Topic2' }],
                user_id: 1
            };
            createStub.resolves(mockFeed);

            const req = {
                body: {
                    name: 'Test Feed',
                    topics: ['Topic1', 'Topic2']
                },
                userId: 1
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            secureTopicsStub.resolves([{id: 1, name: 'Topic1' }, { id: 2, name: 'Topic2' }]);

            await feedController.createAsync(req, res);

            expect(res.status.calledWith(201)).to.be.true;
            expect(res.send.calledWith(successResponse('New Feed', mockFeed))).to.be.true;
        });
    });

    describe('updateAsync', () => {
        it('should update an existing feed', async () => {
            const mockFeed = {
                id: 1,
                name: 'Updated Feed',
                topics: [{id: 3, name: 'Topic3' }],
                user_id: 1,
                update: sinon.stub().resolves({ id: 1, name: 'Updated Feed' })
            };
            findOneStub.resolves(mockFeed);

            const req = {
                params: { id: 1 },
                body: {
                    name: 'Updated Feed',
                    topics: ['Topic3'],
                },
                userId: 1
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            secureTopicsStub.resolves([{id: 3, name: 'Topic3' }]);

            await feedController.updateAsync(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.send.calledWith(successResponse('Feed updated successfully', mockFeed))).to.be.true;
        });

        it('should return 404 if feed not found', async () => {
            findOneStub.resolves(null);

            const req = {
                params: { id: 1 },
                userId: 1
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            await feedController.updateAsync(req, res);

            expect(res.status.calledWith(404)).to.be.true;
            expect(res.send.calledWith(errorResponse('Feed not found'))).to.be.true;
        });
    });

    describe('indexFeedsAsync', () => {
        it('should list feeds with filtering and pagination for public feeds', async () => {
            const req = {
                query: {
                    topic: 'Topic1',
                    page: 1,
                    username: 'testuser'
                },
                userId: 1
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            findAndCountAllStub.resolves({
                rows: [{ id: 1, name: 'Test Feed' }],
                count: 1
            });
            findOneUserStub.resolves({ id: 1, username: 'testuser' });

            await feedController.indexFeedsAsync({is_public: true})(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.send.calledWith(successResponse('Feeds list', {
                totalPages: 1,
                currentPage: 1,
                totalFeeds: 1,
                feeds: [{ id: 1, name: 'Test Feed' }]
            }))).to.be.true;
        });

        it('should list private feeds with filtering and pagination', async () => {
            const req = {
                query: {
                    topic: 'Topic1',
                    page: 1,
                },
                userId: 1
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            findAndCountAllStub.resolves({
                rows: [{ id: 1, name: 'Test Feed' }],
                count: 1
            });
            findOneUserStub.resolves({ id: 1, username: 'testuser' });

            await feedController.indexFeedsAsync({}, true)(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.send.calledWith(successResponse('Feeds list', {
                totalPages: 1,
                currentPage: 1,
                totalFeeds: 1,
                feeds: [{ id: 1, name: 'Test Feed' }]
            }))).to.be.true;
        });
    });

    describe('deleteAsync', () => {
        it('should delete an existing feed', async () => {
            const mockFeed = {
                id: 1,
                destroy: destroyStub
            };
            findOneStub.resolves(mockFeed);

            const req = {
                params: { id: 1 },
                userId: 1
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            await feedController.deleteAsync(req, res);

            expect(destroyStub.calledOnce).to.be.true;
            expect(res.status.calledWith(200)).to.be.true;
            expect(res.send.calledWith(successResponse('Feed deleted successfully'))).to.be.true;
        });

        it('should return 404 if feed not found', async () => {
            findOneStub.resolves(null);

            const req = {
                params: { id: 1 },
                userId: 1
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            await feedController.deleteAsync(req, res);

            expect(res.status.calledWith(404)).to.be.true;
            expect(res.send.calledWith(errorResponse('Feed not found'))).to.be.true;
        });
    });
});
