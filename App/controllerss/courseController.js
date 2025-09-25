const { courseInstance } = require("../modelInstances");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const {
  checkAssociatedModelInstances,
  get_Obj_array_from_id_array,
} = require("../resources/libary");
const {
  Course,
  Faculty,
  Department,
  Lecturer,
  Student,
} = require("../config/model_sync");
const { model } = require("mongoose");

exports.courses_page = asyncHandler(async (req, res, next) => {
  const courses = await Course.findAll();
  res.render("courses_page", {
    title: "courses Display Page",
    courseList: courses,
  });
});

exports.course_page = asyncHandler(async (req, res, next) => {
  const course = await Course.findByPk(req.params.id);

  const { name, title, level, creditUnit, id, url } = course;
  const courseRaw = {
    name,
    title,
    level,
    creditUnit,
  };

  const lecturerList = await course.getLecturers();
  const department = await Department.findByPk(lecturerList[0].departmentId);
  const faculty = await Faculty.findByPk(department.facultyId);
  const studentList = await course.getStudents();

  courseRaw.courseCode = "0" + faculty.id + department.id + id + "d";

  res.render("course_page", {
    title: "course Display Page",
    course: courseRaw,
    faculty,
    department,
    lecturerList,
    studentList,
    url,
  });
});

exports.course_creation_form = asyncHandler(async (req, res, next) => {
  if (req.method === "GET") {
    const facultyList = await Faculty.findAll();
    const departmentList = await Department.findAll();
    const lecturerList = await Lecturer.findAll();
    if (!facultyList[0]) {
      // Neither lecturer nor department nor faculty exists at this point
      const nonExistingAncestralList = {
        greatGrandParent: "faculty",
        grandParent: "department",
        parent: "lecturer",
        child: "course",
      };
      res.render("non_existing", {
        nonExistingAncestralList,
        method: req.method,
      });
      return;
    } else if (!departmentList[0]) {
      // Atleast a faculty exists but neither lecturer nor department exists at this point
      const nonExistingAncestralList = {
        grandParent: "department",
        parent: "lecturer",
        child: "course",
      };

      res.render("non_existing", {
        nonExistingAncestralList,
        method: req.method,
      });
      return;
    } else if (!lecturerList[0]) {
      //Atleast a department and faculty exists but no lecturer exists at this stage
      const nonExistingAncestralList = {
        parent: "lecturer",
        child: "course",
      };

      res.render("non_existing", {
        nonExistingAncestralList,
        method: req.method,
      });
      return;
    } else {
      //Atleast a lecturer, a faculty and department exist in the database at this point
      const ancestryStatus = {
        greatGrandParent: { name: "faculty", selected: true },
        grandParent: { name: "department", selected: false },
        parent: { name: "lecturer", selected: false },
        child: { name: "course" },
      };
      //Faculty should be selected for the course
      res.render("select_ancestry_form", {
        title: "select a lecturer for this course",
        greatGrandParentList: facultyList,
        ...ancestryStatus,
      });
      return;
    }
  }
  let course;

  if (req.method === "POST") {
    //Create a courseInstance with the form data

    course = courseInstance(req.body);

    if (Array.isArray(course.greatGrandParent)) {
      // Only faculty has been selected for the course creation at this moment
      const selectedFacultyId = course.greatGrandParent[0];
      const selectedFacultyDepartments = await Department.findAll({
        where: {
          facultyId: selectedFacultyId,
        },
      });

      if (selectedFacultyDepartments.length < 1) {
        // No department exist in the chosen faculty.
        //therefore, department should be created in the chisen faculty

        res.render("non_existing", {
          child: "course",
          grandParent: "faculty",
          parent: "department",
          method: req.method,
        });
        return;
      } else {
        // Atleast a department exist in the chosen faculty.
        //therefore, department should be selected for the course creation

        const ancestryStatus = {
          greatGrandParent: { name: "faculty", selected: true },
          grandParent: { name: "department", selected: true },
          parent: { name: "lecturer", selected: false },
          child: { name: "course" },
        };
        res.render("select_ancestry_form", {
          title: "select a department for this course",
          grandParentList: selectedFacultyDepartments,
          ...ancestryStatus,
        });
        return;
      }
    } else if (Array.isArray(course.grandParent)) {
      // Both faculty and depatment have been selected
      // for the course creation at this moment

      const selectedDepartmentId = course.grandParent[0];
      const selectedDepartmentLecturers = await Lecturer.findAll({
        where: {
          departmentId: selectedDepartmentId,
        },
      });
      if (selectedDepartmentLecturers.length < 1) {
        // No lecturer exist in the chosen department.
        //therefore, lecturer should be created in the chisen department
        res.render("non_existing", {
          child: "course",
          grandParent: "department",
          parent: "lecturer",
          method: req.method,
        });
        return;
      } else {
        // Atleast a lecturer exist in the chosen department.

        // Check for an atleast a lectuerer with no course or not greater than two courses assigned to him\her
        const availableLecturers = [];
        for await (const lecturer of selectedDepartmentLecturers) {
          const count = await lecturer.countCourses();
          if (count < 2) availableLecturers.push(lecturer);
        }

        if (availableLecturers.length > 0) {
          // There exist at this point atleast a lecturer is available for course assignment
          //therefore, a lecturer should be selected for the course creation
          const ancestryStatus = {
            greatGrandParent: { name: "faculty", selected: true },
            grandParent: { name: "department", selected: true },
            parent: { name: "lecturer", selected: true },
            child: { name: "course" },
          };
          res.render("select_ancestry_form", {
            title: "select a department for this course",
            parentList: availableLecturers,
            ...ancestryStatus,
          });
          return;
        } else {
          // The lecturers in the choosen department have all been assigned a course
          //So a new lecturer should be created or atleast a lecturer should have
          // his or her assigned course removed to create room for the new course creation

          res.render("new_lecturer", {
            departmentId: selectedDepartmentId,
          });
        }
      }
    } else if (Array.isArray(course.parent)) {
      // A lecturer under the department where the course is to be created has been selected
      const selectedLecturerId = course.parent[0];
      const lecturer = await Lecturer.findByPk(selectedLecturerId);

      res.render("course_creation_form", {
        title: "course creation form",
        lecturer,
      });
    } else if (course) {
      // This course details is coming from "already existing form"
      const lecturer = await Lecturer.findByPk(course.lecturerId);

      res.render("course_creation_form", {
        title: "course creation form",
        course,
        lecturer,
      });
    }
  }
});

