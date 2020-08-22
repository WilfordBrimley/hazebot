//Discord to Twitch both ways by Lovecraft#4690. WTFPL
//Load Core config

//Current Setup: CSE

let config = require(`./config.json`),
	request = require('request'),
	baseAPIURL = `https://api.twitch.tv/kraken/streams/`,
	online = false,
	streamUser = ``,
	user = config.channels,
	//Discord Client
	discordClient = new(require(`discord.js`)).Client(),
	logChannel = [],
	log = console.log,
	lastHosting = ``;

	discordClient.login(config.token).then(() => { //Attempt Login
		log(`Discord Bot Login Success!`)
	
	});

discordClient.once('ready', () => {
	log('Ready!');
	logChannel = discordClient.guilds.get(config.guildMirror).channels.find(channel => channel.id === config.discordChannelID);
	 getStreamInfo(user)
	 setInterval(() => {
	 	getStreamInfo(user)
	 }, 3000)
});
discordClient.login(config.token);

// Handle discord to twitch
discordClient.on(`message`, (message) => {
	if (message.author.bot == true) return;
	if (message.channel == logChannel) {
		twitchClient.say(config.channels, `${message.author.username}: ${message.cleanContent}`)
	}
})

//Twitch twitchClient
const twitchClient = new(require('tmi.js')).Client({
	options: {
		debug: false
	},
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: config.username,
		password: config.oauth
	},
	channels: [config.channels]
});
twitchClient.connect()
	.then(() => {
		log(`Attempting Connection to Twitch...`)
	});


//Handle twitch to discord
twitchClient.on('message', (channel, tags, message, self) => {
	if (message == `!test`) {
		twitchClient.say(channel, `whatever`)
	}
	if (message == `baked potato`) {
		twitchClient.say(channel, `i am`)
	}
	if (self) return;

	logChannel.send(`**${tags.username}:** ${message}`)
});


twitchClient.on("connected", (address, port) => {
	log(`twitchClient connected success!
	ADDDRESS: ${address}
	PORT: ${port}`)
	log(`Streamer Online: ` + online)
});

twitchClient.on('logon', () => {
	log(`Logged On, TX/RX UP`)
});

twitchClient.on("hosting", (channel, target, viewers) => {
	if (lastHosting == target) {
		return;
	} else {

		lastHosting = target;
		let embed = new (require(`discord.js`)).RichEmbed()
			.setTitle(`Notice:`)
			.setColor(`0000FF`)
			.setDescription(`${channel} Now Hosting: ${target} with ${viewers} viewers. \nYou can check them out at: <http://www.twitch.tv/${target}>`)
		logChannel.send(embed);

	}
});

twitchClient.on("hosted", (channel, username, viewers) => {
	let embed = new (require(`discord.js`)).RichEmbed()
		.setTitle(`Notice:`)
		.setColor(`00FFFF`)
		.setDescription(`${channel} Being hosted by: **${username}** with ${viewers} viewers.\nYou can check them out at: http://www.twitch.tv/${username}`);
	logChannel.send(embed);

});

twitchClient.on("unhost", (channel, viewers) => {
	let embed = new (require(`discord.js`)).RichEmbed()
		.setTitle(`Notice:`)
		.setColor(`000FFF`)
		.setDescription(`${channel} Stopped Hosting with ${viewers} viewers.\nYou can check them out at: http://www.twitch.tv/${channel}`)

	logChannel.send(embed);

});

getViewers = (clientID, testchannel) => {
	log(`Connecting to: ${baseAPIURL}${clientID}`)

	request({
		headers: {
			'Accept': 'Accept: application/vnd.twitchtv.v5+json',
			'Client-ID': config.clientID
		},
		uri: baseAPIURL + clientID,
		method: 'GET'
	}, (err, res, body) => {
		if (err) {
			log(body)
			return online = false;
		}
		if (!err) {
			let parsed = JSON.parse(body)
			console.log(res)
			if (parsed.stream) {

				if (testchannel !== null) {
					testchannel.setName(`🟢・${parsed.stream.channel.display_name} ${parsed.stream.viewers} viewers`)
					log(`here`)
				}
				log(`${parsed.stream.channel.display_name} is Live with ${parsed.stream.viewers} viewers`)
				online = true

			} else {
				if (testchannel !== []) {
					testchannel.setName(`🔴・Streamer is Offline`)
				}
				log(`Streamer is Offline`)
				online = false
			}
		}
	});
}

getStreamInfo = (user) => {
	request({
		headers: {
			'Accept': 'Accept: application/vnd.twitchtv.v5+json',
			'Client-ID': config.clientID
		},
		uri: `https://api.twitch.tv/kraken/users?login=${user}`,
		method: 'GET'
	}, (err, res, body) => {
		if (err) {
			log(body)
			return online = false;
		}
		if (!err) {
			let parsed = JSON.parse(body);
			streamUser = parsed.users[0]._id;
			log(`Streamer ID: ${streamUser}`)
			getViewers(streamUser, logChannel)
		}

	});
}