var server = require('./server.js');
var Promise = require('bluebird');
var Botkit = require('botkit');
var slackbot = Botkit.slackbot({
	interactive_replies: true,
});
var config = require('./config.json');
var options = require('./utils/options');
var token = config.slack.token;
var messages = require('./messages.js');
var helperFunctions = require('./utils/helperFunctions.js');

// Store for our slack users and channel info
var slackUsers = {}
var channelStore = {};

// Track slackbots
var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

// Tracker for Tic-Tac-Toe board
var clicks = 0;

// Configure your slackbot
slackbot.configureSlackApp(options.slackBotOptions);
slackbot.config.port = server.get('port');

// Slackbot has it own setupServer option
// However I choose to pass in my own Express server options
// Scalability and Ease of Maintainability - 
// In case there was a need to add other endpoints to this application
slackbot
.createHomepageEndpoint(server)
.createWebhookEndpoints(server)
.createOauthEndpoints(server, (err,req,res) => { 
	if (err) return res.status(500).send('Error:' + err);
	res.send('Success!');
 });

slackbot.on('create_bot', (bot, config) => {

	// Request all slack users and store them locally
	bot.api.users.list({token: bot.config.token}, (err, data) => {
		slackUsers = helperFunctions.parseUserListReturn(data.members);
	});

  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM((err) => {
      if (!err) {
        trackBot(bot);
      }

      bot.startPrivateConversation({user: config.createdBy}, (err,convo) => {
        if (err) {
          console.log(err);
        } else {
          convo.say('Tic-Tac-Toe Bot is ONLINE!!!');
        }
      });
    });
  }

});

slackbot.on('rtm_open', (bot) => {
  console.log('** The RTM api just connected!');
});

slackbot.on('rtm_close', (bot) => {
  console.log('** The RTM api just closed');
  // you may want to attempt to re-open
  bot.startRTM((err) => {
    bot.startPrivateConversation({user: config.createdBy}, (err,convo) => {
      if (err) {
        console.log(err);
      } else {
        convo.say('Tic-Tac-Toe Bot is back ONLINE!!!');
      }
    });
  });
});

