/*************************************************************************************************************************************************
/	Export to Table or CSV
/	- Create an html table
/	- Create a csv file
/************************************************************************************************************************************************/

// Create a html table or a csv file from a single layer
function ExportSingleLayer(exportLayer, outputType, outputSet) {
	var exportFeatures;
	
	if (exportLayer.CLASS_NAME == 'OpenLayers.Layer.Vector') {
		if (outputSet == "all")
			exportFeatures = exportLayer.features;
		else if (outputSet == "selected")
			exportFeatures = exportLayer.selectedFeatures;		
	
		if (exportFeatures.length == 0)
			alert("There are no features selected.");
		else {
			if (outputType == "html")
				ExportHTML(exportLayer, exportFeatures);
			else if (outputType == "csv")
				ExportCSV(exportLayer, exportFeatures);
		}
	}
	else
		alert("Can only export data layers.");
}

// Create a html table or a csv file from multiple layers
function ExportMultipleLayers(outputType, outputSet) {

	// Determine how many vector layers are checked
	var exportLayers = [];
	var lyrs = map.layers;
	for (var i = 0; i < lyrs.length; i++) {
		if (lyrs[i].CLASS_NAME == 'OpenLayers.Layer.Vector' && lyrs[i].visibility == true) {
			exportLayers.push(lyrs[i]);
		}
	}

	// Create the list of features to be exported
	var exportFeatures = [];
	if (exportLayers.length == 0)
		alert("Check at least one data layer.");
	else {
		if (outputSet == "all"){
			for (var i=0; i < exportLayers.length; i++)
				exportFeatures = exportFeatures.concat(exportLayers[i].features);
		}
		else if (outputSet == "selected") {
			for (var i=0; i < exportLayers.length; i++)
				exportFeatures = exportFeatures.concat(exportLayers[i].selectedFeatures);
		}
	
		if (exportFeatures.length == 0)
			alert("There are no features selected.");
		else {
			// If there is only one layer to be exported
			if (exportLayers.length == 1)
				exportLayer = exportLayers[0];
			// If there are mulitple layers to be exported get the layer to be used for column headings
			else
				exportLayer = GetPrimaryLayer(exportLayers);
			
			if (exportLayer != null) {
				if (outputType == "html")
					ExportHTML(exportLayer, exportFeatures);
				else if (outputType == "csv")
					ExportCSV(exportLayer, exportFeatures);
			}
		}
	}
}

// Get the layer to be used for the column headings
function GetPrimaryLayer(exportLayers) {
	var exportLayer;
	
	// If the feature types match just use the first layer for the headings
	if (MatchingFeatureTypes(exportLayers)) {
		exportLayer = exportLayers[0];
	}
	// Otherwise get the layer set as the active (highlighted) layer
	else {
		if (activeLayer != undefined) {
			// If the active (highlighted) layer is one of the checked layers
			if (IsIn(exportLayers, activeLayer) == true) {
				// If the feature types of the checked layers do NOT match
				if (MatchingFeatureTypes(exportLayers) == false) {
					if (confirm("Warning! Feature type MISMATCH!\nColumn headings will be taken from: " + activeLayer.name + "\n\nContinue?") == true)
						exportLayer = activeLayer;
					else
						exportLayer = null;
				}
				// If the feature types of the checked layers match
				else
					exportLayer = exportLayers[0];
			}
			// If the active (highlighted) layer is NOT one of the checked layers
			else {
				if (MatchingFeatureTypes(exportLayers) == false) {
					if (confirm("Warning! Feature type MISMATCH!\nColumn headings will be taken from: " + activeLayer.name + "\n\nContinue?") == true)
						exportLayer = activeLayer;
					else
						exportLayer = null;		
				}
				else {
					if (confirm("Warning!\nColumn headings will be taken from: " + activeLayer.name + "\n\nContinue?") == true)
						exportLayer = activeLayer;
					else
						exportLayer = null;	
				}
			}
		}
		// If no layer is set as the active (highlighted) layer
		else { 
			alert("More than one layer is checked.\nClick the name of the layer whose attributes you would like to use for the column headings, highlighting the layer name in blue.");
			exportLayer = null;
		}
	}
	
	return exportLayer;
}

// Check for matching feature types of multiple layers
function MatchingFeatureTypes(exportLayers) {
	for (var i=0; i < exportLayers.length - 1; i++) {
		for (var j=i+1; j < exportLayers.length; j++) {
			if (exportLayers[i].protocol.featureType != exportLayers[j].protocol.featureType)
				return false;
		}
	}
	return true;		
}

