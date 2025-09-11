const {departmentInstance} = require("../modelInstances");
const {Faculty,Department} = require("../config/model_sync");
const asyncHandler = require("express-async-handler");
const {body, validationResult} = require("express-validator");
const {checkAssociatedModelInstances, get_Obj_array_from_id_array} = require('../resources/libary')

exports.departments_page = asyncHandler(async(req,res, next,) => {
    const departments = await Department.findAll();
    res.render('departments_page',{
        title:"departments Display Page",
        departmentList: departments,
    })
}) ;

exports.department_page = asyncHandler(async(req,res, next,) => {
    const department = await Department.findByPk(
        req.params.id,
        {
            include:[Faculty]
        }
    );

    const {name,id,url} = department;
    const departmentLite = {
        name
    };
    
    const departmentFaculty = department.faculty;
    //const url = department.url;
    departmentLite.departmentCode = "0" + departmentFaculty.id + id;
    res.render(
        'department_page',
        {
            title:"department Display Page",
            department: departmentLite,
            faculty : departmentFaculty,
            url,
        }
    );
}) ;

exports.department_creation_form =  asyncHandler(async(req,res, next) => {
    //Check to see that there is atleast one faculty in the database
    let facultyList = await Faculty.findAll();
    if (!facultyList[0]){
        const nonExistingAncestralList = { 
            parent: "faculty",
            child: "department",
        };
        
        res.render(
            'non_existing',
            {
                nonExistingAncestralList,
                method: req.method,
            }
        )
        return
    }

    let department;

    if (req.method === "POST") {
        //Create a departmentInstance with the form data 
        department = departmentInstance(req.body);
        
        const departmentfacultyList = await get_Obj_array_from_id_array([department.facultyId], Faculty);
        facultyList = checkAssociatedModelInstances(facultyList, departmentfacultyList);          
    } 
    res.render('department_creation_form',
        {
            title:"department creation form",
            department,
            facultyList,
        });
});

exports.department_create_formData_processor = [
    
    //validate and sanitize the name field
    
    //Process request after validation and sanitization.
    asyncHandler(async (req, res, next) =>{
        
        // Extract the validation error from a request.
        const errors = validationResult(req);
        // Create a department object
        const department = departmentInstance(req.body);

        if (!errors.isEmpty()) {
            const errorAray = errors.array();
            //Add nameError property to the departmentObj
            department.nameError = errorAray[0].msg;
            
            //Render the form again with sanitized value and or error message

            res.send('error');
        }else{
            //The data is valid at this point            
           //Check if a department with the same name already exists in the database
            const departmentWithSameName = await Department.findOne({
                where:{name:department.name}
            });
            
            
            if (departmentWithSameName) {
                const facultyList = await Faculty.findAll();
                let departmentfacultyList = await get_Obj_array_from_id_array([department.facultyId], Faculty);
                const workedfacultyList = checkAssociatedModelInstances(facultyList, departmentfacultyList);
                department.option = 'create';
                res.render(
                    'department_already_existing',
                    {
                        title: "department_already_existing",
                        department,
                        facultyList: workedfacultyList,   
                    }
                )
            } else {
                const newdepartment = await Department.create(department);
                //redirect to department page
                res.redirect(newdepartment.url+'/display');                
            }
        }
    })    
];

exports.department_update_form =  asyncHandler(async(req,res, next,) => {   

    const facultyList = await Faculty.findAll();
    let department;
    let departmentfaculty ;
    
    if (req.method === "GET") { 
        department = await Department.findByPk(
            req.params.id,
            {
                include:[Faculty],
        
            }
        );
        departmentfaculty = [department.faculty];
    }
    else if (req.method === "POST") {
        //Create a departmentInstance with the form data 
        department = departmentInstance(req.body);
        department.id = req.params.id;
        departmentfaculty = await get_Obj_array_from_id_array([department.facultyId], Faculty);
    }  

     //Add checked plag to each of the departments associated to the department from departmentList
     const workedfacultyList = checkAssociatedModelInstances(facultyList, departmentfaculty);
   
    res.render(
        'department_update_form',
        {
            title:"department update form",
            department,
            facultyList: workedfacultyList,

        }
    );
});

exports.department_update_formData_processor =  [
    //validate and sanitize the name field
    body("name", "department name must contain at least 3 characters")
    .trim().isLength({min: 3}).escape(),
    
    //Process request after validation and sanitization.
    asyncHandler(async (req, res, next) =>{
        // Extract the validation error from a request.
        const errors = validationResult(req);
        // Create a department object
        const department = departmentInstance(req.body);
        department.id = req.params.id;

        if (!errors.isEmpty()) {
            const errorAray = errors.array();
            //Add nameError property to the departmentObj
            department.nameError = errorAray[0].msg;
                       
            //Render the form again with sanitized value and or error message

            res.render('error')
        }else{
            //The data is valid at this point
            const departmentFacultyList = await get_Obj_array_from_id_array([department.facultyId], Faculty);
            
            //Check if a department with the same name already exists in the database
            const departmentWithSameName = await Department.findOne({
                where:{name:department.name}
            });
            if (departmentWithSameName && departmentWithSameName.id != req.params.id) {

                const facultyList = await Faculty.findAll();
            
                const workedFacultyList = checkAssociatedModelInstances(facultyList, departmentFacultyList);
            
                department.option = req.params.id + '/update';

                res.render(
                    'department_already_existing',
                    {
                        title: "department_already_existing",
                        department,
                        facultyList: workedFacultyList,
                    }
                )
            } else {
                await Department.update(department,{
                    where : {
                        id: req.params.id
                    }
                });
                const updateddepartment = await Department.findByPk(req.params.id);
                 //redirect to department page
                res.redirect(updateddepartment.url+'/display');
            }
        }
    })    
    
];

exports.department_delete_form =  asyncHandler(async(req,res, next,) => {
    const department = await Department.findByPk(req.params.id);
    if (req.method === "GET"){
        res.render(
            'department_delete_form',
            {
                title:"department delete form",
                department,
            }
        )
        return;
    }

    if (req.method === "POST") {
        await Department.destroy({
            where: {
                id: req.params.id
            }
        });

        res.redirect('/department')
    }
 });