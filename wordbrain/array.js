Array.prototype.elementsStartingWith = function (currentWord, ignoreCase) {
	var result = [];
	for (var i = 0; i<this.length; i++) {
		var localWord = this[i].substring(0, currentWord.length);
		if ( localWord ===  currentWord || (ignoreCase && currentWord.toLowerCase() === localWord.toLowerCase()) )
			result.push(this[i]);
	}
	return result;
}

Array.prototype.hasElementsStartingWith = function (currentWord, ignoreCase) {
	for (var i = 0; i<this.length; i++) {
		var localWord = this[i].substring(0, currentWord.length);
		if ( localWord ===  currentWord || (ignoreCase && currentWord.toLowerCase() === localWord.toLowerCase()) )
			return true;
	}
	return false;
}
