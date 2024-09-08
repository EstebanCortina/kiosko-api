import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import UserController from '../controllers/userController.js';
import User from '../models/user.js';
import encryptPassword from '../helpers/encryptPassword.js';
import SJWT from '../config/sjwt.js';
import { UniqueConstraintError } from 'sequelize';
import { successResponse, errorResponse } from '../helpers/response.js';

describe('UserController', () => {
    let userController;
    let createStub;
    let findOneStub;
    let bcryptCompareStub;
    let sjwtStub;

    beforeEach(() => {
        userController = new UserController();
        createStub = sinon.stub(User, 'create');
        findOneStub = sinon.stub(User, 'findOne');
        bcryptCompareStub = sinon.stub(bcrypt, 'compare');
        sjwtStub = sinon.stub(SJWT, 'getJWT');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('createNewUserAsync', () => {
        it('should create a new user', async () => {
            const mockUser = {
                id: 1,
                username: 'user',
                email: 'user@email.com',
                password: 'hashedPassword'
            };
            createStub.resolves(mockUser);

            const userData = {
                name: 'user',
                email: 'user@email.com',
                password: 'nomal-password'
            };

            const result = await userController.createNewUserAsync(userData);

            expect(result).to.deep.equal(mockUser);
            expect(createStub.calledOnce).to.be.true;
        });

        it('should throw an error when user creation fails', async () => {
            const error = new Error('Creation failed');
            createStub.rejects(error);

            const userData = {
                name: 'user',
                email: 'user@email.com',
                password: 'plainTextPassword'
            };

            try {
                await userController.createNewUserAsync(userData);
            } catch (e) {
                expect(e).to.equal(error);
            }
        });
    });

    describe('registerAsync', () => {
        it('should register a new user', async () => {
            const mockUser = {
                id: 1,
                username: 'user',
                email: 'user@email.com',
                password: 'hashedPassword'
            };

            const req = {
                body: { name: 'user', email: 'user@email.com', password: 'plainPassword' }
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            createStub.resolves(mockUser);

            await userController.registerAsync(req, res);

            expect(res.status.calledWith(201)).to.be.true;
            expect(res.send.calledWith(successResponse('New user created', mockUser))).to.be.true;
        });

        it('should handle UniqueConstraintError on email conflict', async () => {

            const error = new UniqueConstraintError();
            const req = {
                body: { name: 'user', email: 'exists@email.com', password: 'pass' }
            };

            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };
            createStub.rejects(error);

            await userController.registerAsync(req, res);

            expect(res.status.calledWith(400)).to.be.true;
            expect(res.send.calledWith(errorResponse('Email already in use'))).to.be.true;
        });
    });

    describe('loginAsync', () => {
        it('should login successfully with valid credentials', async () => {

            const mockUser = {
                id: 1,
                username: 'user',
                email: 'user@email.com',
                password: 'hashedPassword'
            };

            const req = {
                body: { email: 'mock@email.com', password: 'password' }
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            findOneStub.resolves(mockUser);
            bcryptCompareStub.resolves(true);
            sjwtStub.resolves('mockToken');

            await userController.loginAsync(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.send.calledWith(
                successResponse('Success login', { jwt: 'mockToken' })
            )).to.be.true;
        });

        it('should return 404 when credentials are invalid', async () => {
            const req = {
                body: { email: 'mock@email.com', password: 'wrong-password' }
            };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            findOneStub.resolves(null);

            await userController.loginAsync(req, res);

            expect(res.status.calledWith(404)).to.be.true;
            expect(res.send.calledWith(errorResponse('Wrong email or password'))).to.be.true;
        });

    });
});
