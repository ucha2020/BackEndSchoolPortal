const { body, validationResult } = require("express-validator");
const { lecturerInstance } = require("../modelInstances");
const {
  Faculty,
  Department,
  Lecturer,
  Course,
  Student,
} = require("../config/model_sync");
const asyncHandler = require("express-async-handler");
const {
  checkAssociatedModelInstances,
  get_Obj_array_from_id_array,
} = require("../resources/libary");

exports.lecturer_page = asyncHandler(async (req, res, next) => {
  const lecturer = await Lecturer.findByPk(req.params.id, {
    include: [Department, Course],
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
  const courseList = await lecturer.getCourses();
  const studentList = await lecturer.getStudents();
  //const url = lecturer.url;
  lecturerLite.lecturerCode =
    "0" + lecturerFaculty.id + lecturerDepartment.id + id;
  res.render("lecturer_page", {
    title: "lecturer Display Page",
    lecturer: lecturerLite,
    faculty: lecturerFaculty,
    department: lecturerDepartment,
    courseList,
    studentList,
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
    const lecturer = await Lecturer.findByPk(req.params.id);
    if (lecturer.level > 4) {
      res.render("message_report", {
        message: `Students can not be assigned to this lecturer, 
                    becausea this lecturers is above level 4  `,
        url: lecturer.url + "/update",
      });
      return;
    }
    const studentCount = await lecturer.countStudents();
    if (req.method == "GET") {
      // Making sure that the lecturer has need exceeded
      // the maximum of the student that can be assigned to him/her
      if (studentCount > 4) {
        res.render("message_report", {
          message: "Maximum studentload reached for this lecturer",
          url: lecturer.url + "/update",
        });
        return;
      }

      // Get all the students in the department with no course adviser
      const studentList = await Student.findAll({
        where: {
          courseAdvicerId: null,
        },
      });

      res.render("update_add_remove", {
        modelList: studentList,
        nameType: "fullName",
        maximumCount: 5 - studentCount,
        parentModel: { name: "lecturer", url: lecturer.url },
        associateModel: "student",
        actionType: "add",
      });
    } else if (req.method === "POST") {
      let studentIds = req.body.modelIds;
      //check to see if no student has been selected
      if (!studentIds) {
        res.redirect(lecturer.url + "/update");
        return;
      }
      // if studentIds is not an array, convert to array

      if (!Array.isArray(studentIds)) {
        studentIds = [studentIds];
      }

      // Check to see if the number of selected students is more than the allowed student per lecturer
      if (studentIds.length + studentCount > 5) {
        res.send(
          `You are currently not allowed to select more than ${5 - studentCount}
        <button class= add> <a href="">Ok</a></button> `
        );
        return;
      }
      const studentList = await get_Obj_array_from_id_array(
        studentIds,
        Student
      );
      await lecturer.addStudents(studentList);

      res.redirect(lecturer.url + "/update");
    }
  }
);
exports.lecturer_update_removeStudent_form = asyncHandler(
  async (req, res, next) => {
    const lecturerId = req.params.id;
    const lecturer = await Lecturer.findByPk(lecturerId);

    if (req.method === "GET") {
      // get all the student under this lecturer if any
      const lecturerStudentList = await lecturer.getStudents();
      res.render("update_add_remove", {
        modelList: lecturerStudentList,
        nameType: "fullName",
        parentModel: { name: "lecturer", url: lecturer.url },
        associateModel: "student",
        actionType: "remove",
      });
    } else if (req.method === "POST") {
      let studentIds = req.body.modelIds;
      //convert studentIds to array if it is a string
      if (!Array.isArray(studentIds)) {
        studentIds = [studentIds];
      }

      const studentList = await get_Obj_array_from_id_array(
        studentIds,
        Student
      );
      await lecturer.removeStudents(studentList);

      res.redirect(lecturer.url + "/update");

      return;
    }
  }
);

exports.lecturer_update_addCourse_form = asyncHandler(
  async (req, res, next) => {
    const lecturerId = req.params.id;
    const lecturer = await Lecturer.findByPk(lecturerId, {
      include: [Department],
    });

    let maximumCourseLoad;

    switch (+lecturer.level) {
      case 1:
        maximumCourseLoad = 4;
        break;

      case 2:
        maximumCourseLoad = 3;
        break;

      case 3:
        maximumCourseLoad = 1;
        break;

      case 4:

      case 5:
        res.render("message_report", {
          message:
            "Course can not be assigned to level 4 and level 5 lecturers ",
          url: lecturer.url + "/update",
        });
        return;
      default:
        res.render("message_report", {
          message: "A valid level has not been choosen for this lecturer",
          url: lecturer.url + "/update",
        });
        return;
    }
    //Check to see if the lecturer has reached his/her course limit
    const courseCount = await lecturer.countCourses();
    if (courseCount > maximumCourseLoad - 1) {
      res.render("maximum_form", {
        model: "lecturer",
        associate: "course",
        count: 2,
        url: lecturer.url + "/update",
      });
      return;
    }

    if (req.method === "GET") {
      // Get all the lecturers in the department where the lecturer belongs
      let lecturerList = await Lecturer.findAll({
        where: {
          departmentId: lecturer.departmentId,
        },
      });
      let courseList = [];
      //Remove this lecturer from the list of lecturers from the lecturerList
      //to avoid returning the course already assigned to this lecturer as part
      // of the courses available for assignment.
      lecturerList = lecturerList.filter((lec) => {
        return lecturer.id == lec.id ? false : true;
      });
      // From the list of the lecturers, get all the  courses under the department
      for await (const lecturer of lecturerList) {
        const courses = await lecturer.getCourses();
        courseList.push(courses);
      }

      courseList = courseList.flat();
      //remove dublicate that could occur due to defferent lecturers
      // having the same course

      courseList = new Set(courseList);
      //pug iterates over array and object but not set
      courseList = [...courseList];
      //filter the courseLIst and remove courses that has been assigned upto 2 lecturers
      const availableCourses = [];
      for await (const course of courseList) {
        let courseList = await course.getLecturers();
        if (courseList.length < 2) {
          availableCourses.push(course);
        }
      }
      res.render("update_add_remove", {
        modelList: availableCourses,
        parentModel: { name: "lecturer", url: lecturer.url },
        associateModel: "course",
        actionType: "add",
        maximumCount: maximumCourseLoad - courseCount,
      });
    } else if (req.method === "POST") {
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
    }
  }
);

exports.lecturer_delete_form = asyncHandler(async (req, res, next) => {
  const lecturer = await Lecturer.findByPk(req.params.id);
  if (req.method === "GET") {
    res.render("delete_form", {
      title: "lecturer delete form",
      model: lecturer,
      nameType: "fullName",
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
