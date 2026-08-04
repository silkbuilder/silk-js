/*
 * Copyright (c) 2025 OopsClick LLC. All rights reserved.
 * This work is licensed under the O'Saasy License Agreement, a copy of which can be
 * found in the LICENSE file in the root directory of this project or at https://silkbuilder.com/core-license.
 */

/*
 * Generates the SQL code to create the table
 */
var generateCreateTableSQL = function(tableObject, columnArray, targetDB) {

	fkMatchDP = ["Simple", "Full", "Partial"];
	fkOnDP = ["No Action", "Cascade", "Set Null", "Set Default", "Restrict"];

	createSQL = "create table " + tableObject.tableName + " (\n";

	for (var x = 0; x < columnArray.length; x++) {

		let column = columnArray[x];
		let columnType = ifUndefined(column["sqlType" + targetDB], "");
		if (isEmpty(columnType)) columnType = "<red>*TYPE NO PROVIDED*</red>";

		createSQL += "\t" + column.columnName + " ";
		createSQL += columnType + " ";

		if (ifUndefined(column.pk, "") == "1") {
			if (tableObject.pkMode == "Auto") {
				if (targetDB == "1") createSQL += "primary key identity (1,1) ";
				if (targetDB == "2") createSQL += "primary key auto_increment ";
				if (targetDB == "3") createSQL += "primary key generated always as identity ";
				if (targetDB == "4") createSQL += "generated always as identity primary key";
			} else {
				createSQL += "primary key";
			}
		}

		if (ifUndefined(column.notNull, "") == "1") createSQL += "not null ";

		if (ifUndefined(column.unique, "") == "1") {
			if (targetDB != "2" && targetDB != "4") {
				createSQL += " unique ";
			}
		}

		var defaultValue = column["defaultValue" + targetDB];
		if (ifUndefined(defaultValue, "") != "") createSQL += "default " + defaultValue;
		createSQL += ",\n";
	}

	var hasForeing = false;

	for (var x = 0; x < columnArray.length; x++) {

		var column = columnArray[x];

		if (ifUndefined(column.fkTable, "") != "") {
			hasForeing = true;
			createSQL += "\tforeign key (" + column.columnName + ") references " + column.fkTable + " (" + column.fkColumn + ") ";
			if (ifUndefined(column.fkMatch, "0") != '0') createSQL += "match " + fkMatchDP[column.fkMatch] + " ";
			if (ifUndefined(column.fkOnUpdate, "0") != '0') createSQL += "on delete " + fkOnDP[column.fkOnUpdate] + " ";
			if (ifUndefined(column.fkOnDelete, "0") != '0') createSQL += "on delete " + fkOnDP[column.fkOnDelete] + " ";
			createSQL += ",\n";
		}

		if (ifUndefined(column.unique, "") == "1") {
			if (targetDB == "2") {
				createSQL += "\tunique (" + column.columnName + "),\n";
			}
		}

	}

	createSQL = createSQL.substring(0, createSQL.length - 2) + "\n";
	createSQL += ");\n\n";

	for (var x = 0; x < columnArray.length; x++) {

		var column = columnArray[x];

		if (ifUndefined(column.indexColumn, "0") != "0") {
			createSQL += "create index " + tableObject.tableName + "_" + column.columnName + " on " + tableObject.tableName + "(" + column.columnName + ");\n";
		}

	}

	createSQL = createSQL.replaceAll("\{dbTable\}", tableObject.tableName);
	createSQL = replaceAll(createSQL, " ,", ",");
	
	return createSQL.trim();

};



/*
 * Transfor Object to XML to be save on the ORM file.
 */
