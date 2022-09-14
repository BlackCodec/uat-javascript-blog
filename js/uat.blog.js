// RELEASE: 20220905.1410

var SITE_URL = 'http://localhost';
var DATABASE_URL = 'http://localhost/db';

var OBJECT_XML_ATTRIBUTES = ["title","description","content","tag","category","readmore"];
var OBJECT_HTTP_PRE = "object-";

var AUTHOR="BlackCodec";

var CSS_MAP = {
  "desktop":'/css/uat.blog.css',
  "mobile":'/css/uat.blog.mobile.css',
}

var REPLACE_MAP = {
  "\{\{siteurl\}\}":SITE_URL,
  "\{\{author\}\}":AUTHOR,
  "\{\{databaseurl\}\}":DATABASE_URL,
  "\{\{datenow\}\}": new Date().getFullYear(),
  "\\\\n\\\\n":"<br>",
  "\\\\t":"&nbsp;&nbsp;&nbsp;&nbsp;",
  "\\\\n":"<br>",
};
var MARKDOWN_MAP = {
  "    ":"\\n&nbsp;&nbsp;",
  "\\n":"",
  "\\!\\[(.*?)\\]\\((.*?)\\)":'<img src="$2" alt="$1" />',
  "\\[(.*?)\\]\\((.*?)\\)":'<a href="$2">$1</a>',
  "([\\#]{5})([^#\\\\\\n]+)":'<h5>$2</h5>',
  "([\\#]{4})([^#\\\\\\n]+)":'<h4>$2</h4>',
  "([\\#]{3})([^#\\\\\\n]+)":'<h3>$2</h3>',
  "([\\#]{2})([^#\\\\\\n]+)":'<h2>$2</h2>',
  "([\\#]{1})([^# \\\\\\n!]+)":'<h1>$2</h1>',
  "\\- ([^\\\\\\n|]*)\\\\n":'<p class="list">$1</p>',
  "\\*\\*([^*]*)\\*\\*":'<b>$1</b>',
  "\\_\\_([^_]*)\\_\\_":'<i>$1</i>',
  "```([^`]*)```":'<br><code>$1</code><br>',

};


function parsexml(url) {
	var httpreq = new XMLHttpRequest();
	httpreq.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200 && httpreq.responseXML != null) {
				xml = httpreq.responseXML;
				OBJECT_XML_ATTRIBUTES.forEach(function(element) {
					httpElement = document.getElementById(OBJECT_HTTP_PRE+element);
					if (httpElement != undefined) {
						xmlElements = xml.getElementsByTagName(element);
						xmltxt = "";
						for (i=0; i < xmlElements.length; i++) {
							xmlChilds = xmlElements[i].childNodes;
							for (j=0; j < xmlChilds.length; j++)
								xmltxt += xmlChilds[j].nodeValue;
						}
						if (xmltxt.trim().length == 0)
							httpElement.style.display="none";
						else
							httpElement.innerHTML = httpElement.innerHTML.replace("{{"+element+"}}",parsetext(xmltxt));
					}
				});
			} else
				parsexml(DATABASE_URL + "/pages/404.xml");
		}
	};
	httpreq.open("GET", url, true);
	httpreq.send();
};

function parseurl() {
	var file = window.location.href.replace(SITE_URL + '/','') + '.xml';
	if (file == ".xml" || file == "#.xml")
		file = "/pages/home.xml";
	if (!file.startsWith("#")) {
		if (!file.startsWith("/"))
			file = '/' + file;
		parsexml(DATABASE_URL + file);
	}
};

function parsetext(text, markdown = true) {
	result = text;
	if (markdown) {
		for (key in MARKDOWN_MAP)
			result = result.replace(new RegExp(key,"gms"),MARKDOWN_MAP[key]);
	}
	for (key in REPLACE_MAP)
		result = result.replace(new RegExp(key,"gms"),REPLACE_MAP[key]);
	return result;
}

function bodyload() {
	parseurl();
	addcss();
	document.body.innerHTML = parsetext(document.body.innerHTML,false);
}

function addcss() {
	csspath=CSS_MAP['desktop'];
	if (detectMobile()) csspath=CSS_MAP['mobile'];
	head  = document.getElementsByTagName('head')[0];
	link  = document.createElement('link');
	link.rel  = 'stylesheet';
	link.type = 'text/css';
	link.href = csspath;
	link.media = 'all';
	head.appendChild(link);
}

function detectMobile() {
	return (/ipad|tablet|mobile/i.test(navigator.userAgent));
}


function showhide(divname) {
	divObj = document.getElementById(divname);
	if (divObj != undefined) {
		if (divObj.style.display == "block")
			divObj.style.display = "none";
		else
			divObj.style.display = "block";
	}
}
