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
	resultsList.innerHTML = "";
	const divList = [];
	results.forEach((ele) => {
		// why Array of Array?!
		/* feed list with items in GUID */
		divList[ele.primaryKey] = document.createElement("div");
		divList[ele.primaryKey].className = "result_list_row";

		const [resDivGUID, resDivShort, resDivLnk] = ["div", "div", "div"].map((tag) => document.createElement(tag));

		resDivGUID.textContent = ele.primaryKey;
		resDivShort.textContent = ele.value;
		resDivLnk.className = "material-symbols-outlined btn";
		resDivLnk.dataset.guid = ele.primaryKey;
		resDivLnk.textContent = "arrow_outward";
		[resDivGUID, resDivShort, resDivLnk].forEach((item) => {
			divList[ele.primaryKey].appendChild(item);
		});
	});
	/* creating fragments instead of appending each child to reduce DOM reload */
	const fragment = document.createDocumentFragment();
	divList.forEach((ele) => {
		fragment.appendChild(ele);
	});
	resultsList.appendChild(fragment);
	/* console.log("indb", results); */
	resultsList.addEventListener("click", (event) => {
		const GUID = event.target.dataset.guid;
		GUIDtoDisplay(DBName, GUID);
	});
}

function displayRes(resArray) {
	const dID = document.getElementById("details_values_DATA");
	let dataHTML = "";
	resArray["Data"].forEach((e) => {
		dataHTML += `<div>${e.map((ele) => `<div>${ele}</div>`).join("<div></div>")}</div>`;
	});
	dID.innerHTML = dataHTML;
	const dIDX = document.getElementById("detail_xml");
	dIDX.innerHTML = resArray["XML"].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>").replace(/&gt;(.*?)&lt;/g, (match, p1) => {
		return `&gt;<span style="color:pink;">${p1}</span>&lt;`;
	});
	
	document.getElementById("details_name_asset").innerHTML = resArray["Head"]["Name"];
	document.getElementById("details_name_template").innerHTML = resArray["Head"]["Template"];
	if (resArray["Head"]["Icon"]) {
		document.getElementById("details_icon").src = "/icos/" + resArray["Head"]["Icon"];
		document.getElementById("details_icon").style.display = "block";
	} else {
		document.getElementById("details_icon").style.display = "none";
	}
}

/**
 *
 * **/
async function GUIDtoDisplay(DBName, GUID) {
	console.error("guidtodisplkay", DBName, GUID);
	const value = await getValueDB(DBName, GUID);
	console.error("guidtodisplkay", value);
	const wXML = new Worker("scripts/worker/wJ2S.js");
	wXML.postMessage(value);
	wXML.onmessage = (e) => {
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
	wXML.onmessage = (e) => {
		//console.log("new status", e);
		checkDB(parentTag)
			.then((dbVal) => {
				const sKey = parentTag.replace(/[^a-zA-Z0-9\-]/g, "_");
				document.getElementById("DBCount").dataset[sKey] = dbVal;
			})
			.catch((err) => {
				console.error("Error checking DB:", err);
			});
		WorkerCount -= 1;
		WorkerStatus();
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
	//console.log("db fetching");
	/* console.error(searchString, searchTag, parentTag, nonstrict); */
	let indDB = await searchFastDB(parentTag, searchString, nonstrict);
	console.log("db fetch completed");
	displayResultList(parentTag, indDB);
	WorkerCount -= 1;
	WorkerStatus();
}

/* main entry for Search */
window.addEventListener("DOMContentLoaded", function () {
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
	document.querySelector('select[name="searchFile"]').addEventListener("change", (event) => {
		clearObjectStore("Text");
		handleSelectionChange();
		fetchStore(event.target.value, "Text");
	});
	document.getElementById("reload_db").addEventListener("click", () => {
		console.log("reloadevent");
		DBUnload();
		window.location.reload();
	});

	checkFetch();
});

function checkFetch() {
	const fileIndex = [
		{ name: "assets.xml.gz", parentTag: "Asset" },
		{ name: "datasets.xml.gz", parentTag: "DataSet" },
		{ name: "templates.xml.gz", parentTag: "Template" },
		{ name: "properties.xml.gz", parentTag: "Group[?(@.Name)]" },
		{ name: "properties-toolone.xml.gz", parentTag: "Property" },
		{ name: document.querySelector('select[name="searchFile"]').value, parentTag: "Text" },
	];
	fileIndex.forEach((ele) => {
		checkDB(ele.parentTag).then((dbVal) => {
			if (dbVal == 0) {
				//console.warn("init of checkFetch", ele.parentTag);
				fetchStore(ele.name, ele.parentTag);
			} else {
				//console.error("DBCount = ", ele.parentTag, dbVal);
				const sKey = ele.parentTag.replace(/[^a-zA-Z0-9\-]/g, "_").toLowerCase();
				document.getElementById("DBCount").dataset[sKey] = dbVal;
			}
		});
	});
}

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

const targetNode = document.getElementById("DBCount");
const config = { attributes: true, childList: false, subtree: false };

// Callback function to execute when mutations are observed
const callback = function (mutationsList) {
	for (let mutation of mutationsList) {
		if (
			mutation.type === "attributes" &&
			mutation.attributeName === "data-" + document.getElementsByClassName("search_tab active_search_tab")[0].dataset["parenttag"]
		) {
			const newValue = targetNode.getAttribute("data-" + document.getElementsByClassName("search_tab active_search_tab")[0].dataset["parenttag"]);
			targetNode.innerHTML = newValue;
		}
	}
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);
