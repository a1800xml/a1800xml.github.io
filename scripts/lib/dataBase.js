export { clearObjectStore, DBUnload, searchFastDB, getValueDB };

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
				{ name: "Name", keyPath: "Text" },
				{ name: "GUID", keyPath: "GUID" }
			]
		},
		{ name: "Dataset", keyPath: "ID" },
		{ name: "Template", keyPath: "Name", indexes: [{ name: "Name", keyPath: "Name" }] },
		{ name: "Group[?(@.Name)]", keyPath: "Name", indexes: [{ name: "Name", keyPath: "Name" }] }
	];

	stores.forEach(config => {
		if (!db.objectStoreNames.contains(config.name)) {
			const objectStore = db.createObjectStore(config.name, { keyPath: config.keyPath, autoIncrement: config.autoIncrement | false });

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

/**
 * @param {string} parentTag the parentTag of the search, defines also the objectstore that is searched e.g. "Asset"
 * @param {string} searchString the string to search e.g. "human7"
 * @param {boolean} [nonstrict=false] absent if unused
 * @returns Array of Arrays with Table [GUID, Name]
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
					/* console.log(result); // array of GUID */
					const aResult = getNameToGUID(parentTag, result);
					resolve(aResult); // Resolve the final result array
				})
				.catch(error => {
					reject(error);
				});
		};
	});
}

/**
 * @param {string} parentTag
 * @param {Number[]} GUIDArray
 * **/
function getNameToGUID(parentTag, GUIDArray) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName);
		/* console.warn("getNameToGUID"); */
		request.onerror = event => {
			reject("Database error: " + event.target.errorCode);
		};

		request.onsuccess = event => {
			const db = event.target.result;
			const _db = db.transaction(parentTag, "readonly").objectStore(parentTag);

			const promise = new Promise((resolveCursor, rejectCursor) => {
				const cursorRequest = _db.index("Name").openKeyCursor();
				let resultArray = [];

				cursorRequest.onsuccess = event => {
					let pointer = event.target.result;

					if (pointer) {
						// Check if the primaryKey already exists in the array
						const _i = GUIDArray.indexOf(pointer.primaryKey);
						if (_i > -1) {
							resultArray.push({ primaryKey: pointer.primaryKey, value: pointer.key });
							//remove found item from GUIDArray
							GUIDArray.splice(_i, 1);
							/* console.log(GUIDArray); */
						}

						pointer.continue();
					} else {
						resolveCursor(resultArray); // Resolve with the final array
					}
				};

				cursorRequest.onerror = event => rejectCursor(event.target.error);
			});

			Promise.all([promise])
				.then(resultArray => {
					resolve(resultArray); // Array of [GUID, indexKey or ""]
				})
				.catch(error => {
					reject(error);
				});
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

// Retrieve data from IndexedDB
function getValueDB(DBName, SearchValue) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName);

		request.onsuccess = () => {
			const db = request.result;
			const transaction = db.transaction(DBName, "readonly");
			const objectStore = transaction.objectStore(DBName);
			const getRequest = objectStore.get(Number(SearchValue));

			getRequest.onsuccess = () => {
				const value = getRequest.result;
				resolve(value);
			};

			getRequest.onerror = err => {
				reject(`Error getting data from object store: ${err}`);
			};
		};

		request.onerror = err => {
			reject(`Error opening database: ${err}`);
		};
	});
}
