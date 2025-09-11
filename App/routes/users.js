const express = require('express');
const router = express.Router();
const u = 34;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
  const u = 34;
});

router.get('/cool',function(req,res,next){
  res.send("You're so cool");
  const u = 34;
})

module.exports = router;
