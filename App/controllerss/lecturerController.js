const {body, validationResult} = require("express-validator");
const {lecturerInstance} = require("../modelInstances")
const {Faculty,Department,Lecturer} = require("../config/model_sync")
const asyncHandler = require("express-async-handler");
const {checkAssociatedModelInstances, get_Obj_array_from_id_array} = require('../resources/libary')



exports.lecturer_page = asyncHandler(async(req,res, next,) => {
    const lecturer = await Lecturer.findByPk(
        req.params.id,
        {
            include:[Department]
        }
    );

    const {firstName,lastName,dateOfEmployment,dateOfBirth,gender,id,url} = lecturer;
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
    lecturerLite.lecturerCode = "0" + lecturerFaculty.id + lecturerDepartment.id + id;
    res.render(
        'lecturer_page',
        {
            title:"lecturer Display Page",
            lecturer: lecturerLite,
            faculty : lecturerFaculty,
            department : lecturerDepartment,
            url,
        }
    );
}) ;

exports.lecturers_page = asyncHandler(async(req,res, next,) => {
    const lecturerList = await Lecturer.findAll()
    res.render('lecturers_page',{
        title:"lecturers Display Page",
        lecturerList,
    })
});

exports.lecturer_creation_form =  asyncHandler(async(req,res, next) => {
    
    if (req.method === "GET") {
        const facultyList = await Faculty.findAll();
        let departmentList = await Department.findAll();
        if (!facultyList[0]){
            // Neither department nor faculty exists at this point
            const nonExistingAncestralList = {
                grandParent: "faculty", 
                parent: "department",
                child: "lecturer",
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
                child: "lecturer",
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
                child: {name:"lecturer"},
            }
            res.render(
                'select_ancestry_form',
                {
                    title: 'select a department for this lecturer',
                    grandParentList: facultyList,
                    ...ancestryStatus,
                }
            )
            return;
        }    
    }
    let lecturer;

    if (req.method === "POST") {
        //Create a lecturerInstance with the form data 

        lecturer = lecturerInstance(req.body);

        if (Array.isArray(lecturer.grandParent)) {
            const selectedFacultyId = lecturer.grandParent[0];
            const selectedFacultyDepartments = await Department.findAll({
                where:{
                    facultyId: selectedFacultyId,
                }
            });
        
            if (selectedFacultyDepartments.length < 1){
                
                res.render(
                    'non_existing',
                    {
                       child : "lecturer",
                        grandParent: "faculty",
                        parent: "department",
                        method: req.method,
                    }
                )

                return;
            } else {
                res.render('lecturer_creation_form',
                    {
                        title:"lecturer creation form",
                        departmentList: selectedFacultyDepartments,
                    }
                );
                return;
            }
        } else {
            const selectedDepartmentId = lecturer.departmentId;
            const selectedDepartment = await Department.findByPk(selectedDepartmentId);
            const selectedFacultyId = selectedDepartment.facultyId;
            const selectedFacultyDepartments = await Department.findAll({
                where:{
                    facultyId: selectedFacultyId,
                }
            });
            
            const departmentList = checkAssociatedModelInstances(selectedFacultyDepartments, [selectedDepartment]);
         
            res.render('lecturer_creation_form',
                {
                    title:"lecturer creation form",
                    lecturer,
                    departmentList,
                }
            );
        }
        
        
    }
});

