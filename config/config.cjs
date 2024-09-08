require('dotenv').config();

module.exports = {
  "development": {
    "username": "postgres",
    "password": "e450cc4f-90e5-42ff-8dc6-77fb6b37f6d6",
    "database": "kiosko_feeds",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "production": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_DATABASE,
    "host": process.env.DB_HOSTNAME,
    "dialect": "postgres"
  }
}
