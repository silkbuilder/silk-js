/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

/** 
 * Returns a Silk instance. **Do not instantiate manually.**
 * @class
 * @classdesc The Silk class defines the global methods, properties, and events of a SilkBuilder application. It is uniquely instantiated as the **silk** object when the ```<silk:App>``` tag is processed in the application.  Other components use the created **silk** object for their internal operations. The user does not need to instantiate this class.
 *
 * @property {Array} pageList - An array containing the list of Page objects used by the application.
 * @property {Array} dpLoader - An array containing the list of DataProvider objects used by the application.
 * @property {Object} $screen - A jQuery object pointing to the page's container.
 * @property {String} focusedPage - The name of the page is currently in focus.
 */
var Silk = function() {

	this.pageList = [];
	this.focusedPage;
	this.$screen = $('.screen');
	this.dpLoader = [];
	this.transitioning = false;
	this.preLoaderAutoFade = true;

	/*
	 * Setting event manager
	 */
	var eventManager = new EventManager();

	/**
	 * Load events to respond to the global interactions. To set an event, use this code: ```silk.on(<eventName>, function(){<code>})```.
	 * @param {String} eventName - The event's name.
	 * @param {function} eventFunction - The function to be triggered.
	 */
	this.on = eventManager.on;


	/**
	 * Returns the screen mode based on the window's width. The return values are:
	 * * 0 - Small. Under 544px width.
	 * * 1 - Medium. Between 544px and 769px.
	 * * 2 - Regular. Between 768px and 1025px.
	 * * 3 - Large. Between 1024px and 1401px.
	 * * 4 - Extra Large. Between 1400px and 1900px.
	 * * 5 - Extra extra large. Above 1900px;
	 * @returns {Integer}
	 */
	this.getScreenMode = function() {
		var screenWidth = $(".screen").parent().innerWidth();
		if (screenWidth < 544) return 0;	// smLayout
		if (screenWidth <= 768) return 1;	// mdLayout
		if (screenWidth <= 1024) return 2;	// rgLayout
		if (screenWidth <= 1400) return 3;	// lgLayout
		if (screenWidth <= 1900) return 4;	// xgLayout
		return 5;							// xxLayout
	}

	/**
	 * Extends the [SweetAlert2](https://sweetalert2.github.io/) dialog object. Use it by calling ```silk.alert(title, message, icon);``` or ```silk.alert(configuration_object);```.
	 * @param {String} title - The dialog's title.
	 * @param {String} message - The dialog's message.
	 * @param {String} icon - The icon's name.
	 * @param {Object} configuration - An object with the SweetAlert2 configuration. When using this, the other parameters should not be used.
	 */
	this.alert = function(parameter0, parameter1, parameter2) {

		return new Promise((resolve, reject) => {

			if (typeof parameter0 === 'string' || parameter0 instanceof String) {
				if (parameter2 == undefined) {
					if (parameter1 == undefined) {
						alertCore.fire(parameter0, "", "info");
					} else {
						alertCore.fire(parameter0, parameter1);
					}
				} else {
					alertCore.fire(parameter0, parameter1, parameter2);
				}
			} else {
				alertCore.fire(parameter0).then(
					function(result) {
						resolve(result);
					}
				);
			}

		});

	}

	var alertCore = Swal.mixin({
		customClass: {
			confirmButton: 'btn btn-success',
			cancelButton: 'btn btn-danger'
		},
		reverseButtons: true,
		buttonsStyling: false
	});

	/**
	 * Extends the [SweetAlert2](https://sweetalert2.github.io/) toas object. The toast is a window that delivers a message, opening for a few seconds. Use it by calling ```silk.toast(title, message,icon);``` or ```silk.toast(configuraition_object);```.
	 * @param {String} title - The dialog's title.
	 * @param {String} message - The dialog's message.
	 * @param {String} icon - The icon's name.
	 * @param {Object} configuration - An object with the SweetAlert2 configuration. When using this, the other parameters should not be used.
	 */
	this.toast = function(parameter0, parameter1, parameter2) {

		if (typeof parameter0 === 'string' || parameter0 instanceof String) {
			if (parameter2 == undefined) {
				if (parameter1 == undefined) {
					toastCore.fire(parameter0, "", "info");
				} else {
					toastCore.fire(parameter0, "", parameter1);
				}
			} else {
				toastCore.fire(parameter0, parameter1, parameter2);
			}
		} else {
			toastCore.fire(parameter0);
		}
	}

	var toastCore = Swal.mixin({
		toast: true,
		position: 'top-end',
		showConfirmButton: false,
		timer: 2000,
		timerProgressBar: true
	});

	/**
	 * Distributes and visualizes the pages based on the screen's width.
	 */
	this.layoutScreens = function() {

		for (var x in this.pageList) {
			this.pageList[x].resize();
			if (x == 0) {
				window[this.focusedPage].show();
			}
		}

		/**
		 * This event is triggered every time the navigator is resized. It is also triggered after the pages have been distributed. Created with the ```silk.on("resize", function(){})``` method.
		 * @event Silk#Event:resize
		 */
		eventManager.dispatch("resize");

	}

	this.confirmation = function(operation, value, title, message, buttonLabel, icon) {

		if (title == undefined) title = "Continue?";
		if (buttonLabel == undefined) buttonLabel = "OK";
		if (icon == undefined) icon = "question";

		this.alert({
			title: title,
			text: message,
			icon: icon,
			animation: false,
			showCancelButton: true,
			cancelButtonText: "Cancel",
			confirmButtonText: buttonLabel
		}).then(
			function(result) {
				if (result.isConfirmed) {
					if (operation instanceof Function) {
						operation(value);
					} else if (operation instanceof Button) {
						operation.click();
					}
				}
			}
		);

	};

	/*
	 * Toggle the element marked with .silk-help class.
	 */
	this.toggleHelp = function(pageName) {
		let queryPath = "";
		if (pageName != undefined) queryPath = "#" + pageName + " ";
		$(queryPath + ".silk-help").fadeToggle();
	};

	/*
	 * Initializes the Silk object.
	 */
	this.initSilk = function() {

		if (this.$screen.length > 0) {
			$("html").addClass("silk-html");
			$("body").addClass("silk-html");
		}

		$("#coverLeft").hide();
		$("#coverRight").hide();

		$("#coverLeft").hide();
		$("#coverRight").hide();

		$(".silk-page").each(function(index) {
			let page = $(this).attr("id");
			window[page].index = index;
			silk.pageList.push(window[page]);
		});

		if (this.pageList.length > 0) this.focusedPage = this.pageList[0].id;

		$(window).resize(function() {
			silk.layoutScreens();
		});

	}


	this.addDPtoLoader = function(dpObject) {
		if (window[dpObject.dataProvider].className == "dataProvider") {
			this.dpLoader.push(dpObject);
		} else {
			throw new Error("The object [" + dpObject.dataProvider + "] is not a DataProvider.");
		}
	}


	/*
	 * Executed the DataProviders loading.
	 */
	this.load = function() {

		/*
		 * Resizing screens
		 */
		this.layoutScreens();

		/**
		 * This event is triggered before the DataProviders marked with *autoLoad=true* are loaded for the first time. Created with the ```on("beforeDPLoad", function(){})``` method.
		 * @event Silk#event:beforeDPLoad
		 */
		eventManager.dispatch("beforeDPLoad");

		/*
		 * Sorts DP loader array by order
		 */
		this.dpLoader.sort(function(a, b) { return (a.order > b.order) ? 1 : -1 });

		/*
		 * Assigns group values to the order property.
		 * Data Providers are load in group blocks. A group is determined base on similar order property value. 
		 */
		var dpGroupCounter = -1;
		for (x in this.dpLoader) {
			if (this.dpLoader[x].order != dpGroupCounter) {
				dpGroupCounter++;
			}
			this.dpLoader[x].order = dpGroupCounter;
		}

		/*
		 * Triggers the interval function which loads the DataProviders by groups.
		 * It waits for each group to finished loading before triggering the next group.
		 * This verifies the dpLoader status which has the following values: 
		 *  0 - No loading. Default value defined at object creation
		 *  1 - Loading
		 *  2 - Loaded
		 */
		var loadingInterval;
		loadingInterval = setInterval(function() {

			/*
			 * Trigger the load method if the group has finishing loading
			 */
			for (x in silk.dpLoader) {
				var dataProvider = silk.dpLoader[x].dataProvider;
				var order = silk.dpLoader[x].order;
				var status = silk.dpLoader[x].status;

				if (status == 0) {
					if (hasLoaded(order - 1) == 0) {
						window[dataProvider].load();
					}
				}
			}

			/*
			 * Counts the number of Data Providers in the loading queue
			 */
			var count = 0;
			for (x in silk.dpLoader) {
				if (silk.dpLoader[x].status < 2) count++;
			}

			/*
			 * Executes if all DataProviders had been loaded.
			 * Triggers the event onDPAfterLoad after DataProviders ended loading
			 * Fades the pre-loader element 
			 */
			if (count == 0) {
				clearInterval(loadingInterval);

				/*
				 * Triggers the event afterDPLoad before DataProviders start loading
				 */
				/**
				 * This event is triggered after the DataProviders marked with *autoLoad=true* have finished loading for the first time. Created with the ```on("afterDPLoad", function(){})``` method.
				 * @event Silk#event:afterDPLoad
				 */
				eventManager.dispatch("afterDPLoad");

				if (silk.preLoaderAutoFade) $('.preloader').fadeOut('fast');
			}


		}, 5);

		/*
		 * Returns the number of Data Providers in a group which have not finishing loading.
		 */
		var hasLoaded = function(order) {
			if (order < 0) return 0;
			var count = 0;
			for (x in silk.dpLoader) {
				let item = silk.dpLoader[x];
				if (item.order == order && item.status < 2) count++;
			}
			return count;
		}


		/*
		 * Set home button action
		 */
		$(".silk-home-button").on("click", function() {
			window.location.href = contextPath;
		})

		/*
		 * Set logout button action
		 */
		$(".silk-logout-button").on("click", function(event) {

			let confirmTitle = "Logout Application";
			let confirmMessage = "Do you want to exit the application?";
			let confirmLabel = "Yes, logout.";

			let element = $(this)
			if (element[0].tagName == "BUTTON") {

				//console.log( window[buttonID].getConfirmMessage() );

				let buttonID = element.attr("id");
				if (buttonID) {
					if (window[buttonID]) {
						if (window[buttonID].getConfirmTitle()) confirmTitle = window[buttonID].getConfirmTitle();
						if (window[buttonID].getConfirmMessage()) confirmTitle = window[buttonID].getConfirmMessage();
						if (window[buttonID].getConfirmLabel()) confirmTitle = window[buttonID].getConfirmLabel();
					}
				}
			};

			event.preventDefault();

			silk.alert({
				title: confirmTitle,
				text: confirmMessage,
				icon: "question",
				animation: false,
				showCancelButton: true,
				cancelButtonText: "Cancel",
				confirmButtonText: confirmLabel
			}).then(
				function(result) {
					if (result.isConfirmed) {
						window.location.href = contextPath + "/auth/webLogout";
					}
				}
			);

		})

		setTimeout(function() {
			$('.preloader').fadeOut("fast");
		}, 10000);

	}

	/*
	 * Open offering help dialog.
	 */
	if (getNumber(ifUndefined(Cookies.get("silkLocalHelp"), "0")) == 0) {
		if ($(".silk-help").length > 0) {
			var helpNoticeHtml = "<p>Click on the <i class='fas fa-question-circle'></i> icon located beside the header's title to display the provided help boxes.</p>"
				+ "<p align='center'><input id='silkHelpCheckbox' type='checkbox' /> Don't show me this notice again.</p>";

			this.alert({
				title: "How to get some help",
				html: helpNoticeHtml,
				icon: "info",
				didClose: function() {
					if ($("#silkHelpCheckbox").prop("checked")) {
						Cookies.set("silkLocalHelp", "1", { path: window.location.pathname });
					}
				}
			});

		}
	}


};
