/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

/** 
 * Returns an instance of ToogleManager.
 * @class
 * @classdesc The Toogle Manager Class stores and toogle elements.
 */
var ToggleManager = function(toggleList, id) {

	id = ifUndefined(id, "");

	var toggleArray = toggleList.trim().split(",");

	/**
	 * Toggles the elements loaded in the list.
	 * @param {Boolean} status - True to show, and false to hid.
	 * @param {Object} $object - The jQuery element. (Optional)
	 */
	this.toggle = function(status, $object) {
		if (toggleList.trim() == "") return;
		for (var x in toggleArray) {
			var item = toggleArray[x].trim();

			/*
			 * Set the visible condition 
			 */
			var visible = status;
			if (item.startsWith("!")) {
				visible = !status;
				item = item.replace("!", "");
			}

			/*
			 * Select method
			 */
			if (item == "all") {
				developerForm.$form.parent().children().each(function(x, element) {
					const $item = $(element);

					let elementID = ifUndefined($item.attr("id"), "");

					if (elementID != id) {
						if (id == "") {
							$item.toggle(visible);
						} else {
							if (window[elementID] == undefined) {
								$item.toggle(visible);
							} else {
								if (window[elementID].toggle == undefined) {
									$item.toggle(visible);
								} else {
									window[elementID].toggle(visible);
								}
							}
						}
					}

				});
			} else if (item == "group") {
				if ($object == undefined) return;
				$object.closest('.silk-group').toggle(visible);
			} else if (item == "parent") {
				if ($object == undefined) return;
				$object.parent().toggle(visible);
			} else if (item == "grandpa") {
				if ($object == undefined) return;
				$object.parent().parent().toggle(visible);
			} else if (item.startsWith("#")) {
				$(item).toggle(visible);
			} else if (item.startsWith(".")) {
				$(item).toggle(visible);
			} else if (item.indexOf(".") > 0) {
				var parts = item.split(".");
				try {
					window[parts[0]][parts[1]].toggle(visible);
				} catch (err) {
				}
			} else {
				try {
					window[item].toggle(visible);
				} catch (err) {
				}
			}
		}
	}

}