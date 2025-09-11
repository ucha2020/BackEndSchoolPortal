const {body, validationResult} = require("express-validator");
const {studentInstance} = require("../modelInstances")
const {Faculty,Student,Department, Lecturer} = require("../config/model_sync")
const asyncHandler = require("express-async-handler");
const {checkAssociatedModelInstances, get_Obj_array_from_id_array} = require('../resources/libary');

exports.student_page = asyncHandler(async(req,res, next,) => {
    const student = await Student.findByPk(
        req.params.id,
        {
            include:[Department,Lecturer]
        }
    );

    const studentRaw = await Student.findByPk(
        req.params.id,
        {
            raw:true,
            attributes:{
                exclude:["createdAt","updatedAt","departmentId","lecturerId","id"],
            }
        }
    );
    
    const studentDeparment = student.department;
    const studentLecturer = student.lecturer;
    const studentFaculty = await Faculty.findByPk(studentDeparment.facultyId);
    const url = student.url;
    studentRaw.regNo = "0" + studentFaculty.id + studentDeparment.id + student.id;
    res.render(
        'student_page',
        {
            title:"student Display Page",
            student: studentRaw,
            department : studentDeparment,
            faculty : studentFaculty,
            lecturer : studentLecturer,
            url,
        }
    );
}) ;

exports.students_page = asyncHandler(async(req,res, next,) => {
    const studentList = await Student.findAll();

    res.render('students_page',{
        title:"students Display Page",
        studentList,
    })
}) ;

exports.student_creation_form =  asyncHandler(async(req,res, next) => {
    
    if (req.method === "GET") {
        const facultyList = await Faculty.findAll();
        let departmentList = await Department.findAll();
        if (!facultyList[0]){
            // Neither department nor faculty exists at this point
            const nonExistingAncestralList = {
                grandParent: "faculty", 
                parent: "department",
                child: "student",
            };
            
            res.render(
                'non_existing',
                {
                    nonExistingAncestralList,
                    method: req.method,
                }
            )
            return;
        }else if (!departmentList[0]){
            //Atleast a faculty exists and no department in existence at at this stage
            const nonExistingAncestralList = {
                parent: "department",
                child: "student",
            };
            
            res.render(
                'non_existing',
                {
                    nonExistingAncestralList,
                    method: req.method,
                }
            ) 
            return;
        }else{
            //Both department and faculty exist in the database at this point
            const ancestryStatus = {
                greatGrandParent: {name: "school", selected : true,},
                grandParent: {name: "faculty", selected : true},
                parent: {name: "department", selected : false},
                child: {name:"student"},
            }
            res.render(
                'select_ancestry_form',
                {
                    title: 'select a department for this student',
                    grandParentList: facultyList,
                    ...ancestryStatus,
                }
            )
            return;
        }    
    }
    let student;

    if (req.method === "POST") {
        //Create a studentInstance with the form data 

        student = studentInstance(req.body);

        if (Array.isArray(student.grandParent)) {
            const selectedFacultyId = student.grandParent[0];
            const selectedFacultyDepartments = await Department.findAll({
                where:{
                    facultyId: selectedFacultyId,
                }
            });
        
            if (selectedFacultyDepartments.length < 1){
                
                res.render(
                    'non_existing',
                    {
                        child : "student",
                        grandParent: "faculty",
                        parent: "department",
                        method: req.method,
                    }
                )

                return;
            } else {
                res.render('student_creation_form',
                    {
                        title:"student creation form",
                        departmentList: selectedFacultyDepartments,
                    }
                );
                return;
            }
        } else {
            const selectedDepartmentId = student.departmentId;
            const selectedDepartment = await Department.findByPk(selectedDepartmentId);
            const selectedFacultyId = selectedDepartment.facultyId;
            const selectedFacultyDepartments = await Department.findAll({
                where:{
                    facultyId: selectedFacultyId,
                }
            });
            
            const departmentList = checkAssociatedModelInstances(selectedFacultyDepartments, [selectedDepartment]);
         
            res.render('student_creation_form',
                {
                    title:"student creation form",
                    student,
                    departmentList,
                }
            );
        }
        
        
    }
});

exports.student_create_formData_processor = [
    
    //validate and sanitize the name field
    body("firstName", "student name must contain at least 3 characters")
    .trim().isLength({min: 3}).escape(),
    
    //Process request after validation and sanitization.
    asyncHandler(async (req, res, next) =>{
        // Extract the validation error from a request.
        const errors = validationResult(req);
        // Create a student object
        const student = studentInstance(req.body);

        if (!errors.isEmpty()) {
            const errorAray = errors.array();
            //Add nameError property to the studentObj
            student.nameError = errorAray[0].msg;
            //Render the form again with sanitized value and or error message
            res.send('error')
        }else{
            //The data is valid at this point
            //Check if a student with the same name already exists in the database
            const studentWithSameName = await Student.findOne({
                where:{
                    firstName:student.firstName,
                    lastName:student.lastName,
                }
            });
            let departmentList = await Department.findAll();
            student.option = 'create';

            if (studentWithSameName) {
                const studentDepartmentList = await get_Obj_array_from_id_array([student.departmentId], Department);    
                departmentList= checkAssociatedModelInstances(departmentList, studentDepartmentList);
                
                 res.render(
                    'student_already_existing',
                    {
                        title: "student_already_existing",
                        student,
                        departmentList,    
                    }
                )
            } else {
                const newstudent = await Student.create(student);
                //redirect to student page
                res.redirect(newstudent.url+'/display');
                
            }
        }
    })    
] 

