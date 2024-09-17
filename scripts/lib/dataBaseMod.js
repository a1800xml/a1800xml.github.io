/**
 * static declarations
 * **/

/* const dbName = "a1800XML";
const dbVersion = 182; */

/**
 * Functions
 * **/

/**
 * @param {string} DBIndex
 * @param {Object} Data
 * **/
/* async function storeInIndexedDB(DBIndex, Data) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, dbVersion);
		request.onsuccess = event => {
			const db = event.target.result;
			const transaction = db.transaction([DBIndex], "readwrite");
			const objectStore = transaction.objectStore(DBIndex);

			Data.forEach(item => {
				if (Array.isArray(item)) {
					item.forEach(e => objectStore.add(e));
				} else if (typeof item === "object" && item !== null) {
					objectStore.add(item);
				}
			});

			// Listen for when the transaction is complete
			transaction.oncomplete = function () {
				console.log(DBIndex, "All results stored in IndexedDB");
				db.close();
				resolve(); // Resolve the promise when transaction completes
			};

			transaction.onerror = function () {
				console.error("Transaction failed");
				db.close();
				reject(new Error("Failed to store in IndexedDB"));
			};
		};

		request.onerror = event => {
			reject(new Error("Failed to open IndexedDB: " + event.target.error));
		};
	});
} */

	/**
 * static declarations
 **/
const dbName = "a1800XML";
const dbVersion = 182;

let dbInstance = null; // Cache the database instance

/**
 * Functions
 **/

/**
 * @param {string} DBIndex
 * @param {Object} Data
 **/
async function storeInIndexedDB(DBIndex, Data) {
	return new Promise((resolve, reject) => {
		// Open or reuse the database connection
		if (!dbInstance) {
			const request = indexedDB.open(dbName, dbVersion);
			request.onsuccess = event => {
				dbInstance = event.target.result;
				storeData(DBIndex, Data, resolve, reject);
			};

			request.onerror = event => {
				reject(new Error("Failed to open IndexedDB: " + event.target.error));
			};
		} else {
			storeData(DBIndex, Data, resolve, reject);
		}
	});
}

/**
 * Helper function to store data
 */
function storeData(DBIndex, Data, resolve, reject) {
	const transaction = dbInstance.transaction([DBIndex], "readwrite");
	const objectStore = transaction.objectStore(DBIndex);

	// Use `Promise.all()` to handle parallel inserts
	const insertPromises = Data.map(item => {
		if (Array.isArray(item)) {
			return Promise.all(item.map(e => storeRecord(objectStore, e)));
		} else if (typeof item === "object" && item !== null) {
			return storeRecord(objectStore, item);
		}
	});

	Promise.all(insertPromises)
		.then(() => {
			transaction.oncomplete = function () {
				console.log(DBIndex, "All results stored in IndexedDB");
				resolve(); // Resolve the promise when transaction completes
			};
			transaction.onerror = function () {
				console.error("Transaction failed");
				reject(new Error("Failed to store in IndexedDB"));
			};
		})
		.catch(reject);
}

/**
 * Helper function to store a single record
 */
function storeRecord(objectStore, item) {
	return new Promise((resolve, reject) => {
		const request = objectStore.put(item); // Using `put()` instead of `add()`
		request.onsuccess = () => resolve();
		request.onerror = () => reject(new Error("Failed to store record"));
	});
}
