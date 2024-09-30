// ------- GLOBALS -------

// for rendering assets and templates values
let assetValues = new Array();

// tags to find GUID and make references
let assetTags = new Array();

// actions history
let actions = new Array();

//let DATA_URL = "https://web.archive.org/web/20240825015319/https://e-technologie.com.pl/";
let DATA_URL = "";

// ------- FUNCTIONS -------

function actionSend(action) {
	return fetch("action.php?" + action)
		.then(response => response.json())
		.then(response => {
			if (response.action == "contact") getID("response").innerHTML = response.text;
			else if (response.action == "toggle") {
				//if (response.target) getID(response.target).outerHTML = response.content;
				if (response.target == "group-tree") {
					//        getID(response.target).outerHTML = response.content;
					toggleEmtyGroups();
					if (getID("template-list")) {
						// after empty status change
						if (getID("template-list").getAttribute("data-type") == "search") window.location.reload(); // list after search
						if (getID("template-list").getAttribute("data-type") == "templates") actionSend("action=template&item=null"); // browsing list
					}
				}

				if (response.target == "preview") {
					text = querySA("p.text", getID("assets-list"));
					for (el of text) {
						if (el.style.display != "none") el.style.display = "none";
						else el.style.display = "block";
					}
				}
			} else {
				if (response.target == "search") {
					if (getID("search-counter")) window.location.reload();
				} else createTabs(response);
			}
		})
		.catch(error => {
			console.error(error);
		});
}

/*
async function getResult(action) {
  try {
    const result = await actionSend(action);

    return result; // return the result to the caller
  } catch (error) {
    console.error(error);
    return null; // return null if there's an error
  }
}
*/

function checkGUID(guid) {
	if (assetTags.hasOwnProperty(guid)) return assetTags[guid];
	else return null;
}

function createTabs(response) {
	let source = "";

	// tags to xml / snippet if exists
	if (response.data) for (const key in response.data) assetTags[key] = response.data[key];

	if (response.xml) source = JSON.parse(response.xml);

	if (getID("img-start")) getID("img-start").style.display = "none";

	if (response.target && response.target != "dataset") getID(response.target.replace("asset-", "") + "Tab").click();
	else getID("dataTab").click();

	if (response.action == "asset" || response.action == "template") {
		getID("tab").style.display = "block";
		getID("tab-title").style.display = "block";
		getID("tab-title").innerHTML = response.title;
		getID("asset-data").innerHTML = "";
	} else {
		getID("tab").style.display = "none";
		getID("tab-title").style.display = "none";
		getID("asset-data").innerHTML = response.title;
	}

	// data tab - asset list & other content
	getID("asset-data").insertAdjacentHTML("beforeend", response.path + response.content);

	// data tab - values
	if (source)
		if (response.action == "template") sourceToPath(source);
		else dataPath(source);

	let values = "";
	let img = new Array();

	for (let array of assetValues) {
		values += '<div class="row"><div class="key">' + array[0] + '</div><div class="value">' + array[1] + "</div></div>";

		if (array[0] == "Values/Standard/IconFilename")
			getID("tab-title").insertAdjacentHTML(
				"afterbegin",
				'<span class="item-picture-span"><img class="item-picture" src="' +
					DATA_URL +
					array[1].replace(".png", "_0.png") +
					'" onError="replaceImg(this)"></span>'
			);

		//  if (array[1].match('.png') || array[1].match('.jpg') || array[1].match('.prp') || array[1].match('.cfg') || array[1].match('.ifo'))
		//    if (!img.includes(array[1])) img.push(array[1]);
	}

	if (getID("back")) {
		if (actions.length > 1)
			getID("back").innerHTML =
				"<button onClick=\"actions.pop();actionSend('" +
				actions[actions.length - 2] +
				'\')" class="button-small"><i class="fa fa-chevron-left"></i> back</button>';
	}

	assetValues = new Array(); // reset global

	if (values)
		getID("asset-data").insertAdjacentHTML(
			"beforeend",
			'<h3>Values: <div class="filter-system right"><label for="toggleTips"><input type="checkbox" name="toggleTips" value="1" id="toggleTips" onClick="toggleTips(this,\'tips\');"> toggle hints</label></div></h3><div class="data">' +
				values +
				"</div>"
		);

	// xml snippet tab
	if (response.xml && source) {
		getID("asset-xml").innerHTML =
			response.path.replace("</i></div>", " / XML source</i></div>") +
			'<div class="txt-right"><button onClick=copy2C() class="button-small"><i class="fa fa-fw fa-file-text-o"></i> Copy</button></div>';
		getID("asset-xml").insertAdjacentHTML("beforeend", createSnippet(source, response.action));
	} else getID("asset-xml").innerHTML = "no XML data found...";

	// texts tab
	if (response.txt) getID("asset-txt").innerHTML = response.path.replace("</i></div>", " / Texts</i></div>") + response.txt;
	else getID("asset-txt").innerHTML = "no Texts data found...";

	// img tab

	log(Object.keys(response.files));

	if (Object.keys(response.files).length)
		// "array here must be"
		getID("asset-img").innerHTML =
			response.path.replace("</i></div>", " / Images</i></div>") + "<h3>Graphics files:</h3><p><br></p>" + loadIMG(response.files);
	else getID("asset-img").innerHTML = "no IMG data found...";

	if (response.action == "dataset" && response.data) {
		log(response.data);
		window.scrollTo({ top: document.getElementsByName(response.data)[0].offsetTop - getID("top").offsetHeight - 70, behavior: "smooth" });
		getID("up").insertAdjacentHTML("beforeend", '<button class="data-datasets button-small left">Back to DataSets list</button>');
	} else if (queryS(".data-datasets", getID("up"))) queryS(".data-datasets", getID("up")).remove();
}

