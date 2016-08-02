var config = require('../config.json');
var token = config.slack.token;

module.exports = {
	slackBotOptions: {
		clientId: config.slack['client-id'],
		clientSecret: config.slack['client-secret'],
		redirectUri: config.slack['redirect-uri'],
		scopes: ['bot', 'channels:write', 'channels:read', 'chat:write:bot', 'chat:write:user', 'im:write'],
		storage: ''
	}
}
