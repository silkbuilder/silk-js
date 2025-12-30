/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

/** 
 * Returns a ImageBox instance.
 * @class
 * @classdesc The ImageBox Class is only use for internal purposes.
 */
var ImageBox = function(element){
	
	this.imagePath = "";
	this.$containter;
	this.$image = undefined;
	this.zoom = 0;
	
	this.parentWidth = 0;
	this.parentHeight = 0;
	this.imageWidth = 0;
	this.imageHeight = 0;
	
	this.load = function(path){
		this.imagePath = path;
		this.zoom = 0;
		
		this.$container.html("<img src='' style='visibility: hidden;' />");
		this.$image = this.$container.children().first();
		this.$container.parent().css("width","");
		this.$container.parent().css("height","");
		
		this.$image.click($.proxy(function(){
			
			this.$image.css("width","");
			this.$image.css("height","");
			
			if( this.zoom==0 ){
				this.zoom=1;
				this.$image.width( this.imageWidth );
			}else{
				this.zoom=0;
				this.$image.width( this.parentWidth );
				if( this.$image.height() > this.parentHeight ){
					this.$image.css("width","");
					this.$image.height( this.parentHeight );
				}
			}
			
		},this));
		
		setTimeout($.proxy(function(){
			this.parentWidth = this.$container.parent().width();
			this.parentHeight = this.$container.parent().height();
			this.$container.parent().width( this.parentWidth );
			this.$container.parent().height( this.parentHeight );
		
			this.$image.one("load",$.proxy(
				function(){
					this.imageWidth = this.$image.width();
					this.imageHeight = this.$image.height();
					this.$image.width( this.parentWidth );
					if( this.$image.height() > this.parentHeight ){
						this.$image.css("width","");
						this.$image.height( this.parentHeight );
					}
					this.$image.css("visibility","");
				},
				this )
			);
			this.$image.attr("src",this.imagePath);
		},this),200)
		
	}
	
	this.initImageBox = function(){
		this.$container = $("#"+element);
		this.$container.parent().css("overflow","auto");
		this.$container.parent().css("padding","0");
		this.$container.parent().attr("align","center");
		
		$( window ).resize($.proxy(function(){
			if( this.$image == undefined ) return true;
			this.$image.hide();
			this.$container.parent().css("width","");
			this.$container.parent().css("height","");
			this.parentWidth = this.$container.parent().width();
			this.parentHeight = this.$container.parent().height();
			this.$container.parent().width( this.parentWidth );
			this.$container.parent().height( this.parentHeight );
			if( this.zoom==0 ){
				this.$image.css("width","");
				this.$image.css("height","");
				this.$image.width( this.parentWidth );
				if( this.$image.height() > this.parentHeight ){
					this.$image.css("width","");
					this.$image.height( this.parentHeight );
				}
			}
			this.$image.show();
		},this));
	}
	
};