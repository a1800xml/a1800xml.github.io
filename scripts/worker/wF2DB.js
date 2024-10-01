importScripts("https://cdn.jsdelivr.net/npm/pako@2.0.4/dist/pako.min.js");
importScripts("/scripts/lib/fxp/fxp.min.js"); // v4.4
importScripts("/scripts/lib/jspath/jsonpath.min.js"); // v1.1.1

/**
 * Constants
 */
const DB_NAME = "a1800XML";
const DB_VERSION = 182;

const parserOptions = {
	ignoreAttributes: true,
	processEntities: false, // default: true
	ignoreDeclaration: true,
};

const parser = new fxp.XMLParser(parserOptions);

/**
 * Main Function of Worker
 * **/

onmessage = async (event) => {
	const { filePath, parentTag } = event.data;

	try {
		// Fetch and decompress the file
		const response = await fetch(filePath);
		const compressedData = await response.arrayBuffer();
		const decompressedData = pako.ungzip(new Uint8Array(compressedData), { to: "string" });

		// Parse the decompressed data and query with JSONPath
		const parsedXML = parser.parse(decompressedData);
		const result = jsonpath.query(parsedXML, `$..${parentTag}`);

		// Store the results in IndexedDB
		indexedDB.open(DB_NAME, DB_VERSION).onsuccess = async (event) => {
			try {
				const dbInstance = event.target.result;
				await storeDataInDB(parentTag, result, dbInstance);
				postMessage({ status: "success" });
			} catch (error) {
				handleError("Error storing data in IndexedDB", error);
			}
		};
	} catch (error) {
		handleError(`Error processing file ${filePath}`, error);
	}
};

/**
 * Utility Functions
 */

async function storeDataInDB(storeName, dataArray, dbInstance) {
	return new Promise((resolve, reject) => {
		const transaction = dbInstance.transaction(storeName, "readwrite");
		const store = transaction.objectStore(storeName);

		dataArray.forEach((item) => {
			if (Array.isArray(item)) {
				item.forEach((element) => store.put(element));
			} else if (typeof item === "object" && item !== null) {
				store.put(item);
			}
		});

		transaction.oncomplete = () => {
			console.log(`${storeName}: All data stored in IndexedDB`);
			resolve("success");
		};

		transaction.onerror = (event) => {
			console.error(`${storeName}: Transaction failed`);
			reject(event.target.error);
		};
	});
}

// Handles error reporting
function handleError(message, error) {
	postMessage({
		status: "error",
		message: `${message}: ${error.message}`,
	});
}
