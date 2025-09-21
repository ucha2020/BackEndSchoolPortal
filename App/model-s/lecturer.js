const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Lecturer = sequelize.define("lecturer", {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateOfEmployment: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  level: {
    type: DataTypes.ENUM("1", "2", "3", "4", "5"),
  },
  url: {
    type: DataTypes.VIRTUAL,
    get() {
      return `/lecturer/${this.id}`;
    },
  },
});

module.exports = Lecturer;
