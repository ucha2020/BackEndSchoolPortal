const Book = require("../models/book.js");
const Author = require("../models/author.js");
const Genre = require("../models/genre.js");
const BookInstance = require("../models/bookinstance.js");

const { generatePrimaryIDArray, generateAssociateIDArray, generateRandomStatus } = require('./idArray.js');

const statusList = ['Available','Maintenance','Loaned','Reserved'];



const {buildGenre, buildAuthor, buildBook, buildBookInstance} = require('./modelBuild.js');


const authorPrimaryIdRange = [1,8]; //8 
const genrePrimaryIdRange = [9,12]; //4

const bookInstancePrimaryIdRange = [28,67]; //40
const bookPrimaryIdRange = [13,27]; //15

const genreNames = ['blues','reggea','hiphop','afro'];
const genrePrimaryIds = generatePrimaryIDArray(genrePrimaryIdRange);
const genreArray = genreNames.map((value,index)=>{
    return buildGenre(value,genrePrimaryIds[index]);
});

const authorPrimaryIds = generatePrimaryIDArray(authorPrimaryIdRange);
const authorArray = authorPrimaryIds.map((id)=>{
    return buildAuthor(id);
});

const bookPrimaryIds = generatePrimaryIDArray(bookPrimaryIdRange);
const bookAssociateAuthorIds = generateAssociateIDArray(bookPrimaryIdRange,authorPrimaryIdRange);
const bookAssociateGenreIds = generateAssociateIDArray(bookPrimaryIdRange,genrePrimaryIdRange);
const bookArray = bookPrimaryIds.map((primaryId,index)=>{
    return buildBook({genreId :bookAssociateGenreIds[index], authorId:bookAssociateAuthorIds[index], primaryId });
});

const bookInstancePrimaryIds = generatePrimaryIDArray(bookInstancePrimaryIdRange);
const bookInstanceAssociateBookIds = generateAssociateIDArray(bookInstancePrimaryIdRange,bookPrimaryIdRange);
const randomStatusValueList = generateRandomStatus(statusList,bookInstancePrimaryIds);
const bookInstanceArray = bookInstancePrimaryIds.map((primaryId,index)=>{
    return buildBookInstance(primaryId,bookInstanceAssociateBookIds[index], randomStatusValueList[index]);
});


Author.hasMany(Book);
Book.belongsTo(Author);

Genre.hasMany(Book);
Book.belongsTo(Genre);

Book.hasMany(BookInstance);
BookInstance.belongsTo(Book);

Genre.belongsToMany(Author,{through:'AuthorGenre'})
Author.belongsToMany(Genre,{through:'AuthorGenre'});

async function fxn() { 
    /*
    const bookNumber = await Book.count();
    const books = await Book.findAll({
        attributes: ['title','id'],
        include: Author,
    });
    let u = books[1].url;
    const sortedBooks = books.sort((book1, book2) => book1.title > book2.title ? 1 : -1)
    const titleArray = books.map((book)=> book.dataValues.title);
    const bookInstance = await BookInstance.findAll();
    const Number = await Genre.findAll();
    const authorN = await Author.findAll({
        include: Book,
    });
    
    const n = 15;
    

    const a =   await Author.destroy({
        where:{ },
     });
      const c =   await Genre.destroy({
        where:{ },
        });    
        
        const b =   await Book.destroy({
            where:{},
        });
       
        const d =   await BookInstance.destroy({
            where:{ },
         })
         */
        let auths;
    try {
         auths = await Author.findAll(); 
    } catch (error) {
        const d = auths;
    }   
    await Author.sync();
    await Genre.sync();
    await Book.sync();
    await BookInstance.sync();

    const authorBuiltArray = Author.build(authorArray);
    const arr1 = [];
    for (const element of authorBuiltArray) {
        const obj = await element.save();
        arr1.push(obj)

    }

    const genreBuiltArray = Genre.bulkBuild(genreArray);
    const arr2 = [];
   
        for (const element of genreBuiltArray) {
            const obj = await element.save();
            arr2.push(obj)
    
        }
           

    const bookBuiltArray = Book.build(bookArray);
    const arr3 = [];
   
        for (const element of bookBuiltArray) {
            const obj = await element.save();
            arr3.push(obj)
    
        }
   
    const bookInstanceBuiltArray = BookInstance.build(bookInstanceArray);
    const arr = [];
   
        for (const element of bookInstanceBuiltArray) {
            const obj = await element.save();
            arr.push(obj)
    
        }
   
    const boks = await Book.findAll();
    const s = 90;
}
fxn();

 
    