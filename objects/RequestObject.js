/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

/*
 * Request Object
 */
var RequestObject = function(){
	this.langID = "";
	this.debugLevel = "0";
	this.parameterList = new Array();
	this.operationList = new Array();
	this.serviceURL = "";
	var operationIndex = -1;
	
	this.setParameter = function(column,value,type,secure){
		
		if( type==undefined){
			if( getObjectType(value)=="number" ){
				if( (""+value).indexOf(".")>-1 ){
					type="N";
				}else{
					type="I";
				}
			}
			if( getObjectType(value)=="string" ) type="S";
			if( getObjectType(value)=="date" ) type="D";
		}
		for( i in this.parameterList ){
			if( this.parameterList[i].column == column ){
				this.parameterList[i].value = ""+value;
				this.parameterList[i].type = type;
				this.parameterList[i].secure = secure;
				return;
			}
		}
		
		var item = new Object();
		item["column"] = column;
		item["value"] = ""+value;
		item["type"] = type;
		item["secure"] = secure;
		this.parameterList.push(item);
	}
	
	this.cleanParameters = function(){
		this.parameterList.length = 0;
	}

	this.setOperationAction = function(action,operation){
		var result = this.operationList.push( new OperationItem() );
		operationIndex = result-1;
		this.operationList[operationIndex].action = action;
		if( operation==undefined ){
			if(action=="select"){
				this.operationList[operationIndex].operation = "default";
			}else{
				this.operationList[operationIndex].operation = action;
			}
		}else{
			this.operationList[operationIndex].operation = operation;
		}
	}
	
	this.setSingleOperationAction = function(action,operation){
		this.operationList.splice(1);
		operationIndex=0;
		this.operationList[0].action = action;
		if( operation==undefined ){
			if(action=="select"){
				this.operationList[0].operation = "default";
			}else{
				this.operationList[0].operation = action;
			}
		}else{
			this.operationList[0].operation = operation;
		}
	}

	this.setOperationItem = function(column,value){
		
		if( this.operationList.length>0 ){
			for( i in this.operationList[operationIndex].columnList ){
				if( this.operationList[operationIndex].columnList[i].column == column ){
					this.operationList[operationIndex].columnList[i].value = ""+value;
					return;
				}
			}
		}else{
			this.operationList.push( new OperationItem() )
			operationIndex=0;
		}
		
		var item = new Object();
		item["column"] = column;
		item["value"] = ""+value;
		this.operationList[operationIndex].columnList.push(item);
	}
	
	this.getOperationItem = function(index){
		return this.operationList[index];
	}

	this.getOperationColumnItemValue = function(column){
		for( i in this.operationList[operationIndex].columnList ){
			if( this.operationList[operationIndex].columnList[i].column == column ){
				return this.operationList[operationIndex].columnList[i].value;
			}
		}
		return "";
	}
	
	this.cleanOperations = function(){
		operationIndex=-1;
		this.operationList = new Array();
	}
	
	this.getJSONString = function(){
		if( this.operationList.lenght==0 ) this.setOperationAction("select")
		return JSON.stringify(this);
	}
}

var ReturnObject = function(){
	this.data = new Array();
}

var OperationItem = function(){
	this.action = "";
	this.operation = "";
	this.columnList = new Array();
	
	this.setItem = function(column,value){
		for( i in this.columnList ){
			if( this.columnList[i].column == column ){
				this.columnList[i].value = value;
				return;
			}
		}
		
		var item = new Object();
		item["column"] = column;
		item["value"] = value;
		this.columnList.push(item);
	}
	
	this.getItemValue = function(column){
		for( i in this.columnList ){
			if( this.columnList[i].column == column ){
				return value;
			}
		}
		return undefined;
	}
	
};
