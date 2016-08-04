# `Slack_Tic_Tac_Toe_Bot` - A simple way to have fun with a slack mate

`Slack_Tic_Tac_Toe_Bot` was built leveraging the power of [Botkit](https://github.com/howdyai/botkit/blob/master/readme.md). Special thanks to the Botkit team for building such a reliable tool.

## Getting Started
So you want to see if `Slack_Tic_Tac_Toe_Bot` is right for you.
First things first, given that this application is not available on slack you will need to `git clone` this repo locally. 

```bash
git@github.com:Way2nnadi/slack_tic_tac_toe.git
```

Now, all we'll need is slack creditentials in order for this app to run locally.

### Getting Credentials
The [Slack Api](https://api.slack.com) is actually well-documented and walks you, hand in hand, through each necessary step to set up a slack app.

### Basic Usage
Once you have your slack credentials, put them into the config.json.
It should be in this format:

```javascript
{
	"slack": {
		"token": "your-slack-token",
		"client-id": "your-slack-client-id",
		"client-secret": "your-slack-client-secret",
		"redirect-uri": "your-redirect-uri"
	}
}
```

Then simiply run:

```bash
node tic_tac_toe_bot.js
```

### Slack Commands

There are a total of 4 slack commands withing this application
* `/challenge @username`: allows you to challenge anyone in your team 
  * sends challenged player a direct message to either accept or decline game
* `/display_board`: shows the current state of the board and the current player whose turn it is
* `/start_game @username1 @username2`: starts a game between two people already in the game room
* `/end_game`: allows current players to end their match

`Slack_Tic_Tac_Toe_Bot` is currently only laptop/desktop safe. 
I hope you enjoy!!!

