/* centerPanel.js 
 
 * Copyright (C) 2015 Eterna Commons at Stanford University
 * All rights reserved.
 *
 * This software may be modified and distributed under the terms
 * of the BSD-3-Clause license.  See the LICENSE.md file for details.
 */

/*
withExceptionHandler= function ( F ) { 
    try { 
        F(); 
    } catch (error) { 
        alert( error );
        alert ( new Error().stack );
    }     
}
*/

window.onError = function(message, source, lineno, colno, error) {
    alert( message );
    alert(  "...occurred on line " + lineno + " of " + source ); 
}

// global setTimeout timers to reduce event handling overlapping fire
var timer_center_resize = 0;

// draw horizontal borders every 5 rows; called on each draw()
function drawBlockBorder() {
    $("#center-table > tbody > tr").each(function(index) {
        if (index % 5 == 4) {
            $(this).addClass("block_border");
        } else {
            $(this).removeClass("block_border");
        }
    });
}

// coloring of row upon rendering
function rowMetaDecorate() {
    // for when first table init, variable "table" not assigned yet
    if (typeof table === 'undefined') { table = $("#center-table").DataTable(); }

    // color groups according to each "master" of the group
    var masters = table.columns(".master")[0];
    for (var i = 0; i < masters.length; i++) {
        var idx = table.colReorder.order()[masters[i]];
        $("#center-table > tbody > tr").each(function() {
            var d = $(".td_def_" + idx, this).text();
            // naive conditional coloring
            if (d == "Yes" || parseInt(d) > 0) {
                $("td.to-be-colored-" + idx, this).addClass("green-font").removeClass("gray-font");
            } else {
                $("td.to-be-colored-" + idx, this).addClass("gray-font").removeClass("green-font");
            }
        });
    }

/* (It's not clear how automatically generating percentages fits into the longer term plan)
    // calculate percentage for each group
    for (var i = 0; i < col_groups.length; i++) {
        // get members of group and sum
        var group = table.columns(".group-percentage-" + col_groups[i])[0];
        // bug that when member of column group is hidden, jQuery can't get that element, result in NaN
        $("#center-table > tbody > tr").each(function() {
            var sum = 0;
            for (var j = 0; j < group.length; j++) {
                var idx = table.colReorder.order()[group[j]];
                sum += parseFloat($(".td_def_" + idx, this).text());
            }
            // append (%) to column
            $("td.group-percentage-" + col_groups[i], this).each(function(j) {
                var idx = table.colReorder.order()[group[j]];
                var val = parseFloat($(this).text());
                var percent = '<span style="display:table; margin:auto;">' + val + ' <i style="color:#888;">(' + Math.round(val / sum * 100).toString() + '%)</i></span>';
                $(this).html(percent);
            });
        });
    }
*/
}

// draw sequence ruler in <th> every 5 residues; called once on init()
function drawSeqRuler() {
    var html = '';
    // make it divisible by 5
    max_len += 5 - max_len % 5;
    for (var i = 1; i <= max_len; i++) {
        if (i == 5) {
            html += '<span class="monospace">5</span>';
        } else if (i <= 95 && i > 5) {
            // cases of two digits
            if (i % 5 == 4) {
                html += '<span class="monospace">' + Math.round(i/10) + '</span>';
            } else if (i % 5 == 0) {
                html += '<span class="monospace">' + Math.round(i % 10) + '</span>';
            } else {
                html += '<span class="monospace">&nbsp;</span>';
            }
        } else if (i > 95) {
            // cases of three digits
            if (i % 5 == 3) {
                html += '<span class="monospace">' + Math.round(i/100) + '</span>';
            } else if (i % 5 == 4) {
                html += '<span class="monospace">' + Math.round(i/10 - 10) + '</span>';
            } else if (i % 5 == 0) {
                html += '<span class="monospace">' + Math.round(i % 10) + '</span>';
            } else {
                html += '<span class="monospace">&nbsp;</span>';
            }
        } else {
            html += '<span class="monospace">&nbsp;</span>';
        }
    }
    $("#seq_number").html(html);
}

