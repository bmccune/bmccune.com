
/**
 * Module dependencies.
 */

var express = require('express')
  , dust = require('./node_modules/express-dust/lib/dust')
  , cons = require('consolidate')
  , routes = require('./routes')
  , page = require('./routes/pages')
  , http = require('http')
  , path = require('path');
var app = express();

dust.makeBase({
	copy: '&copy; 2013 Nobody'
});

app.engine('dust', cons.dust);

app.configure(function(){
  app.set('port', process.env.PORT || 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'dust');
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Index Page
app.get('/', routes.index);

// Pages
app.get('/portfolio', page.portfolio);
app.get('/brian-mccune', page.bio);
app.get('/contact', page.contact);



http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
