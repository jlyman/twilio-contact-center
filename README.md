# Friendswood Area Disaster Help Call Center

This is an adaptation of the Twilio Contact Center Demo, set up as an temporary emergency response for Hurricane Harvey
relief efforts for the city of Friendswood, TX. Please see the [original Twilio README here](https://github.com/nash-md/twilio-contact-center/blob/master/README.md).

This version of the call center application includes FADH-specific changes (IVR wording, copy, recorded messages, etc.),
as well as a few specific enhancements to make it usable for the volunteers. These changes included:

* Adding basic authentication to keep the application secure
* Improving the agent login flow so volunteers could pick from available agents instead of typing them
* Playing a short ringtone when a call arrives to notify agents
* Including a different after-hours message
* and other small tweaks.

## Additional Setup ##

In addition to the setup process detailed in the original Twilio documentation (included below), there are a few other
environment variables and changes that you would want to make if using this codebase.

**Additional Environment Variables:**

* `CALL_CENTER_SESSION_KEY`: a key used as the session secret
* `CALL_CENTER_ADMIN_PASSWORD`: a bcrypt-compatible hash of the superadmin's pasword
* `CALL_CENTER_AGENT_PASSWORD`: a bcrypt-compatible hash of the agent's pasword
* Also don't forget to define your `NODE_LOG_LEVEL` for appropriate logging

**Change voice prompts:**

Recorded for the Friendswood application, the WAV files in the /public/audio folder should be re-recorded to be specific
to your particular setup. Modify `ivr.js` to further change your call flow.

**Agent Chat and Quick Links:**

We set up a quick and dirty chat using [tlk.io](http://tlk.io), and you can set up a channel for your use there and add
it in to `workplace.html` in the `data-channel` attribute to be specific to your application.

Also to the bottom of the Agent Workplace screen we added several forms and resource links that were useful in our
situation. You may have links that would likewise be useful to your agents/volunteers, so modify those (workplace.html).

## Persisting Setup ##

Once you have everything set up, don't forget to save the configuration that gets written out by visiting `/setup`. If using Postgres it will be persisted to the DB. If using flatfile (by default), changes will get written to `configuration.json`. You'll want to grab the written out copy of that file and persist it into your private repo. If using Docker, you will likely want to build and tag your own copy of the image with the updated configuration.json. The Contact Center doesn't play very nice if you try to run setup again with an account that already has everything set up, and it's much easier to just make sure you save the config details.

## Docker Notes ##

This can be run as a Docker image. `docker pull jlyman/fadh-contact-center`

When developing, the including `docker-compose.yml` file can be set up to automatically allow for active development via hot reloading of files, separating out local (host) node_modules from the image's node_modules, etc. By configuration, using Docker Compose defaults to development mode and will look for a `.env.development` file which you can make by copying the `env.example` file.

For production use, follow the guidelines below to determine what environment variables need to be appropriately passed in. Assign them to your prod environment and pass them in via the `docker run` command, or make a copy of the `env.example` file and pass that in as `docker run --env-file=env.production [other commands]`.

---

# Twilio Contact Center Demo
Essence of a modern contact center is to serve customers on multiple channels (voice, web chat, video, email, social media, etc.), allow them to move seamlessly across channels and most importantly maintain context of the conversations.

The Twilio Contact Center demo is reference architecture for building a modern contact center. The focus of the demo is to show how to build a Twilio platform based contact center and the various backend and frontend components needed.

**Note:** We have done the basic work from an UX perspective and lot of opportunities remains to improve on it. Application security implementation is minimal as well in the demo.

This application is provided as-is. Twilio does not officially support it.

# Features
* Twilio Account
* Twilio Phone Numbers
* Twilio Programmable Voice (PSTN, Twilio WebRTC Client)
* Twilio Programmable Chat
* Twilio Programmable SMS
* Twilio Programmable Video
* Twilio TaskRouter
* Twilio REST APIs

# Customer Journey Flows:

## Callback Voice Calling (PSTN):
Customer fills out online call request -> Form submitted to server -> Task on TaskRouter created -> Find available and matching agent -> Agent accepts reservation and dials customer out (PSTN) -> Connect customer to agent (WebRTC)

![Customer Journey Call Back over PSTN](contact_center_flow_call_back.png)

## Inbound Voice Calling (PSTN):
Customer calls Twilio phone number -> Twilio requests webhook -> Server generates TwiML for IVR -> Caller selects IVR option -> Task on TaskRouter created -> Find available and matching agent -> Agent accepts reservation -> Connect customer to agent (WebRTC)

![Customer Journey Inbound Call](contact_center_flow_inbound.png)

## Web Chat:
Customer fills out online web chat request form -> Form submitted to server -> Task on TaskRouter created -> Find available and matching agent -> Agent accepts reservation -> Start chat between customer and agent

![Customer Journey Chat](contact_center_flow_chat.png)

## Video Call:
Customer fills out video call request form -> Form submitted to server -> Task on TaskRouter and video room created -> Find available and matching agent -> Agent accepts reservation -> Agent joins video room

![Customer Journey Video](contact_center_flow_video.png)

## Real-time TaskRouter Events Dashboard:
Real-time display of operational contact center metrics (for example: average call handle time, agent productivity, call metrics, TaskRouter stats, and more etc.).  Please check out the following repo: https://github.com/ameerbadri/twilio-taskrouter-realtime-dashboard 

## Pre-requisites:
* Basic of Twilio platform - [Twilio \<Skills\>](https://twilio.radicalskills.com/), an elearning platform that provides a guided path for getting started with Twilio.
* [Twilio TaskRouter](https://www.twilio.com/docs/quickstart/ruby/taskrouter)
* [Twilio Client](https://www.twilio.com/docs/quickstart/ruby/client)
* [Twilio Programmable Chat](https://www.twilio.com/docs/api/chat)
* [Twilio Programmable Video](https://www.twilio.com/docs/api/video/getting-started)
* Working knowledge of Angular.js, Bootstrap and Node.js

# Installation

Before you start the install, you’ll need the following variables from the Twilio Account Portal. If you haven't used Twilio before, welcome! You'll need to [Sign up for a Twilio account](https://www.twilio.com/try-twilio).

We recommend you create a separate sub-account within Twilio and install this app using that sub-accoount credentials.

**Note:** It is recommended that you have an upgraded Twilio account to fully experience this demo.

* For Account SID and Auth Token please click here:  https://www.twilio.com/console
* Buy a phone number or use an existing one (the application will configure the number for you later)
* Create a new Twilio [TaskRouter Workspace](https://www.twilio.com/user/account/taskrouter/workspaces)
* For creating a new Chat Services or re-using an existing one, click here: https://www.twilio.com/console/chat/services
* For creating a new Video Configuration Profile or re-using an existing one, click here: https://www.twilio.com/console/video/profiles
* For Twilio API Key SID and Twilio API Key Secret, click here: https://www.twilio.com/console/dev-tools/api-keys

## One Click Install - Heroku

This will install the application and all the dependencies on Heroku (login required) for you. As part of the installation, the Heroku app will walk you through configuration of environment variables.  Please click on the following button to deploy the application.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/nash-md/twilio-contact-center)

After the installation has completed please open `https://<your_application_name>.herokuapp.com/setup` and configure the application. The demo overview will be accessible at `https://<your_application_name>.herokuapp.com`. 

## Manual Install - On Your Own Server

Fork and clone the repository. Then, install dependencies with

`npm install`

In order to run the demo you will need to set the following environment variables:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WORKSPACE_SID`

For web chat you need to set Twilio Programmable Chat environment variables:

- `TWILIO_CHAT_SERVICE_SID`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`

For video calls you need to set Twilio API Keys:

- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`

Start the application

`node app.js`

Before you can use the demo please open `http://<your_application_name>/setup` and configure the application. The demo overview will be accessible at `http://<your_application_name>`. Please note, if process.env.PORT is not set the applications runs on port 5000.

If you are running the demo locally please remember that Twilio needs a publically-accessible address for webhooks, and the setup process registers these with Twilio. As such, you'll need to run something like ngrok instead of just hitting http://localhost:5000/. As you get new addresses from ngrok you'll need to also rerun the setup process to register the updated address with Twilio. Otherwise you get errors running setup such as "Invalid URL"

**Note:** On Google Chrome a secure HTTPS connection is required to do phone calls via WebRTC. Use a tunnel that supports HTTPS such as ngrok, which can forward the traffic to your webserver.

# Contributions

Contributions are welcome and generally accepted. For not trivial amendments it is a good idea to submit an issue explaining the proposed changes before a PR. This allows the maintainers to give guidance and avoid you doing duplicated work.

Your changes must adhere a common project code style.

```
# please run this before "git commit"
npm run lint
# try automatic fix
./node_modules/.bin/eslint controllers --fix
./node_modules/.bin/eslint public --fix
```

To make life easier for other contributors and reviewer please rebase your commit in the same PR

```
git rebase -i HEAD^^^^^^
# then squash or fixup your shards
# and force push into your fork
git push origin [YOUR BRANCH] -f
```


# License

MIT

