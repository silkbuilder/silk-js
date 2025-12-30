/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

/** 
 * Returns an instance of EventManager.
 * @class
 * @classdesc
 The Event Manager Class stores functions that will be triggered when called by their provided name. The event object contains a name for the event and a function.
 */
var EventManager = function() {

	var eventArray = new Array();
	var nameArray = new Array();

	/**
	 * Returns the array of event objects loaded into the manager.
	 * @returns {Array} A list or event objects
	 */
	this.getList = function() {
		return eventArray;
	}


	/**
	 * Adds an event object to the event array. An event can be added multiple times.
	 * @param {String} eventName - The event's name. This could be multiple events separated by commas.
	 * @param {function} eventFunction - The function to be triggered
	 */
	this.on = function(eventName, eventFunction) {

		if (eventName == undefined && eventFunction == undefined) {
			//console.log( nameArray );
			//console.log( eventArray );
			return eventArray;
		}

		var eventList = eventName.split(",");
		for (x in eventList) {
			var eventItem = new Object();
			eventItem["eventName"] = eventList[x].trim();
			eventItem["eventFunction"] = eventFunction;

			if (nameArray.indexOf(eventItem.eventName) == -1) nameArray.push(eventItem.eventName);

			if (this.className != undefined) {
				if (this.className == "dataProvider") {
					eventItem["setParameter"] = this.setParameter;
					eventItem["setSelectName"] = this.setSelectName;
					eventItem["getSelectName"] = this.getSelectName;
					eventItem["getItem"] = this.getItem;
					eventItem["getItemAt"] = this.getItemAt;
					eventItem["setLangID"] = this.setLangID;
				}
			}

			eventArray.push(eventItem);
		}
	}

	/**
	 * Returns true if the provided event's name exists in the array. Otherwise, it returns false.
	 * @param {String} eventName - The event's name
	 * @returns {boolean} True or false.
	 */
	this.eventExists = function(eventName) {
		return nameArray.indexOf(eventName) > -1;
	}

	/**
	 * Triggers or executes the function of the provided event's name. It received up to 10 parameters.
	 * If the event has been entered multiple times, these are executed in the order of entrance.
	 * The provided function can return a value. In case of various functions, the value of the last one is returned.
	 * @param {String} eventName - The event's name
	 * @param {any} paramX - The function can received up to 10 parameters. From param0 to param9.
	 * @returns {Object} The result Objec returned after executing the event's function.
	 */
	this.dispatch = function(eventName, param0, param1, param2, param3, param4, param5, param6, param7, param8, param9) {
		let response = undefined;

		if (!this.eventExists(eventName)) return response;

		for (var x in eventArray) {
			if (eventArray[x].eventName == eventName) {
				var result = eventArray[x].eventFunction(param0, param1, param2, param3, param4, param5, param6, param7, param8, param9);
				if (result != undefined) {
					response = result;
				}
			}
		}
		return response;
	}

}