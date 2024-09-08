import {NODE_ENV, PORT, JWT_SECRET} from './config/env.js'
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import SJWT from "./config/sjwt.js";

const app = express();

app.use(express.json());
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

new SJWT();

// Estos origenes estarán permitidos
const allowedOrigins = {
    [`${process.env.LOCAL_URL_FRONT}`]: true,
    [`${process.env.QA_URL_FRONT}`]: true,
    [`${process.env.PROD_URL_FRONT}`]: true
};

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins[origin] !== undefined) {
            callback(null, true);
        } else {
            console.log("Origin not allowed: ", origin);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    optionsSuccessStatus: 204
}));

import router from "./routes/index.js";
app.use("/", router);

app.listen(PORT, ()=> {
    console.log(`Running on ${PORT} in ${NODE_ENV} environment.`);
});
