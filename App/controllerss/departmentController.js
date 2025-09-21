const { departmentInstance } = require("../modelInstances");
const {
  Faculty,
  Department,
  Lecturer,
  Student,
} = require("../config/model_sync");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const {
  checkAssociatedModelInstances,
  get_Obj_array_from_id_array,
} = require("../resources/libary");
const { model } = require("mongoose");

exports.departments_page = asyncHandler(async (req, res, next) => {
  const departments = await Department.findAll();
  res.render("departments_page", {
    title: "departments Display Page",
    departmentList: departments,
  });
});

exports.department_page = asyncHandler(async (req, res, next) => {
  const department = await Department.findByPk(req.params.id, {
    include: [Faculty],
  });

  const lecturerList = await Lecturer.findAll({
    where: {
      departmentId: department.id,
    },
  });
  const studentList = await Student.findAll({
    where: {
      departmentId: department.id,
    },
  });
  const faculty = department.faculty;
  const { name, id, url } = department;
  const departmentLite = {
    name,
    departmentCode: "00" + faculty.id + id,
  };

  res.render("department_page", {
    title: "department Display Page",
    department: departmentLite,
    faculty,
    studentList,
    lecturerList,
    url,
  });
});

exports.department_creation_form = asyncHandler(async (req, res, next) => {
  if (req.method == "GET") {
    //Check to see that there is atleast one faculty in the database
    let facultyList = await Faculty.findAll();
    if (!facultyList[0]) {
      const nonExistingAncestralList = {
        parent: "faculty",
        child: "department",
      };

      res.render("non_existing", {
        nonExistingAncestralList,
        method: req.method,
      });
      return;
    } else {
      //Aleast a faculty exist in the database at this point
      const ancestryStatus = {
        grandParent: { name: "school", selected: true },
        parent: { name: "faculty", selected: true },
        child: { name: "department" },
      };
      res.render("select_ancestry_form", {
        title: "select a faculty for this lecturer",
        parentList: facultyList,
        ...ancestryStatus,
      });
      return;
    }
  } else if (req.method === "POST") {
    //check to see if a faculty option has been provided
    const facultyId = req.body.facultyId;
    if (facultyId) {
      const faculty = await Department.findByPk(facultyId);

      res.render("department_creation_form", {
        title: "department creation form",
        faculty,
      });
      return;
    }

    let department;
    //Create a departmentInstance with the form data
    department = departmentInstance(req.body);

    if (Array.isArray(department.parent)) {
      //Department has been selected for the lecturer creation at this stage
      const selectedFacultyId = department.parent[0];
      const faculty = await Faculty.findByPk(selectedFacultyId);
      res.render("department_creation_form", {
        title: "department creation form",
        faculty,
      });
    } else if (department) {
      //Department body data coming from "already_existing" form
      const faculty = await Faculty.findByPk(department.facultyId);
      res.render("department_creation_form", {
        title: "department creation form",
        department,
        faculty,
      });
    }
  }
});

exports.department_create_formData_processor = [
  //validate and sanitize the name field

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a department object
    const department = departmentInstance(req.body);

    if (!errors.isEmpty()) {
      const errorAray = errors.array();
      //Add nameError property to the departmentObj
      department.nameError = errorAray[0].msg;

      //Render the form again with sanitized value and or error message

      res.send("error");
    } else {
      //The data is valid at this point
      //Check if a department with the same name already exists in the database
      const departmentWithSameName = await Department.findOne({
        where: { name: department.name },
      });

      if (departmentWithSameName) {
        const faculty = await Faculty.findByPk(department.facultyId);

        department.option = "create";
        res.render("department_already_existing", {
          title: "department_already_existing",
          department,
          faculty,
        });
      } else {
        const newdepartment = await Department.create(department);
        //redirect to department page
        res.redirect(newdepartment.url + "/display");
      }
    }
  }),
];

exports.department_update_form = asyncHandler(async (req, res, next) => {
  let department;
  let faculty;

  if (req.method === "GET") {
    department = await Department.findByPk(req.params.id, {
      include: [Faculty],
    });
    faculty = department.faculty;
  } else if (req.method === "POST") {
    //Create a departmentInstance with the form data
    department = departmentInstance(req.body);
    department.id = req.params.id;
    faculty = await Faculty.findByPk(department.facultyId);
  }

  res.render("department_update_form", {
    title: "department update form",
    department,
    faculty,
  });
});

exports.department_update_formData_processor = [
  //validate and sanitize the name field
  body("name", "department name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a department object
    const department = departmentInstance(req.body);
    department.id = req.params.id;

    if (!errors.isEmpty()) {
      const errorAray = errors.array();
      //Add nameError property to the departmentObj
      department.nameError = errorAray[0].msg;

      //Render the form again with sanitized value and or error message

      res.render("error");
    } else {
      //The data is valid at this point

      //Check if a department with the same name already exists in the database
      const departmentWithSameName = await Department.findOne({
        where: { name: department.name },
      });
      if (
        departmentWithSameName &&
        departmentWithSameName.id != req.params.id
      ) {
        const faculty = await Faculty.findByPk(department.facultyId);
        department.option = req.params.id + "/update";

        res.render("department_already_existing", {
          title: "department_already_existing",
          department,
          faculty,
        });
      } else {
        await Department.update(department, {
          where: {
            id: req.params.id,
          },
        });
        const updateddepartment = await Department.findByPk(req.params.id);
        //redirect to department page
        res.redirect(updateddepartment.url + "/display");
      }
    }
  }),
];

exports.department_delete_form = asyncHandler(async (req, res, next) => {
  const department = await Department.findByPk(req.params.id);
  if (req.method === "GET") {
    res.render("delete_form", {
      title: "department delete form",
      model: department,
    });
    return;
  }

  if (req.method === "POST") {
    await Department.destroy({
      where: {
        id: req.params.id,
      },
    });

    res.redirect("/department");
  }
});
