require('dotenv').config();

const level = require('level');
const Parser = require('rss-parser');

const childProcess = require('child_process');

const RSS_FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${process.env.YOUTUBE_CHANNEL_ID}`;

const parser = new Parser();

checkYouTubeChannel();
setInterval(checkYouTubeChannel, process.env.INTERVAL_MS);

async function checkYouTubeChannel() {
	try {
		const db = await openDatabase('database');
		const feed = await parser.parseURL(RSS_FEED);

		const mostRecent = feed.items[0].link;
		await db.put('mostRecent', mostRecent);
		let lastSeen;
		try {
			lastSeen = await db.get('lastSeen');
		} catch (err) {
			if (err.notFound) {
				console.log('created database');
				lastSeen = mostRecent;
				await db.put('lastSeen', mostRecent);
			} else {
				throw err;
			}
		}
		await db.close();

		let newVideos = 0;
		for (const item of feed.items) {
			if (item.link === lastSeen) {
				break;
			}
			newVideos++;
		}

		const color = chooseColor(newVideos);
		await blink(color);
	} catch (err) {
		console.error(err);
	}
}

function openDatabase(location) {
	return new Promise(function (resolve, reject) {
		level(location, {}, (err, db) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(db);
		});
	});
}

function chooseColor(newVideos) {
	switch (newVideos) {
		case 0:
			return '000000';
		case 1:
			return '0000ff';
		case 2:
			return '00ff00';
		case 3:
			return 'ffff00';
		default:
			return 'ff0000';
	}
}

function blink(color) {
	return new Promise(function (resolve, reject) {
		childProcess.exec(`blink1-tool.exe --rgb ${color}`, (err, stdout, stderr) => {
			if (err) {
				reject(err);
				return;
			}
			resolve();
		});
	});
}
