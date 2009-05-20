var BackgroundFadder = function (elements, startColor, endColor, initialTime, fadeTime) {
	this.interval = 50;
	this.initialTime = initialTime;
	this.elements = (elements instanceof Array)? elements : [elements];
	this.numSteps = Math.round(parseInt(fadeTime, 10)/this.interval);
	this.startingRed = this._hex2Dec(startColor.substr(1,2));
	this.startingGreen = this._hex2Dec(startColor.substr(3,2));
	this.startingBlue = this._hex2Dec(startColor.substr(5,2));
	this.endingRed = this._hex2Dec(endColor.substr(1,2));
	this.endingGreen = this._hex2Dec(endColor.substr(3,2));
	this.endingBlue = this._hex2Dec(endColor.substr(5,2));
	this.deltaRed = (this.endingGreen-this.startingRed)/this.numSteps;
	this.deltaGreen = (this.endingGreen-this.startingGreen)/this.numSteps;
	this.deltaBlue = (this.endingBlue-this.startingBlue)/this.numSteps;
	this.currentRed = this.startingRed;
	this.currentGreen = this.startingGreen;
	this.currentBlue = this.startingBlue;
	this.currentStep = 0;
	this.timer1ID = 0;
  	this.timer2ID = 0;
	this.fade = this.fade.bind(this);
}

BackgroundFadder.prototype.reset = function() {
	try {
		clearTimeout(this.timer1ID);
	}
	catch(e) {}
	try {
		clearTimeout(this.timer2ID);
	}
	catch(e) {}
	this.currentRed = this.startingRed;
	this.currentGreen = this.startingGreen;
	this.currentBlue = this.startingBlue;
	this.currentStep = 0;
	this.timer1ID = 0;
  	this.timer2ID = 0;
}

BackgroundFadder.prototype.fade = function() {
	this._setBackgrounds();
  	if (this.currentStep <= this.numSteps) {
  		if (this.currentStep == this.numSteps) {
  	  		this.currentRed = this.endingRed;
			this.currentGreen = this.endingGreen;
			this.currentBlue = this.endingBlue;	
  	  	}
  		else {
  			this.currentRed += this.deltaRed;
			this.currentGreen += this.deltaGreen;
			this.currentBlue += this.deltaBlue;
  			
  		}
  		if (this.currentStep == 0) {
	  		this.timer1ID = setTimeout(function(){
		  		this.timer2ID = setTimeout(this.fade, this.interval); 
		  		// sets timer so that this function will be called every 100 miliseconds
		  	}.bind(this), this.initialTime);
	  	}
	  	else {
	  		this.timer2ID = setTimeout(this.fade, this.interval); // sets timer so that this function will be called every 100 miliseconds
	  	}
	}
	else{
		for (var i=0; i<this.elements.length; i++) {
			this.elements[i].style.background = "";
		}
	}
	this.currentStep++;
}

////////////////////////////////////////
////////////// Private /////////////////
////////////////////////////////////////

BackgroundFadder.prototype._setBackgrounds = function() {
	var color = this._getCurrentColor();
	for (var i=0; i<this.elements.length; i++) {
		this.elements[i].style.backgroundColor = color;
	}
}

BackgroundFadder.prototype._getCurrentColor = function() {
	// convert to hex	
	var hexRed = this._dec2Hex(this.currentRed);
	var hexGreen = this._dec2Hex(this.currentGreen);
	var hexBlue = this._dec2Hex(this.currentBlue);
	
	return "#"+hexRed+""+hexGreen+""+hexBlue+"";
}

BackgroundFadder.prototype.HEX_CHARS = "0123456789ABCDEF";

BackgroundFadder.prototype._hex2Dec = function(hexVal) {
	hexVal = hexVal.toUpperCase();
	var decVal = 0;
	var hv1 = hexVal.substring(0,1);
	decVal = (this.HEX_CHARS.indexOf(hv1)*16);
	hv1 = hexVal.substring(1);
	return decVal + this.HEX_CHARS.indexOf(hv1);
}

BackgroundFadder.prototype._dec2Hex = function(decVal) {
	decVal = parseInt(decVal);
	if (decVal > 255 || decVal < 0) {
		decVal=255;
	}
	var dig1 = decVal % 16;
	var dig2 = (decVal - dig1) / 16;
	return this.HEX_CHARS.charAt(dig2) + this.HEX_CHARS.charAt(dig1);
}

