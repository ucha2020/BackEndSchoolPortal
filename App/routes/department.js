const express = require('express');
const route = express.Router();
const department = require('../controllerss/departmentController');
const { fa } = require('@faker-js/faker');

route.get('/',department.departments_page);

route.get('/create',department.department_creation_form);

route.post('/create_edit',department.department_creation_form);

route.post('/create',department.department_create_formData_processor);

route.get('/:id/display',department.department_page);

route.get("/:id/update",department.department_update_form);

route.post("/:id/update",department.department_update_formData_processor);
route.post('/:id/update_edit',department.department_update_form);

route.get("/:id/delete",department.department_delete_form);

route.post("/:id/delete",department.department_delete_form);

module.exports = route;
