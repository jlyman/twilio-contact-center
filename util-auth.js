var passport = require('passport')
var bcrypt = require('bcrypt')
var LocalStrategy = require('passport-local').Strategy

var users = [
	{
		id: 1,
		username: process.env.CALL_CENTER_ADMIN_USERNAME,
		passwordHash: process.env.CALL_CENTER_ADMIN_PASSWORD,
		isAdmin: true,
	},
	{
		id: 2,
		username: 'agent',
		passwordHash: process.env.CALL_CENTER_AGENT_PASSWORD,
		isAdmin: false,
	}
]

passport.serializeUser(function (user, done) {
	done(null, user.id)
})

passport.deserializeUser(function (id, done) {
	findUserById(id, function (err, user) {
		done(err, user)
	})
})

passport.use(new LocalStrategy((username, password, done) => {
	findUser(username, (err, user) => {
		if (err) {
			return done(err)
		}

		if (!user) {
			return done(null, false)
		}

		bcrypt.compare(password, user.passwordHash, (err, isValid) => {
			if (err) {
				return done(err)
			}

			if (!isValid) {
				return done(null, false)
			}

			return done(null, user)
		})
	})
}))

function findUser (username, callback) {
	var matchingUser = users.find(user => user.username === username)

	if (!matchingUser) {
		callback('No matching user found', null)
	}

	return callback(null, matchingUser)
}

function findUserById (userId, callback) {
	var matchingUser = users.find(user => user.id === userId)

	if (!matchingUser) {
		callback('No matching user found for ID ' + userId, null)
	}

	callback(null, matchingUser)
}

module.exports.authenticationMiddleware = function (requiresAdmin = false) {
	return function (req, res, next) {
		if (req.isAuthenticated()) {
			if (requiresAdmin && !req.user.isAdmin) {
				res.redirect('/authenticate')
			} else {
				return next()
			}
		}
		res.redirect('/authenticate')
	}
}