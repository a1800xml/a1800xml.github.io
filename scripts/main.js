/* 
	 <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>	 
	 */
import * as pako from "https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako.min.js";
/* zlib library to unpack */

import { clearObjectStore, DBUnload, searchDB } from "/scripts/lib/dataBase.js";
/* database modules */

import * as searches from "./lib/iSearches.js";

/**
 * @param {string} storeName
 * **/
async function checkDB(storeName) {
	const db = await openIndexedDB();
	const tx = db.transaction(storeName, "readonly");
	const store = tx.objectStore(storeName);

	return new Promise((resolve, reject) => {
		const countRequest = store.count();

		countRequest.onsuccess = () => {
			resolve(countRequest.result > 0); // Resolve with true if there are entries, otherwise false
		};

		countRequest.onerror = () => {
			reject(countRequest.error); // Reject with the error if the count request fails
		};
	});
}

let WorkerCount = 0;
/**
 * @param {string} file
 * @param {string} parentTag
 * **/
function fetchStore(file, parentTag) {
	const wXML = new Worker("scripts/worker/wFetch.js");
	wXML.postMessage({ filePath: "/xml/" + file });
	WorkerCount += 1;
	WorkerStatus();
	wXML.onmessage = e => {
		const _XML = e.data.xmlData; //xml as string
		console.warn("starting worker");
		const wX2J = new Worker("/scripts/worker/wX2J.js");
		wX2J.postMessage({ xmlData: _XML, parentTag });
		wX2J.onmessage = e => {
			WorkerCount -= 1;
			WorkerStatus();
		};
	};
}

/**
 * @param {string} searchString e.g. Human7
 * @param {string} parentTag e.g. Asset
 * @param {string[]} [searchTag=["GUID","Name"]] e.g. GUID, Name, Text, Template
 * @param {*} nonstrict null/undefined = off; on=off/non-strict
 * this function should be called to perform a search
 * **/

async function perfSearch({ searchString, searchTag, parentTag, nonstrict }) {
	console.error(searchString, searchTag, parentTag, nonstrict);
	let indDB = await searchDB(parentTag, searchString, nonstrict);
}

/* main entry for Search */
window.addEventListener("DOMContentLoaded", function () {
	var form = document.getElementById("search-form");

	const fileIndex = [{ name: "assets.xml.gz", parentTag: "Asset" }];
	fileIndex.forEach(ele => {
		fetchStore(ele.name, ele.parentTag);
	});

	document.addEventListener(
		"submit",
		function (event) {
			event.preventDefault(); // Prevent the default form submission behavior

			const form = event.target; // Get the form element that triggered the submit

			const formData = new FormData(form);
			const formDataObj = Object.fromEntries(formData.entries());
			console.log("formobj", formDataObj);
			perfSearch(formDataObj);
		},
		true
	);
});

/**
 * delete all databases to clean up space after unloading the webpage e.g. closing
 * **/
window.addEventListener("beforeunload", () => {
	DBUnload();
});

// Function to handle the initial setup
function initialize() {
	const selectElement = document.querySelector('select[name="searchFile"]');

	// Set default value
	const defaultValue = selectElement.value;
	handleSelectionChange(defaultValue);

	// Add event listener for changes
	selectElement.addEventListener("change", event => {
		clearObjectStore("Text");
		handleSelectionChange(event.target.value);
	});
}

// Function to handle selection changes
function handleSelectionChange(value) {
	console.log("Selected file:", value);
	fetchStore(value, "Text");
}

// Run initialization when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", initialize);

/**
 * Function to update the visibility of an element based on the WorkerCount
 */
function WorkerStatus() {
	const statusElement = document.getElementById('loader_div');  // The element to toggle

	if (WorkerCount > 0) {
		statusElement.style.display = 'block';  // Show element (unhide)
	} else {
		statusElement.style.display = 'none';  // Hide element
	}
}
