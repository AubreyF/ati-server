window.addEvent('domready', function() {
	
	//Give other scripts a chance to mess up the DOM before we parse it
	window.fireEvent("predomready");
	
	//Styling
	styleHTML();
	
	Lightbox = new Lightbox();
	
	//var lightbox = new Lightbox({resizeDuration:150,resizeTransition:Fx.Transitions.Cubic.easeOut,initialWidth:100,initialHeight:100,animateCaption:{In:true,Out:true},showControls:true,showNumbers:true,descriptions:true});
	//lightbox.image.addEvent('click', function(){ lightbox.close(); });

});

function styleHTML(element) {
	if(!element) element = $(document.body);
	
	/*new SmoothScroll();						//Smooth Anchor Scrolling
	new SmoothScroll({
		links: 'a',
		wheelStops: false
	},element);*/
	
	//element.getElements('select').each(function(el) { new slickselect(el); });		//Slick Select Elements
	
	//$ES('input[type=radio]',element).each(function(el) { new slickradio(el); });	//Slick Radio Elements
	//$ES('input[type=checkbox]',element).each(function(el) { new slickradio(el); });	//Slick Checkbox Elements
	
	//Tool Tips
	/*
	new Tips(element.getElements('a[title],img[title],input[title],select[title]'), {
		showDelay: 1000,
		initialize:function() { this.fx = new Fx.Style(this.toolTip, 'opacity', {duration: 300}); },
		onShow: function(toolTip) { this.fx.start(1); },
		onHide: function(toolTip) { this.fx.start(0); }
	});
	*/
	
	i=0;
	element.getElements('.imgx').each(function(el) {
		var link = new Element('a', {href:el.src, title:el.alt, rel:"lightbox:a", "class":"imgw"});
		link.wraps(el);
		i++;
		var num = new Element('div', {html: "#" + i, "class": "rflt desc"});
		link.adopt(num);
		if(el.alt && el.alt != "") {
			var desc = new Element('div', {html: el.alt});
			link.adopt(desc);
		}
	});
	
	//Accordions
	element.getElements('.acdn').each(function(el) {
		new Accordion( '.acdn>div:nth-child(odd)', '.acdn>div:nth-child(even)',  {
			alwaysHide: true,
			onActive: function(toggler, element) {
				toggler.setStyle('font-style', 'italic');
				//element.setStyle('padding', '10px');
				//element.setStyle('border-bottom','1px solid #999999');
			},
			onBackground: function(toggler, element) {
				toggler.setStyle('font-style', 'normal');
				//element.setStyle('padding', '0');
				//element.setStyle('border-bottom','0');
			}
		}, el);
	});
}

/*
Select Element Restyler
License:		MIT-style license.
Credits:		by aubrey falconer - Based on comboBoo.js by torrinha.com
*/

