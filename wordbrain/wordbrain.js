// automatically select current value on a text input
function selectContent(e) {
	var target = getTarget(e);
	target.select();
}

        function getTarget(e) {
            return (e.target) ? e.target : e.srcElement;
        }
        
var wordbrain = {
	// height and width of container table (i.e. user table height+2 and width+2
	outerHeight:null,
	outerWidth:null,
	maxLength:null,
	startCell:null,
	displayAll: false,		// display all words found
	restrictedMode: true,	// search words based on a dictionnary
	locale: "fr_FR",		// start dictionnary locale
	structure: [],
	deleteMode: false,
	firstLetterOnly: true,  // display only start letters
	
	// possible moves from a position intialization
	possibleMoves: [],

	// initialize 6x6 table
	doInit : function() {
		document.getElementById("tableWidth").value = 6;
		document.getElementById("tableHeight").value = 6;
		wordbrain.buildTable();
	},
	
	populateStructure: function() {
		for (  var i = 0; i< wordbrain.outerHeight*wordbrain.outerWidth; i++ )
			wordbrain.structure[i] = wordbrain.getValue(i) || "";
	},
	
	populateTable: function() {
	    for (  var i = 0; i< wordbrain.outerHeight*wordbrain.outerWidth; i++ )
	        if ( wordbrain.structure[i] )
	        wordbrain.setValue(i, wordbrain.structure[i]);
	},
	
	save: function() {
	    wordbrain.populateStructure();
	    localStorage.setItem("wordbrain", JSON.stringify(wordbrain.structure));
	},
	
	load: function() {
	    wordbrain.structure=JSON.parse(localStorage.getItem("wordbrain"));
	    wordbrain.populateTable();
	},

	// changes the user input to uppercase and moves to next cell
	upperCase: function(e) {
		var target = (e.target) ? e.target : e.srcElement;
		target.value = target.value.toUpperCase();
		if ( target.value.match(/[A-zÀ-ÿ]/) ) {
			wordbrain.nextInput(target);
		}
	},

	setOuterDimensions: function() {
		wordbrain.outerHeight=Number(document.forms["tableBuilder"].tableHeight.value) + 2;
		wordbrain.outerWidth=Number(document.forms["tableBuilder"]["tableWidth"].value) + 2;
	},

	nextInput: function(elem) {
		var next = elem.parentElement;
		do {
			if ( next.nextSibling)
				next = next.nextSibling;
			else if (next.parentElement.nextSibling)
				next = next.parentElement.nextSibling.firstChild;
			else 
			   return;
			 var pos = Number(next.firstChild.getAttribute("data-pos"));
			if ( ! wordbrain.isOuterCell(pos)) {
				next.firstChild.select();
				return;
			}
		} while ( next );
	},
	
	isOuterCell: function(pos) {
		if ( pos <= wordbrain.outerWidth )
			return true;
		if ( pos >= wordbrain.outerWidth*wordbrain.outerHeight-(wordbrain.outerWidth+1) )
			return true;
		if ( pos % wordbrain.outerWidth === 0 )
			return true;
		if ( (pos+1) % wordbrain.outerWidth === 0 )
			return true;
		return false;
	},
	
	// build the table based on user-provided dimensions
	buildTable: function() {
		wordbrain.setOuterDimensions();
		wordbrain.updatePossibleMoves();
		var container = document.getElementById("tableContainer");
		container.innerHTML = "";
		wordbrain.setOuterDimensions();
		var table = document.createElement("table");
		table.setAttribute("id", "inputTable");
		var tableBody = document.createElement("tbody");
		table.appendChild(tableBody);
		for (var row=0;row<wordbrain.outerHeight;row++) {
			var tr = document.createElement("tr");
			tableBody.appendChild(tr);
			for (var column=0;column<wordbrain.outerWidth;column++) {
				// compute global cell position
				var pos = wordbrain.outerWidth*row + column;

				var td = document.createElement("td");

				// hide outer cells
				if ( wordbrain.isOuterCell(pos) )
					td.className = "outer";

				// add text input area
				var input = document.createElement("input");
				input.type = "text";
				input.addEventListener("keyup", wordbrain.upperCase, false);
				input.addEventListener("focus", selectContent, false);
				input.addEventListener("dblclick", wordbrain.dispatchAction, false);
				input.addEventListener("click", wordbrain.checkDelete);

				input.size=1;
				input.maxLength=1;
				input.pattern="[A-zÀ-ÿ]";
				input.setAttribute('data-pos', pos);
				input.value = "";
				td.appendChild(input);
				tr.appendChild(td);
			}
		}
		document.getElementById("tableContainer").appendChild(table);
	},
	
	updatePossibleMoves: function() {
		wordbrain.possibleMoves =[];
		wordbrain.possibleMoves.push(-wordbrain.outerWidth-1,-wordbrain.outerWidth,-wordbrain.outerWidth+1);
		wordbrain.possibleMoves.push(-1,+1);			
		wordbrain.possibleMoves.push(wordbrain.outerWidth-1,wordbrain.outerWidth,wordbrain.outerWidth+1);
	},
	
	doSearch: function() {
		wordbrain.maxLength = Number(document.getElementById("wordLength").value);
		if ( isNaN(wordbrain.maxLength) || wordbrain.maxLength === 0 ) {
			alert("You must define a word length first!");
			return;
		}
		
		if ( wordbrain.maxLength < 2 || wordbrain.maxLength > (wordbrain.outerHeight-2)*(wordbrain.outerWidth-2) ) {
			alert("Length must be between 2 and "+ (wordbrain.outerHeight-2)(wordbrain.outerWidth-2));
			return;
		}
		
		if ( ! wordbrain.startCell ) {
			alert("You must select a start letter first!");
			return;

		}
		document.getElementById("startLetter").innerHTML = wordbrain.structure[wordbrain.startCell];
		wordbrain.clearResults();
		wordbrain.populateStructure();
		setTimeout(wordbrain.buildAndDisplayResults, 100);
	},
	
	buildAndDisplayResults: function() {
		try {
			// build result list
			var results = wordbrain.buildWords();
			
			// display results
			wordbrain.displayResults(results);
		} catch (err) {
			alert(err);
		}
	},
	
	selectInput: function(e) {
	    		var target = getTarget(e);
	    var desiredPosition = Number(target.getAttribute('data-pos'));
	    		if ( wordbrain.startCell ) {
        	// revert style
	        		var input = document.querySelector('input[data-pos="' + wordbrain.startCell + '"]');
	    	    	input.className ="";
     	}
    	wordbrain.startCell = desiredPosition;
    	target.className = "selecteur";
    	document.getElementById("startLetter").innerHTML = wordbrain.getValue(wordbrain.startCell);
	},
	
	checkDelete: function(e) {
    	if ( wordbrain.deleteMode ) {
	        wordbrain.removeLetter(e);
	        getTarget(e).blur();
	    }
	},
	
	dispatchAction: function (e) {
	    wordbrain.selectInput(e);
	    getTarget(e).blur();
	    e.preventDefault();
	},
	removeLetter: function(e) {
	    var input = getTarget(e);
		var pos = Number(input.getAttribute("data-pos"));

		for (j=pos; j>wordbrain.outerWidth; j=j-wordbrain.outerWidth) {
			var currentInput = document.querySelector('input[data-pos="' + j + '"]');
			currentInput.value = wordbrain.getValue(j-wordbrain.outerWidth);
			wordbrain.structure[j] = wordbrain.structure[j-wordbrain.outerWidth];
		}
	},

	toAlpha: function(letters) {
		var alphaWord = "";
		for (j=0; j<letters.length;j++) {
			alphaWord += wordbrain.structure[letters[j]];
		}
		return alphaWord;
	},
	
	displayResults: function(results) {
		var startDate = new Date();
		var millis = startDate.getTime();
		if ( console )
			console.info("displayResults start: " + startDate);
		var resultDiv = document.getElementById("searchResult");
		resultDiv.style.display = "none";
		var htmlProbable = "";
		var probableCount = 0;
		
    			for (i=0; i<results.length;i++) {
	    	if ( this.firstLetterOnly ) {
		        this.highlight(results[i][0], true);
	    	} else {
			    var currentWord = wordbrain.toAlpha(results[i]);
			
		    	if ( wordbrain.displayAll || dico[wordbrain.maxLength].indexOf(currentWord.toLowerCase()) !== -1 ) {
	    			probableCount++;
			    	htmlProbable += currentWord + " ";
	    		} 						
			
    	    	document.getElementById("nbResults").innerHTML = "Nb results: "  + probableCount + "/" + results.length;
	    		    	resultDiv.innerHTML = htmlProbable;
	    		    	resultDiv.style.display = "";
		    }
		}
		if ( console ) {
			var endDate = new Date();
			console.info("displayResults end:   " + endDate + ". Duration: " + (endDate.getTime() - millis)/1000);
		}
	},
	
	setValue: function(pos, value) {
		var input = document.querySelector('input[data-pos="' + pos + '"]');
		input.value = value;
	},
	
	// return text value of the input with data-pos=pos
	// used to populate the data structure
	getValue: function(pos) {
		var input = document.querySelector('input[data-pos="' + pos + '"]');
		return input.value;
	},
	
	highlight: function(pos, highlight) {
	var input = document.querySelector('input[data-pos="' + pos + '"]');
	if ( highlight && input.className.indexOf(" highlighted ") === -1)
	    input.className += " highlighted ";
	else
	    input.className = input.className.replace(" highlighted ","");
	},
	
	buildWords: function() {
		var startDate = new Date();
		var millis = startDate.getTime();
		if ( console ) {
			console.info("buildWords start: " + startDate);
		}
		var results = [];
		results[0] = [[]];
		results[1] = [[wordbrain.startCell]];
		// for earch length up to max word length
		for ( var currentLength = 2; currentLength <= wordbrain.maxLength; currentLength++ ) {
			results[currentLength] = [];
			// for each word found for previous lengthl
			for ( var wordIndex = 0; wordIndex < results[currentLength-1].length; wordIndex++ ) {
				// retrieve current word
				var currentWord = results[currentLength-1][wordIndex];
				// retrieve latest position in the current word
				var latestPosition = currentWord[currentWord.length-1];
				// look for all possibles moves
				for ( var i=0; i<wordbrain.possibleMoves.length; i++ ) {
					var nextPos = latestPosition + wordbrain.possibleMoves[i];
					// if move is possible, we create a new word based on current word and next cell
					if ( wordbrain.structure[nextPos] && wordbrain.structure[nextPos].trim() !== "" && currentWord.indexOf(nextPos) === -1 ) {
						var newWord = currentWord.slice(0);
						newWord.push(nextPos);
						// if a word starting with current word exists for the required length
						var alphaWord = wordbrain.toAlpha(newWord);
						if ( !wordbrain.restrictedMode || dico[wordbrain.maxLength].hasElementsStartingWith(alphaWord, true) ) {
							results[currentLength].push(newWord);
						}
					}
				}
			}
			results[currentLength-1] = [];
		}
		if ( console ) {
			var endDate = new Date();
			console.info("buildWords end:   " + endDate + ". Duration: " + (endDate.getTime() - millis)/1000);
		}
		return results[wordbrain.maxLength];
	},

	setDeleteMode: function(checked) {
	    wordbrain.deleteMode = checked;
	    wordbrain.setReadonly(checked);
	},
	
	listInputs: function() {
	    return document.getElementById("tableContainer").querySelectorAll('input[type="text"][data-pos]');
	},
	
	setReadonly: function(bool) {
	    var inputs = this.listInputs(); 
	    for (var i=0; i<inputs.length;i++) {
	        inputs[i].readOnly=bool;
	    }
	},
	
	updateDisplayMode: function(checked) {
		wordbrain.displayAll = checked;
	},
	
	updateRestrictedSearch: function(checked) {
		wordbrain.restrictedMode = checked;
	},

	reloadDico: function() {
		var script = document.querySelector("script[src='dico_"+wordbrain.locale+".js']");
		script.parentElement.removeChild(script);
		wordbrain.locale = document.getElementById("locale").value;

		var head = document.querySelector("head");
		script= document.createElement("script");
		var url = "?n=" + new Date().getTime();
		url = "dico_"+wordbrain.locale+".js" + url;
		script.src= url;
		
		script.type = "text/javascript";
		script.onload=function() {alert("loaded!");}
		head.appendChild(script);
	},

	fullSearch: function() {
		wordbrain.maxLength = Number(document.getElementById("wordLength").value);
		if ( isNaN(wordbrain.maxLength) || wordbrain.maxLength === 0 ) {
			alert("You must define a word length first!");
			return;
		}
		// simple search: browse all letters
		wordbrain.populateStructure();
		wordbrain.clearResults();
		setTimeout(wordbrain.buildAndDisplayAllResults, 100);
		
	},
	buildAndDisplayAllResults: function() {
		try {
			var results = [];
			for(var i=0; i < wordbrain.outerHeight*wordbrain.outerWidth; i++) {
				// if current position is not empty
				if ( wordbrain.structure[i] && wordbrain.structure[i].trim() !== "" ) {
					wordbrain.startCell =i;
					var tmpResults = wordbrain.buildWords();
					results = results.concat(tmpResults);
				}
			}
			// display results
			wordbrain.displayResults(results);
		} catch (err) {
			alert(err);
		}
	},

	clearResults: function() {
		document.getElementById("nbResults").innerHTML = "Nb results: " ;
		document.getElementById("searchResult").innerHTML = "";
		var inputs = this.listInputs();
		for (var i=0; i< inputs.length; i++) {
		   this.highlight(inputs[i].getAttribute("data-pos"), false);
        }
	},
	
	setFirstLettersOnly: function(activate) {
	    this.firstLetterOnly = activate;
	}
}