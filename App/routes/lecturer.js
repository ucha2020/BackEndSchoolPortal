const express = require("express");
const route = express.Router();
const lecturer = require("../controllerss/lecturerController");
const { fa } = require("@faker-js/faker");

route.get("/:id/display", lecturer.lecturer_page);

route.get("/", lecturer.lecturers_page);

route.get("/create", lecturer.lecturer_creation_form);

route.post("/create_edit", lecturer.lecturer_creation_form);

route.post("/create", lecturer.lecturer_create_formData_processor);

route.get("/:id/update", lecturer.lecturer_update_form);

route.post("/:id/update", lecturer.lecturer_update_formData_processor);

route.post("/:id/update_edit", lecturer.lecturer_update_form);

route.get("/:id/update_addCourse", lecturer.lecturer_update_addCourse_form);

route.post("/:id/update_addCourse", lecturer.lecturer_update_addCourse_form);

route.get(
  "/:id/update_removeCourse",
  lecturer.lecturer_update_removeCourse_form
);

route.post(
  "/:id/update_removeCourse",
  lecturer.lecturer_update_removeCourse_form
);

route.get("/:id/update_addStudent", lecturer.lecturer_update_addStudent_form);

route.post("/:id/update_addStudent", lecturer.lecturer_update_addStudent_form);

route.get(
  "/:id/update_removeStudent",
  lecturer.lecturer_update_removeStudent_form
);

route.post(
  "/:id/update_removeStudent",
  lecturer.lecturer_update_removeStudent_form
);

route.get("/:id/delete", lecturer.lecturer_delete_form);

route.post("/:id/delete", lecturer.lecturer_delete_form);

module.exports = route;
