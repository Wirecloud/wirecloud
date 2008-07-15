if (typeof MYMW == "undefined" || !MYMW) {
    var MYMW = {};
	MYMW.ui = {};
}

String.prototype.supplant = function (o) 
{
	return this.replace(/{([^{}]*)}/g,
		function (a, b) 
		{
			var r = o[b];
			return typeof r === 'string' ? r : a;
		}
	);
};
	
// Detect clients
var ua =  navigator.userAgent;
var isOpera = ua.indexOf("Opera")>0;
var isGecko = ua.indexOf("Gecko")>0;
var isWmobile = !isOpera && !isGecko && (ua.indexOf("PPC")>0 || ua.indexOf("IEMobile")>0);

function id(nid) {
	return isWmobile ? document.all[nid] : document.getElementById(nid);
}

function hasClass(nid, classStr) {
	return (" "+id(node).className+" ").indexOf(" "+classStr+" ") >= 0;
};

function update(nid, content) {
	id(nid).innerHTML = content;
}

function after(nid, content) {
	var el = id(nid);
	el.innerHTML = el.innerHTML + content;
}

function before(nid, content) {
	var el = id(nid);
	el.innerHTML = content + el.innerHTML;
}

function updateClass(nid, className) {
	id(nid).className = className;
}

/*
// not working for IEM
HTMLElement.prototype.update = function( txt ) {
	this.innerHTML = txt;
}
*/

/*
function getElementsByClassName(classStr) {
	var r=[];
	var els=(document.getElementsByTagName)?document.getElementsByTagName("*"):document.all;

	for (var i=0; i<els.length; i++) {
		var tmp=els[i].className.split(" ");
		for (var j=0; j<tmp.length; j++) {
			if (tmp[j] == classStr) { 
				r[r.length] = els[i];
			}
		}
	}
	
	return r
}
*/

/*
var dump = function(obj) {
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			alert(i + " => " + obj[i]);
		}
	}
}
*/