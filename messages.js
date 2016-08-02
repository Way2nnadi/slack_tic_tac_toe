function challenge_sent(opts) {
	return {
	  "text": "Challenge sent -->",
	  "attachments": [
	      {
          "text": `You have challenged ${opts.opponent}. Waiting for them to accept the challenge`,
          "fallback": "challenge was not sent",
          "callback_id": "slash_challenge",
          "color": "#22264b"
	      }
	   ]
	 };
}

function challenge_payload(opts) {
	return {
		"text": `@${opts.challenger} has challenged you to a game of tic-tac-toe`,
	  "attachments": [
		    {
		      "text": "Do you accept their challenge?",
		      "fallback": "challenge was not sent",
		      "callback_id": "slash_challenge",
		      "color": "#173e43",
		      "attachment_type": "default",
		      "actions": [
		          {
		              "name": "Accept",
		              "text": "Accept",
		              "type": "button",
		              "style": "good",
		              "value": `Accept @${opts.challenger} ${opts.channel_cb}`
		          },
		          {
		              "name": "Decline",
		              "text": "Decline",
		              "style": "danger",
		              "type": "button",
		              "value": `Decline @${opts.challenger} ${opts.channel_cb}`
		          },
		      ]
		    }
		 ]
	};
}

function challenge_response(opts) {
	return {
		"Accept" : `Great, check your channel notifications. You've been invited to a public game with @${opts.challenger}`,
		"Decline" : `Sounds good, @${opts.challenger} has been notified that the challenge has been declined.`
	};
}

function game_end_response(opts) {
	return {
	  "text": "Game has ended",
	  "attachments": [
	      {
          "text": `${opts.winner} won the game`,
          "fallback": "game ended",
          "callback_id": "game_of_games",
          "color": "#3fb0ac"
	      }
	   ]
	};
}

function show_board(opts) {
	return {
	  "text": "Current Game Board",
	  "attachments": [
	      {
          "text": `It's ${opts.current_move_user}'s turn to move`,
          "fallback": "challenge was not sent",
          "callback_id": "slash_challenge",
          "color": "#3fb0ac"
	      }
	   ]
	};
}

function game_on_messages(opts) {
	return {
		game_on: `A match is currently on-going between ${opts.player_1} and ${opts.player_2} in this channel. You cannot challenge another opponent untils this match ends`,
		game_off: `Lets the games begin (add gif here)`
	}
}

function board() {
	return {
		"row_1": {
			"text": '------------ | --------- | ------------',
		  "attachments": [
			    {	
			    	"text": "",
			      "callback_id": "row_1",
			      "color": "#3AA3E3",
			      "attachment_type": "default",
			      "actions": [
			          {
			              "name": "r0c0",
			              "text": "Pick",
			              "type": "button",
			              "style": "good",
			              "value": "r0c0"
			          },
			          {
			              "name": "r0c1",
			              "text": "Pick",
			              "style": "good",
			              "type": "button",
			              "value": "r0c1"
			          },
			          {
			              "name": "r0c2",
			              "text": "Pick",
			              "style": "good",
			              "type": "button",
			              "value": "r0c2"
			          }
			      ]
			    }
			 ]
		},
		"row_2": {
			"text": '------------ | --------- | ------------',
		  "attachments": [
			    {	
			    	"text": "",
			      "callback_id": "row_2",
			      "color": "#3AA3E3",
			      "attachment_type": "default",
			      "actions": [
			          {
			              "name": "r1c0",
			              "text": "Pick",
			              "type": "button",
			              "style": "good",
			              "value": "r1c0"
			          },
			          {
			              "name": "r1c1",
			              "text": "Pick",
			              "style": "good",
			              "type": "button",
			              "value": "r1c1"
			          },
			          {
			              "name": "r1c2",
			              "text": "Pick",
			              "style": "good",
			              "type": "button",
			              "value": "r1c2"
			          }
			      ]
			    }
			 ]
		},
		"row_3": {
			"text": '------------ | --------- | ------------',
		  "attachments": [
			    {
			    	"text": "",
			      "callback_id": "row_3",
			      "color": "#3AA3E3",
			      "attachment_type": "default",
			      "actions": [
			          {
			              "name": "r2c0",
			              "text": "Pick",
			              "type": "button",
			              "style": "good",
			              "value": "r2c0"
			          },
			          {
			              "name": "r2c1",
			              "text": "Pick",
			              "style": "good",
			              "type": "button",
			              "value": "r2c1"
			          },
			          {
			              "name": "r2c2",
			              "text": "Pick",
			              "style": "good",
			              "type": "button",
			              "value": "r2c2"
			          }
			      ]
			    }
			 ]
		}
	}
}

module.exports = {
	challenge_sent: challenge_sent,
	challenge_payload: challenge_payload,
	challenge_response: challenge_response,
	game_end_response: game_end_response,
	game_on_messages: game_on_messages,
	show_board: show_board,
	board: board
}