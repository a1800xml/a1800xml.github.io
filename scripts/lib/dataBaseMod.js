/**
 * static declarations
 * **/

const dbName = "a1800XML";
const dbVersion = 182;

/**
 * Functions
 * **/

/**
 * @param {string} DBIndex
 * @param {Object} Data
 * **/
/* async function storeInIndexedDB(DBIndex, Data) {
	indexedDB.open(dbName, dbVersion).onsuccess = event => {
		const transaction = event.target.result.transaction([DBIndex], "readwrite");
		const objectStore = transaction.objectStore(DBIndex);
		Data.forEach(item => {
			Array.isArray(item) ? item.forEach(e => objectStore.add(e)) : typeof item === "object" && item !== null ? objectStore.add(item) : null;
		});
		transaction.oncomplete = function () {
			console.log(DBIndex, "All results stored in IndexedDB");
		};
		event.target.result.close();
	};
} */

async function storeInIndexedDB(DBIndex, Data) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, dbVersion);
		request.onsuccess = event => {
			const db = event.target.result;
			const transaction = db.transaction([DBIndex], "readwrite");
			const objectStore = transaction.objectStore(DBIndex);

			// Add all items to the object store
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
}