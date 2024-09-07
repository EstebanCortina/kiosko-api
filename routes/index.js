import express from 'express';
const router = express.Router();


router.get('/', (req, res) => {
    res.status(200).send({
        httpStatus: 200,
        message: 'Bienvenido a Kiosko Feeds API!',
        data: null
    });
})

export default router;