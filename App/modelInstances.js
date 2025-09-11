exports.facultyInstance = (formBody)=>{
    const {name,} = formBody;   
     return {name};
}

exports.courseInstance = (formBody)=>{    
    return {...formBody};
}

exports.departmentInstance = (formBody)=>{
    return {...formBody};
}

exports.studentInstance = (formBody)=>{    
    return { ...formBody };
}

exports.lecturerInstance = (formBody)=>{    
    return {...formBody};
}