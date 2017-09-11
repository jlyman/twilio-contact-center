'use-strict'

var express       = require('express')
var bodyParser    = require('body-parser')
var sessions      = require('express-session')
var FileStore     = require('session-file-store')(sessions)
var passport			= require('passport')
var compression   = require('compression')
var morgan 				= require('morgan')
var authUtil			= require('./util-auth.js')
var logger 				= require('./util-logger.js')

/* check if the application runs on heroku */
var util

if (process.env.DYNO) {
	util = require('./util-pg.js')
} else {
	util = require('./util-file.js')
}

var app = express()

app.set('port', (process.env.PORT || 5000))

app.use(compression())
app.use(sessions({
	store: new FileStore({ ttl: 25200000 }),
	resave: true,
	saveUninitialized: true,
	secret: process.env.CALL_CENTER_SESSION_KEY,
	name: 'fdr_call_center_session',
	cookie: { maxAge: 25200000 }
}))

app.use(bodyParser.json({}))
app.use(bodyParser.urlencoded({
	extended: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(morgan('short', {
	skip: function (req, res) {
		return res.statusCode < 400
	}, stream: process.stderr
}))
// app.use(morgan('short', {
// 	skip: function (req, res) {
// 		return res.statusCode >= 400
// 	}, stream: process.stdout
// }))

app.use(function (req, res, next) {

	var replaceErrors = function (key, value) {
		if (value instanceof Error) {
			var error = {}

			Object.getOwnPropertyNames(value).forEach(function (key) {
				error[key] = value[key]
			})

			logger.error('Encountered an error. Details:', error)

			return error
		}

		return value
	}

	res.convertErrorToJSON = (error) => {
		console.log(error)

		return JSON.stringify(error, replaceErrors)
	}

	next()
})

app.use(function (req, res, next) {

	util.getConfiguration(function (err, configuration) {
		if (err) {
			res.status(500).json({stack: err.stack, message: err.message})
		} else {
			req.configuration = configuration
			req.util = util
			next()
		}
	})

})

app.use('/', function (req, res, next) {
	if (req.path.substr(0,4) === '/api') {
		res.set({
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=0',
		})
	}

	/* override content type for twiml routes */
	if (req.path.includes('/api/ivr') || req.path.includes('/agents/call')) {
		res.set({
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=0',
		})
	}

	next()
})

var router = express.Router()

var setup = require('./controllers/setup.js')

router.use('/setup', authUtil.authenticationMiddleware(true))
router.route('/setup').get(setup.get)
router.route('/setup').post(setup.update)

var setupPhoneNumber = require('./controllers/setup-phone-number.js')

router.route('/setup/phone-number/validate').post(setupPhoneNumber.validate)
router.route('/setup/phone-number').post(setupPhoneNumber.update)

var validate = require('./controllers/validate.js')

// router.use('/validate/setup', authUtil.authenticationMiddleware)
router.route('/validate/setup').post(validate.validateSetup)

var tasks = require('./controllers/tasks.js')

router.route('/tasks/callback').post(tasks.createCallback)
router.route('/tasks/chat').post(tasks.createChat)
router.route('/tasks/video').post(tasks.createVideo)

/* routes for agent interface and phone */
var agents = require('./controllers/agents.js')

router.route('/agents/call').get(agents.call)
router.use('/agents', authUtil.authenticationMiddleware())
router.route('/agents/list').get(agents.listWorkers)
router.route('/agents/login').post(agents.login)
router.route('/agents/logout').post(agents.logout)
router.route('/agents/session').get(agents.getSession)

/* routes for IVR */
var ivr = require('./controllers/ivr.js')

// router.use('/ivr', authUtil.authenticationMiddleware)
router.route('/ivr/welcome').get(ivr.welcome)
router.route('/ivr/select-team').get(ivr.selectTeam)
router.route('/ivr/create-task').get(ivr.createTask)

/* routes called by the Twilio TaskRouter */
var taskrouter = require('./controllers/taskrouter.js')

// router.use('/taskrouter', authUtil.authenticationMiddleware)
router.route('/taskrouter/workspace').get(taskrouter.getWorkspace)
router.route('/taskrouter/activities').get(taskrouter.getActivities)

var workers = require('./controllers/workers.js')

// router.use('/workers', authUtil.authenticationMiddleware)
router.route('/workers').get(workers.list)
router.route('/workers').post(workers.create)
router.route('/workers/:id').delete(workers.delete)

/* routes for messaging adapter */
var messagingAdapter = require('./controllers/messaging-adapter.js')

// router.use('/messaging-adapter', authUtil.authenticationMiddleware)
router.route('/messaging-adapter/inbound').post(messagingAdapter.inbound)
router.route('/messaging-adapter/outbound').post(messagingAdapter.outbound)

app.use('/api', router)
app.get('/authenticate', express.static(__dirname + '/public/authenticate'))
app.post('/authenticate', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/authenticate'
}))
app.use('/setup', authUtil.authenticationMiddleware(true))
app.use('/administration', authUtil.authenticationMiddleware(true))
app.use('/callcenter', authUtil.authenticationMiddleware())
app.use('/', express.static(__dirname + '/public'))

app.listen(app.get('port'), function () {
	console.log('magic happens on port', app.get('port'))
})
