const express = require('express');
const route = express.Router();
const course = require('../controllerss/courseController');
const { fa } = require('@faker-js/faker');

route.get('/',course.courses_page);

route.get('/create',course.course_creation_form);

route.post('/create_edit',course.course_creation_form);

route.post('/create',course.course_create_formData_processor);

route.get('/:id/display',course.course_page);

route.get("/:id/update",course.course_update_form);

route.post("/:id/update",course.course_update_formData_processor);

route.post("/:id/update_edit",course.course_update_form);

route.get("/:id/delete",course.course_delete_form);

route.post("/:id/delete",course.course_delete_form);

module.exports = route;
