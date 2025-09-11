const express = require('express');
const route = express.Router();
const faculty = require('../controllerss/facultyController');
const { fa } = require('@faker-js/faker');

route.get('/',faculty.faculties_page);

route.get('/create',faculty.faculty_creation_form);

route.post('/create_edit',faculty.faculty_creation_form);

route.post('/create',faculty.faculty_create_formData_processor);

route.get('/:id/display',faculty.faculty_page);

route.get("/:id/update",faculty.faculty_update_form);

route.post("/:id/update",faculty.faculty_update_formData_processor);

route.post("/:id/update_edit",faculty.faculty_update_form);

route.get("/:id/delete",faculty.faculty_delete_form);

route.post("/:id/delete",faculty.faculty_delete_form);

module.exports = route;