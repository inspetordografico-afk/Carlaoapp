import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('estoque_v3.db');

const users = db.prepare("SELECT * FROM users").all();

for (const user of users) {
    // Check if password starts with generic plain text length (usually short)
    // or just re-hash if it doesn't look like a bcrypt hash (starts with $2b$)
    if (!user.password.startsWith('$2')) {
        const hash = bcrypt.hashSync(user.password, 10);
        db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hash, user.id);
        console.log(`Updated password for user ${user.name}`);
    }
}
console.log('Done.');
