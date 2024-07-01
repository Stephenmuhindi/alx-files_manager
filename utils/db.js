// Import MongoClient from mongodb library
import { MongoClient } from 'mongodb';

// Define environment variables for DB connection details (with defaults)
const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || 27017;
const DATABASE = process.env.DB_DATABASE || 'files_manager';

// Construct connection URL string from environment variables
const url = `mongodb://${HOST}:${PORT}`;

class DBClient {
	// Constructor to establish connection to MongoDB database
	constructor() {
		this.client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });
		this.client.connect()
			.then(() => {
				this.db = this.client.db(`${DATABASE}`);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	// Check if the connection to MongoDB is still alive
	isAlive() {
		return this.client.isConnected();
	}

	// Asynchronous function to get the number of users in the 'users' collection
	async nbUsers() {
		const users = this.db.collection('users');
		const usersNum = await users.countDocuments();
		return usersNum;
	}

	// Asynchronous function to get the number of files in the 'files' collection
	async nbFiles() {
		const files = this.db.collection('files');
		const filesNum = await files.countDocuments();
		return filesNum;
	}
}

// Create and export a new instance of DBClient
const dbClient = new DBClient();
module.exports = dbClient;

