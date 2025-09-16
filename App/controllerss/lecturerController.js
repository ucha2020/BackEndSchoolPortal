const { body, validationResult } = require("express-validator");
const { lecturerInstance } = require("../modelInstances");
const { Faculty, Department, Lecturer } = require("../config/model_sync");
const asyncHandler = require("express-async-handler");
const {
  checkAssociatedModelInstances,
  get_Obj_array_from_id_array,
} = require("../resources/libary");

exports.lecturer_page = asyncHandler(async (req, res, next) => {
  const lecturer = await Lecturer.findByPk(req.params.id, {
    include: [Department],
  });

  const {
    firstName,
    lastName,
    dateOfEmployment,
    dateOfBirth,
    gender,
    id,
    url,
  } = lecturer;
  const lecturerLite = {
    firstName,
    lastName,
    dateOfEmployment,
    dateOfBirth,
    gender,
  };

  const lecturerDepartment = lecturer.department;
  const lecturerFaculty = await Faculty.findByPk(lecturerDepartment.facultyId);
  //const url = lecturer.url;
  lecturerLite.lecturerCode =
    "0" + lecturerFaculty.id + lecturerDepartment.id + id;
  res.render("lecturer_page", {
    title: "lecturer Display Page",
    lecturer: lecturerLite,
    faculty: lecturerFaculty,
    department: lecturerDepartment,
    url,
  });
});

exports.lecturers_page = asyncHandler(async (req, res, next) => {
  const lecturerList = await Lecturer.findAll();
  res.render("lecturers_page", {
    title: "lecturers Display Page",
    lecturerList,
  });
});

exports.lecturer_creation_form = asyncHandler(async (req, res, next) => {
  if (req.method === "GET") {
    const facultyList = await Faculty.findAll();
    let departmentList = await Department.findAll();
    if (!facultyList[0]) {
      // Neither department nor faculty exists at this point
      const nonExistingAncestralList = {
        grandParent: "faculty",
        parent: "department",
        child: "lecturer",
      };

      res.render("non_existing", {
        nonExistingAncestralList,
        method: req.method,
      });

      return;
    } else if (!departmentList[0]) {
      //Atleast a faculty exists and no department in existence at at this stage
      const nonExistingAncestralList = {
        parent: "department",
        child: "lecturer",
      };

      res.render("non_existing", {
        nonExistingAncestralList,
        method: req.method,
      });

      return;
    } else {
      //Both department and faculty exist in the database at this point
      const ancestryStatus = {
        greatGrandParent: { name: "school", selected: true },
        grandParent: { name: "faculty", selected: true },
        parent: { name: "department", selected: false },
        child: { name: "lecturer" },
      };
      res.render("select_ancestry_form", {
        title: "select a faculty for this lecturer",
        grandParentList: facultyList,
        ...ancestryStatus,
      });
      return;
    }
  }

  if (req.method === "POST") {
    //check to see if a department option has been provided
    const departmentId = req.body.departmentId;
    if (departmentId) {
      const department = await Department.findByPk(departmentId);

      res.render("lecturer_creation_form", {
        title: "lecturer creation form",
        department,
      });
      return;
    }
    //Create a lecturerInstance with the form data

    let lecturer = lecturerInstance(req.body);

    if (Array.isArray(lecturer.grandParent)) {
      //Only faculty  has been selected at this stage
      const selectedFacultyId = lecturer.grandParent[0];
      const selectedFacultyDepartments = await Department.findAll({
        where: {
          facultyId: selectedFacultyId,
        },
      });

      if (selectedFacultyDepartments.length < 1) {
        //No department exist in this faculty
        res.render("non_existing", {
          child: "lecturer",
          grandParent: "faculty",
          parent: "department",
          method: req.method,
        });

        return;
      } else {
        const ancestryStatus = {
          greatGrandParent: { name: "school", selected: true },
          grandParent: { name: "faculty", selected: true },
          parent: { name: "department", selected: true },
          child: { name: "lecturer" },
        };
        res.render("select_ancestry_form", {
          title: "select a department for this lecturer",
          parentList: selectedFacultyDepartments,
          ...ancestryStatus,
        });
        return;
      }
    } else if (Array.isArray(lecturer.parent)) {
      //Department has been selected for the lecturer creation at this stage
      const selectedDepartmentId = lecturer.parent[0];
      const department = await Department.findByPk(selectedDepartmentId);
      res.render("lecturer_creation_form", {
        title: "lecturer creation form",
        department,
      });
    }
  }
});

