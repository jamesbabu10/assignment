const Sequelize = require('sequelize');

const { DB_CONNECTION, DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_PORT } =
  process.env;


const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_CONNECTION,
  define: {
    freezeTableName: true,
  },
  logging: false,
  pool: {
    max: 50,
    min: 3,
    acquire: 100 * 1000,
  },
});

/**
 * Connects to the database and logs the success or failure.
 *
 * @return {void}
 */
const connectDb = () => {
  sequelize
    .authenticate()
    .then(() => {
      console.log(
        `Database connection has been established successfully on host: ${DB_HOST}`,
      );
    })
    .catch((error) => {
      console.error('Unable to connect to the database: ', error);
      process.exit(1);
    });
};

module.exports = { sequelize, connectDb };
