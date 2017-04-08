var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var image = require('google-images');
var getJSON = require('get-json');
var mongo = require('mongodb').MongoClient;

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var url = "https://www.googleapis.com/customsearch/v1?key=AIzaSyCxJUGIb_tevRKD-Kxxi57OM1f6dbRLwf4&cx=010407088344546736418:onjj7gscy2g&searchType=image"
var client = new image('010407088344546736418:onjj7gscy2g', 'AIzaSyCxJUGIb_tevRKD-Kxxi57OM1f6dbRLwf4')
var dbURL = "mongodb://vivekpadia:webbergen@ds145370.mlab.com:45370/sites"
var queue = {};


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.get('/api/imagesearch/:query', function(req, res){
  var query = req.originalUrl
  var sub = query.split('/')[3]
  var values = sub.split('?')
  var d = Date();
  mongo.connect(dbURL, function(err, db){
    var simage = db.collection('simage');
    simage.insert({term : values[0], when : d})
    db.close();
  })
  url = url + '&q=' + values[0] + '&num=' + Number(values[1]);
  getJSON(url, function(err, data){
    var arr = [];
    for(var i=0; i<Number(values[1]); i++){
      arr[i]=
      {
        'url' : data.items[i].link,
        'thumbnail' : data.items[i].image.thumbnailLink,
        'context' : data.items[i].image.contextLink,
        'snippet' : data.items[i].snippet
      }
    }
    res.send(JSON.stringify(arr));
  })
})
// get the data searched from database

app.get('/api/all/imagesearch', function(req, res){
  mongo.connect(dbURL, function(err, db){
    var simage = db.collection('simage');
    simage.find({}).toArray(function(err, data){
      res.send(data)
    })
  })
})

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.listen(app.get('port'), function(){
  console.log('Listening on port ' + app.get('port'))
})

module.exports = app;
