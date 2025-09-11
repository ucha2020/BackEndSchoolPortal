const express = require("express");
const router = express.Router();

const bookController = require("../controllers/bookController.js");
const authorController = require("../controllers/authorController.js");
const genreController = require("../controllers/genreController.js");
const bookinstanceController = require("../controllers/bookinstanceController.js");

router.get("/",bookController.index);
router.get("/books",bookController.bookList);
router.get("/books/:id",bookController.bookDetail);
router.get("/book/create",bookController.bookCreateGet);
router.post("/book/create",bookController.bookCreatePost);
router.get("/book/:id/update",bookController.bookUpdateGet);
router.post("/book/:id/update",bookController.bookUpdatePost);
router.get("/book/:id/delete",bookController.bookDeleteGet);
router.post("/book/:id/delete",bookController.bookDeletepost);

router.get("/genre/create",genreController.genreCreateGet);
router.post("/genre/create",genreController.genreCreatePost);
router.get("/genre/:id/update",genreController.genreUpdateGet);
router.post("/genre/:id/update",genreController.genreUpdatePost);
router.get("/genre/:id/delete",genreController.genreDeleteGet);
router.post("/genre/:id/delete",genreController.genreDeletepost);
router.get("/genre/:id",genreController.genreDetail);
router.post("/genres",genreController.genreList);
router.get("/genres",genreController.genreList);

router.get("/bookinstance/create",bookinstanceController.bookinstanceCreateGet);
router.post("/bookinstance/create",bookinstanceController.bookinstanceCreatePost);
router.get("/bookinstance/:id/update",bookinstanceController.bookinstanceUpdateGet);
router.post("/bookinstance/:id/update",bookinstanceController.bookinstanceUpdatePost);
router.get("/bookinstance/:id/delete",bookinstanceController.bookinstanceDeleteGet);
router.post("/bookinstance/:id/delete",bookinstanceController.bookinstanceDeletepost);
router.get("/bookinstance/:id",bookinstanceController.bookinstanceDetail);
router.post("/bookinstances",bookinstanceController.bookinstanceList);
router.get("/bookinstances",bookinstanceController.bookinstanceList);

router.get("/author/create",authorController.authorCreateGet);
router.post("/author/create",authorController.authorCreatePost);
router.get("/author/:id/update",authorController.authorUpdateGet);
router.post("/author/:id/update",authorController.authorUpdatePost);
router.get("/author/:id/delete",authorController.authorDeleteGet);
router.post("/author/:id/delete",authorController.authorDeletepost);
router.get("/author/:id",authorController.authorDetail);
router.post("/authors",authorController.authorList);
router.get("/authors",authorController.authorList);


module.exports = router;