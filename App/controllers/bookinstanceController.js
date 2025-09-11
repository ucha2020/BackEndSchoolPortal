const Book = require('../models/book');
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const {body, validationResult} = require("express-validator");

const asyncHandler = require('express-async-handler');

Author.hasMany(Book);
Book.belongsTo(Author);

Genre.hasMany(Book);
Book.belongsTo(Genre);

Book.hasMany(BookInstance);
BookInstance.belongsTo(Book);

Genre.belongsToMany(Author,{through:'AuthorGenre'})
Author.belongsToMany(Genre,{through:'AuthorGenre'});

exports.bookinstanceList = async (req,res,next) => {

    try{
        const AllBookInstances = await BookInstance.findAll({
            attributes: ['status','id', 'imprint'],
            include: Book,
        });

        res.render("bookInstance_list",{
            title: "Book Instance List",
            bookInstance_list: AllBookInstances,
        })
    }catch(error){
        return next(error);
    } 
};

exports.bookinstanceDetail = asyncHandler(async(req,res,next)=>{
    const bookinstance = await BookInstance.findByPk(req.params.id,{
        include: Book,
    });

    res.render('bookinstance_detail',{
        title: "Bookinstance",
        bookinstance,
    })

   
});

exports.bookinstanceCreateGet = asyncHandler(async(req,res,next)=>{

    const books = await Book.findAll();
    const statusList = ['Available','Maintenance','Loaned','Reserved'];
    res.render('bookinstance_form',{
        statusList,
        books,
        title: "Bookinstance (Copy)",
    });
});

exports.bookinstanceCreatePost = [

  // Validate and sanitize fields.
  body("imprint", "Imprint must not be less than 4 cheracters.")
    .trim()
    .isLength({ min: 4 })
    .escape(),
  
  // Process request after validation and sanitization.

  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.
    const bookinstance =  BookInstance.build({
      imprint: req.body.imprint,
      bookId:  req.body.book,
      id :     req.body.id,
      status:  req.body.status,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      const books = await Book.findAll();
      const statusList = ['Available','Maintenance','Loaned','Reserved'];

      // Mark our selected genres as checked.
      for (const status of statusList) {
        if (req.body.status == status) {
          bookinstance.checked = req.body.status;
          break
        }
      }

      for (const book of books) {
        if (req.body.book == book.id) {
              bookinstance.selected = req.body.book;
              break
        }
      }

      res.render("bookinstance_form", {
        title: "Create Bookinstance",
        bookinstance,
        books,
        statusList,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Save book.
     
      await bookinstance.save();
      res.redirect(bookinstance.url);
    }
  }),
];


exports.bookinstanceDeleteGet = asyncHandler(async(req,res,next)=>{
    res.send(`bookinstance deleteGet is yet to be implemented `);
});

exports.bookinstanceDeletepost = asyncHandler(async(req,res,next)=>{
    res.send(`bookinstance deletePost is yet to be implemented `);
});

exports.bookinstanceUpdateGet = asyncHandler(async(req,res,next)=>{
    res.send(`bookinstance updateGet is yet to be implemented `);
});

exports.bookinstanceUpdatePost = asyncHandler(async(req,res,next)=>{
    res.send(`bookinstance updatePost is yet to be implemented `);
});