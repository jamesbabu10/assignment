const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Request = sequelize.define('Request', {
  requestId: {
    type: DataTypes.UUID,
    primaryKey: true,  
    defaultValue: DataTypes.UUIDV4,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'processing',
    allowNull: false,
  },    
  inputCsvUrl: {
    type: DataTypes.STRING,
  },
  outputCsvUrl: {
    type: DataTypes.STRING,
  },
}, {
  tableName: "requests",
  timestamps: true,
});




Request.sync({ al: true });






module.exports = Request;