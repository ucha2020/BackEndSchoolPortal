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

exports.courses_page = asyncHandler(async (req, res, next) => {
  const courses = await Course.findAll();
  res.render("courses_page", {
    title: "courses Display Page",
    courseList: courses,
  });
});

exports.course_page = asyncHandler(async (req, res, next) => {
  const course = await Course.findByPk(req.params.id, {
    include: [Lecturer],
  });

  const { name, title, level, creditUnit, id, url } = course;
  const courseRaw = {
    name,
    title,
    level,
    creditUnit,
  };

  const courseLecturer = course.lecturer;
  const courseDepartment = await Department.findByPk(
    courseLecturer.departmentId
  );
  const courseFaculty = await Faculty.findByPk(courseDepartment.facultyId);
  const courseStudents = await Course.findAll({});

  //const url = course.url;
  courseRaw.courseCode =
    "0" + courseFaculty.id + courseDepartment.id + courseLecturer.id + id;

  res.render("course_page", {
    title: "course Display Page",
    course: courseRaw,
    faculty: courseFaculty,
    department: courseDepartment,
    lecturer: courseLecturer,
    studentList: courseStudents,
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
      //Atleast a department and faculty exists and no lecturer is in existence at at this stage
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
          const obj = await lecturer.getCourses();
          if (obj.length < 2) availableLecturers.push(lecturer);
        }

        if (availableLecturers.length > 0) {
          // There exist at this point atleast a lecturer is available for course assignment
          //therefore, a lecturer should be selected for the course creation
          res.render("course_creation_form", {
            title: "course creation form",
            lecturerList: availableLecturers,
          });
          return;
        } else {
          // The lecturers in the choosen department have been assigned a course
          //So a new lecturer should be created or atleast a lecturer should have
          // his or her course removed to create room for the new course creation

          res.render("new_lecturer");
        }
      }
    } else {
      // Get the list of all the lecturers under the department where the course is to be created
      const selectedLecturerId = course.lecturerId;
      const selectedLecturer = await Lecturer.findByPk(selectedLecturerId);
      const selectedDepartmentId = selectedLecturer.departmentId;
      const selectedDepartmentlecturers = await Lecturer.findAll({
        where: {
          departmentId: selectedDepartmentId,
        },
      });
      //Mark the selected lecturer in the the list of all the lecturer from the selected department
      const lecturerList = checkAssociatedModelInstances(
        selectedDepartmentlecturers,
        [selectedLecturer]
      );

      res.render("course_creation_form", {
        title: "course creation form",
        course,
        lecturerList,
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
      let lecturerList = await Lecturer.findAll();
      course.option = "create";

      if (courseWithSameName) {
        const courseLecturerList = await get_Obj_array_from_id_array(
          [course.lecturerId],
          Lecturer
        );
        lecturerList = checkAssociatedModelInstances(
          lecturerList,
          courseLecturerList
        );

        res.render("course_already_existing", {
          title: "course_already_existing",
          course,
          lecturerList,
        });
      } else {
        const newcourse = await Course.create(course);
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
      course.lecturer = await Lecturer.findByPk(course.lecturerId);
      // Get ID of the department associated with course
      const courseDepartmentid = course.lecturer.departmentId;
      // Get all the lecturer associated with the department where the course belongs with course
      const lecturerList = await Lecturer.findAll({
        where: {
          departmentId: courseDepartmentid,
        },
      });

      //Check if a course with the same name already exists in the database
      const courseWithSameName = await Course.findOne({
        where: {
          name: course.name,
        },
      });
      if (courseWithSameName && courseWithSameName.id != req.params.id) {
        const workedLecturerList = checkAssociatedModelInstances(lecturerList, [
          course.lecturer,
        ]);

        course.option = req.params.id + "/update";

        res.render("course_already_existing", {
          title: "course_already_existing",
          course,
          lecturerList: workedLecturerList,
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
  let lecturerList;
  let course;

  if (req.method === "GET") {
    course = await Course.findByPk(req.params.id, {
      include: [Lecturer],
    });
    // Get ID of the department where the course belongs
    const courseDepartmentid = course.lecturer.departmentId;
    // Get all the lecturers associated with the department where the course belongs
    lecturerList = await Lecturer.findAll({
      where: {
        departmentId: courseDepartmentid,
      },
    });
  } else if (req.method === "POST") {
    //Create a courseInstance with the form data
    course = courseInstance(req.body);
    course.id = req.params.id;
    course.lecturer = await Lecturer.findByPk(course.lecturerId);
    // Get ID of the department associated with course
    const courseDepartmentid = course.lecturer.departmentId;
    // Get all the lecturer associated with the department where the course belongs with course
    lecturerList = await Lecturer.findAll({
      where: {
        departmentId: courseDepartmentid,
      },
    });
  }

  //Add checked plag to each of the lecturers associated to the course from lecturerList
  const workedLecturerList = checkAssociatedModelInstances(lecturerList, [
    course.lecturer,
  ]);
  res.render("course_update_form", {
    title: "course update form",
    course,
    lecturerList: workedLecturerList,
  });
});

exports.course_delete_form = asyncHandler(async (req, res, next) => {
  if (req.method === "GET") {
    const course = await Course.findByPk(req.params.id);

    res.render("course_delete_form", {
      title: "course delete form",
      course,
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
