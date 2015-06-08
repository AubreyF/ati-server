/*
MooRevolver v0.2 - A simple Image revolver control built upon mooTools
by Med - MIT-style license.

Code adapted from jMaki (https://ajax.dev.java.net/samples/)

Slight modifications by Aubrey (http://AubreyFalconer.com) to add ".current" class and change shape of "track"
*/

var MooRevolver = new Class({
initialize: function(element, options){
	this.setOptions({
		"pad":80,
		"border":0,
		"yRadius":10,
		"arrowLeft":null,
		"arrowRight":null,
		"fxDuration": 500,
		"fxTransition": Fx.Transitions.Sine.easeInOut,
		"fade":false
	}, options);
	
	if($(element)){
		
		if($(this.options.arrowLeft)) {
			$(this.options.arrowLeft).addEvent("click", (function(e){
				new Event(e).stop();
				this.getPrevious();
			}).bind(this));
		}
			
		if($(this.options.arrowRight)) {
			$(this.options.arrowRight).addEvent("click", (function(e){
				new Event(e).stop();
				this.getNext();
			}).bind(this));
		}
		
		this.processing = false;
		this.containerSize = $(element).getSize();
		this.xRadius = (this.containerSize.x / 2) - this.options.pad;
		this.yRadius = this.options.yRadius;
		this.centerX = (this.containerSize.x / 2);
		this.centerY = 35;
		
		this.items = $(element).getChildren();
		this.totalItems = this.items.length;
		
		this.points = [];
		this.positions = [];
		this.sizes = [];
		this.zIndexes = [];
		this.opacities = [];
					
		for(var i = 0; i < this.totalItems; i++){
			this.points.push(i * (360 / this.totalItems));
			var pt = this.getElipticalPoint(this.points[i]);
			
			this.items[i].setStyles({
				"left": pt.x,
				"top": pt.y
			});
			
			this.processItem(i, this.points[i]);
		}
		
		this.reposition();
		
	} else {
		return;
	}
},

getNext: function(){
	if (!this.processing) {
		this.processing = true;
		this.rotate(true);
	}
},

getPrevious: function(){
	if (!this.processing) {
		this.processing = true;
		this.rotate(false);
	}
},

rotate: function(forward){
	if(!this.processing) return;
	
	if(forward){
		this.items.push(this.items.shift());
	} else {
		this.items.unshift(this.items.pop());
	}
	
	var fxArray = [];
	
	for(var i = 0; i < this.totalItems; i++){
		var myEffects = this.items[i].effects({"duration": this.options.fxDuration, "transition": this.options.fxTransition});
		fxArray.push(myEffects);
		if(this.options.fade) {
			myEffects.start({"opacity": this.opacities[i], "top": this.positions[i].y, "left": this.positions[i].x, "width": this.sizes[i].x, "height": this.sizes[i].y});
		} else {
			myEffects.start({"top": this.positions[i].y, "left": this.positions[i].x, "width": this.sizes[i].x, "height": this.sizes[i].y});
		}
		this.items[i].setStyle("z-index", this.zIndexes[i]);
		
		if(i == 0) this.items[i].addClass('current');
		else this.items[i].removeClass('current');
	}
	
	var g = new Group(null);
	g.initialize.apply(g, fxArray);
	g.addEvent("onComplete", (function(){ this.processing = false; }).bind(this));
},

reposition: function() {
	for (var _l = 0; _l < this.totalItems; _l++) {
		var pt = this.getElipticalPoint(this.points[_l]);
		this.positions.push({x: pt.x - ((this.items[_l].getSize().x + this.options.border) / 2), y: pt.y});
		
		this.items[_l].setStyles({
			"left": this.positions[_l].x,
			"top": this.positions[_l].y
		});
	}
},

getElipticalPoint: function(_d) {
	var rad = _d * (Math.PI / 180);
	var _x = this.centerX + this.xRadius * Math.sin(rad);
	var _y = this.centerY + this.yRadius * Math.cos(rad);
	return {x : _x, y : _y};
},

processItem: function(_i, deg) {
	var size = 1;
	
	if(deg == 0) {}
	else if (deg >= 0 && deg < 180) {
		size = (180 - deg) / 180; //Was 180 but circle didn't look right. Current number gives cool looking "infinite triangle"
	} else if (deg >= 180 && deg <= 360) {
		size = (deg - 180) / 180; //Was 180 but circle didn't look right. Current number gives cool looking "infinite triangle"
	}
	this.scaleItem(_i, size);
	this.items[_i].setStyle("z-index", (size * 100).round());
	this.zIndexes.push((size * 100).round());
},

scaleItem: function(_i, percentage) {
	if(percentage == 0) percentage = 0.1;
	
	var _x = ((this.items[_i].getSize().x + this.options.border) * percentage);
	var _y = ((this.items[_i].getSize().y + this.options.border) * percentage);
	
	this.sizes.push({x: _x, y: _y});
	this.opacities.push(percentage + ((1 - percentage) * 0.5));
	
	this.items[_i].setStyles({
		"width": _x,
		"height": _y,
		"opacity": this.options.fade ? percentage : 1
	});
}
});

MooRevolver.implement(new Options);
