const { body, validationResult } = require("express-validator");
const { studentInstance } = require("../modelInstances");
const {
  Faculty,
  Student,
  Department,
  Lecturer,
  Course,
} = require("../config/model_sync");
const asyncHandler = require("express-async-handler");
const {
  checkAssociatedModelInstances,
  get_Obj_array_from_id_array,
  getRouteLink,
} = require("../resources/libary");
const { ur } = require("@faker-js/faker");
const { where, Op } = require("sequelize");
const { findByPk } = require("sequelize/lib/model");

exports.student_page = asyncHandler(async (req, res, next) => {
  const student = await Student.findByPk(req.params.id, {
    include: [Department, "courseAdviser", Course],
  });

  const studentRaw = await Student.findByPk(req.params.id, {
    raw: true,
    attributes: {
      exclude: [
        "courseAdviserId",
        "createdAt",
        "updatedAt",
        "departmentId",
        "lecturerId",
        "id",
      ],
    },
  });

  const department = student.department;
  const courseAdviser = student.courseAdviser;
  const faculty = await Faculty.findByPk(department.facultyId);
  const courseList = await student.courses;
  const url = student.url;
  studentRaw.regNo = "0" + faculty.id + "0" + department.id + student.id;
  const routeLinks = getRouteLink(req.originalUrl, "student");
  res.render("student_page", {
    title: "student Display Page",
    student: studentRaw,
    department,
    faculty,
    courseAdviser,
    courses: courseList,
    url,
    routeLinks,
  });
});

exports.students_page = asyncHandler(async (req, res, next) => {
  const studentList = await Student.findAll();
  const routeLinks = getRouteLink(req.originalUrl, "student");

  res.render("students_page", {
    title: "students Display Page",
    studentList,
    routeLinks,
  });
});

exports.student_creation_form = asyncHandler(async (req, res, next) => {
  if (req.method === "GET") {
    const facultyList = await Faculty.findAll();
    let departmentList = await Department.findAll();
    if (!facultyList[0]) {
      // Neither department nor faculty exists at this point
      const nonExistingAncestralList = {
        grandParent: "faculty",
        parent: "department",
        child: "student",
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
        child: "student",
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
        child: { name: "student" },
      };
      res.render("select_ancestry_form", {
        title: "select a department for this student",
        grandParentList: facultyList,
        ...ancestryStatus,
      });
      return;
    }
  }
  let student;

  if (req.method === "POST") {
    //Create a studentInstance with the form data

    student = studentInstance(req.body);

    if (Array.isArray(student.grandParent)) {
      //faculty has been selected at this stage
      const selectedFacultyId = student.grandParent[0];
      const selectedFacultyDepartments = await Department.findAll({
        where: {
          facultyId: selectedFacultyId,
        },
      });

      if (selectedFacultyDepartments.length < 1) {
        //no department exists in the selected faculty
        res.render("non_existing", {
          child: "student",
          grandParent: "faculty",
          parent: "department",
          method: req.method,
        });

        return;
      } else {
        //select a department for the student creation
        const ancestryStatus = {
          greatGrandParent: { name: "school", selected: true },
          grandParent: { name: "faculty", selected: true },
          parent: { name: "department", selected: true },
          child: { name: "student" },
        };
        res.render("select_ancestry_form", {
          title: "select a department for this student",
          parentList: selectedFacultyDepartments,
          ...ancestryStatus,
        });
        return;
      }
    } else if (Array.isArray(student.parent)) {
      //Department has been choosen for the student creation
      //render student creation form with the choosen department
      const selectedDepartmentId = student.parent[0];
      const selectedDepartment = await Department.findByPk(
        selectedDepartmentId
      );
      res.render("student_creation_form", {
        title: "student creation form",
        student,
        department: selectedDepartment,
      });
    }
  }
});

exports.student_create_formData_processor = [
  //validate and sanitize the name field
  body("firstName", "student name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a student object
    const student = studentInstance(req.body);

    if (!errors.isEmpty()) {
      const errorAray = errors.array();
      //Add nameError property to the studentObj
      student.nameError = errorAray[0].msg;
      //Render the form again with sanitized value and or error message
      res.send("error");
    } else {
      //The data is valid at this point
      //Check if a student with the same name already exists in the database
      const studentWithSameName = await Student.findOne({
        where: {
          firstName: student.firstName,
          lastName: student.lastName,
        },
      });
      const department = await Department.findByPk(student.departmentId);
      student.option = "create";

      if (studentWithSameName) {
        res.render("student_already_existing", {
          title: "student_already_existing",
          student,
          department,
        });
      } else {
        const newstudent = await Student.create(student);
        //redirect to student page
        res.redirect(newstudent.url + "/display");
      }
    }
  }),
];

exports.student_update_form = asyncHandler(async (req, res, next) => {
  let department;
  let student;

  if (req.method === "GET") {
    student = await Student.findByPk(req.params.id, {
      include: [Department],
    });
    // Get the department where the student belongs
    department = student.department;
  } else if (req.method === "POST") {
    //Create a studentInstance with the form data
    student = studentInstance(req.body);
    student.id = req.params.id;
    department = await Department.findByPk(student.departmentId);
  }
  res.render("student_update_form", {
    title: "student update form",
    student,
    department,
  });
});

