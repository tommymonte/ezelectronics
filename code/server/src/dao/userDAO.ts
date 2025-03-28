import db from '../db/db';
import { User } from '../components/user';
import crypto from 'crypto';
import { UserAlreadyExistsError, UserNotFoundError } from '../errors/userError';

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

	/**
	 * Checks whether the information provided during login (username and password) is correct.
	 * @param username The username of the user.
	 * @param plainPassword The password of the user (in plain text).
	 * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
	 */
	getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			try {
				/**
				 * Example of how to retrieve user information from a table that stores username, encrypted password and salt (encrypted set of 16 random bytes that ensures additional protection against dictionary attacks).
				 * Using the salt is not mandatory (while it is a good practice for security), however passwords MUST be hashed using a secure algorithm (e.g. scrypt, bcrypt, argon2).
				 */
				const sql = 'SELECT username, password, salt FROM users WHERE username = ?';
				db.get(sql, [username], (err: Error | null, row: any) => {
					if (err) reject(err);
					//If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
					if (!row || row.username !== username || !row.salt) {
						resolve(false);
					} else {
						//Hashes the plain password using the salt and then compares it with the hashed password stored in the database
						const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16);
						const passwordHex = Buffer.from(row.password, 'hex');
						if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) resolve(false);
						resolve(true);
					}
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Creates a new user and saves their information in the database
	 * @param username The username of the user. It must be unique.
	 * @param name The name of the user
	 * @param surname The surname of the user
	 * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
	 * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
	 * @returns A Promise that resolves to true if the user has been created.
	 */
	createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			try {
				const salt = crypto.randomBytes(16);
				const hashedPassword = crypto.scryptSync(password, salt, 16);
				const sql = 'INSERT INTO users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)';
				db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
					if (err) {
						if (err.message.includes('UNIQUE constraint failed: users.username')) {
							reject(new UserAlreadyExistsError());
						}
						reject(err);
					}
					resolve(true);
				});
			} catch (error) {
				console.log(error.message)
				reject(error);
			}
		});
	}

	/**
	  * Returns a user object from the database based on the username.
	  * @param username The username of the user to retrieve
	  * @returns A Promise that resolves the information of the requested user
	  */
	getUserByUsername(username: string): Promise<User> {
		return new Promise<User>((resolve, reject) => {
			try {
				const sql = 'SELECT * FROM users WHERE username = ?';
				db.get(sql, [username], (err: Error | null, row: any) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					if (row === undefined) {
						return reject(new UserNotFoundError());
					}
					let resultUser = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate);
					resolve(resultUser);
				});
			} catch (error) {
				console.log(error.message)
				reject(error);
			}
		});
	}

	/**
	  * Returns an array of users with a specific role retrieved from the database
	  * @param role The role that will be used as a retrieval criteria
	  * @returns A Promise that will resolve in an array of users
	  */
	getUsersByRole(role: string): Promise<User[]> {
		var res: User[] = [];
		return new Promise<User[]>((resolve, reject) => {
			try {
				const sql = 'SELECT * FROM users WHERE role = ?';
				db.each(sql, [role], (err: Error | null, row: any) => {
					// the callback is not called if there's no row
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					let user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate);
					res.push(user);
				},
					() => {
						// again we don't need return, it's the last instruction
						resolve(res);
					},
				);
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Returns an array of users representing all the users in the database
	 * @param none
	 * @returns A Promise that will resolve to an array of rows
	 */
	getAllUsers(): Promise<User[]> {
		var res: User[] = [];
		return new Promise<User[]>((resolve, reject) => {
			try {
				const sql = 'SELECT * FROM users';
				db.each(sql, [], (err: Error | null, row: any) => {
					if (err) {
						console.log(err.message);
						return reject(err);
					}
					let user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate);
					res.push(user);
				},
					() => {
						// we don't need return, it's the last function we call
						resolve(res);
					},
				);
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * Deletes all non admin users from the database
	 * @param none
	 * @returns A Promise that will resolve to true or false depending on the delete result
	 */
	deleteAll(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			try {
				const sql = 'DELETE FROM users WHERE role != "Admin"';
				db.run(sql, (err: Error | null) => {
					if (err) {
						console.log(err.message);
						reject(err);
					} else {
						resolve();
					}
				});
			} catch (error) {
				console.log(error.message);
				reject(error);
			}
		});
	}

	/**
	 * This function deletes the user data given a username
	 * @param username : the username identifing the user that must be deleted
	 * @returns A Promise that will resolve to true or false depening on the delete operation success
	 */
	deleteByUsername(username: string): Promise<Boolean> {
		return new Promise<Boolean>((resolve, reject) => {
			const sql = 'DELETE FROM users WHERE username = ?';
			try {
				// we need a function otherwise this will not work
				db.run(sql, [username], function (err) {
					if (err) {
						console.log(err.message);
						reject(err);
					} else {
						// this.changes -> the number of rows modified
						resolve(this.changes > 0);
					}
				});
			} catch (error) {
				console.log(error.message)
				reject(error);
			}
		});
	}

	/** */
	updateUserInfo(username: string, name: string, surname: string, address: string, birthdate: string): Promise<Boolean> {
		return new Promise<Boolean>((resolve, reject) => {
			try {
				const sql = 'UPDATE users SET name = ?, surname = ?, address = ?, birthdate = ? WHERE username = ?';
				db.run(sql, [name, surname, address, birthdate, username], (err: Error | null) => {
					if (err) {
						console.log(err.message);
						reject(err);
					} else {
						resolve(true);
					}
				});
			} catch (error) {
				console.log(error.message)
				reject(error);
			}
		});
	}
}

export default UserDAO;
