export { clearObjectStore, DBUnload, searchFastDB, getValueDB, checkDB };

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
dbRequest.onerror = (event) => {
	console.error(`Database error: ${event.target.error?.message}`);
};

/**
 * event from callback
 * setup & upgrade handler
 * **/
dbRequest.onupgradeneeded = (event) => {
	const db = event.target.result;

	// Object store configuration
	const stores = [
		{
			name: "Asset",
			keyPath: "Values.Standard.GUID",
			indexes: [
				{ name: "GUID", keyPath: "Values.Standard.GUID" },
				{ name: "Name", keyPath: "Values.Standard.Name" },
				{ name: "Template", keyPath: "Template" },
			],
		},
		{
			name: "Text",
			keyPath: "GUID",
			indexes: [
				{ name: "Name", keyPath: "Text" },
				{ name: "GUID", keyPath: "GUID" },
			],
		},
		{
			name: "Template",
			keyPath: "Name",
			indexes: [{ name: "Name", keyPath: "Name" }],
		},
		{
			name: "Group[?(@.Name)]",
			keyPath: "Name",
			indexes: [{ name: "Name", keyPath: "Name" }],
		},
		{
			name: "DataSet",
			keyPath: "Id",
			indexes: [
				{ name: "Name", keyPath: "Name" },
				{ name: "ID", keyPath: "Id" },
			],
		},
		{
			name: "Property",
			keyPath: "Name",
			indexes: [{ name: "Name", keyPath: "Name" }],
		},
	];

	stores.forEach((config) => {
		if (!db.objectStoreNames.contains(config.name)) {
			const objectStore = db.createObjectStore(config.name, {
				keyPath: config.keyPath,
				autoIncrement: config.autoIncrement || false,
			});

			if (config.indexes) {
				config.indexes.forEach((index) => {
					const options = { unique: false };
					if (index.options) {
						Object.assign(options, index.options);
					}
					objectStore.createIndex(index.name, index.keyPath, options);
				});
			}
		}
	});
};

/**
 *
 *
 * **/
let db;
dbRequest.onsuccess = function (event) {
	db = event.target.result;
	console.log("Database opened successfully");
};

/**
 * Functions
 * **/

/**
 * @param {string} parentTag the parentTag of the search, defines also the objectstore that is searched e.g. "Asset"
 * @param {string} searchString the string to search e.g. "human7"
 * @param {boolean} [nonstrict=false] absent if unused
 * @returns Array of Arrays with Table [GUID, Name]
 * **/
function searchFastDB(parentTag, searchString, nonstrict = false) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(parentTag, "readonly");
		const objectStore = transaction.objectStore(parentTag);
		const result = [];
		const promises = [];

		// Convert DOMStringList to an array
		Array.from(objectStore.indexNames).forEach((indexName) => {
			const promise = new Promise((resolveCursor, rejectCursor) => {
				const cursorRequest = objectStore.index(indexName).openKeyCursor();

				cursorRequest.onsuccess = (event) => {
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

				cursorRequest.onerror = (event) => rejectCursor(event.target.error);
			});

			promises.push(promise);
		});

		Promise.all([promises])
			.then(() => {
				const finalResult = getNameToGUID(parentTag, result);
				resolve(finalResult);
			})
			.catch((error) => reject(error));
	});
}

/**
 * @param {string} parentTag
 * @param {Number[]} GUIDArray
 * **/

function getNameToGUID(parentTag, GUIDArray) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(parentTag, "readonly");
		const objectStore = transaction.objectStore(parentTag);
		const cursorRequest = objectStore.index("Name").openKeyCursor();
		const resultArray = [];

		cursorRequest.onsuccess = (event) => {
			const cursor = event.target.result;

			// Iterate over the cursor as long as it's not null
			if (cursor) {
				const primaryKeyIndex = GUIDArray.indexOf(cursor.primaryKey);
				if (primaryKeyIndex > -1) {
					resultArray.push({ primaryKey: cursor.primaryKey, value: cursor.key });
					GUIDArray.splice(primaryKeyIndex, 1); // Remove found GUID from the array
				}

				cursor.continue(); // Continue to next entry
			} else {
				// Cursor is null, iteration is complete
				resolve(resultArray);
			}
		};

		cursorRequest.onerror = (event) => {
			reject("Cursor error: " + event.target.error);
		};
	});
}

function DBUnload() {
	db.close();
	const request = indexedDB.deleteDatabase(dbName);

	request.onblocked = () => {
		console.warn(`Database ${dbName} deletion is blocked by open connections.`);
	};

	request.onsuccess = () => {
		console.log(`Database ${dbName} deleted successfully.`);
	};

	request.onerror = (event) => {
		console.error("Database deletion failed:", event.target.error);
	};
}

async function clearObjectStore(storeName) {
	const request = db;
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

// Retrieve data from IndexedDB
function getValueDB(DBName, SearchValue) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, dbVersion);
		console.log("valuedb here");
		request.onsuccess = () => {
			const _db = request.result;
			console.log("valuedb here2");
			const transaction = _db.transaction(DBName, "readonly");
			console.log("valuedb here3");
			const objectStore = transaction.objectStore(DBName);
			console.log("valuedb here4");
			const getRequest = objectStore.get(Number(SearchValue));
			console.log("valuedb here5");
			getRequest.onsuccess = () => {
				const value = getRequest.result;
				resolve(value);
			};

			getRequest.onerror = (err) => {
				reject(`Error getting data from object store: ${err}`);
			};
		};

		request.onerror = (err) => {
			reject(`Error opening database: ${err}`);
		};
	});
}

/**
 * @param {string} DBName
 * **/
function checkDB(DBName) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, dbVersion);

		request.onsuccess = () => {
			const _db = request.result;
			const transaction = _db.transaction(DBName, "readonly");
			const objectStore = transaction.objectStore(DBName);
			const getRequest = objectStore.count();

			getRequest.onsuccess = () => {
				const value = getRequest.result;
				resolve(value);
			};

			getRequest.onerror = (err) => {
				reject(`Error getting data from object store: ${err}`);
			};
		};

		request.onerror = (err) => {
			reject(`Error opening database: ${err}`);
		};
	});
}