exports.lecturer_create_formData_processor = [
  //validate and sanitize the name field
  body("firstName", "lecturer name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a lecturer object
    const lecturer = lecturerInstance(req.body);

    if (!errors.isEmpty()) {
      const errorAray = errors.array();
      //Add nameError property to the lecturerObj
      lecturer.nameError = errorAray[0].msg;
      //Render the form again with sanitized value and or error message
      res.send("error");
    } else {
      //The data is valid at this point
      //Check if a lecturer with the same name already exists in the database
      const lecturerWithSameName = await Lecturer.findOne({
        where: {
          firstName: lecturer.firstName,
          lastName: lecturer.lastName,
        },
      });

      lecturer.option = "create";

      if (lecturerWithSameName) {
        const department = await Department.findByPk(lecturer.departmentId);

        res.render("lecturer_already_existing", {
          title: "lecturer_already_existing",
          lecturer,
          department,
        });
      } else {
        const newlecturer = await Lecturer.create(lecturer);
        //redirect to lecturer page
        res.redirect(newlecturer.url + "/display");
      }
    }
  }),
];

exports.lecturer_update_form = asyncHandler(async (req, res, next) => {
  let lecturer;
  let department;

  if (req.method === "GET") {
    lecturer = await Lecturer.findByPk(req.params.id, {
      include: [Department],
    });
    department = lecturer.department;
  } else if (req.method === "POST") {
    //Create a lecturerInstance with the form data
    lecturer = lecturerInstance(req.body);
    lecturer.id = req.params.id;
    department = await Department.findByPk(lecturer.departmentId);
  }

  res.render("lecturer_update_form", {
    title: "lecturer update form",
    lecturer,
    department,
  });
});

exports.lecturer_update_formData_processor = [
  //validate and sanitize the name field
  body("firstName", "lecturer name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a lecturer object
    const lecturer = lecturerInstance(req.body);
    lecturer.id = req.params.id;

    if (!errors.isEmpty()) {
      const errorAray = errors.array();
      //Add nameError property to the lecturerObj
      lecturer.nameError = errorAray[0].msg;
      //Render the form again with sanitized value and or error message
      res.render("error");
    } else {
      //The data is valid at this point
      //Check if a lecturer with the same name already exists in the database
      const lecturerWithSameName = await Lecturer.findOne({
        where: {
          firstName: lecturer.firstName,
          lastName: lecturer.lastName,
        },
      });
      if (lecturerWithSameName && lecturerWithSameName.id != req.params.id) {
        const department = await Department.findByPk(lecturer.departmentId);
        lecturer.option = req.params.id + "/update";

        res.render("lecturer_already_existing", {
          title: "lecturer_already_existing",
          lecturer,
          department,
        });
      } else {
        await Lecturer.update(lecturer, {
          where: {
            id: req.params.id,
          },
        });
        const updatedlecturer = await Lecturer.findByPk(req.params.id);
        //redirect to lecturer page
        res.redirect(updatedlecturer.url + "/display");
      }
    }
  }),
];