// generate column <th> based on meta data; called once on init()
function drawColHeaders(gaColumnSpecification) {
    var html_1 = "<tr>", html_2 = "<tr>";
    var columnLabelIndex = gColumnsColumnIndex["Column_Label"];
    // for field names of two words, wrap it into two lines
    // for (var i = 0; i < gaDownloadedColumns.length; i++) {
    for (var i = 0; i < gaDownloadedColumns.length; i++) {
        var iSpec = gColumnsRowIndex[gaDownloadedColumns[i]];
        var col = gaColumnSpecification[iSpec][columnLabelIndex];
        if (col.indexOf(" ") != -1 && col.toLowerCase() != "sequence") {
            html_1 += '<th class="th_def_' + i + '">' + col.substring(0, col.indexOf(" ")) + '</th>';
            html_2 += '<th>' + col.substring(col.indexOf(" ") + 1, col.length) + '</th>';
        } else  if (col.toLowerCase() == "sequence") {
            html_1 += '<th class="th_def_' + i + '">Sequence</th>';
            html_2 += '<th id="seq_number"></th>';
        } else {
            html_1 += '<th class="th_def_' + i + '"></th>';
            html_2 += "<th>" + col + "</th>";
        }
    }
    $("#table-thead").html(html_1 + "</tr>" + html_2 + "</tr>");
}

// correct data types based on header meta; currently not called
function convertTypes(gaColumnSpecification) {
	for (var i = 0; i < gTableData.length; i++) {
		for (var j = 0; j < gTableData[i].length; j++) {
			if (gaColumnSpecification[j][1] != "string" && typeof(gTableData[i][j]) != gaColumnSpecification[j][1]) {
				gTableData[i][j] = Number(gTableData[i][j]);
			}
		}
	}
}

// extract numeric data from <td> element
// because when sort(), DataTables takes the html() content regardless of original data source
function extractNumCell(d) {
    // get pure trimmed text()
    d = $("<p>" + d + "</p>").text().trim();
    // get substring before e.g. "/100" and "(%)"
    if (d.indexOf("/") != -1) { d = d.substring(0, d.indexOf("/")); }
    if (d.indexOf("(") != -1) { d = d.substring(0, d.indexOf("(")); }
    // only save numbers
    d = d.match("^[-+]?[0-9]*\.?[0-9]+");
    return Number(d);
}

// assign className and type to each column
function initColClass() {
    // custom sorting function for numbers, stripping suffix text
    // "xxx-pre" is recognizied for "xxx" in column.type
    $.fn.dataTable.ext.type.order["num-filtered-pre"] = function ( d ) { return extractNumCell(d); };

        var obj = [];
        var dataTypeIndex = gColumnsColumnIndex["Siqi_sub_1"];
        var specialIndex = gColumnsColumnIndex["Siqi_sub_3"];
        var groupIndex = gColumnsColumnIndex["Siqi_sub_4"];

        for (var i = 0; i < gaDownloadedColumns.length; i++) {
            var iSpec = gColumnsRowIndex[gaDownloadedColumns[i]];
            var col_type = gaColumnSpecification[iSpec][dataTypeIndex];
            // internally reference columns as td_def_*, 0-indexed
            var class_name = "td_def_" + i;
            // add to-be-colored group class name
            if (gaColumnSpecification[iSpec].length > specialIndex && gaColumnSpecification[iSpec][specialIndex]) {
                if (isNaN(parseInt(gaColumnSpecification[iSpec][specialIndex]))) {
                    class_name += ' ' + gaColumnSpecification[iSpec][specialIndex];
                } else {
                    class_name += ' to-be-colored-' + gaColumnSpecification[iSpec][specialIndex];
                    if (gaColumnSpecification[iSpec][specialIndex] == i) { class_name += ' master'; }
                }
            }
            // add group-percentage- group class name
            if (gaColumnSpecification[i].length > groupIndex && gaColumnSpecification[iSpec][groupIndex]) {
                class_name += ' group-percentage-' + gaColumnSpecification[iSpec][groupIndex];
            }

            // format for numeric columns
            if (col_type == "int" || col_type == "float") {
                obj.push({"className": class_name, "type": "num-filtered"});            } else {
                obj.push({"className": class_name, "type": "string"});
            }            
	}
	return obj;
}