exports.course_create_formData_processor = [
  //validate and sanitize the name field
  body("name", "course name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a course object
    const course = courseInstance(req.body);

    if (!errors.isEmpty()) {
      const errorAray = errors.array();
      //Add nameError property to the courseObj
      course.nameError = errorAray[0].msg;
      //Render the form again with sanitized value and or error message
      res.send("error");
    } else {
      //The data is valid at this point
      //Check if a course with the same name already exists in the database
      const courseWithSameName = await Course.findOne({
        where: {
          name: course.name,
        },
      });
      let lecturer = await Lecturer.findByPk(course.lecturerId);
      course.option = "create";

      if (courseWithSameName) {
        res.render("course_already_existing", {
          title: "course_already_existing",
          course,
          lecturer,
        });
      } else {
        const newcourse = await Course.create(course);
        await newcourse.addLecturers(lecturer);
        //redirect to course page

        res.redirect(newcourse.url + "/display");
      }
    }
  }),
];

exports.course_update_formData_processor = [
  //validate and sanitize the name field
  body("name", "course name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  //Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation error from a request.
    const errors = validationResult(req);
    // Create a course object
    const course = courseInstance(req.body);

    if (!errors.isEmpty()) {
      const errorAray = errors.array();
      //Add nameError property to the courseObj
      course.nameError = errorAray[0].msg;
      //Render the form again with sanitized value and or error message
      res.render("error");
    } else {
      //The data is valid at this point
      course.id = req.params.id;
      const lecturer = await Lecturer.findByPk(course.lecturerId);

      //Check if a course with the same name already exists in the database
      const courseWithSameName = await Course.findOne({
        where: {
          name: course.name,
        },
      });
      if (courseWithSameName && courseWithSameName.id != req.params.id) {
        course.option = req.params.id + "/update";

        res.render("course_already_existing", {
          title: "course_already_existing",
          course,
          lecturer,
        });
      } else {
        await Course.update(course, {
          where: {
            id: req.params.id,
          },
        });
        const updatedcourse = await Course.findByPk(req.params.id);
        //redirect to course page
        res.redirect(updatedcourse.url + "/display");
      }
    }
  }),
];

exports.course_update_form = asyncHandler(async (req, res, next) => {
  let lecturers;
  let course;

  if (req.method === "GET") {
    course = await Course.findByPk(req.params.id);
  } else if (req.method === "POST") {
    //Create a courseInstance with the form data
    course = courseInstance(req.body);
    course.id = req.params.id;
  }
  res.render("course_update_form", {
    title: "course update form",
    course,
  });
});

exports.course_delete_form = asyncHandler(async (req, res, next) => {
  if (req.method === "GET") {
    const course = await Course.findByPk(req.params.id);

    res.render("delete_form", {
      title: "course delete form",
      model: course,
    });
    return;
  }

  if (req.method === "POST") {
    await Course.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.redirect("/course");
  }
});
