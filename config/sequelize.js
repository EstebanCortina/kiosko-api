import { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD } from "./env.js";
import { Sequelize } from 'sequelize';

const sequelize = (
    new Sequelize(
        DB_NAME,
        DB_USER,
        DB_PASSWORD,
        {
            host: DB_HOST,
            dialect: 'postgres'
        })
)

try {
    await sequelize.authenticate();
    console.log('[Sequelizer] DB connection');
} catch (error) {
    console.error('[Sequelizer] Unable to connect to the database:', error);
}

export default sequelize;