slackbot.on('interactive_message_callback', (bot, message) => {
	// Promisify Botkit api 
	Promise.promisifyAll(bot.api.chat);
	Promise.promisifyAll(bot.api.channels);

	var callback_id = message.callback_id;
	var channel = channelStore[message.channel];;
  
	if (callback_id === 'slash_challenge') {

		var response = message.actions[0].value.split(' ');
		var challenge_response_value = response[0];
		var challenger = response[1]
		var gameChannelId = response[2];
		var opponent = slackUsers[message.user];
		var challenge_response_message = messages.challenge_response({challenger: challenger});
		var gameChannel = channelStore[gameChannelId];

		if (challenge_response_value === 'Accept') {
			bot.replyInteractive(message, challenge_response_message["Accept"]);

			bot.api.chat.postMessageAsync({
				token: bot.config.token,
				channel: gameChannelId,
				text: `${opponent} accepted your challenge`,
			})
			.then((data) => {

				// Only send invite if user is not in the game channel
				if (!gameChannel.users[message.user]) {
					bot.api.channels.inviteAsync({
						token: token,
						channel: gameChannelId,
						user: message.user
					})
					.catch((err) => { console.log('Error inviting user:', err); });	
				} 
			})
			.then(() => {

				// Only trigger a game to start in the game channel
				// if there isn't already another game being played
				if (!gameChannel.gameOn) {
					helperFunctions.triggerSlashCommand({
						command: '/start_game',
						team_id: message.team.id,
						user_id: message.user,
						channel_id: gameChannelId,
						text: `${challenger} ${opponent}`
					})
				}
			})
			.catch((err) => { console.log('Error posting challenge response', err); });

		} else {
			bot.replyInteractive(message, challenge_response_message["Decline"]);
			bot.api.chat.postMessageAsync({
				token: bot.config.token,
				channel: gameChannelId,
				text: `${opponent} declined your challenge`,
			})
			.catch((err) => { console.log('Error posting challenge response', err); });
		}

	} else if (['row_1', 'row_2', 'row_3'].indexOf(callback_id) > -1 && channel.gameOn) {

		var board = channel.board;
		var row = board.rows[callback_id];
		var currentUserId = board.current_move_user_id;
		var currentUserName = board.current_move_user_name;
		var currentPlayers = channel.playing;
		var opponent = {name: '', id: ''};

		// Check to see that only the current user  
		// whose turn it is can make a move
		if (currentUserId === message.user) {

			var action = message.actions[0].name;
			var buttons = row.attachments[0].actions;
			var symbol = '';

			for (var player in currentPlayers) {
				if (currentPlayers[player].name === currentUserName) {
					symbol = currentPlayers[player].symbol;
				} else {
					opponent.name = currentPlayers[player].name;
					opponent.id = currentPlayers[player].id;
				}
			}

			buttons.forEach((button) => {

			// Check the value of the button and that it has not already been clicked
				if (button.name === action  && button.value !== 'clicked') {

					// Update the text of the button to the symbol the current player
					button.text = symbol;
					button.style = 'danger';
					button.value = 'clicked'
					bot.replyInteractive(message, board.rows[callback_id]);

					// Set current move to opponent name/id
					board.current_move_user_name = opponent.name;
					board.current_move_user_id = opponent.id;

					// parse action name
					var rowIndex = action[1];
					var columnIndex = action[3];

					// add symbol to board game_status
					board.game_status[rowIndex][columnIndex] = symbol;

					if (!board.winner) {
						bot.reply(message, `It's your turn ${board.current_move_user_name}`);
					}

					clicks++;
				}
			});

			// Given that there can only be a winner after 5 clicks
			// We should only start reasoning about game winner after the 5th click
			if (clicks >= 5) {

				var gameStatus = board.game_status
				var winner = helperFunctions.scanMatrix(gameStatus, channel.playing);

				if (winner || (clicks === 9 && !winner)) {
					board.winner = winner || 'No one';

					// Trigger end game command
					helperFunctions.triggerSlashCommand({
						command: '/end_game',
						team_id: message.team.id,
						user_id: message.user,
						channel_id: message.channel,
						text: 'natural end'
					})
				}
			}
		}
	}

})

