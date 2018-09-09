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
var rxjs          			= require('rxjs');
// Include other JS files to implement abstraction
var configs					= require('./conf');
var privateconfig			= require('./appconf');
var Queue					= require('./queue');
var Node          			= require('./Node');

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
var MSClient 	= null;
var folderQueue = null;
var fileQueue 	= null;
// A hot keyword - Folder to detect if any of the elements received in the array is a folder or not
const FOLDER  = 'folder';
const FILE    = 'file';
const PICTURE = 'picture';

// declare subscriptions
this.fileSubscription 	= null;
this.folderSubscription = null;

var port 		= process.env.PORT || 8080;        // set our port

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
// An image subscriber that retrieves image nodes from the observable
var fileSubscriber = new rxjs.Subscriber(value =>  {
	this.nextImageNode = value;
	console.log('Next Image in series received with ID : ' + this.nextImageNode.data['id']);

    // Extract the image resource URL and display on the frame
    if (this.nextImageNode.data && this.nextImageNode.data['images']
    	&& this.nextImageNode.data['images'].length > 0
    	&& this.nextImageNode.data['images'][0].source) {
    	this.onedriveImageSource = this.nextImageNode.data['images'][0].source;
}
},
e => console.error(e),
() => console.log('complete called'));

// A folder subscriber that retrieves foler nodes from the observable
var folderSubscriber = new rxjs.Subscriber(
	value =>  {
		nextFolderNode = value;
		console.log('Next Folder in series received with ID : ' + nextFolderNode.data['id']);

        // Retrieve the files in the folder popped
        MSClient
        .api('me/drive/items/' + nextFolderNode.data.id + '/children')
        .get()
        .then((res)=> {
				// Pass on the received data to the queue creation method
				createQueues(res.value);
				folderSubscriber.next(folderQueue.pop());
			}).catch((err) => {
				console.log(err);
			});
		},
		e => console.error(e),
		() => console.log('complete called'));

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
	(req, res) => {
		// Login successful. Setup MS graph 
		MSClient = MicrosoftGraph.Client.init({
			authProvider: (done) => {
        		done(null, req.user.accessToken); //first parameter takes an error if you can't get an access token
        	}
        });

		// Let the user know the browser may be shut down
		res.json({
			'message': "Login successful. You may close this window."
		});

		// Transfer call to another function to handle file fetching
		getOneDrive();
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
// 
// The function that recursively iterates the one drive root folder and fetches all 
// the files in it

function getOneDrive() {
	// Instantiate the queue
	folderQueue = new Queue();
	fileQueue  	= new Queue();

	// Setup an observer for the queue
	this.fileSubscription 	= fileQueue.observable.subscribe(fileSubscriber);
	this.folderSubscription = folderQueue.observable.subscribe(folderSubscriber);

	// First get the root folder of onedrive
	MSClient
	.api('/me/drive/root/children')
	.get()
	.then((res)=> {
		createQueues(res.value);
	}).catch((err) => {
		console.log(err);
	});
}

function createQueues(elements) {
	for (const element of elements) {
		if (element[FOLDER]) {
			folderQueue.add(element);
		} else if (element[FILE] && element[PICTURE]) {
			fileQueue.add(element);
		} else {
			// Leave out any other file that is not a picture or a folder
		}
	}
}
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