exports.lecturer_create_formData_processor = [
    
    //validate and sanitize the name field
    body("firstName", "lecturer name must contain at least 3 characters")
    .trim().isLength({min: 3}).escape(),
    
    //Process request after validation and sanitization.
    asyncHandler(async (req, res, next) =>{
        // Extract the validation error from a request.
        const errors = validationResult(req);
        // Create a lecturer object
        const lecturer = lecturerInstance(req.body); 

        if (!errors.isEmpty()) {
            const errorAray = errors.array();
            //Add nameError property to the lecturerObj
            lecturer.nameError = errorAray[0].msg;
            //Render the form again with sanitized value and or error message
            res.send('error')
        }else{
            //The data is valid at this point
            //Check if a lecturer with the same name already exists in the database
            const lecturerWithSameName = await Lecturer.findOne({
                where:{
                    firstName:lecturer.firstName,
                    lastName:lecturer.lastName,
                }
            });
            let facultyList = await Faculty.findAll();
            let departmentList = await Department.findAll();
          
            lecturer.option = 'create';

            if (lecturerWithSameName) {
                const lecturerDepartmentList = await get_Obj_array_from_id_array([lecturer.departmentId], Department);
                const lecturerfacultyList = await get_Obj_array_from_id_array([lecturer.facultyId], Faculty);
                
                departmentList= checkAssociatedModelInstances(departmentList, lecturerDepartmentList);
                facultyList = checkAssociatedModelInstances(facultyList, lecturerfacultyList);
                
                res.render(
                    'lecturer_already_existing',
                    {
                        title: "lecturer_already_existing",
                        lecturer,
                        departmentList,
                        facultyList,    
                    }
                )
            } else {
                const newlecturer = await Lecturer.create(lecturer);
                //redirect to lecturer page
                res.redirect(newlecturer.url+'/display');
                
            }
        }
    })    
] 

exports.lecturer_update_form =  asyncHandler(async(req,res, next,) => {   

    const departmentList = await Department.findAll();
    let lecturer;
    let lecturerDepartmentList;
  
    if (req.method === "GET") { 
        lecturer = await Lecturer.findByPk(
            req.params.id,
            {
                include:[Department,Faculty],
            }
        );
        lecturerDepartmentList = lecturer.department;
        lecturerDepartmentList = [lecturerDepartmentList];
    }
    else if (req.method === "POST") {
        //Create a lecturerInstance with the form data 
        lecturer = lecturerInstance(req.body);
        lecturer.id = req.params.id;
        lecturerDepartmentList = await get_Obj_array_from_id_array([lecturer.departmentId], Department);
    }  
     //Add checked plag to each of the departments associated to the lecturer from departmentList
     const workedDepartmentList = checkAssociatedModelInstances(departmentList, lecturerDepartmentList);
     
    res.render(
        'lecturer_update_form',
        {
            title:"lecturer update form",
            lecturer,
            departmentList: workedDepartmentList,
        }
    );
});

exports.lecturer_update_formData_processor =  [
    //validate and sanitize the name field
    body("firstName", "lecturer name must contain at least 3 characters")
    .trim().isLength({min: 3}).escape(),
    
    //Process request after validation and sanitization.
    asyncHandler(async (req, res, next) =>{
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
            res.render('error')   
        }else{
            //The data is valid at this point
            //Check if a lecturer with the same name already exists in the database
            const lecturerWithSameName = await Lecturer.findOne({
                where:{
                    firstName:lecturer.firstName,
                    lastName:lecturer.lastName,
                }
            });
            if (lecturerWithSameName && lecturerWithSameName.id != req.params.id) {
                
                const lecturerDepartmentList = await get_Obj_array_from_id_array([lecturer.departmentId], Department);
                const lecturerFacultyList = await get_Obj_array_from_id_array([lecturer.facultyId], Faculty);
                
                const facultyList = await Faculty.findAll();
                const departmentList = await Department.findAll();
                
                const workedDepartmentList = checkAssociatedModelInstances(departmentList, lecturerDepartmentList);
                const workedFacultyList = checkAssociatedModelInstances(facultyList, lecturerFacultyList);
                
                lecturer.option = req.params.id + '/update';

                res.render(
                    'lecturer_already_existing',
                    {
                        title: "lecturer_already_existing",
                        lecturer,
                        departmentList: workedDepartmentList,
                        facultyList: workedFacultyList,                       
                    }
                )
            } else {
                await Lecturer.update(lecturer,{
                    where : {
                        id: req.params.id
                    }
                });
                const updatedlecturer = await Lecturer.findByPk(req.params.id);
                //redirect to lecturer page
                res.redirect(updatedlecturer.url+'/display');
            }
        }
    })    
    
];

exports.lecturer_delete_form =  asyncHandler(async(req,res, next,) => {
    const lecturer = await Lecturer.findByPk(req.params.id);
    if (req.method === "GET"){
        res.render(
            'lecturer_delete_form',
            {
                title:"lecturer delete form",
                lecturer,
            }
        )
        return;
    }

    if (req.method === "POST") {
        await Lecturer.destroy({
            where: {
                id: req.params.id
            }
        });

        res.redirect('/lecturer')
    }
 });