var slickselect = new Class({
	options: {
		className: 'input'
	},
	
	initialize: function(el, options) {
		this.setOptions(options);
		this.oldElement = $(el);
		this.listShown = -1;
		
		if(this.oldElement.className == "nostyle" || this.oldElement.className == "mceSelectList") return;
		
		//Hide old select box
		this.oldElement.setStyles({
			position: 'absolute',
			left: '-999em'
		}),
		
		//Build "Box"
		this.comboLink = new Element('div', {
			'class': this.options.className + ' ' + this.options.className + 'element',
			'id': el.name
		});
		
		//this.comboLink.setStyles({'width':this.oldElement.getStyle('width')});
		if(this.oldElement.getProperty('title')) this.comboLink.setProperty('title',this.oldElement.getProperty('title'));
		
		this.comboLink.injectBefore(
			this.oldElement
		);
		
		//Build Text
		this.comboTxt = new Element('div', {
			'class': 'text'
		}).setHTML(
			el.options[el.options.selectedIndex].text
		).injectInside(
			this.comboLink
		);
		
		//Build "List"
		this.comboList = new Element('ul', {
			'class': this.options.className + 'list',
			'id': 'choices-' + el.name
		}).injectInside(
			document.body //this.comboLink
		);
		
		//Init FX
		this.fx = {
			cmbList: this.comboList.effect('opacity', {duration: 500}).set(0)
		};
		
		//Attach Events
		this.comboLink.addEvents({
			click:			this.toggle.bind(this)
		});
		
		this.comboList.addEvents({
			mouseleave: 	this.closetimeout.bind(this),
			mouseenter: 	this.unclose.bind(this)
		});
		
		//Populate "List"
		for(i=0; i < el.length; i++) {
			var el2 = new Element('li', {'id': i}).setHTML(el.options[i].text);
			el2.addEvents({
				mouseover: this.choiceOver.bind(this, [el2]),
				mousedown: this.choiceSelect.bind(this, [el2])
			}).injectInside(
				this.comboList
			);
		};
	},
	
	toggle: function() {
		/*if((this.listShown = this.listShown * -1) != 1) {
			this.fx.cmbList.start(0);
		//	document.removeEvent('click', this.toggle());
		}
		else {
			this.fx.cmbList.start(1);
		//document.addEvent('click', this.toggle());
		}*/
		this.comboList.setStyle('top',this.comboLink.getPosition().y + this.comboLink.getSize().y - 1);
		this.comboList.setStyle('left',this.comboLink.getPosition().x);
		
		this.fx.cmbList.start((this.listShown = this.listShown * -1) != 1 ? 0 : 1);
	},
	
	unclose: function() {
		$clear(this.closetimer);
	},
	
	closetimeout: function() {
		this.closetimer = this.close.delay(1000,this);
	},
	
	close: function() {
		this.listShown = -1;
		this.fx.cmbList.start(0);
	},
	
	choiceOver: function(el) {
		if (this.selected) this.selected.removeClass('selected');
		this.selected = el.addClass('selected');
	},
	
	choiceSelect: function(el) {
		this.fx.cmbList.start(0);
		this.listShown = 1;
		this.comboTxt.setHTML(el.getText());
		if(this.oldElement.selectedIndex != el.id) {
			this.oldElement.selectedIndex = el.id;
			this.oldElement.fireEvent('change');
		}
	}
});

slickselect.implement(new Events, new Options);

/*
var slickradio = new Class({
	initialize: function(el, options) {
		this.setOptions(options);
		this.oldElement = $(el);
		
		//Hide Old Element
		this.oldElement.setStyles({
			position: 'absolute',
			left: '-999em'
		}),
		
		//Build New Element
		this.element = new Element('div', {
			'class': 'inputelement inputradio'
		}).setHTML(
			'checkbox!'
		);
		if(this.oldElement.getProperty('title')) this.element.setProperty('title',this.oldElement.getProperty('title'));
		
		//Show New Element
		element.insertBefore(oldElement);
		
		//Init FX
		
		this.fx = {
			cmbList: this.comboList.effect('opacity', {duration: 500}).set(0)
		};
		
		//Attach Events
		
		this.comboLink.addEvents({
			click:			this.toggle.bind(this)
		});
	},
	
	toggle: function() {
		//this.fx.cmbList.start((this.listShown = this.listShown * -1) != 1 ? 0 : 1);
	}
});
slickradio.implement(new Events, new Options);


var slickcheck = new Class({
	initialize: function(el, options) {
		this.setOptions(options);
		this.oldElement = $(el);
		
		//Hide Old Element
		this.oldElement.setStyles({
			position: 'absolute',
			left: '-999em'
		}),
		
		//Build New Element
		this.element = new Element('div', {
			'class': 'inputelement inputradio'
		}).setHTML(
			'checkbox!'
		);
		if(this.oldElement.getProperty('title')) this.element.setProperty('title',this.oldElement.getProperty('title'));
		
		//Show New Element
		element.insertBefore(oldElement);
		
		//Init FX
		
		this.fx = {
			cmbList: this.comboList.effect('opacity', {duration: 500}).set(0)
		};
		
		//Attach Events
		
		this.comboLink.addEvents({
			click:			this.toggle.bind(this)
		});
	},
	
	toggle: function() {
		//this.fx.cmbList.start((this.listShown = this.listShown * -1) != 1 ? 0 : 1);
	}
});
slickcheck.implement(new Events, new Options);*/
