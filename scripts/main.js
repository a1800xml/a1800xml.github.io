/* 
	 <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>	 
	 */

import { clearObjectStore, DBUnload, searchFastDB, getValueDB } from "/scripts/lib/dataBase.js";
/* database modules */

/**
 * @param {Array[primaryKey, value]} results
 * **/
function displayResultList(DBName, results) {
	/* get ResultsListTarget */
	const resultsList = document.getElementById("result_list_target");
	/* empty */
	resultsList.innerHTML = "";
	/* process each element */
	const divList = [];
	results[0].forEach(ele => {
		// why Array of Array?!
		/* feed list with items in GUID */
		divList[ele.primaryKey] = document.createElement("div");
		divList[ele.primaryKey].className = "result_list_row";

		const [resDivGUID, resDivShort, resDivLnk] = ["div", "div", "div"].map(tag => document.createElement(tag));

		resDivGUID.textContent = ele.primaryKey;
		resDivShort.textContent = ele.value;
		resDivLnk.className = "material-symbols-outlined btn";
		resDivLnk.dataset.guid = ele.primaryKey;
		resDivLnk.textContent = "arrow_outward";
		[resDivGUID, resDivShort, resDivLnk].forEach(item => {
			divList[ele.primaryKey].appendChild(item);
		});
	});
	divList.forEach(ele => {
		resultsList.appendChild(ele);
	});
	/* console.log("indb", results); */
	resultsList.addEventListener("click", function (event) {
		// Check if the clicked element has the class 'btn'
		if (event.target && event.target.classList.contains("btn")) {
			const GUID = event.target.dataset.guid;
			GUIDtoDisplay(DBName, GUID);
		}
	});
}

function displayRes(resArray) {
	const dID = document.getElementById("details_values_DATA");
	dID.innerHTML = "";
	resArray["Data"].forEach(e => {
		const div = document.createElement("div");
		e.forEach(ele => {
			const divs = document.createElement("div");
			divs.innerHTML = ele;
			div.appendChild(divs);
		});
		dID.appendChild(div);
	});
	const dIDX = document.getElementById("details_values_XML");
	dIDX.innerHTML = resArray["XML"].replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br>");
	document.querySelectorAll("[id=details_name_asset]").forEach(e => (e.innerHTML = resArray["Head"]["Name"]));
	document.querySelectorAll("[id=details_name_template]").forEach(e => (e.innerHTML = resArray["Head"]["Template"]));
	document.querySelectorAll("[id=details_icon]").forEach(e => (e.src = "/icos/" + resArray["Head"]["Icon"]));
}

/**
 *
 * **/
async function GUIDtoDisplay(DBName, GUID) {
	const value = await getValueDB(DBName, GUID);
	const wXML = new Worker("scripts/worker/wJ2S.js");
	wXML.postMessage(value);
	wXML.onmessage = e => {
		displayRes(e.data);
	};
}

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
	WorkerCount += 1;
	WorkerStatus();
	console.error(searchString, searchTag, parentTag, nonstrict);
	let indDB = await searchFastDB(parentTag, searchString, nonstrict);
	displayResultList(parentTag, indDB);
	WorkerCount -= 1;
	WorkerStatus();
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
	console.warn("Unloading webpage, to free up space, DB will be unloaded!");
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
	const statusElement = document.getElementById("loader_div"); // The element to toggle

	if (WorkerCount > 0) {
		statusElement.style.display = "block"; // Show element (unhide)
	} else {
		statusElement.style.display = "none"; // Hide element
	}
}
