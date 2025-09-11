const Author = require('../models/author');
const Book = require('../models/book');
const asyncHandler = require('express-async-handler');
const {body, validationResult} = require("express-validator");


exports.authorList = async (req,res,next) => {

    try{
        const allAuthors = await Author.findAll();
        res.locals.author_list = allAuthors;
        res.locals.title = 'Author List';
        res.render('author_list');
    }catch(error){
        return next(error);
    } 
};

exports.authorDetail = asyncHandler(async(req,res,next)=>{
    const [author,authorBooks] = await Promise.all([
        Author.findByPk(req.params.id),
        Book.findAll({
            where:{ 
                authorId: req.params.id,
            }
        })
    ])
    res.render('author_detail',{
        title: 'Author Detail',
        author,
        authorBooks,
    });
});

exports.authorCreateGet = (req,res,next)=>{
    res.render(`author_form`,{
        title: "Create Author"
    });
};

exports.authorCreatePost = [
      // Validate and sanitize fields.
  body("firstName")
  .trim()
  .isLength({ min: 1 })
  .escape()
  .withMessage("firstName must be specified.")
  .isAlphanumeric()
  .withMessage("firstName has non-alphanumeric characters."),
body("lastName")
  .trim()
  .isLength({ min: 2 })
  .escape()
  .withMessage("lastName must be specified.")
  .isAlphanumeric()
  .withMessage("lastName has non-alphanumeric characters."),
body("dateOfBirth", "Invalid date of birth")
  .optional({ values: "falsy" })
  .isISO8601()
  .toDate(),
body("dateOfDeath", "Invalid date of death")
  .optional({ values: "falsy" })
  .isISO8601()
  .toDate(),

// Process request after validation and sanitization.
asyncHandler(async (req, res, next) => {
  // Extract the validation errors from a request.
  const errors = validationResult(req);

  // Create Author object with escaped and trimmed data
  const author = Author.build({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    id:        req.body.id,
    dateOfBirth: req.body.dateOfBirth,
    dateOfDeath: req.body.dateOfDeath,
  });

  if (!errors.isEmpty()) {
    // There are errors. Render form again with sanitized values/errors messages.
    res.render("author_form", {
      title: "Create Author",
      author: author,
      errors: errors.array(),
    });
    return;
  } else {
    // Data from form is valid.
    const authorExists = await Author.findOne({
        where:{
            firstName: req.body.firstName,
        }
      })
        
      if (authorExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(authorExists.url);
      } else {
    // Save author.
    await author.save();
    // Redirect to new author record.
    res.redirect(author.url);
      }
    
  }
}),
];


exports.authorDeleteGet = asyncHandler(async(req,res,next)=>{
    res.send(`author deleteGet is yet to be implemented `);
});

exports.authorDeletepost = asyncHandler(async(req,res,next)=>{
    res.send(`author deletePost is yet to be implemented `);
});

exports.authorUpdateGet = asyncHandler(async(req,res,next)=>{
    res.send(`author updateGet is yet to be implemented `);
});

exports.authorUpdatePost = asyncHandler(async(req,res,next)=>{
    res.send(`author updatePost is yet to be implemented `);
});