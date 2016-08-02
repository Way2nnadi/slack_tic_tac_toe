var messages = require('../messages.js');
var rp = require('request-promise');

function parseUserListReturn(membersArray) {
	var slackUsers = {};

	// associate slack name to slack id
	membersArray.forEach((user) => {
		slackUsers[`@${user.name}`] = user.id;
	});

	// associate slack id to slack name
	membersArray.forEach((user) => {
		slackUsers[user.id] = `@${user.name}`;
	});

	return slackUsers
}

function formatData(membersArray, slackUsers) {
	var users = {};

	membersArray.forEach((user) => {
		users[user] = { id: user, name: slackUsers[user] };
	})

	return users;
}

function sendGameInvite(opts) {
	var challenge_payload = 
		messages.challenge_payload({
			challenger: opts.message.user_name,
			channel_cb: opts.message.channel
		});

	// Display message that challenge was sent to that specific user
	opts.bot.reply(opts.message, messages.challenge_sent({opponent: opts.opponent}));

	// Send buttons to challenged to either accept or decline game offer
	return opts.bot.api.chat.postMessageAsync({
		token: opts.bot_token,
		channel: opts.channel,
		text: challenge_payload.text,
		attachments: challenge_payload.attachments
	})
	.catch((err) => {
		console.log("Error inside game invite function:", err);
	}) 
}

function triggerSlashCommand(opts) {
	rp({
  	method: 'POST',
	  uri: 'https://b059b3ea.ngrok.io/slack/receive',
	  body: {
	  	command: opts.command,
	  	team_id: opts.team_id,
	  	user_id: opts.user_id,
	  	channel_id: opts.channel_id,
  		text: opts.text
	  },
	  json: true
	})
	.catch((err) => {
		console.log('Error in triggering the slash command:', err);
	})
}

function checkGameStatus(opts) {
	var bot = opts.bot;
	var message = opts.message;
	var channel = opts.channel;
	var players = message.text.split(' ');
	var currentPlayers = opts.players;
	var usersInGameChannel = channel.users;
	var status = false;

	// challenger
	var player1 = { 
		name: players[0],
		inChannel: false
	};

	// opponent
	var player2 = { 
		name: players[1],
		inChannel: false
	}; 

	// Check to see if player1 and player2 are currently in the channel
	for (var key in usersInGameChannel) {
		if (usersInGameChannel[key].name === player1.name) {
			player1.inChannel = true;
		} else if (usersInGameChannel[key].name === player2.name) {
			player2.inChannel = true;
		}
	}

	if (channel.gameOn) {
		bot.reply(message, `${currentPlayers.player_1.name} and ${currentPlayers.player_2.name} are currently playing a game. Please wait for their match to end before starting a new game in this channel`);
		

	} else if (!player1.name || !player2.name) {
		bot.replyAsync(message, 'This command requires that you include the name of two users')
								.then(() => bot.replyAsync(message, 'Example: /start_game @you @me'));
	  

	} else if (!player1.inChannel || !player2.inChannel) {
		bot.reply(message, 'Please make sure both players are invited to the game channel before starting the game.');
		
	} else {
		status = 'playable'
	}

	return {
		status: status,
		player_1: player1,
		player_2: player2
	}
}

function scanMatrix(boardArray, players) {
	var player1Symbol = players.player_1.symbol;
	var player2Symbol = players.player_2.symbol;
	var board = [];
	var winner = '';
  
  // EXTREMELY - naive basic solution here
  // there are 8 possible ways you can win in tic tac toe
	
	// Scan rows
	for (var a=0; a<3; a++) {
		var array = [];

		for (var b=0; b<3; b++) {
			array.push(boardArray[a][b]);
		}
		board.push(array);
	}

	// Scan columns
	for (var y=0; y<3; y++) {
		var array = [];

		for (var i=0; i<3; i++) {
			array.push(boardArray[i][y]);
		}
		board.push(array);
	}

	// Scan Diagonally down
  var d_down = [boardArray[0][0], boardArray[1][1], boardArray[2][2]];

	// Scan Diagonally Up
	var d_up = [boardArray[2][0], boardArray[1][1], boardArray[0][2]];
	board.push(d_up, d_down);

  // check our board for a possible winner
	board.forEach((row) => {
		if (every(row, player1Symbol) ) {
			winner = players.player_1.name;
			return
		}

		if (every(row, player2Symbol) ) {
			winner = players.player_2.name;
			return
		}
	})

	return winner;
}

function displayBoard(opts) {
  var bot = opts.bot;
  var row1 = opts.row1;
  var row2 = opts.row2;
  var row3 = opts.row3;
  var message = opts.message;

  // Given we want our row's to display sequentially
  // we have to go into a bit of promise-callback hell 
  // in order to get desired effect.

  bot.replyAsync(message, `${opts.board.current_move_user_name} your move`)
  	.then(() => {
  		bot.replyAsync(message, row1)
  		 .then(() => {
  		 	 bot.replyAsync(message, row2)
  		 	  .then(() => {
  		 	  	bot.replyAsync(message, row3);
  		 	  })
  		 })
  	})
  	.catch((err) => {
  		console.log('Error displaying board:', err);
  	})

}

function every(array, value) {
	var answer = true;
	array.forEach((item) => {
		if( item !== value) {
			answer = false;
			return;
		}
	})
	return answer;
}

module.exports = {
	parseUserListReturn: parseUserListReturn,
	formatData: formatData,
	sendGameInvite, sendGameInvite,
	triggerSlashCommand: triggerSlashCommand,
	checkGameStatus: checkGameStatus,
	scanMatrix: scanMatrix,
	displayBoard: displayBoard
}