/*
	SLASH COMMANDS
*/
slackbot.on('slash_command', (bot, message) => {
	// Promisify Botkit api
	Promise.promisifyAll(bot.api.channels);
	Promise.promisifyAll(bot.api.groups);
	Promise.promisifyAll(bot.api.im);
	Promise.promisifyAll(bot.api.chat);
	Promise.promisifyAll(bot);

	// Check to see if that channel has been created in our channel store
	if (!channelStore[message.channel]) {
		channelStore[message.channel] = {};
	}

	// Request info on users in the channel
	bot.api.channels.infoAsync({
		token: token,
		channel: message.channel
	})
	.then((data) => {

		var channel = channelStore[message.channel];

		// Save current users in the channel to our channel store
		channel.users = helperFunctions.formatData(data.channel.members, slackUsers)

		// Check to see if the command is a challenge
		// We only want to invite our bot user if the command is a challenge
		if (message.command === '/challenge' && message.text) {

			var opponent = message.text;
			var player1 = '';
			var player2 = '';

			// check to see that bot (tic_tac_toe_bot) is already invited to that channel
			if (!channel.users[bot.config.bot.user_id]) {

				// Invite the bot
			  bot.api.channels.inviteAsync({
			  	token: token,
			  	channel: message.channel,
			  	user: bot.config.bot.user_id
			  })
				.then((data) => {

					// Save bot to channel user store
					channel.users[bot.config.bot.user_id] = {
						id: bot.config.bot.user_id,
						name: 'tic_tac_toe_bot'
					};

					// check to see that a game isn't currently going on in this channel
					if (!channel.matchOn) {

						// Invite user to a game
					  helperFunctions.sendGameInvite({
							bot: bot,
							message: message,
							opponent: opponent,
							token: bot.config.token,
							channel: slackUsers[opponent]
						});
					} else {

						// Send game is currently on-going message
						player1 = channel.playing.player_1.name;
						player2 = channel.playing.player_2.name;
						bot.reply(message, messages.game_on_messages({player_1: player1, player_2: player2}).game_on);
					}
				})
				.catch((err) => {
					console.log('Error challenging player:', err);
					bot.res.send(err)
				}) 

			} else {

				// check to see that a game isn't currently going on in this channel
				if (!channel.gameOn) {
					// Invite user to a game
				  helperFunctions.sendGameInvite({
						bot: bot,
						message: message,
						opponent: opponent,
						token: bot.config.token,
						channel: slackUsers[opponent]
					});
				} else {

					// Send game is currently on-going message
					player1 = channel.playing.player_1.name;
					player2 = channel.playing.player_2.name;
					bot.reply(message, messages.game_on_messages({player_1: player1, player_2: player2}).game_on);
				}
			}

		} else if (message.command === '/start_game') {

			// Check the status of the current game
			var game = helperFunctions.checkGameStatus({
				bot: bot,
				message: message,
				channel: channel,
				players: channel.playing
			});

			// If game is playable assign players
			if (game.status && game.status === 'playable') {

				var player1 = game.player_1.name;
				var player2 = game.player_2.name;

				// Assign a symbol to the challenger and the opponent
				channel.playing = {};
				channel.playing.player_1 = {symbol: 'X', name: player1, id: slackUsers[player1]};
				channel.playing.player_2 = {symbol: 'O', name: player2, id: slackUsers[player2]};

				// Create the board as an array of arrays
				// where the indexes of board[0] corresponds to the columns of the baord
				// and the first index of each array (i.e. board[0][0], board[1][0], board[2][0])
				// corresponds to the rows of the board 

				channel.board = {
					current_move_user_id: slackUsers[player1],
					current_move_user_name: player1,
					game_status: [[], [], []],
					rows: Object.assign({}, messages.board()),
				}

				// Alert that the game is starting
				bot.reply(message, `Game is starting between ${player1} and ${player2}`);

				// Trigger a slash command that displays the board
				helperFunctions.triggerSlashCommand({
					command: '/display_board',
					team_id: message.team_id,
					user_id: message.user,
					channel_id: message.channel,
					text: 'full board'
				})

				channel.gameOn = true;
			}

		} else if (message.command === '/end_game') {

			if (channel.gameOn) {
				var winner = channel.board.winner || 'No one';
				var player1 = channel.playing.player_1.id;
				var player2 = channel.playing.player_2.id;
				var naturalEnd = message.test === 'natural end' ? true : false;

				// Only the users that are currently playing can use this command
				// Command is also invoked once the game comes to a natural end
				if (message.user === player1 || message.user === player2 || naturalEnd) {
					bot.reply(message, messages.game_end_response({winner: winner}))

					// Reset game board
					channel.board = {};

					// Allow other games to be played on this channel;
					channel.gameOn = false;
				}
			}



		} else if (message.command === '/display_board') {
			var board = channel.board;

			// Only display board if game is on going in channel
			if (channel.gameOn && message.text === 'full board' ) {

				// Display Full Game Board 
				helperFunctions.displayBoard({
					bot: bot,
					board: board,
					message: message,
					row1: board.rows.row_1,
					row2: board.rows.row_2,
					row3: board.rows.row_3
				});
	
			} else if (channel.gameOn) {
				var gs = board.game_status;

				// Display board representation
				helperFunctions.displayBoard({
					bot: bot,
					board: board,
					message: message,
					row1: `${gs[0][0] || '__'}|${gs[0][1] || '__'}|${gs[0][2] || '__'}`,
					row2: `${gs[1][0] || '__'}|${gs[1][1] || '__'}|${gs[1][2] || '__'}`,
					row3: `${gs[2][0] || '__'}|${gs[2][1] || '__'}|${gs[2][2] || '__'}`,
				})

			}
		} 
	})
	.then(() => {

		// Bot has to respond with within 3000 ms or Slack cries ;)
		bot.res.send('');

	})
	.catch((err) => {
		console.log(err.message);
		bot.res.sendStatus(500);
	}) 
});