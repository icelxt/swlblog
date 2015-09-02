var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '<h1>Express</h1>',
  						users:[  {username:'1'},
  								{username:'2'},
  								{username:'3'}] });
});

module.exports = router;
