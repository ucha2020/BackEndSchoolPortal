exports.faculty_page = asyncHandler(async(req,res, next,) => {
    const faculty = await Faculty.findByPk(req.params.id);

    const {name,id,url} = faculty;
    const facultyLite = {
        name
    };
    //const url = faculty.url;
    facultyLite.facultyCode = "0" + id;
    res.render(
        'faculty_page',
        {
            title:"faculty Display Page",
            faculty: facultyLite,
            url,
        }
    );
}) ;
