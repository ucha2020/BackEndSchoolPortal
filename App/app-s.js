const express = require('express');
const createError = require('http-errors');
const app = express();
const path = require('path');
const home = require('./routes/home');
const faculty = require("./routes/faculty");
const department = require('./routes/department');
const student = require('./routes/student');
const course = require('./routes/course');
const lecturer = require('./routes/lecturer');

app.use(express.static(path.join(__dirname,"public")))
app.set('view engine','pug');
app.set('views',path.join(__dirname,'viewss'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/',home);
app.use('/faculty',faculty);
app.use('/department',department);
app.use('/student',student);
app.use('/course',course);
app.use('/lecturer',lecturer);
  
    // error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    console.log(err.message);
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
   // res.status(err.status || 500);
   // res.render('error');
   next(err);
});
  
app.get('/',function(req, res) {
    const facultyObj = {
        deanId: 1,

    }
    const facultyList = [{id:3,name: "hnfd"},{id:1,name:'okwulu'}];
    const lecturerList = [{id:3,name: "Lhnfd"},{id:1,name:'Lokwulu'},{id:3,name: "plhnfd"},{id:1,name:'slokwulu'}]
    
    res.render('faculty_form',{facultyObj,facultyList,lecturerList});
})

module.exports = app;
