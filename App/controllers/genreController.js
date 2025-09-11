const Genre = require('../models/genre');
const Book = require('../models/book');
const Author = require("../models/author");
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

exports.genreList = async (req,res,next) => {

    try{
        const allgenre = await Genre.findAll();
        const sortedGenreList = allgenre.sort((a,b)=> a.name > b.name ? 1:-1);

        res.render('genre_list',{
            title: "Genre List",
            genre_list: sortedGenreList,
        });
    }catch(error){
        return next(error);
    } 
};

exports.genreDetail = asyncHandler(async(req,res,next)=>{
    const genre = await Genre.findByPk(req.params.id);
    const booksUnderGenre = await Book.findAll({
        where:{
            genreId: req.params.id,
        }
    })

    res.render("genre_detail",{
        genre,
        booksUnderGenre,
    });
});

exports.genreCreateGet = (req,res,next)=>{
    res.render('genre_form',{
        title:"Create Genre",
    });
};


// Handle Genre create on POST.

exports.genreCreatePost = [
  // Validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = Genre.build({
      name: req.body.name,
      id: 1,
    })  
    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({
        where:{
            name: req.body.name
        }
      })
        
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];

exports.genreDeleteGet = asyncHandler(async(req,res,next)=>{
    res.send(`genre deleteGet is yet to be implemented `);
});

exports.genreDeletepost = asyncHandler(async(req,res,next)=>{
    res.send(`genre deletePost is yet to be implemented `);
});

exports.genreUpdateGet = asyncHandler(async(req,res,next)=>{
    res.send(`genre updateGet is yet to be implemented `);
});

exports.genreUpdatePost = asyncHandler(async(req,res,next)=>{
    res.send(`genre updatePost is yet to be implemented `);
});