const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Department = sequelize.define("department", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  url: {
    type: DataTypes.VIRTUAL,
    get() {
      return `/departments/${this.id}`;
    },
  },
});
module.exports = Department;
