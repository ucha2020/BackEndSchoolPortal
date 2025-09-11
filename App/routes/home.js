const express = require('express');
const route = express.Router();

route.get('/',async (req,res) => {
    try {
        res.render('homeLayout')
    } catch (error) {
        
    }
})
module.exports = route;
