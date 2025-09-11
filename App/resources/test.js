const crt = require('./modelBuild');

const bookList = [...Array(50)].map(() => crt.createBook() );
const authorList = [...Array(38)].map(() => crt.createAuthor() );
const genreList =  crt.createGenre();
const instanceList = [...Array(500)].map(() => crt.createBookInstance() )

console.log(bookList);
alert('ok');