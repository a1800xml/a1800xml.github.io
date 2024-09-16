/**
 * static declarations
 * **/

const dbName = "a1800XML";
const dbVersion = 182;

/* let dbRequest = indexedDB.open(dbName, dbVersion); */

/**
 * dbRequest callback functions
 * **/

/**
 * event from callback
 * error handler
 * **/
/* dbRequest.onerror = event => {
	console.error(`Database error: ${event.target.error?.message}`);
}; */

/**
 * event from callback
 * setup & upgrade handler
 * **/
/* dbRequest.onupgradeneeded = function (event) {
	const db = event.target.result;

	// Object store configuration
	const stores = [
		{
			name: "Asset",
			keyPath: "Values.Standard.GUID",
			indexes: [
				{ name: "StandardName", keyPath: "Values.Standard.Name" },
				{ name: "Template", keyPath: "Template" }
			]
		},
		{ name: "Text", keyPath: "GUID", indexes: [{ name: "Txt", keyPath: "Text" }] },
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
}; */

/**
 *
 *
 * **/
/* dbRequest.onsuccess = function (event) {
	const db = event.target.result;
	console.log("Database opened successfully");
}; */

/**
 * Functions
 * **/

/**
 * @param {string} DBIndex
 * @param {Object} Data
 * **/
function storeInIndexedDB(DBIndex, Data) {
	indexedDB.open(dbName, dbVersion).onsuccess = event => {
		const transaction = event.target.result.transaction([DBIndex], "readwrite");
		const objectStore = transaction.objectStore(DBIndex);
		Data.forEach(item => {
			/* console.log("item", item, typeof item); */
			Array.isArray(item) ? item.forEach(e => objectStore.add(e)) : typeof item === "object" && item !== null ? objectStore.add(item) : null;
		});
		transaction.oncomplete = function () {
			console.log(DBIndex, "All results stored in IndexedDB");
		};
		event.target.result.close();
	};
}

/*

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
	const db = indexedDB.open(dbName);
	const tx = db.transaction(storeName, "readwrite");
	const store = tx.objectStore(storeName);

	return new Promise((resolve, reject) => {
		const clearRequest = store.clear(); // Clear all entries from the object store

		clearRequest.onsuccess = () => {
			resolve("Object store cleared successfully.");
		};
	});
}
 */