generateXML = function(targetType) {

	var ormXML = "<?xml version='1.0' encoding='UTF-8' ?>\n"
		+ "<!DOCTYPE ormObject>\n";

	/*
	 * Open ORM tag
	 */
	ormXML += "<orm ";

	// Set development database ID
	var developmentDatabaseID = ormObject.table.developmentDatabaseID;
	if (developmentDatabaseID != 0) ormXML += "developmentDatabaseID=\"" + developmentDatabaseID + "\" ";

	// Set databaseController
	var databaseController = ifUndefined(ormObject.table.databaseController, "");
	if (databaseController != "") ormXML += "databaseController=\"" + databaseController + "\" ";

	// Set query type.
	var queryType = ormObject.queryType;
	if (queryType != "SQL") ormXML += "queryType=\"" + queryType.toLowerCase() + "\" ";

	ormXML += ">";

	/*
	 * Open table tag
	 */
	ormXML += "\n\n\t<table ";

	var pkMode = ormObject.table.pkMode;
	if (pkMode != "Auto") ormXML += "pkMode=\"" + pkMode.toLowerCase() + "\" ";

	var tableName = ormObject.table.tableName;
	if (tableName != "") ormXML += "name=\"" + tableName + "\" ";

	var insertAuthorization = ifUndefined(ormObject.table.insertAuthorization, "");
	if (insertAuthorization != "") ormXML += "insertAuthorization=\"" + insertAuthorization + "\" ";

	var updateAuthorization = ifUndefined(ormObject.table.updateAuthorization, "");
	if (updateAuthorization != "") ormXML += "updateAuthorization=\"" + updateAuthorization + "\" ";

	var deleteAuthorization = ifUndefined(ormObject.table.deleteAuthorization, "");
	if (deleteAuthorization != "") ormXML += "deleteAuthorization=\"" + deleteAuthorization + "\" ";

	ormXML += ">\n";

	/*
	 * Generating column's tags
	 */
	for (var x = 0; x < ormObject.column.length; x++) {
		ormXML += "\t\t<column ";

		var columnName = ormObject.column[x].columnName;
		if (ifUndefined(columnName, "") != "") ormXML += "name=\"" + columnName + "\" ";

		var type = ormObject.column[x].type;
		if (ifUndefined(type, "") != "") ormXML += "type=\"" + type + "\" ";

		var pk = ormObject.column[x].pk;
		if (ifUndefined(pk, "0") != "0") ormXML += "pk=\"" + pk + "\" ";

		var secure = ormObject.column[x].secure;
		var pkNotSecure = ormObject.column[x].pkNotSecure;
		if (ifUndefined(pkNotSecure, "0") == "1") {
			ormXML += "secure=\"0\" ";
		} else {
			if (ifUndefined(secure, "0") != "0") ormXML += "secure=\"" + secure + "\" ";
		}

		var role = ifUndefined(ormObject.column[x].role, "X");
		if (role == "R") ormXML += "root=\"1\" ";
		if (role == "P") ormXML += "parent=\"1\" ";
		if (role == "L") ormXML += "level=\"1\" ";
		if (role == "O") ormXML += "order=\"1\" ";

		var translation = ormObject.column[x].translation;
		if (ifUndefined(translation, "0") != "0") ormXML += "translation=\"" + translation + "\" ";

		var xfunction = ormObject.column[x]["function" + databaseID];
		if (ifUndefined(xfunction, "") != "") ormXML += "function=\"" + xfunction + "\" ";

		var functionInsert = ormObject.column[x]["functionInsert" + databaseID];
		if (ifUndefined(functionInsert, "") != "") ormXML += "functionInsert=\"" + functionInsert + "\" ";

		var functionUpdate = ormObject.column[x]["functionUpdate" + databaseID];
		if (ifUndefined(functionUpdate, "") != "") ormXML += "functionUpdate=\"" + functionUpdate + "\" ";

		var nullValue = ormObject.column[x].nullValue;
		if (ifUndefined(nullValue, "") != "") ormXML += "nullValue=\"" + nullValue + "\" ";

		var validation = ormObject.column[x].validation;
		if (ifUndefined(validation, "") != "") ormXML += "validation=\"" + validation + "\" ";

		var authorization = ormObject.column[x].authorization;
		if (ifUndefined(authorization, "") != "") ormXML += "authorization=\"" + authorization + "\" ";

		ormXML += "/>\n";

	}

	/*
	 *  Generating reference columns used on selects
	 */
	for (var x = 0; x < ormObject.fk.length; x++) {
		ormXML += "\t\t<column ";

		var columnName = ormObject.fk[x].columnName;
		if (ifUndefined(columnName, "") != "") ormXML += "name=\"" + columnName + "\" ";

		var type = ormObject.fk[x].type;
		if (ifUndefined(type, "") != "") ormXML += "type=\"" + type + "\" ";

		var secure = ormObject.fk[x].secure;
		if (ifUndefined(secure, "0") != "0") ormXML += "secure=\"" + secure + "\" ";

		var role = ifUndefined(ormObject.fk[x].role, "X");
		if (role == "R") ormXML += "root=\"1\" ";
		if (role == "P") ormXML += "parent=\"1\" ";
		if (role == "L") ormXML += "level=\"1\" ";

		ormXML += "/>\n";

	}

	/*
	 * Closes table tag
	 */
	ormXML += "\t</table>\n\n";


	var editorArray = ormObject.table.editorDatabaseID.substring(1, ormObject.table.editorDatabaseID.length - 1).split(",");

	/*
	 * Setting schema 
	 */
	for (x in editorArray) {

		let editorDatabaseID = editorArray[x];
		if (!isNumeric(editorDatabaseID)) continue;

		let schemaValue = ifUndefined(ormObject.table["dbSchema" + editorDatabaseID].trim(), "");
		let pkSql = ifUndefined(ormObject.table["pkSql" + editorDatabaseID].trim(), "");

		if (schemaValue + pkSql == "") continue;

		ormXML += "\t<schema silkDatabaseID=\"" + editorDatabaseID + "\" ";

		if (schemaValue != "") ormXML += "value=\"" + schemaValue + "\" ";

		if (ormObject.table.pkMode == "SQL") {
			ormXML += ">";

			if (pkSql != "") {
				ormXML += "\n\t\t<![CDATA[\n\t\t\t" + replaceAll(pkSql, "\n", "\n\t\t\t") + "\n\t\t]]>\n";
			} else {
				ormXML += "\n";
			}
			ormXML += "\t</schema>\n\n";
		} else {
			ormXML += "/>\n";
		}
	}
	ormXML += "\n";

	/*
	 * Generates selects
	 */
	for (var x = 0; x < ormObject.select.length; x++) {
		for (y in editorArray) {

			let editorDatabaseID = editorArray[y];

			var sql = ormObject.select[x]["sql" + editorDatabaseID];
			if (isEmpty(sql)) continue;

			ormXML += "\t<sqlSelect ";

			var selectName = ormObject.select[x].selectName;
			if (ifUndefined(selectName, "default") != "default") ormXML += "name=\"" + selectName + "\" ";

			if (targetType == "ORM") {
				ormXML += "silkDatabaseID=\"" + editorDatabaseID + "\" ";
			}

			var origin = ormObject.select[x].origin;
			if (ifUndefined(origin, "0") != "0") ormXML += "origin=\"" + origin + "\" ";

			ormXML += ">\n";

			ormXML += "\t\t<![CDATA[\n\t\t\t" + replaceAll(sql, "\n", "\n\t\t\t") + "\n\t\t]]>\n";

			ormXML += "\t</sqlSelect>\n\n";
		}
	}


	/*
	 * Generates the operations tags
	 */
	for (var x = 0; x < ormObject.operation.length; x++) {
		for (y in editorArray) {

			let editorDatabaseID = editorArray[y];

			var sql = ormObject.operation[x]["sql" + editorDatabaseID];
			if (isEmpty(sql)) continue;

			ormXML += "\t<sqlOperation ";

			if (targetType == "ORM") {
				ormXML += "silkDatabaseID=\"" + editorDatabaseID + "\" ";
			}

			var type = ormObject.operation[x].type;
			if (type == "exec") {
				var operationName = ormObject.operation[x].operationName;
				if (ifUndefined(operationName, "") != "") ormXML += "name=\"" + operationName + "\" ";
			} else {
				var when = ormObject.operation[x].when;
				if (ifUndefined(when, "") != "") ormXML += "when=\"" + when + "\" ";

				var action = ormObject.operation[x].action;
				if (ifUndefined(action, "") != "") ormXML += "action=\"" + action + "\" ";
			}

			var origin = ormObject.operation[x].origin;
			if (ifUndefined(origin, "0") != "0") ormXML += "origin=\"" + origin + "\" ";

			var authorization = ormObject.operation[x].authorization;
			if (ifUndefined(authorization, "") != "") ormXML += "authorization=\"" + authorization + "\" ";

			var reportZeroResult = ormObject.operation[x].reportZeroResult;
			if (ifUndefined(reportZeroResult, "0") != "0") ormXML += "reportZeroResult=\"" + reportZeroResult + "\" ";

			ormXML += ">\n";

			ormXML += "\t\t<![CDATA[\n\t\t\t" + replaceAll(sql, "\n", "\n\t\t\t") + "\n\t\t]]>\n";

			ormXML += "\t</sqlOperation>\n\n";
		}
	}

	/*
	 * Generates authorization tags
	 */
	for (var x = 0; x < ormObject.authorization.length; x++) {
		for (y in editorArray) {

			let editorDatabaseID = editorArray[y];

			var sql = ormObject.authorization[x]["sql" + editorDatabaseID];
			if (isEmpty(sql)) continue;

			ormXML += "\t<sqlAuthorization ";

			ormXML += "silkDatabaseID=\"" + editorDatabaseID + "\" ";

			var authorizationName = ormObject.authorization[x].authorizationName;
			if (ifUndefined(authorizationName, "") != "") ormXML += "name=\"" + authorizationName + "\" ";

			ormXML += ">\n";

			ormXML += "\t\t<![CDATA[\n\t\t\t" + replaceAll(sql, "\n", "\n\t\t\t") + "\n\t\t]]>\n";

			ormXML += "\t</sqlAuthorization>\n\n";
		}
	}

	/*
	 * Close ORM tag
	 */
	ormXML += "</orm>";

	return ormXML;

};

