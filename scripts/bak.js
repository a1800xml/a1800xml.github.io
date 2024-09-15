/**
 * @param {object} results
 * **/
function displayResultList(results) {
	/* get ResultsListTarget */
	const resultsList = document.getElementById("result_list_target");
	/* empty */
	resultsList.innerHTML = "";
	/* process each element */
	var divList = [];
	results.forEach(result => {
		/* get GUID Text and Name */
		const rTag = findTagContent(result, ["GUID", "Name", "Text"]);
		/* feed list with items in GUID */
		divList[rTag.GUID] = document.createElement("div");
		divList[rTag.GUID].className = "result_list_row";
		divList.dataGUID = rTag.GUID;

		/* const divElements = ["resDivGUID", "resDivSht", "resDivLnk"];
		const elements = {};

		divElements.forEach(name => {
			elements[name] = document.createElement("div");
		}); */

		const resDivGUID = document.createElement("div");
		const resDivSht = document.createElement("div");
		const resDivLnk = document.createElement("div");
		const resDivShort = document.createElement("span");
		resDivGUID.textContent = rTag.GUID;
		resDivShort.textContent = rTag.Name.length < 2 ? rTag.Text : rTag.Name;
		resDivLnk.className = "material-symbols-outlined btn";
		resDivLnk.dataGUID = rTag.GUID;
		resDivLnk.textContent = "arrow_outward";
		resDivSht.appendChild(resDivShort);
		[resDivGUID, resDivSht, resDivLnk].forEach(ele => {
			divList[rTag.GUID].appendChild(ele);
		});
	});
	divList.forEach(ele => {
		resultsList.appendChild(ele);
	});
}