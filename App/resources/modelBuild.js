const {faker} = require('@faker-js/faker');

  exports.buildBook = ({genreId,authorId,primaryId})=>(
     {
        id: primaryId,
        title: faker.music.songName(),
        summary: faker.lorem.words(2),
        isbn: faker.commerce.isbn(),
        genreId ,
        authorId ,
    }
  );

  exports.buildGenre = (value,id)=>{
      return{
        id: id,
        name:value,
      }
  };

  exports.buildBookInstance = (primaryId,bookId,status)=>({
    id: primaryId,
    imprint:`${faker.lorem.word(2)}${faker.number.int({min:1000, max: 9999})}`,
    bookId,
    status,
  });
  
  exports.buildAuthor = (id)=>({
    id:id,
    firstName:faker.person.firstName(),
    lastName: faker.person.lastName(),
    dateOfBirth: `${faker.date.birthdate()}`.substring(4,15),

  });

  
  