// Export the data as an HTML table
function ExportHTML(exportLayer, exportFeatures) {

	var output = "<html><title>" + exportLayer.name + "</title>";
	output += "<head><style type='text/css'>td{width:200px; border-style:ridge; border-width:2px; border-color:#99bbe8; background:white}</style></head>";
	output += "<body style=\"background-color:#c7dffc\"><table style='width:10000px; border-collapse:collapse; font:11px tahoma,arial,verdana,sans-serif'><tr>";

	output = WriteHTMLHeaders(exportLayer, output);
	output = WriteHTMLRows(exportFeatures, output);
	output += "</table></body></html>";
	
	// Write the html to a new window
	var htmlWin = window.open("","myWindow");
	htmlWin.document.write(output);
	htmlWin.document.close();
	
}

// Write the headers of the HTML table
function WriteHTMLHeaders(exportLayer, output) {
	// Set all attributes for the active layer
	GetAttributes(exportLayer.protocol);
	
	output += "<th>Layer Name</th>";
	// Write the attributes to an html table as the column headings
	for (var i=0; i < layerAttributes.length; i++) {
		//console.log(layerAttributes[i].name);
		output += "<th>" + layerAttributes[i].name + "</th>";
	}
	output += "</tr>";
	
	return output;
}

// Write the rows of the HTML table
function WriteHTMLRows(exportFeatures, output) {
	
	for (var i=0; i < exportFeatures.length; i++) {
		output += "<tr><td>" + exportFeatures[i].layer.name + "</td>";				
		for (var j=0; j < layerAttributes.length; j++) {
			var curColName = layerAttributes[j].name;
			var curRowData = exportFeatures[i].data;
			if ((curRowData[curColName]) == undefined)
				output += "<td></td>";
			else {
				// Make a HTML link for any Url within the text
				replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
				replacedText = curRowData[curColName].replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
				output += "<td>" + replacedText + "</td>";
			}
		}
		output += "</tr>";
	}	
		
	return output;
}

// Export the data as a CSV file
function ExportCSV(exportLayer, exportFeatures) {
	
	var output = "";
	output = WriteCSVHeaders(exportLayer, output);
	output = WriteCSVRows(exportFeatures, output);

	try {
		var xmlhttp;
		if (window.XMLHttpRequest)
		  // code for IE7+, Firefox, Chrome, Opera, Safari
		  xmlhttp = new XMLHttpRequest();
		else
		  // code for IE6, IE5
		  xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		
		// Tell the server to create a csv file with the string output
		xmlhttp.open("POST", "/csv", false);
		xmlhttp.send(output);
		
		// Open the csv
		window.open('/files/data.csv', '_blank');
	}
	catch (e) {
		alert("Unable to download the CSV file.");
	}
}

// Write the headers of the CSV table
function WriteCSVHeaders(exportLayer, output) {
	// Set all attributes for the active layer
	GetAttributes(exportLayer.protocol);

	output += "\"Layer Name\"";
	// Write the attributes to a string for a csv as the column headings
	for (var i=0; i < layerAttributes.length; i++) {
		//console.log(layerAttributes[i].name);
		output += ",\""+layerAttributes[i].name+"\"";
	}
	output += "\n";
	
	return output;
}

// Write the rows of the CSV table
function WriteCSVRows(exportFeatures, output) {
	for (var i=0; i < exportFeatures.length; i++) {
		output += "\"" + exportFeatures[i].layer.name + "\"";				
		for (var j=0; j < layerAttributes.length; j++) {
			var curColName = layerAttributes[j].name;
			var curRowData = exportFeatures[i].data;
			if ((curRowData[curColName]) == undefined)
				output += ",";
			else{
				// Escape embedded double quote characters with another double quote for CSV
				output += ",\"" + curRowData[curColName].replace(/\"/gi,"\"\"") + "\"";
			}
		}
		output += "\n";
	}	
	return output;
}

// Call DescribeFeatureType to get list of attributes for the active layer
function GetAttributes(protocol){
	var baseUrl = protocol.url;
	OpenLayers.Request.GET({
		url: baseUrl+'?SERVICE=WFS&version=1.1.0&REQUEST=DescribeFeatureType&namespace=wfs'+'&typeName='+protocol.featureType,
		async: false,
		success: function(resp) {
			// Format the response as WFS DescribeFeatureType
			var desFormat = new OpenLayers.Format.WFSDescribeFeatureType();
			var des = desFormat.read(resp.responseText);
			
			// Get the number of attributes and the attributes themselves
			layerAttributes = des.featureTypes[0].properties;
		}
	});
}