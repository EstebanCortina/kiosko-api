# Kiosko Feeds API

This project is an API for managing and consuming news feeds, with user authentication and topic-based filtering. The API is built using various technologies and includes endpoints for user registration, login, and feed management.

## Technologies Used

- **Node.js**: Backend JavaScript runtime for executing the API logic.
- **Express.js**: Web framework for handling HTTP requests and responses.
- **Express Validator**: Validation middleware for input data.
- **Jose**: JSON Object Signing and Encryption (JWT with encrypted payload).
- **Bcrypt**: Hash passwords.
- **Sequelize**: ORM (Object-Relational Mapping) for working with PostgreSQL.
- **Mocha**: JavaScript test framework
- **PostgreSQL**: Relational database for storing users, feeds, and topics.
- **Docker & Docker Compose**: Used for containerizing the application and managing service dependencies.
- **Swagger (OpenAPI)**: API documentation and specification format.
- **Azure Functions**: Serverless architecture for hosting the API.
- **Chronicling America API**: External API to fetch related news resources.

## Prerequisites

- **Node.js** (version >= 14.x)
- **PostgreSQL** (version >= 12.x) if running locally
- **Docker** & **Docker Compose** (if running with containers)
- **Azure Functions core** (if running locally)

## How to Run the Solution

### Running with Docker-compose (recommended)
1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/kiosko-feeds-api.git
   cd kiosko-feeds-api

2. Docker-compose
   ```bash
   docker-compose up --build

### Running Locally
- This solution requires a postgres database with an user named "user_kiosko" and password "kiosko098".
- A database named "kiosko_feeds"

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/kiosko-feeds-api.git
   cd kiosko-feeds-api

2. Install dependencies:

   ```bash
   npm install

3. Migrate and seed database:
- Must check config/config.cjs for required env variables
   ```bash
   npm run migrate-seed

4. Start server:
   ```bash
   npm run dev or npm run prod

### Running Azure Functions V4
- This solution reuses the database from the last solution


1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/kiosko-feeds-api.git

2. Change to directory
   ```Bash
   cd ./kiosko-feeds-api/kiosko-api-azure
   
3. Install dependencies:

   ```bash
   npm install

4. Start server:
   ```bash
   func start

## How to Run tests

   ```bash
   cd ./kiosko-feeds-api
   npm run test