// assign columnDefs of coloring and suffix etc.  This is called once when the table is initialized.
function initColRender() {
    var obj = [];
    var dataTypeIndex = gColumnsColumnIndex["Siqi_sub_1"];
    var suffixIndex = gColumnsColumnIndex["Siqi_sub_2"];
    var specialIndex = gColumnsColumnIndex["Siqi_sub_3"];
    var usageIndex = gColumnsColumnIndex["Usage"];
    for (var i = 0; i < gaDownloadedColumns.length; i++) {
        var iSpec = gColumnsRowIndex[gaDownloadedColumns[i]];
        var col_type = gaColumnSpecification[iSpec][dataTypeIndex];

        // special rendering for "Sequence" column (nucleotide coloring)
        if (gaColumnSpecification[iSpec].length > specialIndex && gaColumnSpecification[iSpec][specialIndex] == "sequence") {
            obj.push({
                "targets": "th_def_" + i, 
                "render": function(data, type, row, meta) {
                    var html = '';
                    for (var i = 0; i < data.length; i++) {
                        var nt = data.substring(i, i+1);
                        if ((i + 1) % 5 == 0) {
                            html += '<span class="monospace nt-' + nt.toUpperCase() + ' line-per-five-base">' + nt + '</span>';
                        } else {
                            html += '<span class="monospace nt-' + nt.toUpperCase() + '">' + nt + '</span>';
                        }
                    }
                    // get max_len of all sequences, used for <th> ruler
                    if (data.length > max_len) { max_len = data.length; }
                    return html;
                } 
            });
        } else {
            // format for numeric columns
            if (col_type == "int" || col_type == "float") {
                obj.push({
                    "targets": "th_def_" + i, 
                    "render": function(data, type, row, meta) {  // Lot of repeated calculation; can some of this calculation be moved out of this per-cell call?
                        // for when first table init, variable "table" not assigned yet
                        if(typeof table === 'undefined') { table = $("#center-table").DataTable(); };
                        var idx = table.colReorder.order()[meta['col']];	
                        var iSpec = gColumnsRowIndex[gaDownloadedColumns[idx]];
                        // round float to 2 decimals
                        if (gaColumnSpecification[iSpec][dataTypeIndex] == 'float') {
                            data = parseFloat(data).toFixed(2);
                        } else {
                            data = parseInt(data);
                        }
                        var suffix = '';
                        // Display missing numeric data as "N/A", rather than NaN
                        if (data === 'NaN') {
                            data = 'N/A   ';
                        } else {
                            // add suffix string in gray if it exists
                            if (gaColumnSpecification[iSpec].length > suffixIndex && gaColumnSpecification[iSpec][suffixIndex].length) {
                                suffix = ' <i style="color:#888;">' + gaColumnSpecification[iSpec][suffixIndex] + '</i>';
                            }
                        }
                        return '<span class="td-num">' + data + suffix + '&nbsp;&nbsp;</span>';
                    } 
                });
            } else {
                obj.push({
                    "targets": "th_def_" + i, 
                    "render": function(data, type, row, meta) {
                        // for when first table init, variable "table" not assigned yet
                        if(typeof table === 'undefined') { table = $("#center-table").DataTable(); };

                        var idx = meta['col']; // i.e. DataTable's column index 
                        idx = table.colReorder.order()[idx];
                        var iSpec = gColumnsRowIndex[gaDownloadedColumns[idx]];
                        var suffix = '';
                        if (gaColumnSpecification[iSpec].length > suffixIndex && gaColumnSpecification[iSpec][suffixIndex].length) {
                            suffix = ' <i style="color:#888;">' + gaColumnSpecification[iSpec][suffixIndex] + '</i>';
                        }
                        // truncate text and enable expand-when-hover, controlled by CSS
                        return '<p class="txt-hover">' + data + suffix + '</p>';
                    } 
                });
            }            
        }

    }
    return obj;
}

