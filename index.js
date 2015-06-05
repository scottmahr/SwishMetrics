
var http = require ('http');	     // For serving a basic web page.
var querystring = require('querystring');
var _ = require('underscore');
var mongoose = require ("mongoose"); // The reason for this demo.
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var fs = require('fs');


app.use(cors());
app.use( bodyParser.json({limit: '50mb'}) );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  limit: '50mb',
  extended: true
}));





// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.  
var uristring = 
  process.env.MONGOLAB_URI || 
  process.env.MONGOHQ_URL || 
  'mongodb://localhost/test';



// The http server will listen to an appropriate port, or default to
// port 5000.
var theport = process.env.PORT || 5000;

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
  if (err) { 
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
  }
});

// This is the schema.  Note the types, validation and trim
// statements.  They enforce useful constraints on the data.

var shotSchema = new mongoose.Schema({
    cDate: { type: Date, default: Date.now },   //date item was createde
    shots: { type: mongoose.Schema.Types.Mixed, default: [] },    //all the shot info here
}, { versionKey: false });





// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'PowerUsers' collection in the MongoDB database
var Shots = mongoose.model('Shots', shotSchema);

// In case the browser connects before the database is connected, the
// user will see this message.
var found = ['DB Connection not yet established.  Try again later.  Check the console output for error messages if this persists.'];

var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)

app.get('/', function(req, res){
  res.redirect('/index.html');
  //res.send('our home');
});


app.use(express.static(__dirname + '/public'));



router.get('/', function(req, res) {
    res.json({ success: 'hooray! welcome to our api, this is new!' });   
});

// ----------------------------------------------------



// on routes that end in /reviews
// ----------------------------------------------------
router.route('/shots')
    .post(function(req, res) {
        new Shots(req.body).save(function(err,shot) {
            if(err){
                res.json({ error: err });;
            }else{
                res.json(shot);
            }
        });

        
    })

    
    .get(function(req, res) {
        var query = Shots.findOne().sort('-cDate').exec(
            function(err, shot) {
            if (err){
                res.json({ error: err });;
            }else{
                res.json([shot]);
            }
        });
    });

router.route('/shots/:shot_id')

    // get the review with that id
    .get(function(req, res) {
        Shots.findById(req.params.shot_id, function(err, shot) {
            if (err){
                res.json({ error: err });
            }else{
                res.json(shot);
            }
        });
    })

    // update the shot with this id
    .put(function(req, res) {
        Shots.findById(req.params.shot_id, function(err, shot) {
            if (err){
                res.json({ error: err });
            }
            _.extend(shot,req.body).save(function(err,shot) {
                if (err){
                    res.json({ error: err });
                }else{
                    res.json(shot);
                }
            });

        });
    })


// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

app.listen(theport);



// Tell the console we're getting ready.
// The listener in http.createServer should still be active after these messages are emitted.
console.log('http server will be listening on port %d', theport);
console.log('CTRL+C to exit');

