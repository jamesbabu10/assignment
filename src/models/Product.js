const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Request = require('./Request');
const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    serialNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    inputImageUrls: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const items = this.getDataValue('inputImageUrls');
        return items ? items.split(',') : [];
      },
    },
    outputImageUrls: {
      type: DataTypes.TEXT,
      get() {
        const items = this.getDataValue('outputImageUrls');
        return items ? items.split(',') : [];   
      },
      set(value) {
        this.setDataValue('outputImageUrls', value.join(','));
      },
    },
    requestId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "products",
    timestamps: true,
  }
);

Request.hasMany(Product, { foreignKey: 'requestId' });
Product.belongsTo(Request, { foreignKey: 'requestId' });

Product.sync({ alter: true });

module.exports = Product;
