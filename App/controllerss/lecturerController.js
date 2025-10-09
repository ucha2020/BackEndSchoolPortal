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
  getRouteLink,
} = require("../resources/libary");

exports.lecturer_page = asyncHandler(async (req, res, next) => {
  const lecturer = await Lecturer.findByPk(req.params.id);

  const {
    firstName,
    lastName,
    dateOfEmployment,
    dateOfBirth,
    gender,
    id,
    url,
    level,
  } = lecturer;
  const lecturerLite = {
    firstName,
    lastName,
    dateOfEmployment,
    dateOfBirth,
    gender,
    level,
  };

  const department = await Department.findByPk(lecturer.departmentId);
  const faculty = await Faculty.findByPk(department.facultyId);
  const courseList = await lecturer.getCourses();
  const studentList = await lecturer.getStudents();
  //const url = lecturer.url;
  lecturerLite.lecturerCode = "0" + faculty.id + department.id + id;
  const routeLinks = getRouteLink(req.originalUrl, "lecturer");

  res.render("lecturer_page", {
    title: "lecturer Display Page",
    lecturer: lecturerLite,
    faculty,
    department,
    courseList,
    studentList,
    url,
    routeLinks,
  });
});

exports.lecturers_page = asyncHandler(async (req, res, next) => {
  const lecturerList = await Lecturer.findAll();
  const routeLinks = getRouteLink(req.originalUrl, "lecturer");
  res.render("lecturers_page", {
    title: "lecturers Display Page",
    lecturerList,
    routeLinks,
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
      const routeLinks = getRouteLink(req.originalUrl);
      res.render("lecturer_creation_form", {
        title: "lecturer creation form",
        department,
        routeLinks,
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
  const routeLinks = getRouteLink(req.originalUrl, "lecturer");
  res.render("lecturer_update_form", {
    title: "lecturer update form",
    lecturer,
    department,
    level: lecturer.level,
    routeLinks,
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
    if (lecturer.level > 3) {
      res.render("message_report", {
        message: `Students can not be assigned to this lecturer, 
                    becausea this lecturers is above level 3  `,
        url: lecturer.url + "/update",
      });
      return;
    }
    const studentCount = await lecturer.countStudents();
    if (req.method == "GET") {
      // Making sure that the lecturer has not reached
      // the maximum number of student that can be assigned to him/her
      const courseLimit =
        lecturer.level == 1
          ? 2
          : lecturer.level == 2
          ? 4
          : lecturer.level == 3
          ? 3
          : "";

      if (studentCount >= courseLimit) {
        res.render("message_report", {
          message: "Maximum studentload reached for this lecturer",
          url: lecturer.url + "/update_addStudent",
        });
        return;
      }

      // Get all the students in the department with no course adviser
      const studentList = await Student.findAll({
        where: {
          courseAdviserId: null,
        },
      });
      const routeLinks = getRouteLink(req.originalUrl, "lecturer");
      res.render("update_add_remove", {
        modelList: studentList,
        nameType: "fullName",
        maximumCount: courseLimit - studentCount,
        parentModel: { name: "lecturer", url: lecturer.url },
        associateModel: "student",
        actionType: "add",
        routeLinks,
      });
    } else if (req.method === "POST") {
      let studentIds = req.body.modelIds;
      const maximumCount = req.body.maximumCount;
      //check to see if no student has been selected
      if (!studentIds) {
        res.render("message_report", {
          message: "You have not selected any student",
          url: lecturer.url + "/update_addStudent",
        });
        return;
      }
      // if studentIds is not an array, convert to array

      if (!Array.isArray(studentIds)) {
        studentIds = [studentIds];
      }

      // Check to see if the number of selected students is more than the allowed student per lecturer
      if (studentIds.length + studentCount > maximumCount) {
        res.send(
          `You are currently not allowed to select more than ${maximumCount}
           student(s)
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
      const studentList = await lecturer.getStudents();
      const routeLinks = getRouteLink(req.originalUrl, "lecturer");
      res.render("update_add_remove", {
        modelList: studentList,
        nameType: "fullName",
        parentModel: { name: "lecturer", url: lecturer.url },
        associateModel: "student",
        actionType: "remove",
        routeLinks,
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

    //Check to see if the lecturer has reached his/her course limit
    const courseCount = await lecturer.countCourses();

    if (req.method === "GET") {
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
            message:
              "A valid level has not been choosen for this lecturer, Assign a level to this lecturer and continue",
            url: lecturer.url + "/update",
          });
          return;
      }
      if (courseCount > maximumCourseLoad - 1) {
        res.render("maximum_form", {
          model: "lecturer",
          associate: "course",
          count: maximumCourseLoad,
          url: lecturer.url + "/update",
        });
        return;
      }
      // Get all the lecturers in the department where the lecturer belongs
      let lecturerList = await Lecturer.findAll({
        where: {
          departmentId: lecturer.departmentId,
        },
      });
      //Remove this lecturer from the list of lecturers from the lecturerList
      //to avoid returning the course already assigned to this lecturer as part
      // of the courses available for assignment.
      lecturerList = lecturerList.filter((lec) => {
        return lecturer.id == lec.id ? false : true;
      });
      let courseList = [];
      // From the list of the lecturers, get all the  courses under the department
      for await (const lecturer of lecturerList) {
        const courses = await lecturer.getCourses();
        courseList.push(courses);
      }
      courseList = courseList.flat();

      //remove dublicate that could occur due to different lecturers
      // having the same course

      courseList = new Set(courseList);
      //pug iterates over array and object but not set
      courseList = [...courseList];
      //filter the courseLIst and remove courses that has been assigned upto 2 lecturers
      const availableCourses = [];
      for await (const course of courseList) {
        let count = await course.countLecturers();
        if (count < 2) {
          availableCourses.push(course);
        }
      }
      if (availableCourses.length < 1) {
        res.render("message_report", {
          message: "No course available currently to assign to this lecturer",
          url: lecturer.url + "/update",
        });
        return;
      }
      const routeLinks = getRouteLink(req.originalUrl, "lecturer");
      res.render("update_add_remove", {
        modelList: availableCourses,
        parentModel: { name: "lecturer", url: lecturer.url },
        associateModel: "course",
        actionType: "add",
        maximumCount: maximumCourseLoad - courseCount,
        routeLinks,
      });
    } else if (req.method === "POST") {
      let courseIds = req.body.modelIds;
      //check to see  that atleast a course was selected
      if (!courseIds) {
        res.render("message_report", {
          message: "No course has lecturer",
          url: lecturer.url + "/update",
        });
        return;
        res.redirect(lecturer.url + "/update");
        return;
      }
      //convert courseIds to array if it is a string
      if (!Array.isArray(courseIds)) {
        courseIds = [courseIds];
      }

      const availableCourseList = await get_Obj_array_from_id_array(
        courseIds,
        Course
      );
      await lecturer.addCourses(availableCourseList);

      res.redirect(lecturer.url + "/display");
    }
  }
);

exports.lecturer_update_removeCourse_form = asyncHandler(
  async (req, res, next) => {
    const lecturerId = req.params.id;
    const lecturer = await Lecturer.findByPk(lecturerId);

    if (req.method == "GET") {
      let courseList = await lecturer.getCourses();

      if (courseList.length < 1) {
        res.render("message_report", {
          message: "No course has been assigned to this lecturer",
          url: lecturer.url + "update_removeCourse",
        });
        return;
      } else {
        //Add "deactivate" flag to courses whose only lecturer reference is only this current lecturer
        const arr = [];
        for await (const course of courseList) {
          const count = await course.countLecturers();
          if (count == 1) {
            continue;
          }
          arr.push(course);
        }
        courseList = arr;
      }

      const routeLinks = getRouteLink(req.originalUrl, "lecturer");
      res.render("update_add_remove", {
        modelList: courseList,
        parentModel: { name: "lecturer", url: lecturer.url },
        associateModel: "course",
        actionType: "remove",
        routeLinks,
      });
    } else if (req.method == "POST") {
      const courseId = req.body.modelIds;
      if (!courseId) {
        res.render("message_report", {
          message:
            "No course selected for removal, select atleast a course to proceed",
          url: lecturer.url + "update_removeCourse",
        });
        return;
      }
      const course = await Course.findByPk(courseId);
      await lecturer.removeCourse(course);

      res.redirect(lecturer.url + "/display");
    }
  }
);
exports.lecturer_update_add_changeLevel_form = asyncHandler(
  async (req, res, next) => {
    const lecturer = await Lecturer.findByPk(req.params.id);
    const levelList = ["1", "2", "3", "4", "5"];
    if (req.method == "GET") {
      const routeLinks = getRouteLink(req.originalUrl);
      res.render("update_add_change", {
        levelList,
        presentLevel: lecturer.level,
        routeLinks,
      });
    } else if (req.method == "POST") {
      const courseCount = await lecturer.countCourses();
      const studentCount = await lecturer.countStudents();
      let maximumCourseLoad;
      let maximumStudentLoad;
      const level = req.body.level;

      switch (+level) {
        case 1:
          maximumCourseLoad = 4;
          maximumStudentLoad = 2;
          break;

        case 2:
          maximumCourseLoad = 3;
          maximumStudentLoad = 4;
          break;

        case 3:
          maximumCourseLoad = 1;
          maximumStudentLoad = 3;
          break;

        case 4:

        case 5:
          maximumCourseLoad = 0;
          maximumStudentLoad = 0;
          break;
      }
      if (courseCount > maximumCourseLoad) {
        res.render("message_report", {
          message: `You will need to remove atleast ${
            courseCount - maximumCourseLoad
          } course(s) from this lecturer before upgrading from level ${
            lecturer.level
          } to level ${level}`,
          url: lecturer.url + "/update_add_changeLevel",
        });
        return;
      } else if (studentCount > maximumStudentLoad) {
        res.render("message_report", {
          message: `You will need to remove atleast ${
            studentCount - maximumStudentLoad
          } student(s) from this lecturer before changing from level ${
            lecturer.level
          } to level ${level}`,
          url: lecturer.url + "/update_add_changeLevel",
        });
        return;
      } else {
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
          level,
        };

        await lecturer.update(lecturerLite);
        res.redirect(lecturer.url + "/display");
      }
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
