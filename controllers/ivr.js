const Twilio 	= require('twilio')
const moment = require('moment-timezone')
const logger 	= require('../util-logger.js')

const taskrouterHelper = require('./helpers/taskrouter-helper.js')
const voice = { voice: 'alice', language: 'en-us' }

module.exports.welcome = function (req, res) {
	const twiml =  new Twilio.twiml.VoiceResponse()

	let keywords = []

	/* add the team names as hints to the automatic speech recognition  */
	for (let i = 0; i < req.configuration.ivr.options.length; i++) {
		keywords.push(req.configuration.ivr.options[i].friendlyName)
	}

	logger.info('Receiving call, starting IVR. Phone Number: %s', req.query.From)

	const gather = twiml.gather({
		input: 'dtmf',
		action: 'select-team',
		method: 'GET',
		numDigits: 1,
		timeout: 4,
		language: 'en-US',
		hints: keywords.join()
	})

	// gather.say(voice, req.configuration.ivr.text)
	gather.play(req.protocol + '://' + req.hostname + '/audio/welcome.wav')

	// twiml.say(voice, 'If you\'d like to speak to a volunteer, press 1.')
	twiml.play(req.protocol + '://' + req.hostname + '/audio/welcome-reminder.wav')
	twiml.pause({length: 3})
	twiml.redirect({method: 'GET'}, 'welcome')

	res.send(twiml.toString())
}

var analyzeKeypadInput = function (digits, options) {

	for (let i = 0; i < options.length; i++) {
		if (parseInt(digits) === options[i].digit) {
			return options[i]
		}
	}

	return null
}

var analyzeSpeechInput = function (text, options) {

	for (let i = 0; i < options.length; i++) {
		if (text.toLowerCase().includes(options[i].friendlyName.toLowerCase())) {
			return options[i]
		}
	}

	return null
}

module.exports.selectTeam = function (req, res) {
	let team = null

	/* check if we got a dtmf input or a speech-to-text */
	if (req.query.SpeechResult) {
		console.log('SpeechResult: ' + req.query.SpeechResult)
		team = analyzeSpeechInput(req.query.SpeechResult, req.configuration.ivr.options)
	}

	if (req.query.Digits) {
		team = analyzeKeypadInput(req.query.Digits, req.configuration.ivr.options)
	}

	const twiml =  new Twilio.twiml.VoiceResponse()

	/* the caller pressed a key that does not match any team */
	if (team === null) {
		// redirect the call to the previous twiml
		twiml.say(voice, 'Your selection was not valid, please try again')
		twiml.pause({length: 2})
		twiml.redirect({ method: 'GET' }, 'welcome')
	} else {

		const gather = twiml.gather({
			action: 'create-task?teamId=' + team.id + '&teamFriendlyName=' + encodeURIComponent(team.friendlyName),
			method: 'GET',
			numDigits: 1,
			timeout: 5
		})

		const currentHour = moment().tz('America/Chicago').hour()
		if (currentHour > 15 || currentHour < 9) {
			// Outside of business hours
			// gather.say(voice, 'A volunteer will answer your call shortly. Or you can press any key to receive a callback when one is available.')
			gather.play(req.protocol + '://' + req.hostname + '/audio/pleasehold-off-clock.wav')
		} else {
			// During business hours
			// gather.say(voice, 'A volunteer will answer your call shortly. Or you can press any key to receive a callback when one is available.')
			gather.play(req.protocol + '://' + req.hostname + '/audio/pleasehold.wav')
		}

		/* create task attributes */
		const attributes = {
			text: 'Caller answered IVR with option "' + team.friendlyName + '"',
			channel: 'phone',
			phone: req.query.From,
			name: req.query.From,
			title: 'Inbound call',
			type: 'inbound_call',
			team: team.id
		}

		logger.info('Call entered queue, awaiting agent to pick up. Phone Number: %s', req.query.From)

		twiml.enqueueTask({
			workflowSid: req.configuration.twilio.workflowSid,
		}).task({priority: 1, timeout: 3600}, JSON.stringify(attributes));

	}

	res.send(twiml.toString())
}

module.exports.createTask = function (req, res) {
	/* create task attributes */
	const attributes = {
		text: 'Caller answered IVR with option "' + req.query.teamFriendlyName + '"',
		channel: 'phone',
		phone: req.query.From,
		name: req.query.From,
		title: 'Callback request',
		type: 'callback_request',
		team: req.query.teamId
	}

	const twiml =  new Twilio.twiml.VoiceResponse()

	taskrouterHelper.createTask(req.configuration.twilio.workflowSid, attributes)
		.then(task => {
			logger.info('Caller requested a callback')
			// twiml.say(voice, 'Thanks for your callback request, an volunteer will call you back soon.')
			twiml.play(req.protocol + '://' + req.hostname + '/audio/callback-confirm.wav')
			twiml.hangup()
		}).catch(error => {
			logger.error('Something happened trying to schedule a callback.', error)
			twiml.say(voice, 'Sorry, we encountered a problem. Please call us again.')
		}).then(() => {
			res.send(twiml.toString())
		})

}
