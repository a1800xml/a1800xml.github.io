export { clearObjectStore, DBUnload, getFromIndexedDB, searchDB };

/**
 * static declarations
 * **/

const dbName = "a1800XML";
const dbVersion = 182;

let dbRequest = indexedDB.open(dbName, dbVersion);

/**
 * dbRequest callback functions
 * **/

/**
 * event from callback
 * error handler
 * **/
dbRequest.onerror = event => {
	console.error(`Database error: ${event.target.error?.message}`);
};

/**
 * event from callback
 * setup & upgrade handler
 * **/
dbRequest.onupgradeneeded = function (event) {
	const db = event.target.result;

	// Object store configuration
	const stores = [
		{
			name: "Asset",
			keyPath: "Values.Standard.GUID",
			indexes: [{ name: "Default", keyPath: ["Values.Standard.GUID", "Values.Standard.Name", "Template"] }]
		},
		{ name: "Text", keyPath: "GUID", indexes: [{ name: "Default", keyPath: ["GUID", "Text"] }] },
		{ name: "Dataset", keyPath: "ID" },
		{ name: "Template", keyPath: "Name" }
	];

	stores.forEach(config => {
		if (!db.objectStoreNames.contains(config.name)) {
			const objectStore = db.createObjectStore(config.name, { keyPath: config.keyPath });

			// Create indexes for the current object store
			if (config.indexes) {
				config.indexes.forEach(index => {
					objectStore.createIndex(index.name, index.keyPath, { unique: false });
				});
			}
		}
	});
};

/**
 *
 *
 * **/
dbRequest.onsuccess = function (event) {
	const db = event.target.result;
	console.log("Database opened successfully");
};

/**
 * Functions
 * **/
function searchDB(parentTag, searchString, nonstrict = false, searchTag = "") {
	isNaN(Number(searchString)) ? null : (searchString = Number(searchString));
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName);

		request.onerror = event => {
			reject("Database error: " + event.target.errorCode);
		};

		request.onsuccess = event => {
			const db = event.target.result;
			const kCursor = db.transaction(parentTag, "readonly").objectStore(parentTag).index("Default").openKeyCursor();
			const result = [];
			kCursor.onsuccess = event => {
				var cursor = event.target.result;
				if (cursor) {
					/* console.log(cursor.key.includes(searchString), cursor.key, searchString, typeof searchString); */
					cursor.key.includes(searchString) ? result.push(cursor.key) : null;
					cursor.continue();
				} else {
					console.log(result);
				}
			};

			kCursor.onerror = function () {
				console.error("Error retrieving keys:");
			};
			/* const results = []; */
			/* 
			const checkMatch = (value, searchString) => {
				console.log(value.toString().includes(searchString), value.toString(), searchString);
				return nonstrict ? value.toString().includes(searchString) : value.toString() === searchString;
			};

			const processRecord = (record, searchTag) => {
				// If the searchTag contains additional fields, check those fields in the record
				for (let tag of searchTag) {
					if (record[tag] && checkMatch(record[tag], searchString)) {
						results.push(record);
						break; // Stop further checks once a match is found
					}
				}
			};

			const searchIndex = indexName => {
				return new Promise(resolve => {
					const index = store.index(indexName);
					const cursorRequest = index.openCursor();

					cursorRequest.onsuccess = event => {
						const cursor = event.target.result;
						if (cursor) {
							if (checkMatch(cursor.key, searchString)) {
								results.push(cursor.value);
							}
							cursor.continue();
						} else {
							resolve();
						}
					};

					cursorRequest.onerror = () => resolve(); // Continue on error
				});
			};

			const searchObjectStore = () => {
				return new Promise(resolve => {
					const cursorRequest = store.openCursor();

					cursorRequest.onsuccess = event => {
						const cursor = event.target.result;
						if (cursor) {
							processRecord(cursor.value, searchTag);
							cursor.continue();
						} else {
							resolve();
						}
					};

					cursorRequest.onerror = () => resolve(); // Continue on error
				});
			};

			// Perform indexed search first
			Promise.all(searchTag.filter(tag => tag === "GUID" || tag === "Template" || tag === "Name").map(indexName => searchIndex(indexName))).then(
				() => {
					// If there are non-indexed fields in searchTag, search the entire object store
					if (searchTag.some(tag => tag !== "GUID" && tag !== "Template" && tag !== "Name")) {
						searchObjectStore().then(() => resolve(results));
					} else {
						resolve(results);
					}
				}
			);*/
		};
	});
}

// Retrieve data from IndexedDB
function getFromIndexedDB(DBName, searchValue) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName);

		request.onerror = function (event) {
			reject(`Error opening database: ${event.target.errorCode}`);
		};

		request.onsuccess = function (event) {
			const db = event.target.result;
			const transaction = db.transaction([DBName], "readonly");
			const objectStore = transaction.objectStore(DBName);

			// Get all index names
			const indexNames = objectStore.indexNames;
			const results = [];

			// Array to store search promises
			const searchPromises = [];

			// Iterate over all indexes
			for (let i = 0; i < indexNames.length; i++) {
				const indexName = indexNames[i];
				const index = objectStore.index(indexName);

				// Create a promise for each index search
				const searchPromise = new Promise((resolveIndex, rejectIndex) => {
					const request = index.getAll(searchValue);

					request.onsuccess = function (event) {
						const indexResults = event.target.result;
						if (indexResults.length > 0) {
							results.push({ indexName, records: indexResults });
						}
						resolveIndex();
					};

					request.onerror = function (event) {
						rejectIndex(`Error searching index ${indexName}: ${event.target.errorCode}`);
					};
				});

				searchPromises.push(searchPromise);
			}

			// Wait for all index searches to complete
			Promise.all(searchPromises)
				.then(() => resolve(results))
				.catch(error => reject(error));
		};
	});
}

function DBUnload() {
	const request = indexedDB.deleteDatabase(dbName);
	request.onsuccess = () => {
		console.log(`Database ${dbName} deleted successfully.`);
	};
	request.onerror = event => {
		console.error("Database deletion failed:", event.target.error);
	};
}

async function clearObjectStore(storeName) {
	const request = indexedDB.open(dbName);
	request.onsuccess = function (event) {
		const db = event.target.result;
		const tx = db.transaction(storeName, "readwrite");
		const store = tx.objectStore(storeName);

		return new Promise((resolve, reject) => {
			const clearRequest = store.clear(); // Clear all entries from the object store

			clearRequest.onsuccess = () => {
				resolve("Object store cleared successfully.");
			};

			clearRequest.onerror = () => {
				reject(clearRequest.error); // Reject with the error if the clear request fails
			};
		});
	};
}
