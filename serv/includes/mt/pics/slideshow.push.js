/*
Script: Slideshow.Push.js
	Slideshow.Push - Push extension for Slideshow.

License:
	MIT-style license.

Copyright:
	Copyright (c) 2008 [Aeron Glemann](http://www.electricprism.com/aeron/).
	
Dependencies:
	Fx.Elements.
*/

Slideshow.Push = new Class({
	Extends: Slideshow,
	
	// constructor
	
	initialize: function(el, data, options){
		options.overlap = true;		
		this.parent(el, data, options);
	},

	// does the slideshow effect

	show: function(fast){
		var images = [this.image, ((this.counter % 2) ? this.a : this.b)];
		if (!this.image.retrieve('fx'))
			this.image.store('fx', new Fx.Elements(images, {'duration': this.options.duration, 'link': 'cancel', 'transition': this.options.transition }));
		this.image.set('styles', {'left': 'auto', 'right': 'auto' }).setStyle(this.direction, this.width).setStyle('visibility', 'visible');
		var values = {'0': {}, '1': {} };
		values['0'][this.direction] = [this.width, 0];
		values['1'][this.direction] = [0, -this.width];
		if (images[1].getStyle(this.direction) == 'auto'){
			var width = this.width - images[1].width;	
			images[1].set('styles', {'left': 'auto', 'right': 'auto' }).setStyle(this.direction, width);		 
			values['1'][this.direction] = [width, -this.width];
		}
		if (fast){
		 	for (var prop in values)
		 		values[prop][this.direction] = values[prop][this.direction][1];			
			this.image.retrieve('fx').cancel().set(values);
		} 
		else
			this.image.retrieve('fx').start(values);
	}
});