// main function for drawing the DataTable
var _lastTableRowClickEventTimeStamp = 0; // Kludge.  See below.
function initTable() {
    $("#center-table").DataTable({
        "data": gTableData,
        "dom": 'BRC<"clear">rt',
        "processing": true,
        "sortCellsTop": true,
        "stateSave": true,
        "orderClasses": true,
        // "bPaginate": false,
        "scrollX": "100%",
        "scrollY": $(window).height() - 245,
        "sortClasses": false,
        "autoWidth": true,
        "deferRender": true,
        "scroller": {
            "loadingIndicator": true,
            "displayBuffer": 2,
        },
// !!! Testing
/*
        "createdRow": function( row, data, dataIndex ) {
            if ( data[4] == "A" ) {
                $(row).addClass( 'important' );
            }
        },
*/
        "createdCell": function (td, cellData, rowData, row, col) {
            alert();
            if ( cellData < 1 ) {
                $(td).css('color', 'red')
            }
        },
// !!! end of testing

        "buttons": [], // add after initialization
        "columns": initColClass(),
        "columnDefs": initColRender(),

        "select": {
            "style": "os",
            "items": "row",
            "selector": "td" // does not work at all!
        },

        "initComplete": function() { 
            // draw sequence numbering once on init
            drawSeqRuler();
            // remove "Loading" placeholder	// Move to pair with $(".ui-layout-center > h1").html("Loading Table...");

            $(".ui-layout-center > h1").remove();

            // init side panels
            initStr2D();
            initColOpt();
            initFilterInput();
            // move buttons to same line with lab title
            if (gOptions.example) {
                //$(".dt-buttons").remove();
            }
            else {
                new $.fn.dataTable.Buttons( table, {
//!!!!
                        // custom buttons above the table
                        "buttons": [
/*                            {
                                "extend": "selectNone",
                                "text": "Unselect Rows",
                                "className": "purple-button seq-button table-button"
                            },
*/
                            {
                                "text": "Puzzles",
                                "action": function ( e, dt, node, config ) {
                                    if (pageLayout.state.west.isClosed && !pageLayout.state.west.isHidden) {
                                        pageLayout.toggle("west");
                                        $("#tab-panel-west-1").trigger("click");
                                    } else {
                                        if ($("#tab-panel-west-1").parent().attr("aria-selected") == "true") {
                                            pageLayout.toggle("west");
                                        } else {
                                            $("#tab-panel-west-1").trigger("click");
                                        }
                                    }
                                },
                                "className": "green-button seq-button table-button"
                            },
                            {
                                "text": "Columns",
                                "action": function ( e, dt, node, config ) {
                                    if (pageLayout.state.west.isClosed) {
                                        pageLayout.toggle("west");
                                        $("#tab-panel-west-2").trigger("click");
                                    } else {
                                        if ($("#tab-panel-west-2").parent().attr("aria-selected") == "true") {
                                            pageLayout.toggle("west");
                                        } else {
                                            $("#tab-panel-west-2").trigger("click");
                                        }
                                    }
                                },
                                "className": "green-button seq-button table-button"
                            },
                            {
                                "text": "Filters",
                                "action": function ( e, dt, node, config ) {
                                    if (pageLayout.state.west.isClosed) {
                                        pageLayout.toggle("west");
                                        $("#tab-panel-west-3").trigger("click");
                                    } else {
                                        if ($("#tab-panel-west-3").parent().attr("aria-selected") == "true") {
                                            pageLayout.toggle("west");
                                        } else {
                                            $("#tab-panel-west-3").trigger("click");
                                        }
                                    }
                                },
                                "className": "green-button seq-button table-button"
                            },
/*
                            {
                                "text": "Download",
                                "action": function ( e, dt, node, config ) {
                                    alert("Data download is not implemented yet.")
                                    // window.open("/data/synthesis" + id + ".tsv", "Download");
                                },
                                "className": "blue-button seq-button table-button"
                            },
*/
                    ]
                });
                table.buttons().container().prependTo($("#table-button-container"));
                $(".dt-buttons").removeClass("dt-buttons"); // Why remove the clasee?
            }
            resizeCenterTable();
    
            // make sure table size and 2D JS size are right
            $(window).on("resize", function() { resizeCenterTable(); });
        },
        "drawCallback": function() { 
            // draw horizontal separators every 5 rows
            drawBlockBorder();
            rowMetaDecorate();
            // work around for select trigger, re-route click events to 1st column

            $("td").on("click", function(e) {
                if (!$(this).hasClass("td_def_0")) {
                    var td_0 = $(this).parent().find(".td_def_0");
                    // replacing the "target" is important!
                    e["target"] = td_0[0];
                    td_0.trigger(e);
                    e.stopPropagation();
                }
            })

/* !!! Try this
    $('#center-table tbody').on( 'click', 'tr', function (e) {
        if (e.timeStamp  - _lastTableRowClickEventTimeStamp > 0.1) {	// !!! Kluge!  Suppress doubled events.  Why are they happening?
            _lastTableRowClickEventTimeStamp = e.timeStamp;
            alert( table.row($(this)[0]._DT_RowIndex).data()[gDataColumnIndex['Sequence']] );
        }
    });
*/
/* !!! Attempting to make selection work on first column as well as others.
            $("td").on("click", function(e) {
                var td_0 = $(this).parent().find(".td_def_0");
                if ($(this).hasClass("td_def_0")) {
                    td_0.trigger(e);
                    e.stopPropagation();
                }
                else {
                    // replacing the "target" is important!
                    e["target"] = td_0[0];
                }
            })
*/
        },
        // not used because it fires for each row, too frequent
        "rowCallback": function(row, data, dataIndex) {}
    });
}


