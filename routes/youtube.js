
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('youtube', { title: 'Brian McCune - Web Developer, Designer, Front-End Expert, and Web Marketer' });
};