importScripts("/scripts/lib/fxp/fxp.min.js"); //v4.4

importScripts("/scripts/lib/jspath/jsonpath.min.js"); //v1.1.1

importScripts("/scripts/lib/dataBaseMod.js");

onmessage = async function (event) {
	const pOptions = {
		ignoreAttributes: true,
		//allowBooleanAttributes: true,
		//parseNodeValue: false,
		//parseAttributeValue: false, //no attributes in anno
		trimValues: true,
		processEntities: false, //default :true
		ignoreDeclaration: true
	};
	const { xmlData, parentTag } = event.data;
	const parser = new fxp.XMLParser(pOptions);
	let parsedXML = await parser.parse(xmlData);
	const result = jsonpath.query(parsedXML, "$.." + parentTag);
	await storeInIndexedDB(parentTag, result);
	postMessage({
		status: "success"
	});
};
