importScripts("/scripts/lib/fxp/fxp.min.js"); //v4.4
importScripts("/scripts/lib/jspath/jsonpath.min.js"); //v1.1.1

/**
 * 3 Values to find:
 * Icon
 * Name
 * Template
 * @param {object} Data
 * **/
function displayHead(Data) {
	const result = [];
	result["Icon"] = jsonpath.query(Data, "$..IconFilename");
	result["Template"] = jsonpath.query(Data, "$..Template");
	result["Name"] = jsonpath.query(Data, "$..Name") || jsonpath.query(Data, "$..Text");
	return result;
}

/**
 * @param {object} Data
 * **/
function displayData(Data) {
	const jPathTable = [];

	function buildJPath(jsonObj, currentPath = "") {
		if (typeof jsonObj === "object" && jsonObj !== null) {
			for (const key in jsonObj) {
				const newPath = currentPath ? `${currentPath}.${key}` : key;
				buildJPath(jsonObj[key], newPath);
			}
		} else {
			jPathTable.push([currentPath, jsonObj]);
		}
	}
	buildJPath(Data);
	return jPathTable;
}

/**
 * @param {object} Data
 * **/
function displayXML(Data) {
	const bOptions = {
		ignoreAttributes: false,
		format: true,
		suppressEmptyNode: true,
		indentBy: "   "
	};
	const xBuilder = new fxp.XMLBuilder(bOptions);
	const string = xBuilder.build(Data);
	return string;
}

/**
 * @param {object} Data
 * **/
function display3D(Data) {
	return "Under construction lol";
}

onmessage = event => {
	/* console.log(event.data); */
	const rArray = [];
	rArray["Head"] = displayHead(event.data);
	rArray["Data"] = displayData(event.data);
	rArray["XML"] = displayXML(event.data);
	rArray["3d"] = display3D(event.data);
	postMessage(rArray);
};
