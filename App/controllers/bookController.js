const Book = require('../models/book');
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const {body, validationResult} = require("express-validator");

Author.hasMany(Book);
Book.belongsTo(Author);

Genre.hasMany(Book);
Book.belongsTo(Genre);

Book.hasMany(BookInstance);
BookInstance.belongsTo(Book);

Genre.belongsToMany(Author,{through:'AuthorGenre'})
Author.belongsToMany(Genre,{through:'AuthorGenre'});


const asyncHandler = require('express-async-handler');
const bookInstance = require('../models/bookinstance');

exports.index = asyncHandler(async(req,res,next)=>{
    const [
        numBook, 
        numBookInstance, 
        numAuthors,
        numGenre,
        numAvailableBookInstance
    ] = await Promise.all([
        Book.count(),
        BookInstance.count(),
        Author.count(),
        Genre.count(),

    ]);
    res.render("index",{
        title: "Local Library Home",
        bookCount: numBook,
        authorCount: numAuthors,
        genreCount: numGenre,
        bookInstanceCount: numBookInstance,
    });
});

exports.bookList = async (req,res,next) => {

    try{
        const books = await Book.findAll({
            attributes: ['title','id'],
            include: Author,
        });
        const sortedBooks = books.sort((book1, book2) => book1.title > book2.title ? 1 : -1)
        
        res.render("book_list",{
            title: "Book List",
            book_list: sortedBooks,
        });
    }catch(error){
        return next(error);
    } 
};

exports.bookDetail = asyncHandler(async(req,res,next)=>{
    const [book,bookinstances] = await Promise.all([ 
        Book.findByPk(req.params.id,{
        include: [Author,Genre],
        }),
        BookInstance.findAll({
            where:{
                bookId: req.params.id
            }
        })
    ])
    
    res.render('book_detail',{
        tittle: book.title,
        book,
        bookinstances,
    });
});

exports.bookCreateGet = asyncHandler(async(req,res,next)=>{
    // Get all authors and genres, which we can use for adding to our book.
    const [allAuthors, allGenres] = await Promise.all([
        Author.findAll(),
        Genre.findAll(),
      ]);
    
      res.render("book_form", {
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
      });
});

exports.bookCreatePost = [
    // Convert the genre to an array.
    (req, res, next) => {
      if (!Array.isArray(req.body.genre)) {
        req.body.genre =
          typeof req.body.genre === "undefined" ? [] : [req.body.genre];
      }
      next();
    },
  
    // Validate and sanitize fields.
    body("title", "Title must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("author", "Author must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("summary", "Summary must not be empty.")
      .trim()
      .isLength({ min: 6 })
      .escape(),
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
    body("genre.*").escape(),
    // Process request after validation and sanitization.
  
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a Book object with escaped and trimmed data.
      const book =  Book.build({
        title: req.body.title,
        authorId:  req.body.author - 0,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genreId:  req.body.genre[0]- 0,
        id: req.body.id - 0,
      });
  
      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.
  
        // Get all authors and genres for form.
        const [allAuthors, allGenres] = await Promise.all([
          Author.findAll(),
          Genre.findAll(),
        ]);
  
        // Mark our selected genres as checked.
        for (const genre of allGenres) {
          if (req.body.genre.includes(genre.id.toString())) {
            genre.checked = "true";
          }
        }
        res.render("book_form", {
          title: "Create Book",
          authors: allAuthors,
          genres: allGenres,
          book: book,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid. Save book.
       
        await book.save();
        res.redirect(book.url);
      }
    }),
  ];

exports.bookDeleteGet = asyncHandler(async(req,res,next)=>{
    res.send(`book deleteGet is yet to be implemented `);
});

exports.bookDeletepost = asyncHandler(async(req,res,next)=>{
    res.send(`book deletePost is yet to be implemented `);
});

exports.bookUpdateGet = asyncHandler(async(req,res,next)=>{
    res.send(`book updateGet is yet to be implemented `);
});

exports.bookUpdatePost = asyncHandler(async(req,res,next)=>{
    res.send(`book updatePost is yet to be implemented `);
});