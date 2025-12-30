/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

var NullObject = function() {
	this.getID = function() { return "" };
	this.on = function() { };
	this.toggle = function() { };
	this.show = function() { };
	this.hide = function() { };
	this.close = function() { };
	this.open = function() { };
	this.load = function() { };
	this.disable = function() { };
	this.enable = function() { };
	this.hasChange = function() { return false; };
	this.getValue = function() { return ""; };
	this.setValue = function() { };
	this.getEditable = function() { };
	this.getInputID = function() { };
	this.getMode = function() { return false };
	this.setMode = function() { };
	this.required = function() { return false };
	this.getVisible = function() { return false };
	this.$button = this;
	this.$page = $("");
};
