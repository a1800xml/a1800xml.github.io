importScripts("https://cdn.jsdelivr.net/npm/pako@2.0.4/dist/pako.min.js");

onmessage = async function (event) {
	const { filePath } = event.data;

	try {
		const response = await fetch(filePath);
		const compressedData = await response.arrayBuffer();

		const decompressedData = pako.ungzip(new Uint8Array(compressedData), { to: "string" });

		postMessage({
			status: "success",
			xmlData: decompressedData
		});
	} catch (error) {
		postMessage({
			status: "error",
			message: `Error processing file ${filePath}: ${error.message}`
		});
	}
};
