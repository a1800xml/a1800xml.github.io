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
			indexes: [
				{ name: "Name", keyPath: "Values.Standard.Name" },
				{ name: "Template", keyPath: "Template" }
			]
		},
		{ name: "Text", keyPath: "GUID", indexes: [{ name: "Text", keyPath: "Text" }] },
		{ name: "Dataset", keyPath: "ID" },
		{ name: "Template", keyPath: "Name" }
	];

	stores.forEach(config => {
		if (!db.objectStoreNames.contains(config.name)) {
			const objectStore = db.createObjectStore(config.name, { keyPath: config.keyPath });

			// Create indexes for the current object store
			if (config.indexes) {
				console.warn(config.indexes);
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

function searchDB(parentTag, searchString, nonstrict, searchTag) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName);

		request.onerror = event => {
			reject(`Error opening database: ${event.target.errorCode}`);
		};

		request.onsuccess = event => {
			const db = event.target.result;
			const transaction = db.transaction([parentTag], "readonly");
			const objectStore = transaction.objectStore(parentTag);

			// Use openCursor to iterate over all entries
			const cursorRequest = objectStore.openCursor();
			const results = [];

			cursorRequest.onsuccess = event => {
				const cursor = event.target.result;
				if (cursor) {
					const record = cursor.value;
					console.warn("cursor", record.GUID, record.Template, record.Name);
					if (nonstrict) {
						//on
					} else {
						//off
					}

					// Assuming the record structure contains GUID, Template, and Name
					const GUID = record.GUID;
					const Template = record.Template;
					const Name = record.Name;

					// Push an array of [GUID, Template, Name] to results
					results.push([GUID, Template, Name]);

					// Continue to the next record
					/* cursor.continue(); */
				} else {
					// All entries have been processed
					resolve(results);
				}
			};

			cursorRequest.onerror = function (event) {
				reject(`Error retrieving entries: ${event.target.errorCode}`);
			};
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
