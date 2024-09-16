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
