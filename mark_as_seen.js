const level = require('level');

const db = level('database');

markAsSeen();

async function markAsSeen() {
	const mostRecent = await db.get('mostRecent');
	await db.put('lastSeen', mostRecent);
}