exports.student_update_form =  asyncHandler(async(req,res, next,) => {   

    let departmentList ;

    let student;
    
    if (req.method === "GET") { 
        student = await Student.findByPk(
            req.params.id,
            {
                include:[Department],
            }
        );
        // Get ID of the faculty where the student belongs
        const studentFacultyid = student.department.facultyId;
        // Get all the departments associated with the faculty where the student belongs 
        departmentList = await Department.findAll({
            where:{
                facultyId: studentFacultyid,
            }
        });

              
    }
    else if (req.method === "POST") {
        //Create a studentInstance with the form data 
        student = studentInstance(req.body);
        student.id = req.params.id;
        student.department = await Department.findByPk(student.departmentId);
        // Get ID of the faculty associated with student
        const studentFacultyid = student.department.facultyId;
        // Get all the department associated with the faculty where the student belongs with student
        departmentList = await Department.findAll({
            where:{
                facultyId: studentFacultyid,
            }
        });
        
        }  
        //Add checked plag to each of the departments associated to the student from departmentList
        const workedDepartmentList = checkAssociatedModelInstances(departmentList, [student.department]);
        // Get all the lecturers in the department where the student belongs
        // From the list of the lecturers, get all the  courses under the department where the student belongs
        const lecturerList = await Lecturer.findAll({
            departmentId: student.departmentId
        });
         let studentCourseList = [];
        
        for await (const lecturer of lecturerList) {
            const courses = await lecturer.getCourse();
            studentCourseList.push(courses);
        }

        studentCourseList = studentCourseList.flat();
        studentCourseList = new Set(studentCourseList);
       
    res.render(
        'student_update_form',
        {
            title:"student update form",
            student,
            departmentList: workedDepartmentList,
            studentCourseList,
        }
    );
});

exports.student.student_update_add_form = asyncHandler(async(req,res, next,) => {
    const student = await Student.findByPk(
            req.params.id,
            {
                include:[Department],
            }
        );
    // Get all the lecturers in the department where the student belongs
        // From the list of the lecturers, get all the  courses under the department where the student belongs
        const lecturerList = await Lecturer.findAll({
            departmentId: student.departmentId
        });
         let studentCourseList = [];
        
        for await (const lecturer of lecturerList) {
            const courses = await lecturer.getCourse();
            studentCourseList.push(courses);
        }

        studentCourseList = studentCourseList.flat();
        studentCourseList = new Set(studentCourseList);

        res.render(
            'student_update_add',
            {
                studentCourseList,
            }
        )
 
});
exports.student_update_formData_processor =  [
    //validate and sanitize the name field
    body("firstName", "student name must contain at least 3 characters")
    .trim().isLength({min: 3}).escape(),
    
    //Process request after validation and sanitization.
    asyncHandler(async (req, res, next) =>{
        // Extract the validation error from a request.
        const errors = validationResult(req);
        // Create a student object
        const student = studentInstance(req.body);

        if (!errors.isEmpty()) {
            const errorAray = errors.array();
            //Add nameError property to the studentObj
            student.nameError = errorAray[0].msg;          
            //Render the form again with sanitized value and or error message
            res.render('error')   
        }else{
            //The data is valid at this point
            student.id = req.params.id;
            student.department = await Department.findByPk(student.departmentId);
            // Get ID of the faculty associated with student
            const studentFacultyid = student.department.facultyId;
            // Get all the department associated with the faculty where the student belongs with student
            const departmentList = await Department.findAll({
                where:{
                    facultyId: studentFacultyid,
                }
            });
        
            //Check if a student with the same name already exists in the database
            const studentWithSameName = await Student.findOne({
                where:{
                    firstName:student.firstName,
                    lastName:student.lastName,
                }
            });
            if (studentWithSameName && studentWithSameName.id != req.params.id) {
                const workedDepartmentList = checkAssociatedModelInstances(departmentList, [student.department]);

                student.option = req.params.id + '/update';

                res.render(
                    'student_already_existing',
                    {
                        title: "student_already_existing",
                        student,
                        departmentList: workedDepartmentList,                      
                    }
                )
            } else {
                await Student.update(student,{
                    where : {
                        id: req.params.id
                    }
                });
                const updatedstudent = await Student.findByPk(req.params.id);
                //redirect to student page
                res.redirect(updatedstudent.url+'/display');
            }
        }
    })    
    
];

exports.student_delete_form =  asyncHandler(async(req,res, next,) => {
    const student = await Student.findByPk(req.params.id);
    if (req.method === "GET"){
        res.render(
            'student_delete_form',
            {
                title:"student delete form",
                student,
            }
        )
        return;
    }

    if (req.method === "POST") {
        await Student.destroy({
            where: {
                id: req.params.id
            }
        });

        res.redirect('/student')
    }
 });