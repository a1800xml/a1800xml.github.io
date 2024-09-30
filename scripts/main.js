/* 
	 <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>	 
	 */

import { clearObjectStore, DBUnload, searchFastDB, getValueDB, checkDB } from "/scripts/lib/dataBase.js";
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
	/* creating fragments instead of appending each child to reduce DOM reload */
	const fragment = document.createDocumentFragment();
	divList.forEach(ele => {
		fragment.appendChild(ele);
	});
	resultsList.appendChild(fragment);
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
	let dataHTML = "";
	resArray["Data"].forEach(e => {
		dataHTML += `<div>${e.map(ele => `<div>${ele}</div>`).join("")}</div>`;
	});
	dID.innerHTML = dataHTML;
	const dIDX = document.getElementById("details_values_XML");
	dIDX.innerHTML = resArray["XML"].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
	document.querySelectorAll("[id=details_name_asset]").forEach(e => (e.innerHTML = resArray["Head"]["Name"]));
	document.querySelectorAll("[id=details_name_template]").forEach(e => (e.innerHTML = resArray["Head"]["Template"]));
	resArray["Head"]["Icon"]
		? document.querySelectorAll("[id=details_icon]").forEach(e => {
				e.src = "/icos/" + resArray["Head"]["Icon"];
				e.style.display = "block";
		  })
		: document.querySelectorAll("[id=details_icon]").forEach(e => (e.style.display = "none"));
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
 * @param {string} file
 * @param {string} parentTag
 * **/

function fetchStore(file, parentTag) {
	const wXML = new Worker("/scripts/worker/wF2DB.js");
	wXML.postMessage({ filePath: "/xml/" + file, parentTag });
	WorkerCount += 1;
	WorkerStatus();
	wXML.onmessage = e => {
		console.log("new status", e);
		WorkerCount -= 1;
		WorkerStatus();
	};
	const testDB = checkDB(parentTag);
	console.log(testDB);
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
	/* console.error(searchString, searchTag, parentTag, nonstrict); */
	let indDB = await searchFastDB(parentTag, searchString, nonstrict);
	displayResultList(parentTag, indDB);
	WorkerCount -= 1;
	WorkerStatus();
}

/* main entry for Search */
window.addEventListener("DOMContentLoaded", function () {
	/* var form = document.getElementById("search-form"); */
	document.addEventListener(
		"submit",
		function (event) {
			event.preventDefault(); // Prevent the default form submission behavior

			const form = event.target; // Get the form element that triggered the submit

			const formData = new FormData(form);
			const formDataObj = Object.fromEntries(formData.entries());
			/* console.log("formobj", formDataObj); */
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
	const fileIndex = [
		{ name: "assets.xml.gz", parentTag: "Asset" }/*,
		{ name: "datasets.xml.gz", parentTag: "DataSet" } ,
		{ name: "templates.xml.gz", parentTag: "Template" },
		{ name: "properties.xml.gz", parentTag: "Group[?(@.Name)]" },
		{name : "properties-toolone.xml.gz", parentTag: "Property"}*/
	];
	fileIndex.forEach(ele => {
		fetchStore(ele.name, ele.parentTag);
	});

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
let WorkerCount = 0;
function WorkerStatus() {
	const statusElement = document.getElementById("loader_div"); // The element to toggle

	if (WorkerCount > 0) {
		statusElement.style.display = "block"; // Show element (unhide)
	} else {
		statusElement.style.display = "none"; // Hide element
	}
}
