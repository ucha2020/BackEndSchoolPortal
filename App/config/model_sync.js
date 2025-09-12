const sequelize = require("../config/database");
const Course = require("../model-s/course");
const Lecturer = require("../model-s/lecturer");
const Faculty = require("../model-s/faculty");
const Department = require("../model-s/department");
const Student = require("../model-s/student");
const { DataTypes } = require("sequelize");

const Student_Course = sequelize.define("Student_Course", {
  studentId: {
    type: DataTypes.INTEGER,
    references: {
      model: Student,
      key: "id",
    },
  },
  courseId: {
    type: DataTypes.INTEGER,
    references: {
      model: Course,
      key: "id",
    },
  },
});

Faculty.hasMany(Department, {
  foreignKey: {
    allowNull: false,
  },
  onDelete: "RESTRICT",
});
Department.belongsTo(Faculty);

Department.hasMany(Lecturer, {
  foreignKey: {
    allowNull: true,
  },
  onDelete: "RESTRICT",
});
Lecturer.belongsTo(Department);

Department.hasMany(Student, {
  foreignKey: {
    allowNull: false,
  },
  onDelete: "RESTRICT",
});
Student.belongsTo(Department);

Lecturer.hasMany(Course, {
  foreignKey: {
    allowNull: false,
  },
});
Course.belongsTo(Lecturer);

Lecturer.hasMany(Student, {
  foreignKey: {
    allowNull: true,
  },
});
Student.belongsTo(Lecturer);

Student.belongsToMany(Course, { through: Student_Course });
Course.belongsToMany(Student, { through: Student_Course });

async () => {
  const fac = await Faculty.sync({ force: true });
  const dep = await Department.sync({ force: true });
  const lec = await Lecturer.sync({ force: true });
  const cou = await Course.sync({ force: true });
  const stu = await Student.sync({ force: true });
  const stu_cou = await Student_Course.sync({ force: true });
  const tst = 54;
};
module.exports = { Lecturer, Course, Faculty, Department, Student };
