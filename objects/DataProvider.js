/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

/**
 * Returns a DataProvider instance.
 * @class
 * @classdesc
The DataProvider Class provides properties, methods, and events to interface with JSON data returned by data Outlet services. The [silk:DataProvider](..\tags\DataProvider.md) component creates the DataProvider object with a name as the component's ID.

```xml
<silk:DataProvider id="dataDP" servicePath="..." autoSelect="false" />
<silk:JQcode>
	dataDP.select();
</silk:JQcode>
```
 *
 * @constructor
 * @param {String} id - Unique identifier.
 * @param {Object} options - Object containing the DataProvider configuration options.
 * @param {String} [options.servicePath] - The URL to the Outlet Service providing the data.
 * @param {String} [options.selectName] - The ORM's selectName used to extract the data.
 * @param {Boolean} [options.treeData=false] - Indicates if the data will be treated as a hierarchical structure.
 * @param {Boolean} [options.markDeleted=false] - Indicated that records will display like a deletion, but marked deleted in the database.
 * @param {Integer} [options.isPublic=0] - Indicates if the service is publicly available. Use when accessing public Outlets from a private environment.
 * @param {Integer} [options.debugLevel=0] - Defines the debugging level.
 * @param {String} [options.pkColumn] - The primary key column of the table accessed.
 * @param {String} [option.linkedDP] - The name of a related DataProvider that will be loaded after the local loading process ends. This could be a list of DataProvider’s names separated by commas.
 * @param {Boolan} [option.recordSync] - The SELECT name used during the record sync process. If provided, it indicates that the DataProvider will automatically trigger the record sync method when a row is selected in a table component.
 * @param {Boolean} [option.dpSort=false] - Indicates if the sorting will happen in the data provider.
 */