/* --------------------------------------------------- */
/* Campativility with XML */
/* --------------------------------------------------- */

/*
 * Convert XML to Object
 */
ormXMLtoObject = function() {
	var tableObject = new Object()

	var $orm = ormXML.find("orm");
	tableObject["remoteService"] = ifUndefined($orm.attr("remoteService"), "");
	tableObject["queryType"] = ifUndefined($orm.attr("queryType"), "SQL");

	var $table = ormXML.find("table");
	tableObject["tableName"] = ifUndefined($table.attr("name"), "");
	tableObject["pkMode"] = ifUndefined($table.attr("pkMode"), "Auto");
	tableObject["insertAuthorization1"] = ifUndefined($table.attr("insertAuthorization"), "");
	tableObject["updateAuthorization1"] = ifUndefined($table.attr("updateAuthorization"), "");
	tableObject["deleteAuthorization1"] = ifUndefined($table.attr("deleteAuthorization"), "");

	var $pkSQL = ormXML.find("pkSQL");
	tableObject["pkSql1"] = ormXML.find("pkSQL").text().trim();

	ormObject["table"] = tableObject;

	var columnList = new Array();
	ormXML.find("column").each(function() {
		var column = new Object();
		var $column = $(this);

		column["columnName"] = ifUndefined($column.attr("name"), "");
		column["type"] = ifUndefined($column.attr("type"), "S");

		column["pk"] = "0";
		if (("true,1,on").indexOf(ifUndefined($column.attr("pk"), "0") > -1)) column.pk = "1";

		column["secure"] = "0";
		if (("true,1,on").indexOf(ifUndefined($column.attr("secure"), "0") > -1)) column.secure = "1";

		column["role"] = "X";
		if (("true,1,on").indexOf(ifUndefined($column.attr("root"), "0") > -1)) column.role = "R";
		if (("true,1,on").indexOf(ifUndefined($column.attr("parent"), "0") > -1)) column.role = "P";
		if (("true,1,on").indexOf(ifUndefined($column.attr("level"), "0") > -1)) column.role = "L";

		column["translation"] = ifUndefined($column.attr("translation"), "0");
		if (column.translation == "false") column.translation = "0";
		if (("true,xml,1").indexOf(column.translation) > -1) column.translation = "1";
		if (("column,2").indexOf(column.translation) > -1) column.translation = "2";


		column["function1"] = ifUndefined($column.attr("function"), "");
		column["functionInsert1"] = ifUndefined($column.attr("functionInsert"), "");
		column["functionUpdate1"] = ifUndefined($column.attr("functionUpdate"), "");
		column["nullValue"] = ifUndefined($column.attr("nullValue"), "");
		column["validation"] = ifUndefined($column.attr("validation"), "");
		column["authorization"] = ifUndefined($column.attr("authorization"), "");

		column["description"] = "";
		column["sqlType1"] = "";
		column["sqlDefaultValue1"] = "";
		column["fkTable"] = "";
		column["fkColumn"] = "";
		column["fkAction"] = "";

		columnList.push(column);

	});
	ormObject["column"] = columnList;

	var selectList = new Array();
	ormXML.find("sqlSelect").each(function() {
		var select = new Object();
		var $select = $(this);

		select["selectName"] = ifUndefined($select.attr("name"), "default");
		select["sql1"] = $select.text().trim();
		select["description"] = "";

		selectList.push(select);

	});
	ormObject["select"] = selectList;

	var operationList = new Array();
	ormXML.find("sqlOperation").each(function() {
		var operation = new Object();
		$operation = $(this);

		operation["operationName"] = ifUndefined($operation.attr("name"), "");
		operation["type"] = "exec"
		if (operation.operationName != "") operation.type = "trigger";

		operation["action"] = ifUndefined($operation.attr("action"), "");
		operation["when"] = ifUndefined($operation.attr("when"), "");

		operation["sql1"] = $operation.text().trim();
		operation["description"] = "";

		operation["authorization"] = ifUndefined($operation.attr("authorization"), "");
		operation["reportZeroResult"] = ifUndefined($operation.attr("reportZeroResult"), "0");

		operationList.push(operation);

	});
	ormObject["operation"] = operationList;

	var authorizationList = new Array();
	ormXML.find("sqlAuthorization").each(function() {
		var authorization = new Object();
		$authorization = $(this);

		authorization["authorizationName"] = ifUndefined($authorization.attr("name"), "");
		authorization["sql1"] = $authorization.text().trim();
		authorization["description"] = "";

		authorizationList.push(authorization);

	});
	ormObject["authorization"] = authorizationList;

};

