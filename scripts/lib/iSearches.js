/* internal functions for searching */

/**
 * @param {*} data
 * @param {*} tags
 * @returns object with GUID, Text and Name
 * **/
function findTagContent(data, tags) {
	let result = { GUID: "", Text: "", Name: "" };
	/**
	 * @param {object} node
	 * recursive function
	 * **/
	function search(node) {
		if (tags.includes(node.tag)) {
			if (node.tag === "GUID") {
				result.GUID = node.content;
			} else if (node.tag === "Text") {
				result.Text = node.content;
			} else if (node.tag === "Name") {
				result.Name = node.content;
			}
		}

		// Recursively search children if they exist
		if (node.children && Array.isArray(node.children)) {
			node.children.forEach(child => search(child));
		}
	}

	// Start the search from the root
	search(data);
	return result;
}
