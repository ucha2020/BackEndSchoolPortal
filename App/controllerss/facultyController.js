const { facultyInstance } = require("../modelInstances");
const {
  Faculty,
  Course,
  Student,
  Department,
  Lecturer,
} = require("../config/model_sync");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const {
  get_Obj_array_from_id_array,
  checkAssociatedModelInstances,
} = require("../resources/libary");

exports.faculty_page = asyncHandler(async (req, res, next) => {
  const faculty = await Faculty.findByPk(req.params.id, {
    include: Department,
  });
  const departmentList = faculty.departments;
  const { name, id, url } = faculty;
  const facultyLite = {
    name,
  };
  //const url = faculty.url;
  facultyLite.facultyCode = "0000" + id + "f";
  res.render("faculty_page", {
    title: "faculty Display Page",
    faculty: facultyLite,
    url,
    departmentList,
  });
});

exports.faculties_page = asyncHandler(async (req, res, next) => {
  const facultyList = await Faculty.findAll();
  res.render("faculties_page", {
    title: "Faculties Display Page",
    facultyList,
  });
});
exports.faculty_creation_form = asyncHandler(async (req, res, next) => {
  let faculty;

  if (req.method === "POST") {
    //Create a facultyInstance with the form data
    faculty = facultyInstance(req.body);
  }
  res.render("faculty_creation_form", {
    title: "faculty creation form",
    faculty,
  });
});

exports.faculty_create_formData_processor = [
  //validate and sanitize the name field
  body("name", "faculty name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a faculty object
    let faculty = facultyInstance(req.body);

    if (!errors.isEmpty()) {
      const errorAray = errors.array();

      res.render("error");
    } else {
      //The data is valid at this point
      const facultyWithSameName = await Faculty.findOne({
        where: { name: faculty.name },
      });

      faculty.option = "create";

      if (facultyWithSameName) {
        res.render("faculty_already_existing", {
          title: "faculty_already_existing",
          faculty,
        });
      } else {
        const newFaculty = await Faculty.create(faculty);

        res.redirect(newFaculty.url + "/display");
      }
    }
  }),
];

exports.faculty_update_form = asyncHandler(async (req, res, next) => {
  const departmentList = await Department.findAll();

  let faculty;

  let facultyDepartmentList;

  if (req.method === "GET") {
    faculty = await Faculty.findByPk(req.params.id, {
      include: [Department],
    });
    facultyDepartmentList = faculty.departments;
  } else if (req.method === "POST") {
    //Create a facultyInstance with the form data
    faculty = facultyInstance(req.body);
    faculty.id = req.params.id;
    // convert faculty.departmentIds to array if it is of string type
    if (typeof faculty.departmentIds == "string") {
      faculty.departmentIds = [faculty.departmentIds];
    }
    // convert faculty.courseIds to array if it is of string type
    if (typeof faculty.courseIds == "string") {
      faculty.courseIds = [faculty.courseIds];
    }
    // convert faculty.lecturerIds to array if it is of string type
    if (typeof faculty.lecturerIds == "string") {
      faculty.lecturerIds = [faculty.lecturerIds];
    }
    // convert faculty.studentIds to array if it is of string type
    if (typeof faculty.studentIds == "string") {
      faculty.studentIds = [faculty.studentIds];
    }

    facultyDepartmentList = await get_Obj_array_from_id_array(
      faculty.departmentIds,
      Department
    );
    facultyCourseList = await get_Obj_array_from_id_array(
      faculty.courseIds,
      Course
    );
    facultyLecturerList = await get_Obj_array_from_id_array(
      faculty.lecturerIds,
      Lecturer
    );
    facultyStudentList = await get_Obj_array_from_id_array(
      faculty.studentIds,
      Student
    );
  }

  //Add checked plag to each of the departments associated to the faculty from departmentList
  const workedDepartmentList = checkAssociatedModelInstances(
    departmentList,
    facultyDepartmentList
  );

  res.render("faculty_update_form", {
    title: "faculty update form",
    faculty,
    departmentList: workedDepartmentList,
  });
});

exports.faculty_update_formData_processor = [
  //validate and sanitize the name field
  body("name", "faculty name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a faculty object
    const faculty = facultyInstance(req.body);
    faculty.id = req.params.id;

    if (!errors.isEmpty()) {
      const errorAray = errors.array();
      //Add nameError property to the facultyObj
      faculty.nameError = errorAray[0].msg;

      //Render the form again with sanitized value and or error message

      res.send("error");
    } else {
      //The data is valid at this point
      //Check if a faculty with the same name already exists in the database
      const facultyWithSameName = await Faculty.findOne({
        where: { name: faculty.name },
      });

      // convert faculty.departmentIds to array if it is of string type
      if (typeof faculty.departmentIds == "string") {
        faculty.departmentIds = [faculty.departmentIds];
      }

      const facultyDepartmentList = await get_Obj_array_from_id_array(
        faculty.departmentIds,
        Department
      );

      if (facultyWithSameName && facultyWithSameName.id != req.params.id) {
        const departmentList = await Department.findAll();
        const workedDepartmentList = checkAssociatedModelInstances(
          departmentList,
          facultyDepartmentList
        );
        faculty.option = req.params.id + "/update";

        res.render("faculty_already_existing", {
          title: "faculty_already_existing",
          faculty,
          departmentList: workedDepartmentList,
        });
      } else {
        await Faculty.update(faculty, {
          where: {
            id: req.params.id,
          },
        });
        const updatedFaculty = await Faculty.findByPk(req.params.id);
        const d = await updatedFaculty.addDepartments(facultyDepartmentList);
        //redirect to faculty page
        res.redirect(updatedFaculty.url + "/display");
      }
    }
  }),
];

exports.faculty_delete_form = asyncHandler(async (req, res, next) => {
  const faculty = await Faculty.findByPk(req.params.id);
  if (req.method === "GET") {
    res.render("delete_form", {
      title: "faculty delete form",
      model: faculty,
    });
    return;
  }

  if (req.method === "POST") {
    await Faculty.destroy({
      where: {
        id: req.params.id,
      },
    });

    res.redirect("/faculty");
  }
});