function javaIn(content){
	content = replaceAll(content, atob("PCU="), atob("PGphdmE+"));
	content = replaceAll(content, atob("JT4="), atob("PC9qYXZhPg=="));
	return content;
}

function javaOut(content){
	content = replaceAll(content, atob("PGphdmE+"), atob("PCU="));
	content = replaceAll(content, atob("PC9qYXZhPg==") , atob("JT4="));
	return content;
}



/**
 * showDiff(code1, code2)
 * Renders a side-by-side / line-by-line diff of two code strings
 * inside the element with id="diffBox" using Diff2HtmlUI.
 *
 * Dependencies (add to your HTML before this script):
 *   <link  rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/diff2html/3.4.48/bundles/css/diff2html.min.css">
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/diff2html/3.4.48/bundles/js/diff2html-ui.min.js"></script>
 */
function silkShowDiff(code1, code2, type, full) {
	
	let outputFormat = "side-by-side";
	if( type==1 ) outputFormat = "line-by-line";
	
	if( full==undefined ) full=false;
	
  // ── 1. Build a unified-diff string from the two code snippets ──────────────

  const lines1 = code1.split("\n");
  const lines2 = code2.split("\n");

  // Produce a minimal unified-diff header + hunks via the built-in Diff helper
  // that ships with diff2html-ui (it re-exports the `diff` npm package).
  // If that isn't available we build the unified diff manually so the function
  // works in every environment.
  let unifiedDiff;

  if (window.Diff2HtmlUI && window.Diff) {
    // diff library is bundled with diff2html-ui
    unifiedDiff = window.Diff.createPatch("code", code1, code2, "", "");
  } else {
    unifiedDiff = buildUnifiedDiff(lines1, lines2, full);
  }

  // ── 2. Render with Diff2HtmlUI ─────────────────────────────────────────────

  const targetEl = document.getElementById("diffBox");
  if (!targetEl) {
    console.error('showDiff: no element found with id="diffBox"');
    return;
  }

  const diff2htmlUi = new Diff2HtmlUI(targetEl, unifiedDiff, {
    drawFileList:    false,   // hide the file-list summary bar
    matching:        "lines", // highlight matching tokens within changed lines
    outputFormat:    outputFormat, // "side-by-side" "line-by-line" is the other option
    synchronisedScroll: true,
	fileContentToggle:  false,
	colorScheme: 'dark',
	renderNothingWhenEmpty: false
  });

  diff2htmlUi.draw();
  diff2htmlUi.highlightCode(); // apply syntax highlighting (highlight.js)
}


