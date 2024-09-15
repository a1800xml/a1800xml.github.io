export { clearObjectStore, DBUnload, searchFastDB };

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
			indexes: [
				{ name: "GUID", keyPath: "Values.Standard.GUID" },
				{ name: "Name", keyPath: "Values.Standard.Name" },
				{ name: "Template", keyPath: "Template" }
			]
		},
		{
			name: "Text",
			keyPath: "GUID",
			indexes: [
				{ name: "Text", keyPath: "Text" },
				{ name: "GUID", keyPath: "GUID" }
			]
		},
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
function searchFastDB(parentTag, searchString, nonstrict = false) {
	/* isNaN(Number(searchString)) ? null : (searchString = Number(searchString)); */
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName);

		request.onerror = event => {
			reject("Database error: " + event.target.errorCode);
		};

		request.onsuccess = event => {
			const result = [];
			const db = event.target.result;
			const _db = db.transaction(parentTag, "readonly").objectStore(parentTag);
			const promises = [];

			// Loop through all indexes and open cursors
			Array.from(_db.indexNames).forEach(indexName => {
				const promise = new Promise((resolveCursor, rejectCursor) => {
					const cursorRequest = _db.index(indexName).openKeyCursor();

					cursorRequest.onsuccess = event => {
						let pointer = event.target.result;

						if (pointer) {
							const keyStr = pointer.key.toString().toLowerCase();
							const searchStr = searchString.toLowerCase();

							if (nonstrict ? keyStr.includes(searchStr) : keyStr === searchStr) {
								result.push(pointer.primaryKey);
							}
							pointer.continue();
						} else {
							resolveCursor();
						}
					};

					cursorRequest.onerror = event => rejectCursor(event.target.error);
				});

				promises.push(promise);
			});

			// Wait for all cursor operations to finish
			Promise.all(promises)
				.then(() => {
					console.log(result); // array of GUID
					resolve(result); // Resolve the final result array
				})
				.catch(error => {
					reject(error);
				});
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