exports.student_update_addCourse_form = asyncHandler(async (req, res, next) => {
  const student = await Student.findByPk(req.params.id);
  const courseCount = await student.countCourses();
  if (req.method == "GET") {
    // Check to see that the student has not reached it course addition count limit of 10
    if (courseCount > 8) {
      res.render("maximum_form", {
        model: "student",
        associate: "course",
        count: 9,
        url: student.url + "/update_addCourse",
      });
      return;
    }
    // Get all the lecturers in the department where the student belongs
    // From the list of the lecturers, get all the  courses under that department
    const lecturerList = await Lecturer.findAll({
      where: {
        departmentId: student.departmentId,
      },
    });
    let courseList = [];

    for await (const lecturer of lecturerList) {
      const courses = await lecturer.getCourses();
      courseList.push(courses);
    }
    courseList = courseList.flat();
    let courseIdList = courseList.map((course) => {
      return course.id;
    });
    //Filter the courseList to remove the courses already assigned to the student
    const studentCourseList = await student.getCourses();
    const studentCourseIdList = studentCourseList.map((studentCourse) => {
      return studentCourse.id;
    });
    courseIdList = courseIdList.filter((courseId) => {
      return !studentCourseIdList.includes(courseId);
    });
    //Remove duplicates
    courseIdList = new Set(courseIdList);
    //pug iterates over array and object but not set
    courseIdList = [...courseIdList];
    courseList = await get_Obj_array_from_id_array(courseIdList, Course);

    res.render("update_add_remove", {
      modelList: courseList,
      maximumCount: 9 - courseCount,
      parentModel: { name: "student", url: student.url },
      associateModel: "course",
      actionType: "add",
    });
  } else if (req.method === "POST") {
    let courseIds = req.body.modelIds;
    //check to see if no course was selected
    if (!courseIds) {
      res.redirect(student.url + "update_addCourse");
      return;
    }
    //convert studentCourseIds to array if it is a string
    if (!Array.isArray(courseIds)) {
      courseIds = [courseIds];
    }
    // Check to see if the number of selected courses is more than the allowed courses per that student
    if (courseIds.length + courseCount > 9) {
      res.send(
        `You are currently not allowed to select more than ${9 - courseCount}
        <button class= add> <a href="">Ok</a></button> `
      );
      return;
    }
    const courseList = await get_Obj_array_from_id_array(courseIds, Course);
    await student.addCourses(courseList);

    res.redirect(student.url + "/update");
  }
});

exports.student_update_removeCourse_form = asyncHandler(
  async (req, res, next) => {
    const student = await Student.findByPk(req.params.id);

    if (req.method === "GET") {
      // Get all the courses the student offers
      const courseList = await student.getCourses();
      res.render("update_add_remove", {
        modelList: courseList,
        parentModel: { name: "student", url: student.url },
        associateModel: "course",
        actionType: "remove",
      });
    } else if (req.method === "POST") {
      let courseIds = req.body.modelIds;
      //convert studentCourseIds to array if it is a string
      if (!Array.isArray(courseIds)) {
        courseIds = [courseIds];
      }

      const courseList = await get_Obj_array_from_id_array(courseIds, Course);
      await student.removeCourses(courseList);

      res.redirect(student.url + "/update");

      return;
    }
  }
);

exports.student_update_formData_processor = [
  //validate and sanitize the name field
  body("firstName", "student name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a student object
    const student = studentInstance(req.body);

    if (!errors.isEmpty()) {
      const errorAray = errors.array();
      //Add nameError property to the studentObj
      student.nameError = errorAray[0].msg;
      //Render the form again with sanitized value and or error message
      res.render("error");
    } else {
      //The data is valid at this point
      student.id = req.params.id;
      const department = await Department.findByPk(student.departmentId);

      //Check if a student with the same name already exists in the database
      const studentWithSameName = await Student.findOne({
        where: {
          firstName: student.firstName,
          lastName: student.lastName,
        },
      });
      if (studentWithSameName && studentWithSameName.id != req.params.id) {
        student.option = req.params.id + "/update";

        res.render("student_already_existing", {
          title: "student_already_existing",
          student,
          department,
        });
      } else {
        await Student.update(student, {
          where: {
            id: req.params.id,
          },
        });
        const updatedstudent = await Student.findByPk(req.params.id);
        //redirect to student page
        res.redirect(updatedstudent.url + "/display");
      }
    }
  }),
];

exports.student_delete_form = asyncHandler(async (req, res, next) => {
  const student = await Student.findByPk(req.params.id);
  if (req.method === "GET") {
    res.render("delete_form", {
      title: "student delete form",
      model: student,
      nameType: "fullName",
    });
    return;
  }

  if (req.method === "POST") {
    await Student.destroy({
      where: {
        id: req.params.id,
      },
    });

    res.redirect("/student");
  }
});