exports.lecturer_update_addStudent_form = asyncHandler(
  async (req, res, next) => {
    const lecturerId = req.params.id;
    const lecturer = await Lecturer.findByPk(lecturerId);
    if (req.method === "POST") {
      let lecturerStudentIds = req.body.modelIds;
      // if lecturerStudentIds is not an array, convert to array

      if (!Array.isArray(lecturerStudentIds)) {
        lecturerStudentList = [lecturerStudentList];
      }
      let lecturerStudentList = await student.findByPk(lecturerStudentIds);
      lecturerStudentList = await get_Obj_array_from_id_array(
        lecturerStudentList,
        Student
      );
      await lecturer.addstudentS(lecturerStudentList);

      res.redirect("/lecturer" + lecturerId + "/update");

      return;
    }

    // Get all the students in the department
    // with no course advicer assigned where the lecturer belongs
    const studentList = await student.findAll({
      where: {
        departmentId: lecturer.departmentId,
      },
    });
    let unassignedStudentList = [];

    for await (const student of studentList) {
      const assigned = await student.hasLecturer();
      if (!assigned) {
        unassignedStudentList.push(student);
      }
    }
    res.render("update_add_remove", {
      modelList: availablelecturerStudentList,
      nameType: "fullName",
    });
  }
);
exports.lecturer_update_removeStudent_form = asyncHandler(
  async (req, res, next) => {
    const lecturerId = req.params.id;
    const lecturer = await Lecturer.findByPk(lecturerId);
    if (req.method === "POST") {
      let lecturerStudentIds = req.body.modelIds;
      //convert lecturerStudentIds to array if it is a string
      if (!Array.isArray(lecturerStudentIds)) {
        lecturerStudentIds = [lecturerStudentIds];
      }

      const lecturerStudentList = await get_Obj_array_from_id_array(
        lecturerStudentIds,
        Student
      );
      await lecturer.removeStudents(lecturerStudentList);

      res.redirect(lecturer.url + "/update");

      return;
    }
    // get all the student under this lecturer if any
    const lecturerStudentList = await lecturer.getStudents();
    res.render("update_add_remove", {
      modelList: lecturerStudentList,
      nameType: "fullName",
    });
  }
);

exports.lecturer_update_addCourse_form = asyncHandler(
  async (req, res, next) => {
    const lecturerId = req.params.id;
    const lecturer = await lecturer.findByPk(lecturerId, {
      include: [Department],
    });
    if (req.method === "POST") {
      let lecturerCourseIds = req.body.modelIds;
      //convert lecturerCourseIds to array if it is a string
      if (!Array.isArray(lecturerCourseIds)) {
        lecturerCourseIds = [lecturerCourseIds];
      }

      const availableCourseList = await get_Obj_array_from_id_array(
        lecturerCourseIds,
        Course
      );
      await lecturer.addCourses(availableCourseList);

      res.redirect(lecturer.url + "/update");

      return;
    }

    // Get all the courses in the department that has not been assigned upto two
    // lecturers in that department

    // Fierst, get all the courses in that department
    const allCourses = await Course.findAll({
      where: {
        departmentId: lecturer.departmentId,
      },
    });
    let availableCourseList = [];

    for await (const course of allCourses) {
      const count = await course.countLecturer();
      if (count < 2) {
        availableCourseList.push(course);
      }
    }

    res.render("update_add_remove", {
      modelList: availableCourseList,
      nameType: "fullName",
    });
  }
);

exports.lecturer_update_removeCourse_form = asyncHandler(
  async (req, res, next) => {
    const lecturerId = req.params.id;
    const lecturer = await lecturer.findByPk(lecturerId);

    if (req.method === "POST") {
      let lecturerCourseIds = req.body.modelIds;
      //convert lecturerCourseIds to array if it is a string
      if (!Array.isArray(lecturerCourseIds)) {
        lecturerCourseIds = [lecturerCourseIds];
      }

      const courseList = await get_Obj_array_from_id_array(
        lecturerCourseIds,
        Course
      );
      await lecturer.removeCourses(courseList);

      res.redirect(lecturer.url + "update");

      return;
    }

    // Get all the courses under this lecturer
    const courseList = await lecturer.getCourses();
    res.render("update_add_remove", {
      modelList: courseList,
      nameType: "fullName",
    });
  }
);

exports.lecturer_delete_form = asyncHandler(async (req, res, next) => {
  const lecturer = await Lecturer.findByPk(req.params.id);
  if (req.method === "GET") {
    res.render("lecturer_delete_form", {
      title: "lecturer delete form",
      lecturer,
    });
    return;
  }

  if (req.method === "POST") {
    await Lecturer.destroy({
      where: {
        id: req.params.id,
      },
    });

    res.redirect("/lecturer");
  }
});