// ── Fallback: manual unified-diff builder ────────────────────────────────────
// Produces a standards-compliant unified diff that diff2html can parse.
// Uses a simple LCS-based differ (good enough for code review use-cases).

function buildUnifiedDiff(lines1, lines2, full) {
  const CONTEXT = (full) ? 999999 : 4; //999999; // lines of context around each change
  
  // Compute the LCS table
  const m = lines1.length;
  const n = lines2.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        lines1[i - 1] === lines2[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Back-trace to produce edit operations
  const ops = []; // { type: 'eq'|'del'|'ins', line1, line2, text }
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      ops.push({ type: "eq", line1: i, line2: j, text: lines1[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "ins", line1: i, line2: j, text: lines2[j - 1] });
      j--;
    } else {
      ops.push({ type: "del", line1: i, line2: j - 1, text: lines1[i - 1] });
      i--;
    }
  }
  ops.reverse();

  // Group ops into hunks (changed regions + CONTEXT lines)
  const hunks = [];
  let k = 0;
  while (k < ops.length) {
    if (ops[k].type === "eq") { k++; continue; }

    // Found a change — collect the surrounding context
    const start = Math.max(0, k - CONTEXT);
    let end = k;
    while (end < ops.length && (ops[end].type !== "eq" || end - k < CONTEXT)) {
      end++;
    }
    end = Math.min(ops.length, end + CONTEXT);

    hunks.push(ops.slice(start, end));
    k = end;
  }

  if (hunks.length === 0) {
    // Files are identical — return a no-op diff
    return `--- a/code\n+++ b/code\n`;
  }

  // Render hunks as unified-diff text
  const header = `--- a/code\n+++ b/code\n`;
  const body = hunks.map((hunk) => {
    const firstOp = hunk[0];
    const lastOp  = hunk[hunk.length - 1];

    const oldStart = hunk.filter(o => o.type !== "ins")[0]?.line1 ?? 1;
    const newStart = hunk.filter(o => o.type !== "del")[0]?.line2 ?? 1;
    const oldCount = hunk.filter(o => o.type !== "ins").length;
    const newCount = hunk.filter(o => o.type !== "del").length;

    const hunkHeader = `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@\n`;
    const lines = hunk.map((op) => {
      if (op.type === "eq")  return ` ${op.text}`;
      if (op.type === "del") return `-${op.text}`;
      if (op.type === "ins") return `+${op.text}`;
    }).join("\n");

    return hunkHeader + lines;
  }).join("\n");

  return header + body;
}

