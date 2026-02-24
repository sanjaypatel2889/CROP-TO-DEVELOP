const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

/**
 * Get the SQLite database singleton instance.
 * Creates a new connection if one does not already exist.
 * @returns {Database} better-sqlite3 database instance
 */
function getDb() {
    if (!db) {
        const dbPath = path.join(__dirname, '..', '..', 'kisanai.db');
        db = new Database(dbPath);

        // Enable WAL journal mode for better concurrent read performance
        db.pragma('journal_mode = WAL');

        // Enable foreign key constraint enforcement
        db.pragma('foreign_keys = ON');

        console.log(`[Database] Connected to SQLite database at ${dbPath}`);
    }
    return db;
}

/**
 * Initialize the database by reading and executing the schema.sql file.
 * Creates all tables and indexes if they do not already exist.
 */
function initializeDatabase() {
    const database = getDb();
    const schemaPath = path.join(__dirname, 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    database.exec(schema);

    console.log('[Database] Schema initialized successfully');
}

/**
 * Close the database connection gracefully.
 */
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('[Database] Connection closed');
    }
}

module.exports = {
    getDb,
    initializeDatabase,
    closeDatabase
};