function initLayout(){

}

// handle table height resizeTimer
function resizeCenterTable() {
    clearTimeout(timer_center_resize);
    timer_center_resize = setTimeout(function() {
        if (DEBUG) { console.log("center-resize"); }

        // !!!TODO: This calculation is not correct for all browsers.  The value of 36 is chosen as a compromise that seems to be widely acceptable
        $("div.dataTables_scrollBody").css("height", $("#concept-center").height() - $("#lab-red-header").height() - $("div.dataTables_scrollHead").height() - 36);
    }, 100);
}


function fetchAllData( continuation )
{
	$.ajax({
		"dataType": "json",
		"url": getPuzzleQuery(),
		"success": function(data) {
			normalizePuzzleResponse( data )
			initPuzzleSelections();
		},
		"error": function(){
                        var errorDetails = data.error;
                        alert("Download of puzzle descriptions failed: " + errorDetails.message);
                        throw( errorDetails );

			// for debugging, put up some fake data
			//this.success( fakePuzzleResponse );
		},
		"complete": function() {
			// Query for columns present in selected puzzles
			$.ajax({
				"dataType": "json",
				"url": getColumnQuery(),
				"success": function(data) {
					normalizeColumnResponse( data );
					fillColumns();
					initColumnSelections();
				},
				"error": function(){
					// put up some fake data
					this.success( fakeColumnResponse );
				},
				"complete": function() {
					// Query for data in the selected puzzles/columns 
                                        $(".ui-layout-center > h1").html("Retrieving Data ...");
					$.ajax({
						"dataType": "json",
						"url": getDataQuery(),
						"success": function(data) {
							dataAjaxSuccess(data);
/* (Unless there's a big player demand, implement percentages as a calculated field, rather than storing them in the database)
							gaDownloadedColumns.length = gaColumnsToDownload.length; 
							// get group percentages in array
							for (var i in Object.keys(gaColumnSpecification)) {
							    if (gaColumnSpecification[i].length > 4 && gaColumnSpecification[i][4]) {
							        if (col_groups.indexOf(gaColumnSpecification[i][4]) == -1) {
						            		col_groups.push(gaColumnSpecification[i][4]);
						        	}
							    }
							}
*/
							// init column options and headers according to query
							drawColDisplayOptions(gaColumnSpecification);
							drawColHeaders(gaColumnSpecification);
							$(".ui-layout-center > h1").html("Loading Table...");
						},
						"error": function(){
							// put up some fake data
							this.success( fakeDataResponse );
						},
						"complete": function() {
							// manually converting data types
							// don't need this since the sorting takes text() of <td> regardless of source data
							// convertTypes(gaColumnSpecification);

							if (tableNotLoaded)
							    if (continuation) continuation()
							    setTimeout(function() {
							         initTable();
							         $("#loading-dialog").dialog("close");
							         tableNotLoaded = false;                          
							    }, 50);
							// apply retrieved filter when loaded.
							//!!! $("#col-filter-str-0") doesn't exist any more.  What should replace this code?
							setTimeout(function() { 
							    if ($("#col-filter-str-0").length) {
							        $("#col-filter-str-0").trigger("change");
							    } else {
							        $("#col-filter-min-0").trigger("change");
							    }
							}, 200);
						}
					});
				}
			});
		}
	});
}

