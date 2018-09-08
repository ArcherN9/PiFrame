// call the packages we need
var express    				= require('express');        // call express
var app        				= express();                 // define our app using express
var request 				= require('request');
var nodeSchedule			= require('node-schedule');
var bodyParser 				= require('body-parser');
var path 					= require('path');
var net 					= require('net');
var passport 				= require('passport');
var OIDCStrategy 			= require('passport-azure-ad').OIDCStrategy;
var session 				= require('express-session');
var uuid 					= require('uuid');
var MicrosoftGraph 			= require("@microsoft/microsoft-graph-client");
// Include other JS files to implement abstraction
var configs					= require('./conf');
var privateconfig			= require('./appconf');

// Start up configurations
// 
// authentication setup
const callback = (iss, sub, profile, accessToken, refreshToken, done) => {
	done(null, {
		profile,
		accessToken,
		refreshToken
	});
};
// Configure passport library
passport.use(new OIDCStrategy(configs, callback));
const users 		= {};
passport.serializeUser((user, done) => {
	const id 			= uuid.v4();
	users[id] 		= user;
	done(null, id);
});
passport.deserializeUser((id, done) => {
	const user 		= users[id];
	done(null, user);
});
// 
// configure app to use bodyParser()
// this will let us get the data from a POST
var urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedParser);
app.use(bodyParser.json());
// view engine setup
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
// Attach directory with views and stylesheets
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
// see https://github.com/expressjs/session
app.use(session({
	secret: '12345QWERTY-SECRET',
	name: 'graphNodeCookie',
	resave: false,
	saveUninitialized: false,
  //cookie: {secure: true} // For development only
}));

// MS graph client
var client 	= null;
var port 	= process.env.PORT || 8080;        // set our port

// =============================================================================

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {

	// Redirect user to /api/login to display the login page
	res.statusCode = 302; 
	res.setHeader("Location", "/api/login");
	res.end();

	//Console output
	console.log(new Date() + " : " + "PiFrame API is working normally.");

	// const client = net.createConnection({ port: 4444 }, () => {
	// 	//'connect' listener
	// 	console.log('connected to server!');
	// 	client.write('world!\r\n');
	// });
	// client.on('data', (data) => {
	// 	console.log(data.toString());
	// 	client.end();
	// });
	// client.on('end', () => {
	// 	console.log('disconnected from server');
	// });
});

// =============================================================================
// 
// The login API. User is redirect here automatically if anyone arrives on '/'.
// This page is responsible for rendering the login page
router.get('/login', function(req, res){

	// Render the login HBS page
	res.render('login');
});

// =============================================================================
// 
// The auto callback end point which is called from MS. This is executed on a successfull login 
// attempt.
router.get('/token',
	passport.authenticate('azuread-openidconnect', { failureRedirect: '/api' }),
	(req, response) => {
		// Login successful. Setup MS graph 
		client = MicrosoftGraph.Client.init({
			authProvider: (done) => {
        		done(null, req.user.accessToken); //first parameter takes an error if you can't get an access token
        	}
        });

		// 
		res.json({
			'message': "Login successful. You may close this window."
		});
	});

// ============================================================================= //
// The execute login API end point initiates the login process with passportJS
// It is called when the user presses the 'login with Microsoft' button 
// 
router.get('/executeLogin',
	passport.authenticate('azuread-openidconnect', { failureRedirect: '/api' }),
	(req, res) => {
		res.redirect('/api');
	});

// ============================================================================= //

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port, '0.0.0.0', function() {
    // Show confirmation message on terminal that the API has been started
    console.log(new Date() + ":" + 'PiFrame API is running on port : ' + port);
});