function openTab(tab, el = null) {
	let content = document.getElementsByClassName("tab-content");
	for (let i = 0; i < content.length; i++) content[i].style.display = "none";

	let links = document.getElementsByClassName("tablink-active");
	for (let i = 0; i < links.length; i++) links[i].className = "tablink";

	getID(tab).style.display = "block";
	el.className = "tablink-active";
}

function dataPath(source) {
	let goto = queryS("[data-type]").getAttribute("data-type");

	for (let data of source) {
		let value = [];
		value[0] = data.AssetPath.replace(/\/\d+\//g, "/");
		value[1] = data.AssetValue;

		if (data.AssetPath.includes("Template"))
			value[1] = '<a data-guid="' + data.AssetValue + '" class="data-template" data-goto="' + goto + '">' + data.AssetValue + "</a>";
		else if (data.AssetValue != goto.replace("asset-", "")) {
			if ((title = checkGUID(data.AssetValue)))
				value[1] =
					'<span class="tooltip"><a data-guid="' +
					data.AssetValue +
					'" class="data-asset" data-goto="' +
					goto +
					'">' +
					data.AssetValue +
					"</a><a onClick=\"window.open(location.pathname + '?itemSearch=" +
					data.AssetValue +
					'\', \'_blank\');" class="link-ext"><i class="fa fa-external-link-square"></i></a><span class="tooltiptext">' +
					title +
					"</span></span>"; // removes array numbers like /0/
		}

		assetValues.push(value);
	}
}

// crate X-Path strings -> assetValues() // DATA tab

function sourceToPath(source, subpath = "") {
	let path = "";
	for (let key in source) {
		if (source[key] instanceof Array) {
			for (let array in source[key]) {
				path += sourceToPath(new Object(source[key][array]), subpath + key + "/");
			}
		} else if (typeof source[key] === "object") {
			if (Object.keys(source[key]).length) {
				path += sourceToPath(new Object(source[key]), subpath + key + "/");
			}
		} else {
			let value = [];
			(value[0] = subpath + key), (value[1] = source[key]);
			let goto = queryS("[data-type]").getAttribute("data-type");

			if (key == "Template" || key == "TemplateName")
				value[1] = '<a data-guid="' + source[key] + '" class="data-template" data-goto="' + goto + '">' + source[key] + "</a>";
			else if (source[key] != goto.replace("asset-", "")) {
				if ((title = checkGUID(source[key])))
					value[1] =
						'<span class="tooltip"><a data-guid="' +
						source[key] +
						'" class="data-asset" data-goto="' +
						goto +
						'">' +
						source[key] +
						'</a><span class="tooltiptext">' +
						title +
						"</span></span>";
			}

			assetValues.push(value);
		}
	}

	return path;
}

function showGlb(files, file) {
	let images = "";

	for (let glb of files) {
		if (glb.indexOf(".glb") !== -1) {
			images +=
				'<model-viewer class="viewer" src="' +
				DATA_URL +
				glb +
				'" auto-rotate rotation-per-second="200%" camera-controls touch-action="pan-y" shadow-intensity="0.25" camera-target="0m 1m 0m" interaction-prompt="none" exposure="0.70"><div slot="progress-bar"></div></model-viewer>';
			images += '<button type="button" class="button-mini" onClick=download(\'' + glb + '\')><i class="fa fa-floppy-o"></i> Download</button>';
			images += "<p><i>model file:</i><br><a href='" + DATA_URL + glb + "' target=_blank>" + glb + "</a></p>";
		} else {
			if (glb.indexOf("_diff_") !== -1)
				images +=
					'<img class="img" style="max-width:460px" src="' +
					DATA_URL +
					glb +
					"\" onError=\"this.style.display='none'\"><p><i>diffusion file:</i><br><a href='" +
					glb +
					"' target=_blank>" +
					glb +
					"</a></p>";
			if (glb.indexOf("_norm_") !== -1)
				images +=
					'<img class="img" style="max-width:460px" src="' +
					DATA_URL +
					glb +
					"\" onError=\"this.style.display='none'\"><p><i>normal map file:</i><br><a href='" +
					glb +
					"' target=_blank>" +
					glb +
					"</a></p>";
		}
	}
	images += "<p><i>PRP filename:</i><br>" + file + "</p>";

	return images;
}

function loadIMG(files = null) {
	let images = "";
	let count = 0;

	for (pic in files)
		if (pic.toLowerCase().indexOf("cfg") != -1 || pic.toLowerCase().indexOf("prp") != -1) {
			images += "<div>";
			count++;
			images += "<p><b>variant #" + count + "</b></p>";
			if (pic.toLowerCase().indexOf("cfg") != -1) {
				//        images += "<p><h3>models for CFG file:</h3><a href='" + pic + "' target=_blank>" + pic + "</a><br></p>";
				images += "<p><h3>models for CFG file:</h3>" + pic + "<br></p>";
				//log (files[pic][file]);
				for (file in files[pic]) images += showGlb(files[pic][file], file);
			} else {
				images += showGlb(files[pic], pic);
			}
			images += "</div>";
		} else
			images +=
				'<div><p><img class="img" src="' +
				DATA_URL +
				pic +
				'" onError="this.style.display=\'none\'"><p><i>filename:</i><br><b>' +
				pic +
				"</b></p></div>";

	return images;
}

// not used
function createLink(guid, name) {
	let a = document.createElement("a");
	a.innerHTML = name;
	a.setAttribute("data-item", guid);
	a.setAttribute("class", "data-asset");
	return a;
}

function selectDataset() {
	//log ("action=dataset&item=" + getID("dataset").value);
	actionSend("action=dataset&item=" + getID("dataset").value);
}

function copy2C(copyText = "") {
	if (!copyText) copyText = getID("snippet").textContent;

	navigator.clipboard.writeText(copyText);
	showMessage();
}

function copyUrl(guid) {
	navigator.clipboard.writeText("https://web.archive.org/web/20240825015319/https://a1800.net/?itemSearch=" + guid);
	showMessage();
}

function createSnippet(source, type) {
	if (type == "template")
		return '<pre id="snippet"><code>&lt;Template&gt;\n' + JSONtoShowXML(source, 1) + "&lt;/Template&gt;</code></pre>"; // JSONtoShowXML
	else return '<pre id="snippet"><code>&lt;Asset&gt;\n' + JSONtoShowXML(JsonArray(source), 1) + "&lt;/Asset&gt;</code></pre>"; //JSONtoShowXML
}

/*
function JsonArray(list) {
  var jsonObject = {};

  for (var i = 0; i < list.length; i++) {
    var path = list[i]["AssetPath"].split('/');
    var value = list[i]["AssetValue"];
    var currentObj = jsonObject;

    for (var j = 0; j < path.length - 1; j++) {
      var key = path[j];
      if (!currentObj.hasOwnProperty(key)) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }

    var lastKey = path[path.length - 1];
    currentObj[lastKey] = value;
  }

  return jsonObject;
}

*/

function JsonArray(data) {
	var result = {};

	data.forEach(function (item) {
		var assetPath = item["AssetPath"];
		var assetValue = item["AssetValue"];
		var keys = assetPath.split("/");
		var currentObject = result;

		keys.forEach(function (key, index) {
			if (!currentObject.hasOwnProperty(key)) {
				if (index === keys.length - 1) {
					currentObject[key] = assetValue;
				} else {
					if (isNaN(parseInt(keys[index + 1]))) {
						currentObject[key] = {};
					} else {
						currentObject[key] = [];
					}
				}
			} else if (Array.isArray(currentObject[key])) {
				if (index === keys.length - 1) {
					var lastElementIndex = currentObject[key].length;
					currentObject[key][lastElementIndex] = assetValue;
				} else {
					currentObject[key].push();
				}
			}

			currentObject = currentObject[key];
		});
	});

	return result;
}

function JSONtoShowXML(obj, count) {
	let xml = "";
	let indent = "";
	for (let i = 0; i < count; i++) indent += "\t";

	for (let el in obj) {
		//log (el + " " + typeof obj[el]);
		if (obj[el] instanceof Array) {
			for (let array in obj[el]) {
				count++;
				xml += indent + "&lt;" + el + "&gt;</span>\n";
				xml += JSONtoShowXML(new Object(obj[el][array]), count);
				xml += indent + "&lt;/" + el + "&gt;\n";
				count--;
			}
		} else if (typeof obj[el] == "object") {
			if (Object.values(obj[el]).length) {
				count++;
				xml += indent + "&lt;" + el + "&gt;\n";
				xml += JSONtoShowXML(new Object(obj[el]), count);
				xml += indent + "&lt;/" + el + "&gt;\n";
				count--;
			} else {
				xml += indent + "&lt;" + el + "/&gt;\n";
			}
		} else {
			if (obj[el]) {
				let goto = queryS("[data-type]").getAttribute("data-type");
				let title = "";

				if (el == "Template" || el == "TemplateName")
					obj[el] = '<a data-guid="' + obj[el] + '" class="data-template" data-goto="' + goto + '">' + obj[el] + "</a>";
				else if (obj[el] != goto.replace("asset-", ""))
					if ((title = checkGUID(obj[el])))
						obj[el] = '<a data-guid="' + obj[el] + '" class="data-asset" data-goto="' + goto + '">' + obj[el] + "</a>";

				xml += indent + "&lt;" + el + '&gt;<span class="tag-el">' + obj[el] + "</span>&lt;/" + el + "&gt;\n";

				if (title) xml += indent + '<span class="tag-name">&lt;!--' + title + "--&gt;</span>\n";
			} else {
				xml += indent + "&lt;" + el + "/&gt;\n";
			}
		}
	}
	//xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
	return xml;
}

function ShowXML(list) {
	let xml = "";
	for (let pair of list) {
		xml += generateXMLNode(pair.AssetPath.split("/"), pair.AssetValue);
	}
	return xml;
}

function generateXMLNode(keys, value) {
	let xml = "";
	if (keys.length > 0) {
		let key = keys.shift();
		xml += "&lt;" + key + "&gt;\n" + generateXMLNode(keys, value) + "&lt;/" + key + "&gt;\n";
	} else {
		xml += value + "\n";
	}
	return xml;
}

function ShowXML2(list, count = 0) {
	let xml = "";
	for (let pair of list) {
		let keys = pair.AssetPath.split("/");
		let value = pair.AssetValue;

		xml += "\t";
		for (let key of keys) {
			xml += "&lt;" + key + "&gt;\n";
		}
		xml += value;
		for (let key of keys) {
			xml += "&lt;/" + key + "&gt;\n";
		}
		xml += "\n";
	}

	return xml;
}

function assetsExport() {
	const table = getID("assets-list");
	//	let dataCSV = "\xEF\xBB\xBF";
	let dataCSV = "";
	let fname = "";

	for (const item of querySA("li", table))
		if (queryS(".guid", item).innerText != "GUID") {
			dataCSV += queryS(".guid", item).innerText + ';"' + queryS(".data-asset", item).innerText + '"';
			if (queryS(".template-name", item)) dataCSV += ';"' + queryS(".template-name", item).innerText + '"';
			else dataCSV += ";";
			if (queryS(".ext-info", item)) dataCSV += ';"' + queryS(".ext-info", item).innerText.replace(": ", '";"') + '"';
			if (queryS(".text", item)) dataCSV += ';"' + queryS(".text", item).innerText + '"';
			dataCSV += "\n";
		}

	let blob = new Blob([dataCSV], { type: "text/csv" });

	let csv = document.createElement("a"); // a href
	csv.href = window.URL.createObjectURL(blob);

	if (getID("tab-title") && getID("tab-title").innerText) fname = queryS("b", getID("tab-title")).innerText.replace("Template: ", "");
	else fname = "from-search";

	csv.download = "assets-list-" + fname + ".csv";
	//if (filename) csv.download = filename +'-' + csv.download;

	csv.click();
}

function download(filename) {
	let file = document.createElement("a"); // a href
	file.href = DATA_URL + filename;
	file.download = filename;
	file.click();
}

// for filer must be data-table defined on list (<ul>)
// for counter must be ID defined with pattern "search-counter-" + data-table value
// if results has header, class for this row must contain "header" in the name

function SearchTable(table = null) {
	let filter = getID("search-filter").value.toUpperCase();
	let rowsList = querySA("[data-table]", getID("asset-data"));

	for (let rows of rowsList) {
		let count = 0;
		for (let row of getTag("li", rows))
			if (row.className.indexOf("header") == -1 || !row.className.indexOf("header")) {
				row.classList.remove("hidden");

				if (filter.indexOf("-") === 0) {
					if (row.innerText.toUpperCase().indexOf(filter.replace("-", "")) > -1 && filter.length > 1) row.style.display = "none";
					else {
						count++;
						row.style.display = "";
					}
				} else {
					if (row.innerText.toUpperCase().indexOf(filter) > -1) {
						count++;
						row.style.display = "";
					} else row.style.display = "none";
				}
			}
		if (getID("more")) getID("more").style.display = "none";
		let counter = getID("search-counter-" + rows.getAttribute("data-table"));

		if (counter) counter.innerHTML = count;
	}
}

function toggleValue(el, action) {
	actionSend("action=toggle&item=" + el.name + "&value=" + el.value);
}

function toggleMode() {
	document.body.classList.toggle("dark-mode");
	actionSend("action=toggle&item=mode");
}

function toggleTips() {
	let toggler = querySA(".tooltiptext", getID("asset-data"));
	for (let tips of toggler) {
		tips.classList.toggle("tooltiptext-show");
	}
	actionSend("action=toggle&item=mode");
}

function toggleEmtyGroups() {
	let toggler = querySA(".data-template", getID("group-tree"));

	for (let el of toggler)
		if (el.parentElement.innerHTML.indexOf("(0)") != -1) {
			if (getID("includeEmpty").checked) el.parentElement.style.display = "";
			else el.parentElement.style.display = "none";
		}
}

function toggleGroups() {
	let toggler = document.getElementsByClassName("node");
	let ico = getID("toggle").querySelector(".fa");

	if (toggler[0].classList.contains("node-down"))
		for (let el of toggler) {
			//      el.parentElement.querySelector(".node-group").classList.toggle("node-active");
			el.parentElement.querySelector(".node-group").classList.remove("node-active");
			el.classList.remove("node-down");
			ico.style = "transform: rotate(0deg)";
		}
	else
		for (let el of toggler) {
			el.parentElement.querySelector(".node-group").classList.add("node-active");
			el.classList.add("node-down");
			ico.style = "transform: rotate(180deg)";
		}
}

function showMore() {
	getID("more").style.display = "none";
	for (let line of querySA(".hidden", getID("asset-list"))) line.classList.remove("hidden");
}

function checkSearch() {
	/*
  let count = getID("search-counter-assets");
  let count_tpl = getID("search-counter-tpl");
  //let assets_list = getID("assets-list");

  if (count) count = count.innerText;
  if (count_tpl) count_tpl = count_tpl.innerText;

  if (count || count_tpl)
    if ((count==1 && assets_list && !count_tpl) || (!count && count_tpl==1))
    {
      let asset = queryS("a[data-guid]",getID("asset-data"));
      const item = asset.getAttribute("data-guid");
      const action = asset.className.substring(asset.className.indexOf('-') + 1);
      actionSend("action=" + action + "&item=" + item + "&search=-1");
    }
  else
*/

	if ((search = getID("search-results"))) return search.getAttribute("data-search");
}

function sendForm(e) {
	var data = getID("form");
	var query = "";

	if (data) {
		for (i = 0; i < data.length; i++)
			if (data.elements[i].type != "button") {
				if (data.elements[i].type == "checkbox" && data.elements[i].value == 1) {
					if (data.elements[i].checked) query += data.elements[i].name + "=1&";
					else query += data.elements[i].name + "=0&";
				} else query += data.elements[i].name + "=" + data.elements[i].value + "&";
			}
		query += e.name + "=" + e.value + "&";

		actionSend(query);
	}
}

function Init() {
	// hide empty templates
	toggleEmtyGroups();

	// open default tab
	getID("dataTab").click();

	// open asset card if only one result
	//checkSearch();

	// check if adanced search used
	fields = querySA("input, select", getID("advanced-search"));
	for (el of fields)
		if (el.value) {
			tip("filter-ext");
			showAdv();
			break;
		}
}

// ------- FUNCTIONS END -------

// ------- CORE FUNCTIONS MISC -------

function log(data) {
	console.dir(data);
}

function getID(id) {
	return document.getElementById(id);
}

function getTag(selector, el) {
	if (el) return el.getElementsByTagName(selector);
	else return document.getElementsByTagName(selector);
}

function queryS(selector, el = null) {
	if (el) return el.querySelector(selector);
	else return document.querySelector(selector);
}

function querySA(selector, el = null) {
	if (el) return el.querySelectorAll(selector);
	else return document.querySelectorAll(selector);
}

function test() {
	log("I'm HERE!");
}

function clearNode(id) {
	const list = getID(id);
	while (list.hasChildNodes()) {
		list.removeChild(list.firstChild);
	}
}

function hideAlert(response) {
	getID(response).innerHTML = "";
}

function htmlEntities(str) {
	return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// hide img on load error

function replaceImg(el) {
	el.parentElement.style.position = "relative";
	el.parentElement.style.display = "none";
	el.parentElement.innerHTML = "";
}

function showAdv() {
	ico = getID("advanced").querySelector(".fa");

	if (!ico.style.transform.match("180")) {
		ico.style = "transform: rotate(180deg)";
		getID("container").style.marginTop = getID("container").offsetTop + getID("tip-filter-ext").scrollHeight + "px";
	} else {
		ico.style = "transform: rotate(0deg)";
		getID("container").style.marginTop = getID("container").offsetTop - getID("tip-filter-ext").offsetHeight + "px";
	}
}

function resetAdv() {
	fields = querySA("input, select", getID("advanced-search"));
	for (el of fields) el.value = "";
}

// snackbar - alert

function showMessage() {
	let show = document.getElementById("snackbar");
	show.className = "show";
	setTimeout(function () {
		show.className = show.className.replace("show", "");
	}, 1200);
}

function tip(tip = null) {
	if (tip) content = getID("tip-" + tip); // tip name if more than one on site
	else content = getID("tip");

	if (content.style.maxHeight) content.style.maxHeight = null;
	else content.style.maxHeight = content.scrollHeight + "px";
}

function newFormElement(id) {
	var newInput = document.createElement("input");
	newInput.type = "hidden";
	newInput.name = id;
	newInput.value = getID(id).value;

	log(newInput);

	return newInput;
}

function getFormValues(form) {
	form.appendChild(newFormElement("langSearch"));
	form.appendChild(newFormElement("prevSearch"));

	//  log (form.elements);

	//return false;
}

const scrollBtn = function () {
	if (window.scrollY > 120) getID("up").style.display = "block";
	else getID("up").style.display = "none";
};

window.addEventListener("scroll", scrollBtn);

function resNavi() {
	var top = getID("topnav");
	if (top.className === "topnav") {
		top.className += " responsive";
	} else {
		top.className = "topnav";
	}
}

function showModal(content = "", title = "") {
	const modal = getID("modal");
	modal.style.display = "block";

	if (content) getID("modal-body").innerHTML = content;
	if (title) getID("modal-title").innerHTML = title;

	window.onclick = function (event) {
		if (event.target == modal) hideModal(modal);
	};
}

function hideModal() {
	modal = getID("modal");
	modal.style.display = "none";
}

// ------- CORE FUNCTIONS MISC END -------

Init();

// listener for groups tree

getID("groups").addEventListener("click", e => {
	if (e.target.nodeName == "SPAN") {
		e.target.parentElement.querySelector(".node-group").classList.toggle("node-active");
		e.target.classList.toggle("node-down");
	}
});

// listener for tabs and template lists (in tab and groups)

getID("container").addEventListener(
	"click",
	e => {
		//e.preventDefault();
		//e.stopImmediatePropagation();
		// listener for modal

		if (e.target.parentElement.className == "show-modal") {
			if (e.target.parentElement.getAttribute("data-guid")) showModal(e.target.parentElement.getAttribute("data-guid"));
		}

		// listener for animations
		else if (e.target.className == "ext-info-cols" || e.target.className == "ext-info") {
			if (e.target.getAttribute("title")) copy2C(e.target.getAttribute("title"));
		} else {
			const classList = e.target.classList;
			//if (classList.contains("data-asset") || classList.contains("data-template") || classList.contains("data-datasets") || classList.contains("mark")) {
			if (
				classList.value.indexOf("data-") == 0 ||
				(classList.contains("mark") && getID("search-results").getAttribute("data-search") != "text-search")
			) {
				window.scrollTo({ top: 0 }); //, behavior: 'smooth'

				let element;
				if (e.target.className == "mark") element = e.target.parentElement;
				else element = e.target;

				let action = element.className.substring(element.className.indexOf("-") + 1);

				if (action.indexOf(" ") > 0) action = action.substring(0, action.indexOf(" "));

				const item = element.getAttribute("data-guid");
				const goto = element.getAttribute("data-goto");

				let send = "action=" + action + "&item=" + item;

				if ((where = checkSearch())) send += "&search=" + where;
				else send += "&goto=" + goto;

				if (queryS(".tablink-active").innerHTML.toLowerCase() == "xml") send += "&tab=xml";

				if (action == "asset" || action == "template" || action == "templates") actions.push(send);
				//log (actions);

				log(send);
				actionSend(send);
			}
		}
	},
	true
);

const allbtn = querySA(".button-action");

for (const btn of allbtn) {
	btn.addEventListener("click", function (e) {
		e.preventDefault();
		e.stopImmediatePropagation();

		sendForm(e.target);
	});
}

if (getID("load"))
	document.onreadystatechange = function () {
		var state = document.readyState;
		if (state == "interactive") {
			getID("load").style.visibility = "visible";
			getID("asset-data").style.visibility = "hidden";
		} else if (state == "complete") {
			setTimeout(function () {
				getID("interactive");
				getID("load").style.visibility = "hidden";
				getID("asset-data").style.visibility = " visible";
			}, 0);
		}
	};
