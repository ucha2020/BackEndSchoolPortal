const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Student = sequelize.define("student", {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  admissionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  financialStatus: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  CGP: {
    type: DataTypes.DOUBLE,
  },
  url: {
    type: DataTypes.VIRTUAL,
    get() {
      return `/students/${this.id}`;
    },
  },
});

module.exports = Student;
