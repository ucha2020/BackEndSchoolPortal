const express = require("express");
const route = express.Router();
const student = require("../controllerss/studentController");
const { fa } = require("@faker-js/faker");

route.get("/", student.students_page);

route.get("/create", student.student_creation_form);

route.post("/create_edit", student.student_creation_form);

route.post("/create", student.student_create_formData_processor);

route.get("/:id/display", student.student_page);

route.get("/:id/update", student.student_update_form);

route.get("/:id/update_add", student.student_update_add_form);

route.post("/:id/update_add", student.student_update_add_form);

route.post("/:id/update", student.student_update_formData_processor);

route.post("/:id/update_edit", student.student_update_form);

route.get("/:id/delete", student.student_delete_form);

route.post("/:id/delete", student.student_delete_form);

module.exports = route;
