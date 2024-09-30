importScripts("https://cdn.jsdelivr.net/npm/pako@2.0.4/dist/pako.min.js");

importScripts("/scripts/lib/fxp/fxp.min.js"); //v4.4

importScripts("/scripts/lib/jspath/jsonpath.min.js"); //v1.1.1

const pOptions = {
	ignoreAttributes: true,
	processEntities: false, //default :true
	ignoreDeclaration: true
};

const parser = new fxp.XMLParser(pOptions);

onmessage = async function (event) {
	const { filePath, parentTag } = event.data;

	try {
		const response = await fetch(filePath);
		const compressedData = await response.arrayBuffer();

		const decompressedData = pako.ungzip(new Uint8Array(compressedData), { to: "string" });

		let parsedXML = await parser.parse(decompressedData);

		const result = jsonpath.query(parsedXML, "$.." + parentTag);

		storeBulkDB(parentTag, result);

		postMessage({
			status: "success"
		});
	} catch (error) {
		postMessage({
			status: "error",
			message: `Error processing file ${filePath}: ${error.message}`
		});
	}
};

/**
 * static declarations
 **/
const dbName = "a1800XML";
const dbVersion = 182;

let dbInstance = null; // Cache the database instance */

const dbRequest = indexedDB.open(dbName, dbVersion);

dbRequest.onsuccess = event => {
	dbInstance = event.target.result;
};

/**
 * Functions
 **/

function storeBulkDB(parentTag, dataArray) {
	return new Promise((resolve, reject) => {
		const _transaction = dbInstance.transaction(parentTag, "readwrite");
		const store = _transaction.objectStore(parentTag);
		dataArray.map(item => {
			if (Array.isArray(item)) {
				item.map(e => store.put(e));
			} else if (typeof item === "object" && item !== null) {
				store.put(item);
			}
		});
		_transaction.oncomplete = () => {
			console.log(parentTag, "all results stored in IndexedDB");
			resolve("success");
		};
		_transaction.onerror = event => {
			console.log(parentTag, "failed with errors!");
			reject(event.target.error);
		};
	});
}