function fetchPuzzles( continuation ) {
    $.ajax({
	"dataType": "json",
	"url": getPuzzleQuery(),
	"success": function(data) {
	    normalizePuzzleResponse( data )
	    initPuzzleSelections();
	},
	"error": function(){
	    // put up some fake data
	    this.success( fakePuzzleResponse );
	},
	"complete": function() {if (continuation) continuation()}
    });
}

function fetchColumns( continuation ) {
    $.ajax({
	"dataType": "json",
	"url": getColumnQuery(),
	"success": function(data) {
	    normalizeColumnResponse( data );
	    fillColumns();
	    initColumnSelections();
	},
	"error": function(){
	    // put up some fake data
	    this.success( fakeColumnResponse );
	},
	"complete": function() {if (continuation) continuation()}
    });
}

function fetchData(  continuation ) {
    $(".ui-layout-center > h1").html("Retrieving Data ...");
    $.ajax({
	"dataType": "json",
	"url": getDataQuery(),
	"success": function(data) {
	    dataAjaxSuccess(data);
/* (It's not clear how automatically generating percentages fits into the longer term plan)
	    // get group percentages in array
	    for (var i in Object.keys(gaColumnSpecification)) {
		if (gaColumnSpecification[i].length > 4 && gaColumnSpecification[i][4]) {
		    if (col_groups.indexOf(gaColumnSpecification[i][4]) == -1) {
	                col_groups.push(gaColumnSpecification[i][4]);
	            }
		}
	    }
*/
	    // init column options and headers according to query
	    drawColDisplayOptions(gaColumnSpecification);
	    drawColHeaders(gaColumnSpecification);
	    $(".ui-layout-center > h1").html("Loading Table...");
	},
	"error": function(){
	    // put up some fake data
	    this.success( fakeDataResponse );
	},
	"complete": function() {
	    // manually converting data types
	    // don't need this since the sorting takes text() of <td> regardless of source data
	    // convertTypes(gaColumnSpecification);

	    if (tableNotLoaded)
		setTimeout(function() {
		    initTable();
		        $("#loading-dialog").dialog("close");
		        tableNotLoaded = false;                          
	            if (continuation) continuation();
		}, 50);
	    // apply retrieved filter when loaded.
	    /* These ids don't exist any more.  What did this code actually do?
	    setTimeout(function() {
		 if ($("#col-filter-str-0").length) {
		     $("#col-filter-str-0").trigger("change");
		 } else {
		     $("#col-filter-min-0").trigger("change");
		 }
	    }, 200);
            */
	}
    });
}


