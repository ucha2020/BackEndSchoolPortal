const sequelize = require('./databaseSetup-sqlite.js');
const Book = require("../models/book.js");
const Author = require("../models/author.js");
const Genre = require("../models/genre.js");
const BookInstance = require("../models/bookinstance.js");

(async (params) => {
    try {
        const books = await Book.findAll();
        const b = 45;
    } catch (error) {
        const b = 45;  
    }
    
    const b = 45;
})()