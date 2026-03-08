/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

/**
 * Function replaceAll to replace all the existing string to a new one.
 * @param target - The text to operate
 * @param search - The text to search
 * @param replace  - The replacement text
 * @returns {String}
 */
var replaceAll = function(target, search, replace) {
	return target.replace(new RegExp(search, 'g'), replace);
};

/**
 * Converts any provided value into a number.
 * @param value - The value to be converted to a number.
 * @param precision=2 - The decimal places.
 * @returns {Number}
 */
var getNumber = function(value, precision) {
	if (precision == undefined) precision = 2;
	if (value == undefined) return 0;
	if (value == "") return 0;

	if (typeof value == "string") {
		var sign = "";
		if (value.trim().substring(0, 1) == "-") sign = "-";
		value = value.replace(/[^\d.]/g, '');

		if (value.indexOf(".") > -1) {
			var temp = value.split('.');
			temp.splice(temp.length - 1, 0, '.');
			value = temp.join('');
		}
		value = sign + value;
	}

	var returnNumber = 0.00;
	try {
		returnNumber = Number(value);
	} catch (err) {
		returnNumber = 0;
	}

	if (precision == -1) return returnNumber;
	return roundNumber(returnNumber, precision);
};

/**
 * Returns true if the provided parameter is a number
 */