// Update gDataColumnIndex to match the column order of gTableData.  This is needed after re-ordering columns.
function updateColumnTracking()
{
    if (gTableData) {
        for (i = 0; i < gaDownloadedColumns.length; i++) {
            gDataColumnIndex[gTableData[i][columnNameIndex]] = i;
        }
    }
}

// Specific columns for right-panel
function getColNums() {
    return {
        "designer": gDataColumnIndex["Designer_Name"],
        "title": gDataColumnIndex["Design_Name"],
        "sequence": gDataColumnIndex["Sequence_"],
        "id": gDataColumnIndex["Design_ID"],
        "round": gDataColumnIndex["Synthesis_Round"],
        "description": gDataColumnIndex["Description_"],
        "score": gDataColumnIndex["Eterna_Score"],
        "flag": -1
    };
}

// default columns, either because we don't want to ask, or because there is no localStorage history.
function defaultColumns() {
    return ["Project_ID", "Project_Name", "Puzzle_ID", "Design_ID", "Design_Name", "Designer_Name", "Folding_Subscore", "Baseline_Subscore", "Switch_Subscore", "Eterna_Score", "Sequence"];
}

//--------------------------------------------------------------------
// Check for, and act on, any URL query string coming from the iframe container
//-------------------------------------------------------------------- 
var queryString = "";

// Send request to parent
function requestQueryString () {
   window.parent.postMessage("queryString?", "*");
}

// Record the response
function receiveMessage(event)
{
    queryString = event.data;
}

// Set things in motion
function asyncGetQueryString( continuation ) {
    // If the window is its own parent, there is no iframe.  Get the query string from the window's URL
    if (window.parent == window) {
        processQueryString( "queryString:" + location.search );
    } else {        
        // Ask the parent window for the query string
        window.addEventListener("message", receiveMessage, false);
        // Wait for 100 ms before asking parent window to send query string
        setTimeout( function () {
            requestQueryString ();
            // Wait for another 20 ms for a response from parent
            if (continuation) {
                setTimeout( function() {
                    continuation( queryString )
                }, 20 );
            }
        }, 100); 
    }
}
// Query constraints are collected in the queryConstraints, which has members corresponding to data column names 
var queryConstraints = {};
// Act on the query string

