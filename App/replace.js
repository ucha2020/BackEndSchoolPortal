exports.lecturer_update_addCourse_form = asyncHandler(
  async (req, res, next) => {
    const lecturerId = req.params.id;
    const lecturer = await lecturer.findByPk(lecturerId, {
      include: [Department],
    });
    if (req.method === "POST") {
      let lecturerCourseIds = req.body.lecturerCourseIds;
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

    res.render("lecturer_update_addCourse", {
      availableCourseList,
    });
  }
);

exports.lecturer_update_removeCourse_form = asyncHandler(
  async (req, res, next) => {
    const lecturerId = req.params.id;
    const lecturer = await lecturer.findByPk(lecturerId);

    if (req.method === "POST") {
      let lecturerCourseIds = req.body.lecturerCourseIds;
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
    res.render("lecturer_update_removeCourse", {
      courseList,
    });
  }
);