function isNumeric(str) {
	str = "" + str;
	return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		!isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

/**
 * Rounds a number to the provided decimal place
 * @param value - The number to be rounded.
 * @param precision=0 - The rounding decimal place.
 * @returns {Number}
 */
var roundNumber = function(value, precision) {
	if (precision == undefined) precision = 0;

	if (precision == 0) {
		precision = 1;
	} else {
		precision = Math.pow(10, precision)
	}

	return Math.round(value * precision) / precision;
};

/**
 * Convert a Silk string-date data to data object. The string should have the formar "YYY-MM-DD HH:MM:SS.MMS". Sample: "2022-09-09 09:40:43.226".
 * The Silk ORM returns and received date data in this format.
 * @param stringDate - The SILK string-date value to be converted.
 * @returns {Date}
 */
var stringToDate = function(stringDate) {
	if (stringDate == undefined) return "";

	stringDate = stringDate.replace("T", "-").replace(":", "-").replace(":", "-").replace(".", "-").replace(" ", "-");
	var dateParts = stringDate.split("-");

	var year = 0;
	var month = 0;
	var day = 0;
	var hour = 0;
	var minute = 0;
	var second = 0;
	var millsec = 0;

	year = getNumber(dateParts[0]);
	if (dateParts.length > 1) month = getNumber(dateParts[1]);
	if (dateParts.length > 2) day = getNumber(dateParts[2]);
	if (dateParts.length > 3) hour = getNumber(dateParts[3]);
	if (dateParts.length > 4) minute = getNumber(dateParts[4]);
	if (dateParts.length > 5) second = getNumber(dateParts[5]);
	if (dateParts.length == 7) millsec = getNumber(dateParts[6]);

	return new Date(year, month - 1, day, hour, minute, second, millsec);
};

/**
 * Convert a Date object to the Silk string-date with formar "YYY-MM-DD HH:MM:SS.MMS". Sample: "2022-09-09 09:40:43.226".
 * The Silk ORM returns and received date data in this format.
 * @param date - The Date object to be converted
 * @returns {String}
 */
var dateToString = function(date) {

	if (date == null) return "";

	var year = date.getFullYear();
	var month = right("0" + (date.getMonth() + 1), 2);
	var day = right("0" + date.getDate(), 2);
	var hour = right("0" + date.getHours(), 2);
	var minute = right("0" + date.getMinutes(), 2);
	var second = right("0" + date.getSeconds(), 2);
	var millsec = right("00" + date.getMilliseconds(), 3);

	return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second + "." + millsec;
};

/**
 * Return the current date and time
 * @returns {Date}
 */
var getToday = function() {
	return new Date();
};

/**
 * Return the current date and time in silk's string format.
 */
var getTodayString = function() {
	return dateToString(new Date());
};

/**
 * Returns a string with the provided number of characters starting from the left.
 * @param str - The string to operate
 * @param n - The number of character to return
 * @returns {String}
 */
var left = function(str, n) {
	if (n <= 0)
		return "";
	else if (n > String(str).length)
		return str;
	else
		return String(str).substring(0, n);
};

/**
 * Returns a string with the provided number of characters starting from the right.
 * @param str - The string to operate
 * @param n - The number of character to return
 * @returns {String}
 */
var right = function(str, n) {
	if (n <= 0)
		return "";
	else if (n > String(str).length)
		return str;
	else {
		var iLen = String(str).length;
		return String(str).substring(iLen, iLen - n);
	}
};

/**
 * Return the type of the object.
 * @param obj - The object to evaluate.
 * @returns {String}
 */
var getObjectType = function(obj) {
	return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
};

/**
 * Analyzes if the provided value is undefined or null. If tyes it return the provided option.
 * @param value - The value to evaluate.
 * @param option - The option to return if the value is undefined or null.
 * @returns {Object}
 */
var ifUndefined = function(value, option) {
	if (option == undefined) option == false;
	if (value == undefined) return option;
	if (value == null) return option;
	return value;
};

/**
 * Returns true if the object is undefined or null or empty.
 * @param object - The object to evaluate.
 * @returns {Boolean}
 */
var isEmpty = function(object) {
	if (object == undefined) return true;
	if (object == null) return true;
	if (object == "") return true;

	if (isNumeric("" + object)) {
		if (getNumber(object) == 0) {
			return true;
		} else {
			return false;
		}
	}

	if (typeof object !== "function") {
		if (Object.keys(object).length == 0) return true;
	}

	return false;
};

/**
 * Returns true if the object is not undefined or null or empty.
 * @param object - The object to evaluate.
 * @returns {Boolean}
 */
var isNotEmpty = function(object) {
	return !isEmpty(object);
};

/**
 * Verifies is the URL of a resource file exist or is accesible in host server.
 * @param urlToFile - The file' URL.
 * @returns {Boolean}
 */
function doesFileExist(urlToFile) {
	var xhr = new XMLHttpRequest();
	xhr.open('HEAD', urlToFile, false);
	xhr.send();

	if (xhr.status == "404") {
		return false;
	} else {
		return true;
	}
};

/**
 * Formats the value to specify pattern.
 * @param {Object} value - The value to get formated
 * @param {String} formatter - The formating pattern or template
 * @returns {String}
 */
var getFormattedValue = function(value, formatter) {

	if (value === "") return "";
	if (value == null) return "";
	if (value == undefined) return "";

	if (formatter == "date") {
		if (getObjectType(value) == "date") {
			return $.format.date(value, "MM/dd/yyyy");
		} else {
			return $.format.date(stringToDate(value), "MM/dd/yyyy");
		}
	} else if (formatter == "time") {
		if (getObjectType(value) == "date") {
			return $.format.date(value, "hh:mm a");
		} else {
			return $.format.date(stringToDate(value), "hh:mm a");
		}
	} else if (formatter == "datetime") {
		if (getObjectType(value) == "date") {
			return $.format.date(value, "MM/dd/yyyy hh:mm a");
		} else {
			return $.format.date(stringToDate(value), "MM/dd/yyyy hh:mm a");
		}
	} else if (formatter == "numeric" || formatter == "number" || formatter == "integer") {
		return $.format.number(callFunction(getNumber(value)), "##'###,###");
	} else if (formatter == "decimal") {
		return $.format.number(callFunction(getNumber(value)), "##'###,###.00");
	} else if (formatter == "byte") {
		var bytes = getNumber(value);
		var i = Math.floor(Math.log(bytes) / Math.log(1024)), sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		return (bytes / Math.pow(1024, i)).toFixed(1) * 1 + ' ' + sizes[i];
	} else if (formatter == "upper") {
		return value.toUpperCase();
	} else if (formatter == "lower") {
		return value.toLowerCase();
	} else if (formatter == "firstCap") {
		value = value.toLowerCase();
		return value.charAt(0).toUpperCase() + value.slice(1);
	} else {
		if (formatter.indexOf("#") != -1 || formatter.indexOf("0") != -1) {
			//Is Number
			return $.format.number(callFunction(getNumber(value, -1)), formatter);
		} else {
			//Is Date
			return $.format.date(stringToDate(value), formatter);
		}
	}
	return value;
};

/**
 * Replaces the columns, enclosed with "{" or ""{{", found in a provided template with the attributes found in the the provided item. Then apply a renderer if provided.
 * Some templates:
 * {row-index} - Renders the row number starting with 1. Usually use to display the row number in a table.
 * {dp-inded} - Renders the data provider index used when building the row.
 * {ms-value} - Render the current milliseconds. Usually used as a unique variable when displaying images.
 * @param template {String} - The string containing the columns to replace.
 * @param index {Integer} - The index position in the list
 * @param item {Objet} - The object containing the attributes to be used to replace.
 * @param renderer {String} - The function to be used as data renderer.
 * @returns {String}
 */
var getTemplateData = function(template, index, item, renderer) {

	if (template == undefined) return "";
	if (index == undefined) return template;
	if (item == undefined) item = new Object();

	// Checks for braces type
	var isDoubleBraces = template.indexOf("{{") > -1;
	var parameterList;
	if (isDoubleBraces) {
		// Double braces
		parameterList = template.match(/\{\{(.*?)\}\}/g);
	} else {
		// Single braces
		parameterList = template.match(/\{(.*?)\}/g);
	}

	if (parameterList != null) {

		for (var x in parameterList) {

			var parameter = parameterList[x];
			var columnTemplate;
			if (isDoubleBraces) {
				columnTemplate = parameter.replace("{{", "").replace("}}", "") + "|";
			} else {
				columnTemplate = parameter.replace("{", "").replace("}", "") + "|";
			}
			var columnTemplateList = columnTemplate.split("|");
			var column = columnTemplateList[0];
			var formatter = columnTemplateList[1];
			var value = "";

			/*
			 * Sets value with the item object column. Also process virtual columns: row-index and dp-index.
			 */
			if (column == "row-index") {
				value = getNumber(index) + 1;
			} else if (column == "dp-index") {
				value = getNumber(index);
			} else if (column == "ms-value") {
				value = "" + (new Date()).getTime();
			} else {
				value = item[column];
			}

			if (formatter.indexOf("fn:") == 0) {
				/*
				 * Send data to a renderer function.
				 * Sample: {value|fun:processValue}
				 */
				var formatterFunction = formatter.split(":")[1]
				value = window[formatterFunction](value, index, item);

			} else if (formatter.indexOf("dp:") == 0) {
				/*
				 * Returns the label from a dataProvider based on the provided value.
				 * The value has to be PK of the targeted dataProvider.
				 * Sample: {countryID|dp:countryDP:countryName}
				 */
				var dpItems = formatter.split(":");
				if (dpItems.length == 3) {
					var dpName = dpItems[1];
					var columnName = dpItems[2];
					if (window[dpName] != undefined) {
						let item = window[dpName].getIndexItem(value);
						if (item != undefined) value = item[columnName];
					}
				}
			} else {
				if (formatter != "") {
					value = getFormattedValue(value, formatter);
				}
			}

			if (value != undefined) {
				template = template.replace(parameter, value);
			} else {
				template = template.replace(parameter, "");
			}
		}
	}

	if (isNotEmpty(renderer)) {
		template = renderer(getNumber(index), item, template);
	}

	/*
	 * Checks if keepIf property exists.
	 */
	if (("" + template).toLowerCase().indexOf("keepif=") != -1) {
		
		var $content = $("<data>" + template + "</data>");
		ifTag($content);
		template = $content.html();
	}

	return template;
};

/**
 * Evaluates HTML tags for keepIf property in the provided JQuery object. If tags found evaluates the attribute data-if criteria to keep or remove the tag.
 * @param {Object} $container - JQuery object to evaluate. if undefined evaluates all the html document
 */
var ifTag = function($container) {
	if ($container == undefined) $container = $("html");

	$container.find("[keepIf]").each(function(index, element) {
		var $element = $(element);
		var test = $element.attr("keepIf");
		
		while (test.indexOf("str(") > -1) {
			let partStart = test.substring(0, test.indexOf("str(\'"));
			let partMiddle = test.substring(test.indexOf("str(") + 5);
			let partEnd = partMiddle.substring(partMiddle.indexOf("\')") + 2);
			partMiddle = partMiddle.substring(0, partMiddle.indexOf("\')"));

			test = partStart + "\"" + partMiddle + "\"" + partEnd;
		}

		var result = false;

		try {
			result = eval(test);
		}
		catch (err) {
			result = false;
		}
		
		if (result) {
			$element.removeAttr("keepIf");
		} else {
			$element.remove();
		}

	});

};


/**
 * Generates a UUID Value.
 * @returns {String}
 */
var getUUID = function() {
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return uuid;
};

/**
 * Calls and executes the provided function's name without parameters.
 * @param {String} fnString - The function's name
 * @returns {Object}
 */
var callFunction = function(fnString) {
	if (typeof fnString === 'string') {
		if (fnString.includes("()")) {
			fnString = fnString.substring(0, fnString.length - 2);
			if (window[fnString] == undefined) {
				console.error("Function " + fnString + " does not exist");
				return false;
			}

			return window[fnString]();
		}
	}
	return fnString;
};

/**
 * Cleans data from HTML tags.
 * @param {String} text - The text to sanitize.
 * @returns {String}
 */
function sanitize(text) {
	return text.replace(/<[^>]+>/g, '');
};


/**
 * Takes code text and replaces the tabs with hard spaces and in lines.
 * @param {String} - The code to format
 * @returns {String}
 */
var renderCode = function(code) {
	var codeLines = code.trim().split("\n");
	var htmlCode = "<div class='code-block' >";
	for (var line in codeLines) {
		var lineText = codeLines[line];
		lineText = replaceAll(lineText, "\t", "&nbsp;&nbsp;&nbsp;&nbsp;");
		htmlCode += "<div class='code-line'>" + lineText + "</div>";
	}
	htmlCode += "</div>";

	return htmlCode;
};

/**
 * Returns the HEX value of ransom color.
 * @returns {String}
 */
var getRandomColor = function() {
	return "#" + Math.floor(Math.random() * 16777215).toString(16);
};

/**
 * Verifies if the web application is running standalone (PWA)
 * @returns {Boolean}
 */
function isRunningStandalone() {
	return navigator.standalone || (window.matchMedia('(display-mode: standalone)').matches);
}

/**
 * Verifies if a web application is running inside an iframe
 * @returns {Boolean}
 */
function inIframe() {
	try {
		return window.self !== window.top;
	} catch (e) {
		return true;
	}
};



/**
 * Function to verify if the first parameter matches the other parameter values. The second parameter can be an array. It is not extrict compparizon.
 * @returns {Boolean}
 */
var isIn = function() {
	if (arguments.length < 2) return false;

	var toSearch = arguments[0];
	var testArray = arguments[1];

	if (Array.isArray(testArray)) {
		for (var i = 0; i < testArray.length; i++) {
			var toTest = testArray[i];
			if (toSearch == toTest) return true;
		}
	} else {
		for (let i = 1; i < arguments.length; i++) {
			var toTest = arguments[i];
			if (toSearch == toTest) return true;
		}
	}
	return false
};

/**
 * Verifies if the provided string contains a valid email. Multiples comma separated emails are validated individually. If one or more emails are invalid it return false.
 * if the parameter "single" is true, or exist, the validation expect only one email address.
 * @param {String} email - The email address or a comma separated list of email addresses.
 * @param {Boolean} singel - Only evalutes one email address
 * @returns {Boolean}
 */
var isEmail = function(email, single) {

	/*
	 * Used with type email to validate email format
	 */
	let emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	let emailList;

	if (!single) single = false;

	if (single) {
		emailList = [email];
	} else {
		emailList = email.trim().split(",");
	}


	let errorCount = 0;

	for (let item of emailList) {
		if (!emailReg.test(item.trim())) {
			errorCount++;
		}
	}

	return errorCount == 0;

};

/**
 * Function to download the provided text into a file.
 * @param {String} content - The text to download
 * @param {String} contentType - The content type to download
 * @param {String} fileName - Name of the file
 */
var downloadText = function(content, mimeType, fileName) {

	if (fileName == undefined) {
		fileName = mimeType;
		mimeType = "text/plain";
	}

	const a = document.createElement('a') // Create "a" element
	const blob = new Blob([content], { type: mimeType }) // Create a blob (file-like object)
	const url = URL.createObjectURL(blob) // Create an object URL from blob
	a.setAttribute('href', url) // Set "a" element link
	a.setAttribute('download', fileName) // Set download filename
	a.click() // Start downloading
};

/**
 * Excutes a jQuery ajax post/json call to the provided URL. The handle function received the parameter result, which can be true or false, and the response data.
 * @param {String} serviceURL - The URL to the target service
 * @param {Object} data - The data to be submited
 * @param {Function} handleFunction - The functin which will received the response.
 */
var postToService = function(serviceURL, data, handleFunction, context) {
	if (context == undefined) context = this;
	$.ajax({
		context: context,
		url: serviceURL,
		data: data,
		type: "POST",
		dataType: "json",
		error: function(xhr, ajaxOptions, thrownError) {
			let errorObject = {};
			errorObject["xhr"] = xhr;
			errorObject["ajaxOptions"] = ajaxOptions;
			errorObject["thrownError"] = thrownError;
			handleFunction(false, errorObject);
		},
		success: function(response) {
			handleFunction(true, response);
		}
	});
};

/**
 * Escapes HTML to be displayed with in a div.
 */
const escapeHtml = unsafe => {
	return unsafe
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
};

/**
 * Returns the element's CSS attribute's value without checking the inhereted parent status.
 * @param {String} attribute - The CSS attribute
 * @returns {String}
 */
$.fn.getCSSValue = function(attribute) {
	var el = this[0];
	if (!el) return 'none';

	// 1. If it has inline style → trust it
	if (el.style[attribute]) return el.style[attribute];

	// 2. Otherwise, clone off-screen to read the true CSS value
	return this.clone()
		.css({ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden', display: 'block' })
		.appendTo('body')
		.css(attribute);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*
 * Add the openSelect method to open selects programmatically
 */
(function($) {
	"use strict";
	$.fn.openSelect = function() {
		return this.each(function(idx, domEl) {
			if (document.createEvent) {
				var event = document.createEvent("MouseEvents");
				event.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				domEl.dispatchEvent(event);
			} else if (element.fireEvent) {
				domEl.fireEvent("onmousedown");
			}
		});
	}
}(jQuery));