function processQueryString( queryString ) {
    console.log("iframe received '" + queryString + "'");

    // Remove the leading "queryString:" and/or "?", if present
    queryString = queryString.replace(/^queryString:/,"").replace(/\?/,"").toLowerCase();

    if (queryString) {
        // Parse the options from the query string
        gOptions = {};
        queryString.split("&").map( function(x){ 
            var temp = x.split("="); 
            gOptions[temp[0].trim()] = temp[1].trim() 
        });

        // options now has a property for each option set by the query string
        if (gOptions.example) {
            gOptions.noPersistence = true;    // Bypass persistence to/from localStorage
            switch (gOptions.example[0]) {
              case "1": 
                overrideQueryIDs( "Example-1" );  // Special database
                $("#lab-title").html( "Exclusion 1" );
                gOptions.lock = ["panel-left", "panel-right"];
                break;
              case "2": 
                overrideQueryIDs( "Example-2" );  // Special database
                $("#lab-title").html( "Exclusion 5" );
                gOptions.lock = ["panel-left"];
                break;
            }
        }

        // Check for locking of capabilities
        if (gOptions.lock) {
            for (var t = 0; t < gOptions.lock.length; t++) {
                switch (gOptions.lock[t]) {
                  case "panel-left":
                    pageLayout.hide("west");
                    break;
                  case "panel-right":
                    pageLayout.hide("east");
                    break;
                }
            }
        }

        // special case for examples
        if (gOptions.example) { // !!! Check for implemented examples? // && gOptions.example[0] == "1") {
            fetchAllData( function(){
                updateCenterTitle();
            });
        }

        // See if particular puzzles were specified
        if (gOptions.puzzle_id) {
            var puzzles = decodeURIComponent(gOptions.puzzle_id).replace(/"/g, '').split(",");

            // Bypass persistence to/from localStorage
            gOptions.noPersistence = true;

   
            // fetch the puzzle data,
            fetchPuzzles( function() {                                                                      
                // extract the project ID(s) for the specified puzzles and submit the column query
                var puzzleIDIndex = gPuzzleIndex.Puzzle_ID;
                var projectIDIndex = gPuzzleIndex.Project_ID;
                for (var i = 0; i < gaPuzzles.length; i++) {
                    if (puzzles.indexOf(gaPuzzles[i][puzzleIDIndex]) >= 0) {
                        gProjectIDs[ gaPuzzles[i][projectIDIndex] ] = true;
                    }
                }
                // Update the table title
                var puzzleNameIndex = gPuzzleIndex.Puzzle_Name;
                var puzzleIDIndex = gPuzzleIndex.Puzzle_ID;
                var aPuzzleNames = [];
                gaPuzzles.map( function( value ) {
                    if (puzzles.indexOf(value[puzzleIDIndex]) >= 0) {
                        aPuzzleNames.push( value[puzzleNameIndex] );
                    }
                });
                $("#lab-title").html( aPuzzleNames.join(", ") ); // refactor updateCenterTitle?
                fetchColumns( function () {
                    // Specify the desired puzzles and columns and submit the data query
                    gaSelectedPuzzles = [puzzles];
                    gaColumnsToDownload = defaultColumns();
                    fetchData( function() {
                        if (!pageLayout.state.west.isClosed) {
                             pageLayout.toggle("west");
                        }
                    });

                });
            });
            return;
        }

 
        // The exec option was for testing; its long-term role is uncertain, but currently exec == "fetchAllData" is being used when the table needs to be reinitialized. 
        if (gOptions.exec && gOptions.exec == "fetchalldata") {
            fetchAllData( function() {
                updateCenterTitle();
                $("#tab-panel-west-3").click(); // Open Display Control accordion
                pageLayout.open("west");
            });
            return;
        }
       
        // The Designer_Name option is used for limiting the download (or should it be the filter?) to one a specific player (or players)
        // Id enabled, it needs to be made more complete in terms of setting up left panel selections
        if (gOptions.Designer_Name){
            queryConstraints.Designer_Name = gOptions;    //!!! can't be right (?)  
        };       
    }

    // The query string hasn't diverted the flow of control.
    if (!queryString) {
        console.log( "No queryString received. Fetch the available puzzles and let the user take over." );
    } else {
        console.log( "The query string didn't divert control.  Was it malformed?" );
    }

    // Query for available puzzles, closing the loading dialog when done
    fetchPuzzles( function () {
        $("#loading-dialog").dialog("close");
        updateCenterTitle();
        $(".ui-layout-center > h1").html('Select one or more puzzles from the list on the left.<br><br>Then click on the "Select Columns" button.');
        // Open the left panel.  Nothing more will happen until the user takes action
        if(pageLayout.state.west.isClosed && !pageLayout.state.west.isHidden) {
            pageLayout.toggle("west");
        }
    });
}

// Initiate the interaction with the player, based on the absence/presence/content of the query string.
// The query string can come directly from the window or indirectly from the parent Eterna container.
function initAction() {
    asyncGetQueryString( processQueryString );
}

/*
// Debugging aid -- have a place to set breakpoint, to see what is causing a pane to close. !!! But including this code has unwanted side effects, even without placing the breakpoint.
$("body").layout({
    onclose_start: function () {
        return true; // false = Cancel
    }
});
*/

// To support experimentation (from the debugger console) of alternate colors
// From David Walsh blog: https://davidwalsh.name/add-rules-stylesheets
var customCSS = (function() {
	// Create the <style> tag
	var style = document.createElement("style");

	// Add a media (and/or media query) here if you'd like!
	// style.setAttribute("media", "screen")
	// style.setAttribute("media", "only screen and (max-width : 1024px)")

	// WebKit hack :(
	style.appendChild(document.createTextNode(""));

	// Add the <style> element to the page
	document.head.appendChild(style);

	return style.sheet;
})();