var DataProvider = function(id, options, jsonString){
	this.className = "dataProvider";

	if( ifUndefined(options,"")=="" ) options = {};

	var servicePath		= ifUndefined( options["servicePath"],"");
	var selectName		= ifUndefined( options["selectName"],"default");
	var treeData		= ifUndefined( options["treeData"],false);
	var markDeleted		= ifUndefined( options["markDeleted"],false);
	var isPublic		= ifUndefined( options["isPublic"],false);
	var debugLevel		= ifUndefined( options["debugLevel"],0);
	var pkColumn		= ifUndefined( options["pkColumn"],"");
	var dataSource		= ifUndefined( options["dataSource"],"");
	var timeout			= ifUndefined( options["timeout"],30000);
	var dpSort			= ifUndefined( options["dpSort"],false);

	/*
	 * Setting the recordSync option
	 */
	this.doRecordSync = false;
	this.recordSyncSelect = "";
	if( options["recordSync"] ){
		this.doRecordSync = true;
		this.recordSyncSelect = ""+options["recordSync"];
	}
	
	/*
	 * Property indicating if the recordSync method will be trigger after the loading select.
	 * This is changed by the table's load method.
	 */
	this.execRecordSyncAfterLoadingSelect = false;
		
	/*
	 * Settting linked data providers
	 */
	this.linkedDP = options["linkedDP"];

	var treeInitLevel = -1;
	this.getTreeInitLevel = function(){
		return treeInitLevel;
	};

	/*
	 * The langID is use to overwrite the session loaded langID.
	 */
	var langID = "";
	
	/**
	 * Set the langID, it is used to overwrite the session's loaded *langID* variable.
	 * @param (String} newLangID - The new langID
	 */
	this.setLangID = function(newLangID){
		langID = newLangID;
	}

	/**
	 * Get the langID if it has been replaced.
	 * @returns {String}
	 */
	this.getLangID = function(){
		return langID;
	}

	/**
	 * Returns the component's unique identifier.
	 */
	this.getID = function(){
		return id;
	}

	/**
	 * The number of milliseconds before triggering a timeout error. The default value is 30 seconds.
	 */
	this.setTimeout = function(newTimeout){
		timeout = newTimeout;
	};

	/*
	 * Setting event manager
	 */
	var eventManager = new EventManager();

	/**
	 * Load events to respond to the DataProvider's interactions. To set an event, use this code: ```DataProvider.on(<eventName>, function(){<code>})```.
	 * @param {String} eventName - The event's name.
	 * @param {function} eventFunction - The function to be triggered.
	 */
	this.on = eventManager.on;

	/* refence DP on eventManager */
	eventManager["dp"] = this;

	/*
	 * To capture the loading and ending time of a loading process.
	 */
	var loadingStart;
	var loadingEnd;
	this.isLoading = false;

	/** An object containing the data returned from the Outlet Service after a select operation. */
	this.selectObject = new ReturnObject();

	/** An object containing the returned Outlet Service data after insert, update, delete, exec, or batch. */
	this.operationObject = new ReturnObject();

	this.action = "select";
	this.operation = "select";

	var requestObject = new RequestObject();
	operationIndex = -1;
	this.selectedIndex = -1;

	
	/**
	 * Changes the internal data index to the provided value. By default, the selected index should be synchronized with the operation index. The selected index is connected to the view, such as a table, which could display the rows in a different order than the DataProvider order.
	 * @param {Integer} index1 - Index to the view.
	 * @param {Integer} index2 - Index to the operation (Optional).
	 */
	this.setSelectedIndex = function(index1,index2)	{
		this.selectedIndex = index1;
		operationIndex = (index2==undefined) ? index1 : index2;
	}

	/**
	 * Return the value of the operation index. This is usually synchronized with the selected index value.
	 */
	this.getOperationIndex = function(){
		return operationIndex;
	}
	
	/**
	 * Indicates the type of data source. These could be:<br>
	 * SQL : From SQL database<br>
	 * Local :  Loaded using the loadJSON method. This JSON structure is provided as part of the DataProvider content.<br>
	 * JSON : Data from file containing JSON.
	 */
	this.sourceType = "SQL";

	if( servicePath=="" ){
		this.sourceType="Local"

		/*
		 * Changes the pkColumn to the value set by the user
		 */
		if( pkColumn!="") this.selectObject["pkColumn"] = pkColumn;

	}

	if( servicePath.substring(0,1)!="/") servicePath = "/"+servicePath;

	/** Returns the service path. */
	this.getService = function(){
		return servicePath;
	}

	/** Returns the selected name to be used to load the data. */
	this.getSelectName = function(){
		return selectName;
	}

	/**
	 * Set the name of the select from the ORM, which will be used to load the data.
	 * @param {String} newSelectName - The new select name.
	 */
	this.setSelectName = function(newSelectName){
		selectName=newSelectName;
		if( requestObject.operationList.length==0 ){
			requestObject.setOperationAction("select",selectName);
		}else{
			requestObject.operationList[0].operation=selectName;
		}
	}

	/**
	 * Returns the name of the primary key column.
	 */
	this.getPkColumn = function(){
		var pk = this.selectObject.pkColumn;
		if( pk==undefined ) return "nopk"
		return pk;
	}

	/**
	 * Returns the primary key's value of the selected data item.
	 */
	this.getPKValue = function(){
		return this.getItemAt(this.selectedIndex, this.getPkColumn());
	}

	/**
	 * Returns the operation Item from the *operationObject*. If the index is not provided, return the first one. If the DataProvider does not have data, it returns an empty object.
	 * @param {integer} index - The operation index (optional). 
	 */
	this.getOperationItem = function(index){
		if( this.operationObject.data.length==0 ) return {};
		if( index==undefined ) index = 0;
		return this.operationObject.data[index];
	}

	/**
	 * Returns the *selectObject's* item using the *selectedIndex* property. By default, the *selectedIndex* is 0;
	 * @param {String} columnName - The column to return. If not provided return the item object.
	 */
	this.getSelectedItem = function(columnName){
		if( this.selectedIndex==-1 ) return new Object();
		if( columnName==undefined )	 return this.getItemAt(this.selectedIndex);
		return this.getItemAt(this.selectedIndex, columnName);
	}

	/** Return a boolean indicating if the data is set to be tree structured */
	this.isTreeData = function(){
		return treeData;
	}

	/**
	 * Returns the index of the provided primary key value in the *selectObject*'s data.
	 * @param {String} pkValue - The primary key value to search for.
	 */
	this.getIndex = function(pkValue){
		for( var y in this.selectObject.data ){
			if( this.selectObject.data[y][this.selectObject.pkColumn]==pkValue ) return getNumber(y);
		}
		return -1;
	}

	/**
	 * Returns the item object of the provided primary key value in the *selectObject*'s data.
	 * @param {String} pkValue - The primary key value to search for.
	 */
	this.getIndexItem = function(pkValue){
		for( var y in this.selectObject.data ){
			if( this.selectObject.data[y][this.selectObject.pkColumn]==pkValue ) return this.selectObject.data[y] ;
		}
		return undefined;
	}

	/**
	 * Returns the index of the entity matching the provided column and value in the *selectObject*'s data.
	 * @param {String} columnName - The column name use to filter
	 * @param {Object} value - The value use to filter.
	 */
	this.getIndexOf = function(columnName, value){
		for( var y in this.selectObject.data ){
			if( this.selectObject.data[y][columnName]==value ) return getNumber(y);
		}
		return -1;
	}

	/**
	 * Returns the item object of the entity matching the provided column and value in the *selectObject*'s data.
	 * @param {String} columnName - The column name use to filter
	 * @param {Object} value - The value use to filter.
	 */
	this.getIndexItemOf = function(columnName, value){
		for( var y in this.selectObject.data ){
			if( this.selectObject.data[y][columnName]==value ) return this.selectObject.data[y];
		}
		return undefined;
	}

	/*
	 * Sets the data provider loading status in the loading process. This is to use in customized loading processes.<br>
	 * The status values are:<br>
	 * 0 - No loading. Default value defined at object creation<br>
	 * 1 - Loading<br>
	 * 2 - Loaded<br>
	 * 3 - Error<br>
	 *
	 * The loading process only affects to the dataProviders with autoLoad=true.<br>
	 * @param {Integer} status - The new status
 	 */
	var setLoaderStatus = function(status){
		var loaderIndex = silk.dpLoader.map( function(e){ return e.dataProvider }).indexOf(id);
		if( loaderIndex>-1 ) silk.dpLoader[loaderIndex].status = status;
	}

	/*
	 * Array containing the components which will be notify of changes in the data provider.<br>
	 * The component must have a load() function.
	 */
	var components = new Array();

	/**
	 * Adds a component to the list of components that will be notified of changes in the DataProvider.<br>
	 * The component must have a load() function.
	 * @param {Object} component - The name of the component to be added
	 */
	this.addComponent = function(component){
		components.push(component);
	}

	/**
	 * Returns the array containing the components which will be notify of changes in the data provider.<br>
	 * The component must have a load() function.
	 */
	this.getComponents = function(){
		return components;
	}

	/**
	 * Cleans the parameter list from the *requestObject*.
	 */
	this.cleanParameters = function(){
		requestObject.cleanParameters();
	}
	/**
	 * Sets a parameter in the *requestObject*. If the parameter exists, it gets updated.
	 *
	 * @param {String} column - The column name
	 * @param {Object }value - The value
	 * @param {String} type - (optional) One character value (S,I,N,D,T) to force data convertion
	 * @param {booelan} secure - (optional) To inndicates if the value is encrypted. To overwrite what has been define in the ORM.
	 */
	this.setParameter = function(column,value,type,secure){
		if(value==undefined) console.error("Parameter "+column+" is undefined");
		requestObject.setParameter(column,value,type,secure);
	}

	/**
	 * Cleans the loaded operation action in the *operationObject* before adding operations programmatically. If the provided parameter is *true,* it will initialize an empty select action, which is used to initialize the request object as a select. Submitting an empty operation list will trigger an error.
	 *
	 * @param {boolean} init - (optional) Default is false. 
	 */
	this.cleanOperations = function(init){
		requestObject.cleanOperations();

		if( init==undefined) init = false
		if( init ){
			this.action = "select";
			this.opearation = selectName;
			requestObject.setOperationAction("select",selectName);
		}
	}


	/**
	 * Sets an action in the *operationObject*. After setting an operation action, it becomes the active action and is ready to receive operation items.
	 *
	 * @param {String} action - The action to execute: select, insert, update, delete, exec, batch.
	 * @param {String} operation - (optional) The name of the operation when action is set to exec.
	 */
	this.setOperationAction = function(action,operation){
		requestObject.setOperationAction(action,operation);
	}

	/**
	 * Sets an operation item to the current operation action. The item contains the column and value to be operated on.
	 *
	 * @param column The column name
	 * @param value The value
	 */
	this.setOperationItem = function(column,value){
		requestObject.setOperationItem(column,value);
	}

	/**
	 * Executes a SELECT request. By default, it uses the select's name configured in the DataProvider. If a different request needs to be executed, it has to be provided as a parameter. Query parameters should be added before calling this method.
	 *
	 * @param {String} selectName - (optional) (optional) The name of a select from the ORM.
	 */
	this.select = function(newSelectName){
		this.action = "select";
		this.operation = "select";
		requestObject.cleanOperations();
		if( newSelectName==undefined ) newSelectName = selectName;
		requestObject.setOperationAction("select",newSelectName);
		this.load(true);
	}

	/**
	 * Executes an INSERT request. Operation items should be added before calling this method.
	 */
	this.insert = function(){
		this.action = "insert";
		this.operation = "insert";
		requestObject.setSingleOperationAction("insert");
		this.load(true);
	}

	/**
	 * Executes the SELECT name provided in the recordSync intialization parameter to sync the loaded record with the new database record data. This will only affect the selected item.
	 * If the parameter syncSelectName is provided it overwrites the default select.
	 * If the SELECT requires query parameters, these should be added using the "beforeRecordSync" event.
	 * @param {String} syncSelectName
	 */
	this.recordSync = function(syncSelectName){
		this.action = "select";
		this.operation = "_recordSync_";
		requestObject.cleanOperations();
		
		/*
		 * If there is no records, record sync is canceled.
		 */
		if( this.size()==0 ) return;
		
		if( syncSelectName ){
			requestObject.setOperationAction("select", syncSelectName);
		}else{
			if( this.recordSyncSelect=="true" ){
				/*
				 * Added for compativility
				 */
				requestObject.setOperationAction("select", selectName+"-recordSync");
			}else{
				requestObject.setOperationAction("select", this.recordSyncSelect);
			}
		}

		this.load(true);
	}
	
	/**
	 * Executes an UPDATE request. Operation items should be added before calling this method.
	 *
	 * @param {Integer} recordIndex - (optional) The index of the item to be updated
	 */
	this.update = function(recordIndex){
		if( recordIndex!=undefined ){
			/*
			 * The Record index is provided
			 */
			operationIndex=recordIndex;
		}else{
			/*
			 * Record index is not provided.
			 * Getting operationIndex searching for the primary key if exists
			 */
			var value = requestObject.getOperationColumnItemValue(this.getPkColumn());
			if( isNotEmpty(value) ){
				operationIndex = this.getIndex(value);
			}
		}
		
		this.action = "update";
		this.operation = "update";
		requestObject.setSingleOperationAction("update");
		this.load(true);
	}



	/**
	 * Executes a DELETE request. Operation items should be added before calling this method.<br>
	 * If the DataProvider's property *markDeleted* is *true*, it will perform a delete in the local data for visual effect, but an update in the database.
	 *
	 * @param {Integer} recordIndex - (optional) The index of the item to be deleted
	 */
	this['delete'] = function(recordIndex){
		if( recordIndex!=undefined ){
			/*
			 * The Record index is provided
			 */
			operationIndex=recordIndex;
		}else{
			/*
			 * Record index is not provided.
			 * Getting operationIndex searching for the primary key if exists
			 */
			var value = requestObject.getOperationColumnItemValue(this.getPkColumn());
			if( isNotEmpty(value) ){
				operationIndex = this.getIndex(value);
			}
		}		
		
		this.action = "delete";
		this.operation = "delete";

		/*
		 * Check for markDeleted. If true it calls the onMarkDeleted function and changes the action to update.
		 */
		if( markDeleted ){
			/**
			 * This event is triggered before a delete action is processed. Created with the ```DataProvider.on("markDeleted", function(requestObject){})``` method. The event is triggered before the event "beforeDelete", so the data changes are considered part of the original submission process and not affected by other internal actions.
			 * @param {Object} requestObject - The return objected to be operated.
			 * @event DataProvider#Event:markDeleted
			 */
			eventManager.dispatch("markDeleted",requestObject);
			requestObject.setSingleOperationAction("update","delete");
		}else{
			requestObject.setSingleOperationAction("delete");
		}

		this.load(true);
	}

	/**
	 * Submits multiple operations loaded into the *operationsObject,* performing a batch request.
	 */
	this.batch = function(){
		this.action = "batch";
		this.operation = "batch";
		this.load(true);
	}

	/**
	 * Executes an ORM's SQL Operation. If the operation requires parameters that are not added in the "beforeLoad" or "beforeExec" events, they should be added before this method is executed.
	 *
	 * @param {String} operation - The operation name from the ORM.
	 */
	this.exec = function(operation){
		this.action = "exec";
		this.operation = operation;
		requestObject.cleanOperations();
		requestObject.setOperationAction("exec",operation);
		this.load(true);
	}

	/*
	 * Method used by external SILK components to request operation actions. Not recomended to be used programatically.
	 *
	 * @param {Array} operationList - The operations list to be submitted.
	 * @param {Integer} operationIndexParam - (optional) The data index in which the operation result will be applied.
	 */
	this.callAction = function(operationList, operationIndexParam ){
		if( operationIndexParam!=undefined ) operationIndex = operationIndexParam;
		requestObject.operationList = operationList;
		this.action = requestObject.operationList[0].action;
		this.operation = requestObject.operationList[0].action;
		
		/*
		 * Check for markDeleted. If true it calls the onMarkDeleted function and changes the action to update.
		 */
		if( markDeleted && this.action=="delete" ){
			if( this.onMarkDeleted != null ) this.onMarkDeleted(requestObject);
			eventManager.dispatch("markDeleted",requestObject);
			requestObject.operationList[0].action = "update";
			requestObject.operationList[0].operation = "delete";
		}

		this.load();
	}

	/**
	 * Gets the object item from *selectObject*'s data at the provided index position.
	 * If a column is provided, it returns the value of the column at the provided position.
	 *
	 * @param {Integer} index - The object item's index position
	 * @param {String} column - (optional) The column name whose value will be returned
	 *
	 * @returns {Object}
	 */
	this.getItemAt = function(index,column){
		if( index<0 ) return undefined;
		if( index==this.length() ) return undefined;
		if( column==undefined ){
			var object = this.selectObject.data[index]
			object["_recordIndex"] = parseInt(index);
			return object ;
		}else{
			return this.selectObject.data[index][column];
		}
	}

	/**
	 * Gets the object item of the first item in the *selectObject*'s data.
	 * If the column is provided, it returns the value of the column in the first position.
	 *
	 * @param {String} column - (optional) Column name whose value will be returned
	 */
	this.getItem = function(column){
		if( column==undefined ){
			return this.getItemAt(0);
		}else{
			return this.getItemAt(0,column);
		}
	}

	/**
	 * Sets the column's value of the first item in the *selectObject*'s data.
	 *
	 * @param {String} column - The target column.
	 * @param {String} value - The value.
	 */
	this.setItem = function(column,value){
		this.selectObject.data[0][column] = value;
	}

	/**
	 * Sets the column's value of the *selectObject*'s data at the provided index.
	 *
	 * @param {Integer} index - Array index target.
	 * @param {String} column - The target column.
	 * @param {String} value - The value.
	 */
	this.setItemAt = function(index,column,value){
		this.selectObject.data[index][column] = value;
	}

	/**
	 * Returns the number of records in the data array. This is similar to the *size()* method.
	 */
	this.length = function(){
		if( this.selectObject == undefined ) return 0;
		return this.selectObject.data.length;
	}

	/**
	 * Returns the number of records in the data array.  This is similar to the *length()* method.
	 */
	this.size = function(){
		return this.length();
	}

	/**
	 * Submits the operations from the *requestObject* and loads the response from the Outlet service into the *selectObject*.
	 * The parameter is only for the frame's work internal use.
	 * 
	 * @param {boolean} - (Optional) True if call internally within the DataProvider
	 */
	this.load = function(internalCall){
		
		this.isLoading = true;
		if( debugLevel>0 ){
			loadingStart = new Date();
			console.log( id+": Start Loading " );
		}
		if( this.operation != "_recordSync_" ) setLoaderStatus(1);

		if( internalCall==undefined ) internalCall=false;

		/*
		 * If sourceType is Local (JSON) and action is select. Local is a JSON local base data provider
		 */
		if( this.sourceType=="Local" && this.action=="select" ){


			/*
			 * Initializes indexes to the first array element
			 */
			if( this.selectObject.data.length>0 && this.selectedIndex==-1 ){
				operationIndex = 0;
				this.selectedIndex = 0;
			}

			/*
			 * Notify attached components for local data.
			 */
			notifyComponents(this.action, operationIndex);
			

			/*
			 * Calls triggers for local data
			 */
			eventManager.dispatch("afterLoad", this.action, this.action);
			
			eventManager.dispatch("afterSelect");

			setLoaderStatus(2);
			return;
		}

		/*
		 * If sourceType is Local (JSON) and action are insert,update, delete.
		 */
		if( this.sourceType=="Local" && ("insert,update,delete").indexOf(this.action)>-1 ){
			var returnObject = new ReturnObject();
			var item = new Object();
			item[this.getPkColumn()] = requestObject.getOperationColumnItemValue(this.getPkColumn());
			returnObject.data.push(item);
			this.loadCallback(returnObject);
			return;
		}


		/**
		 * This event is triggered before the load action is executed. If the event function returns *false* the process is canceled. It is created with the ```DataProvider.on("beforeLoad", function(action,operation){})``` method.
		 * @param {String} action - The action to be executed.
		 * @param {String} operation - The operation to be executed.
		 * @event DataProvider#Event:beforeLoad
		 */
		if( !ifUndefined(eventManager.dispatch("beforeLoad",this.action,this.operation),true) ) return;


		if( this.action=="select" ){

			if( this.operation == "_recordSync_" ){
				
				/*
				 * Dispatch beforeRececordSync if the call is to refresh the record
				 */

				/*
				 * Sets the linked components property "recordSyncLoading" to false, to allow triggering the recordSync method.
				 */
				for( x in components ){
					var component = components[x];
					if( component["recordSyncLoading"]!=undefined ){
						component.recordSyncLoading = false;
					}
				}
								 
				/**
				 * This event is triggered before the record sync action is executed. If the event function returns *false* the process is canceled. Created with the ```DataProvider.on("beforeRecordSync", function(selectName){})``` method.
				 * @param {String} selectName - (Optional) The name of the select to be called.
				 * @event DataProvider#Event:beforeRecordSync
				 */
				if( !ifUndefined(eventManager.dispatch("beforeRecordSync", this.operation),true) ){
					return;	
				} 

			}else{

				/*
				 * Dispatch before select event
				 */

				/**
				 * This event is triggered before the select action is executed. If the event function returns *false* the process is canceled. Created with the ```DataProvider.on("beforeSelect", function(selectName){})``` method.
				 * @param {String} selectName - The name of the select to be called.
				 * @event DataProvider#Event:beforeSelect
				 */
				if( !ifUndefined(eventManager.dispatch("beforeSelect",this.operation),true) ) return;

			}

		};


		if( this.action=="insert" ){

			/*
			 * Triggers beforeInsert event
			 */

			/**
			 * This event is triggered before the insert action is executed. If the event function returns *false* the process is canceled. Created with the ```DataProvider.on("beforeInsert", function(){})``` method.
			 * @event DataProvider#Event:beforeInsert
			 */
			if( !ifUndefined(eventManager.dispatch("beforeInsert"),true) ) return;
			 
		};

		if( this.action=="update" ){
			
			/*
			 * Triggers beforeUpdate event
			 */

			/**
			 * This event is triggered before the update action is executed. If the event function returns *false* the process is canceled. Created with the ```DataProvider.on("beforeUpdate", function(){})``` method.
			 * @event DataProvider#Event:beforeUpdate
			 */
			if( !ifUndefined(eventManager.dispatch("beforeUpdate"),true) ) return;

		};

		if( this.action=="delete" ){

			/*
			 * Triggers beforeDelete event
			 */

			/**
			 * This event id triggered before the delete action is executed. If the event function returns *false* the process is canceled. Created with the ```DataProvider.on("beforeDelete", function(){})``` method.
			 * @event DataProvider#Event:beforeDelete
			 */
			if( !ifUndefined(eventManager.dispatch("beforeDelete"),true) ) return;

		};

		if( this.action=="batch" ){

			/*
			 * Triggers beforeBatch event
			 */

			/**
			 * This event is triggered before the batch action is executed. If the event function returns *false* the process is canceled. Created with the ```DataProvider.on("beforeBatch", function(){})``` method.
			 * @event DataProvider#Event:beforeBatch
			 */
			if( !ifUndefined(eventManager.dispatch("beforeBatch"),true) ) return;
			
		};

		if( this.action=="exec" ){

			/*
			 * Triggers beforeExec event
			 */

			/**
			 * This event is triggered before the exec action is executed. If the event function returns *false* the process is canceled. Created with the ```DataProvider.on("beforeExec", function(){})``` method.
			 * @param {String} operation - The operation to be executed.
			 * @event DataProvider#Event:beforeExec
			 */
			if( !ifUndefined(eventManager.dispatch("beforeExec", this.operation),true) ) return;

		};

		/*
		 * Applies selectName to SELECT action if the call is from external objects
		 * This is to respect the select name parameter use when calling the select() method.
		 */
		if( this.action=="select" && !internalCall ){
			requestObject.operationList[0].operation=selectName;
		}

		/*
		 * Sets langID if provided
		 */

		if( this.getLangID()!="" ){
			requestObject.langID = this.getLangID();
		}

		/*
		 * Setting the debug level to report data
		 */
		if( debugLevel!=undefined ) requestObject.debugLevel = ""+debugLevel;

		/*
		 * Extracting RequestObject to a JSON String
		 */
		requestObject.serviceURL = ifUndefined(window.location.pathname,"");
		var jsonString = requestObject.getJSONString();

		/*
		 * For insert, update, and delete, clean columns which should remain in DataProvider (scope 2) but not send to database;
		 */
		if( ("insert,update,delete").indexOf(this.action)>-1 ){

			var loadOperationObject = JSON.parse(jsonString);
			var loadColumnList = new Array();
			var hasLevel = false;
			var hasParent = false;

			for( x in loadOperationObject.operationList[0].columnList ){
				/*
				 * At columns without scope value to temporary array
				 */

				if( loadOperationObject.operationList[0].columnList[x].scope==undefined ){
					loadColumnList.push( loadOperationObject.operationList[0].columnList[x] );
				}

				if( treeData && this.action=="insert" ){
					hasLevel = loadOperationObject.operationList[0].columnList[x].column==this.selectObject.levelControlColumn;
					hasParent = loadOperationObject.operationList[0].columnList[x].column==this.selectObject.parentTreeColumn;
				}

			}

			loadOperationObject.operationList[0].columnList = loadColumnList;

			if( treeData && this.action=="insert" ){

				if( !hasParent ){
					var parentObject = new Object();
					parentObject["column"] = this.selectObject.parentTreeColumn;
					parentObject["value"] = this.getItemAt(operationIndex, this.selectObject.rootTreeColumn);
					loadOperationObject.operationList[0].columnList.push(parentObject);
				}

				if( !hasLevel ){
					var levelObject = new Object();
					levelObject["column"] = this.selectObject.levelControlColumn;
					levelObject["value"] = this.getItemAt(operationIndex, this.selectObject.levelControlColumn)+1;
					if( isNaN(levelObject["value"]) ) levelObject["value"]=0;
					loadOperationObject.operationList[0].columnList.push(levelObject);
				}

			}

			jsonString = JSON.stringify(loadOperationObject);

		}

		//console.log( jsonString );

		/*
		 * Initialized the fullServicePath with the contextPath
		 */
		var fullServicePath = contextPath;

		/*
		 * Verifies if the service is public of private
		 */
		if( window.location.href.includes('/link/') ){
			/*
			 * If the location link contains "link" it definitely call a public service
			 */
			fullServicePath += "/link";
		}else{
			/*
			 * If the location link does not contain "link" then it checks the isPublic option.
			 */
			if( isPublic ){
				fullServicePath += "/link";
			}else{
				fullServicePath += "/service";
			}
		}
		
		/*
		 * Add the provided service path to the generated fullServicePath.
		 */
		fullServicePath += servicePath;

		/*
		 * Send to debug the request boject.
		 */
		if( debugLevel>1 ){
			console.log( id+": Request Object. " );
			console.log( JSON.parse(jsonString) );
		}

		$.ajax({
			url: fullServicePath,
			context: this,
			data: {
				requestObject: jsonString
			},
			dataType: "json",
			error: function(jqXHR, textStatus, errorThrown){
				console.log("DataProvider: "+id);
				console.log("Service: "+fullServicePath);
				console.log("jsonString: "+jsonString);
				console.log("timeout: "+timeout);
				console.log(jqXHR);
				console.log(textStatus);
				console.log(errorThrown);
				if( jqXHR.responseText.indexOf("<!-- MAIN INDEX -->")==0 ){
					silk.alert("Internet Session", "The internet session has been terminated.","error");
					//Adds a meta refresh for 5 seccods.
					var meta = document.createElement('meta');
					meta.httpEquiv = "refresh";
					meta.content = "5";
					document.getElementsByTagName('head')[0].appendChild(meta);
					
				}else{
					console.log(jqXHR.responseText);
					silk.alert("Data Access Error", "Triggered by "+id,"warning");
				}
				
				setLoaderStatus(3);
				
			},
			success: function(returnObject) {

				if( debugLevel>0 ) console.log( id+": Server responded" );

				if( debugLevel>1 ){
					console.log( id+": Return Object" );
					console.log( returnObject );
				}
				if( debugLevel>2 ){
					console.log( id+": Server message" );
					console.log( returnObject.debugMessage );
				}

				if( returnObject.error ){
					this.errorHandle(returnObject);
				}else{
					this.loadCallback(returnObject);
				}

				this.isLoading = false;
				if( debugLevel>0 ){
					loadingEnd = new Date();
					var diffTime = Math.abs( loadingEnd.getTime() - loadingStart.getTime() );
					console.log( " "+id+": "+this.size()+" records, loading time: "+ (diffTime/1000)+" sec." );
				}

			},
			type: "POST",
			timeout: timeout
		});

	}

	/**
	 * Cleans the data from the *selectObject*.
	 */
	this.clean = function(){
		this.loadCallback( new ReturnObject() );
	}

	/*
	 * Process an error
	 */
	this.errorHandle = function(error){

		notifyError(this.action, operationIndex);

		/**
		 * This Event is triggered when an error has occurred. It is created with the ```DataProvider.on("error", function(errorObject){})``` method.
		 * If the event returns an object, this will replace the existing operationObject.
		 * @param {Object} error - The returned error object.
		 * @event DataProvider#Event:error
		 */
		if( eventManager.eventExists("error") ){
			eventManager.dispatch("error",error);
		}else{
			console.error( error.stackTrace );
			silk.alert("Service Error","An error happened while reaching the service. Please try again later.", "error");
		}

		this.action="select";
		this.cleanOperations(true);

		setLoaderStatus(2);
		
	}

	/*
	 * Process return object after load method
	 */

	this.loadCallback = function(returnObject){

		if( this.action=="select" ){

			/*
			 * Process the result of a SELECT request
			 */

			if( debugLevel>0 ) console.log(id +": Handling Select.")

			if( this.operation=="_recordSync_" ){
				
				/*
				 * Process a select for record synchronization
				 * Updates the received columns into data source
				 */
				var recordData = returnObject.data[0];
				var recordPkValue = recordData[this.selectObject.pkColumn];
				var recordIndex = this.getIndex(recordPkValue);
				if( recordIndex==-1 ) return;

				var columnList = Object.keys(recordData);
				for( var x in columnList ){
					var column = columnList[x];
					this.selectObject.data[recordIndex][column] = recordData[column];
				}
				
				if( debugLevel>0 ) console.log(id +": Loaded record sync.");

			}else{

				/*
				 * Process a regular select
				 */
				this.selectObject = returnObject;

				/*
				 * Executes the user define data processor.
				 */

				/**
				 * This event is triggered when the received data is being processed. It is created with the ```DataProvider.on("processLoadedData", function(returnObject){})``` method. If the event returns an object, this will replace the existing *selectObject*.
				 * This event can process the received data before loading it into the *selectObject*.
				 * @param {Object} returnObject - The return objected to be operated.
				 * @return {Object}
				 * @event DataProvider#Event:processLoadedData
				 */
				if( eventManager.eventExists("processLoadedData") ){
					var result = eventManager.dispatch("processLoadedData",returnObject);
					if( result!=undefined ) this.selectObject = result
					if( debugLevel>0 ) console.log(id +": Process Loaded Data");
				}

				/*
				 * Formats data for Tree processing
				 */
				if( treeData ){
					returnObject = parseTreeData(returnObject);
				}
				
				/*
				 * Changes the pkColumn to the value set by the user
				 */
				if( pkColumn!="" ) this.selectObject.pkColumn = pkColumn;

				/*
				 * Settings values if no records returned
				 */
				if( this.length()>0  ){
					this.selectedIndex = 0;
					operationIndex=0;
				}
			}

		}else if( this.action=="insert" ){
			if( debugLevel>0 ) console.log(id+": Handling Insert.")
			/*
			 * Process the result of a INSERT request
			 */
			this.operationObject = returnObject;
			var newItem = new Object();
			var hasLevel = false;
			var hasParent = false;

			for( x in requestObject.operationList[0].columnList ){

				var column = requestObject.operationList[0].columnList[x].column;
				var value = requestObject.operationList[0].columnList[x].value;
				newItem[column] = value;

				if( treeData && this.action=="insert" ){
					hasLevel = column==this.selectObject.levelControlColumn;
					hasParent = column==this.selectObject.parentTreeColumn;
				}

			}

			newItem[this.operationObject.pkColumn] = this.operationObject.data[0][this.operationObject.pkColumn];

			if( treeData && this.action=="insert" ){
				if( !hasParent ){
					newItem[this.selectObject.parentTreeColumn] = this.getItemAt(operationIndex, this.selectObject.rootTreeColumn);
				}
				if( !hasLevel ){
					var newLevel = this.getItemAt(operationIndex, this.selectObject.levelControlColumn)+1
					newItem[this.selectObject.levelControlColumn] = newLevel;
					newItem["_treeLevel"] = newLevel - treeInitLevel;
				}
				newItem["_childrenCount"]==0;
			}

			this.selectObject.data.push(newItem);
			operationIndex = this.selectObject.data.length-1;

		}else if( this.action=="update" ){
			if( debugLevel>0 ) console.log(id+": Handling Update.")
			/*
			 * Process the result of a UPDATE request
			 */
			this.operationObject = returnObject;
			for( x in requestObject.operationList[0].columnList ){
				
				var column = requestObject.operationList[0].columnList[x].column;
				var value = requestObject.operationList[0].columnList[x].value;
				
				if( this.selectObject.data.length > 0 ){
					this.selectObject.data[operationIndex][column] = value;
				}
			}

			/*
			 * If the transaction is File System pkValue is updated.
			 */
			if( this.operationObject.transactionType==1 ){
				if( this.selectObject.data.length > 0){
					this.selectObject.data[operationIndex][this.operationObject.pkColumn] = this.operationObject.data[0][this.operationObject.pkColumn];
				}
			}

		}else if( this.action=="delete" ){
			if( debugLevel>0 ) console.log(id+": Handling Delete.")
			/*
			 * Process the result of a DELETE request
			 */
			this.operationObject = returnObject;

			if( treeData ){
				var parentID = this.selectObject.data[operationIndex][this.selectObject.parentTreeColumn];
				this.operationObject.data[0][this.selectObject.parentTreeColumn]=parentID;
			}
			if( this.selectObject.data.length > 0) this.selectObject.data.splice(operationIndex,1);

		}else{
			/*
			 * Process the result of a EXEC or BATCH request
			 */
			this.operationObject = returnObject;
		}

		/*
		 * Call children components that action has finished
		 */
		if( this.action != "exec" && this.action != "batch" ){
			$.proxy( notifyComponents(this.action, operationIndex, this.operation), this);
		}

		var lastAction = this.action;
		var lastOperation = this.operation;
		this.cleanOperations(true);
		this.action="select";

		/**
		 * This event is triggered after the load action is executed. It is created with the ```DataProvider.on("afterLoad", function(action,operation){})``` method.
		 * @param {String} action - The action to be executed.
		 * @param {String} operation - The operation to be executed.
		 * @event DataProvider#Event:afterLoad
		 */
		eventManager.dispatch("afterLoad",lastAction, lastOperation)

		if( lastAction=="select" ){
			
			if( lastOperation=="_recordSync_" ){
				/**
				 * This event is triggered after the record sync action is executed. It is created with the ```DataProvider.on("afterRecordSync", function(selectName){})``` method.
				 * @param {String} selectName - The name of the select with in the ORM to be executed.
				 * @event DataProvider#Event:afterRecordSync
				 */
				eventManager.dispatch("afterRecordSync",lastOperation);
								
			}else{
				/**
				 * This event is triggered after the select action is executed. It is created with the ```DataProvider.on("afterSelect", function(selectName){})``` method.
				 * @param {String} selectName - The name of the select with in the ORM to be executed.
				 * @event DataProvider#Event:afterSelect
				 */
				eventManager.dispatch("afterSelect",lastOperation);
			}
		} 

		/**
		 * This event is triggered after the insert action is executed. It is created with the ```DataProvider.on("afterInsert", function(){})``` method.
		 * @event DataProvider#Event:afterInsert
		 */
		if( lastAction=="insert" ) eventManager.dispatch("afterInsert");

		/**
		 * This event is triggered after the update action is executed. It is created with the ```DataProvider.on("afterUpdate", function(){})``` method.
		 * @event DataProvider#Event:afterUpdate
		 */
		if( lastAction=="update" ) eventManager.dispatch("afterUpdate");

		/**
		 * This event is triggered after the delete action is executed. It is created with the ```DataProvider.on("afterDelete", function(){})``` method.
		 * @event DataProvider#Event:afterDelete
		 */
		if( lastAction=="delete" ) eventManager.dispatch("afterDelete");

		/**
		 * This event is triggered after the batch action is executed. It is created with the ```DataProvider.on("afterBatch", function(){})``` method.
		 * @event DataProvider#Event:afterBatch
		 */
		if( lastAction=="batch" ) eventManager.dispatch("afterBatch");

		/**
		 * This event is triggered after the exec action is executed. It is created with the ```DataProvider.on("afterExec", function(){})``` method.
		 * @param {String} operation - The operation to be executed.
		 * @event DataProvider#Event:afterExec
		 */
		if( lastAction=="exec" ) eventManager.dispatch("afterExec",lastOperation);

		setLoaderStatus(2);
		
		/*
		 * If recordSync is true after an Insert the recordSync method is executed to load extra records.
		 */
		if( lastAction == "insert" ){
			if( this.doRecordSync ){
				this.recordSync();
			}
		}

		/*
		 * Executes the record sync methos after the loading select has been executed. This is call from the table load event.
		 */
		if( lastAction == "select" && this.execRecordSyncAfterLoadingSelect ){
			this.execRecordSyncAfterLoadingSelect = false;
			this.recordSync()
		}

	}

	/*
	 * Parses a linear tree structure and converts into tree structure.
	 *
	 * @param returnObject
	 * @return retunObject
	 */
	var parseTreeData = function(returnObject){
		var tmpData = new Array();
		treeInitLevel=-1;

		for( x in returnObject.data ){
			var item = returnObject.data[x];
			item["_childrenCount"] = 0;

			var level = item[returnObject.levelControlColumn];
			if( treeInitLevel==-1 ) treeInitLevel = level;
			item["_treeLevel"] = level - treeInitLevel;

			var parentPos = -1;
			for( i=0; i<tmpData.length; i++ ){
				if( tmpData[i][returnObject.rootTreeColumn]==item[returnObject.parentTreeColumn] && tmpData[i][returnObject.levelControlColumn]==level-1  ){
					parentPos = i;
					break;
				}
			}

			if( parentPos==-1 ){
				tmpData.push(item);
			}else{
				tmpData[parentPos]._childrenCount++;
				var insertPos = parentPos + tmpData[parentPos]._childrenCount;
				tmpData.splice(insertPos,0,item);
			}

		}

		returnObject.data = tmpData;

		return returnObject;
	}

	/*
	 * Sort comparing methods
	 */
  	var sortColumn = "";
  	var sortLocalColumn = "";
  	var sortDirection = 1;

	/**
	 * Initializes the sorting column and/or direction before the DataProvider loads the data. The direction is optional.
	 * If the sorting happens in the database, then before executing a select, the sort column has to be set up to match the select order.
	 * @param {String} - Column name
	 * @param {Integer} - Sorting direction. 1 - accedant, -1 is descendant
	 */
	this.setSortColumn = function(column, direction){
		if( direction!=undefined ){
			if( direction<0 ){
				sortDirection = -1;
			}else{
				sortDirection = 1;
			}
		}
		sortColumn = column;
		sortLocalColumn = column;
	}

	/**
	 * Returns the name of the column used for data sorting.
	 * @return {String} - Column name
	 */
	this.getSortColumn = function(){
		return sortColumn;
	}

	/**
	 * Returns the column used for sorting with added SQL keywords 'asc' or 'desc' based on the sorting direction.
	 * If the sorting column is composite ("column, column"),  the SQL direction keyword will be added to each column.
	 * @return {String}
	 */
	this.getSQLSortColumn = function(){
		let sortList = sortColumn.trim().split(",");
		for( x=0; x<sortList.length; x++ ){
			if( sortDirection==1 ){
				sortList[x] = sortList[x].trim() + " asc";
			}else{
				sortList[x] = sortList[x].trim() + " desc";
			}
		}
		return sortList.toString();
	}

	/**
	 * Gets the sorting direction. 1 is an ancestor, and -1 is a descendant.
	 * @return {Integer} - Sorting Direction
	 */
	this.getSortDirection = function(column){
		return sortDirection;
	}

	/*
	 * The column comparizon function
	 */
	var compareColumns = function(a, b) {

		if( a[sortLocalColumn]==undefined ) return 1;

		var bandA = ""+a[sortLocalColumn].toLowerCase();
		var bandB = ""+b[sortLocalColumn].toLowerCase();

		if( isNumeric(bandA)>0 && isNumeric(bandB)>0  ){
			bandA = getNumber(bandA);
			bandB = getNumber(bandB);
		}

		let comparison = 0;
		if (bandA > bandB) {
			comparison = 1 * sortDirection;
		} else if (bandA < bandB) {
			comparison = -1 * sortDirection;
		}

		return comparison;
	}

	/**
	 * Sorts, or orders, the data by the provided column. This does not work if the DataProvider is set to *treeData="true"*.
	 * @param {String} - Column to sort
	 * @param {Boolean} - (Optional) If set to false cancels order switch.
	 */
	this.sort = function(column, changeOrder ){

		if( changeOrder==undefined ) changeOrder=true;

		if( treeData ) return;

		sortColumn = column;

		/*
		 * Set sorting direction
		 */
		 if( changeOrder ){
			if( sortLocalColumn==column ){
				sortDirection = -1;
			}else{
				sortDirection = 1;
			}
		}
		sortLocalColumn = column;

		if( dpSort ){
			/*
			 * Database sorting
			 */

			this.select();

		}else{
			/*
			 * Local sorting only in dataProvider data
			 */
			this.selectObject.data.sort(compareColumns);
			notifyComponents();

		}

		if( sortDirection== -1 ) sortLocalColumn = "";

	}

	/**
	 * Returns an array containing the generational children of a record.
	 * @param {pkValue} - The primary key value to evaluate.
	 * @returns {Array}
	 */
	this.getChildren = function(pkValue){
		let childrenArray = [];
		if( !treeData ) return [];
		for( let x=0; x < this.selectObject.data.length; x++){
			if( this.selectObject.data[x][this.selectObject.parentTreeColumn]==pkValue  ){
				let foundPkValue = this.selectObject.data[x][this.selectObject.pkColumn];
				childrenArray.push(foundPkValue);
				let grantChildrenArray = this.getChildren(foundPkValue);
				for(let y=0; y < grantChildrenArray.length; y++ ){
					childrenArray.push(grantChildrenArray[y]);
				}
			}
		}
		return childrenArray;
	}
	
	/**
	 * Return the data provider data in JSON format
	 * @returns {JSON}
	 */
	this.getJSON = function(){
		return JSON.stringify( this.selectObject.data );
	}
	
	/*
	 * Notifies components of changes applied to the data
	 *
	 * @param action The executed action
	 * @param index The data index affected with the action
	 */
	var notifyComponents = function(action,index, operation){
		
		if( operation==undefined ) operation = "";

		for( x in components ){
			var component = components[x];
			if( operation === "_recordSync_" ){
				/*
				 * If recordSynync then calls refreshRow
				 */
				if( component["recordSyncLoading"]!=undefined){
					component.recordSyncLoading = false;
				}
				if( component["refreshRow"]!=undefined){
					component.refreshRow();
				}
				if( component["selectRow"]!=undefined){
					component.selectRow();
				}

			}else{
				/*
				 * If regular call.
				 */
				if( debugLevel>0 ) console.log(id+": Notify Load in "+component.getID());
				if( component["load"]!=undefined){
					component.load(action,index);
				}
			}
		}
		
		if( this.linkedDP ){
			let linkedList = linkedDP.split(",");
			for( item of linkedList ){
				window[item.trim()].load();
			}
		}
		
	}

	/*
	 * Notifies components of error during load process
	 *
	 * @param action The executed action
	 * @param index The data index affected with the action
	 */
	var notifyError = function(action,index){
		for( x in components ){
			if( components[x]["errorHandle"]!=undefined){
				components[x].errorHandle(action,index);
			}
		}
		eventManager.dispatch("afterLoad",action,index);
	}

	/**
	 * Load data from a JSON string into the *selectObject"'s data.
	 * @param {String} json - The JSON structure to be parsed.
	 */
	this.loadJSON = function(json){
		this.selectObject.data = JSON.parse(json);

		/*
		 * Changes the pkColumn to the value set by the user
		 */
		if( pkColumn=="") this.selectObject["pkColumn"] = "value";

		/*
		 * Initializes indexes to the first array element
		 */
		if( this.selectObject.data.length>0 ){
			operationIndex = 0;
			this.selectedIndex = 0;
		}
	}

	/*
	 * Loading JSON string if provided
	 */
	if( jsonString != undefined  ){
		this.loadJSON(jsonString);
	}
	
	this.cleanOperations(true);

}; // End Data Provider
