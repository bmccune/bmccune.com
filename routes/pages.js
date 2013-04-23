
/*
 * GET home page.
 */

exports.portfolio = function(req, res){
  res.render('portfolio', { title: 'Brian McCune - Select Examples of my work' });
};
exports.bio = function(req, res){
  res.render('bio', { title: 'Brian McCune - All about me' });
};
exports.contact = function(req, res){
  res.render('contact', { title: 'Brian McCune - Contact Me' });
};