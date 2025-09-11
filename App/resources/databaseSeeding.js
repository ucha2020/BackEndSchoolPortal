const sequelize = require('./databaseSetup.js');
const Book = require("../models/book.js");
const Author = require("../models/author.js");
const Genre = require("../models/genre.js");
const BookInstance = require("../models/bookinstance.js");

const { generatePrimaryIDArray, generateAssociateIDArray, generateRandomStatus } = require('./idArray.js');

const statusList = ['Available','Maintenance','Loaned','Reserved'];



const {buildGenre, buildAuthor, buildBook, buildBookInstance} = require('./modelBuild.js');
/*

const authorPrimaryIdRange = [1,8]; //8 
const genrePrimaryIdRange = [9,12]; //4

*/
const bookInstancePrimaryIdRange = [28,67]; //40
const bookPrimaryIdRange = [13,27]; //15
/*
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
*/
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

async function fxn(params) { 
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
         /*
    await Author.sync({alter:true})
    await Genre.sync({alter:true});
    await Book.sync({alter:true});
    await BookInstance.sync({alter:true});

    const authorBuiltArray = Author.build(authorArray);
    const authorSavedArray =  authorBuiltArray.map( (author)=>{
        return author.save();       
    });

    const genreBuiltArray = Genre.bulkBuild(genreArray);
    const genreSavedArray = genreBuiltArray.map((genreInstance)=>{
        return genreInstance.save();
   });

  const byk11l = BookInstance.build({id:16,title:"lu",imprint:"a2",bookId:16});
  const byk21l = await byk11l.save();
  const ssss = await byk21l.reload();

   const bookInstanceBuildArray = BookInstance.build(bookInstanceArray);
   const bookInstanceSaveArray = bookInstanceBuildArray.map((bookInstance)=>{
      return   bookInstance.save();
    });
  */
    const bookInstanceBuiltArray = BookInstance.build(bookInstanceArray);
    const arr = [];
    (async () => {
        for (const element of bookInstanceBuiltArray) {
            const obj = await element.save();
            arr.push(obj)
    
        }
    })()
    /*
     */

   // const bookSavedArray =  bookBuiltArray.map((book)=>{
   //     return book.save();
   // });
    /*
    const p =   bookSavedArray[bookSavedArray.length-1].then(console.log,console.error);
    const resolveBooks = Promise.allSettled(bookSavedArray);
    
    
   
   */
    }
    fxn();

/*
async function fxn() {
    
    
    const BookInstance1 = await BookInstance.create({
        imprint:'notsure',
        status:'Available',
        id: 3,
    });
    const cominghome = await Book.create({
        title: 'cominghome',
        summary: 'summarized',
        isbn:'isbn',
        id:2,
    });
   
    const numberDestroyed = await Genre.destroy({
        where:{
            firstName:'ogaboss',
        },
    });
    const comedy = await Genre.create({
        name:'ogaboss',
        id:4,
    });

    await Author.destroy();
    const writer = await Author.create({
        firstName: 'writer',
        lastName: 'Somebody',
        id:1,
    
    });
    
};
fxn();

async function fxn() {
    
    const bookList = [...Array(50)].map(() => ({
        name: faker.commerce
        
      }));
    const booksNumber =  Book.count();
    const instances = BookInstance.findAll();
    const genres =  Genre.findAll();
    const a = await  Author.destroy({
        where:{
            id:1,
        }
    });
    const writer = await Author.create({
        firstName: 'writer',
        lastName: 'Somebody',
        id:1,
    
    });
    const fName = writer.fullName;
    const url = writer.url;

};

*/
//fxn();    
