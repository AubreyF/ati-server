window.addEvent('load', function() {
	var navSlide = [];
	$('sidebar').getElements('a').each(function(item) {
		navSlide[item] = new Fx.Style(item, 'opacity',{duration: 500,wait: false});
		navSlide[item].set(0.5);
		item.addEvent('mouseenter', function(){ navSlide[item].start(0.99); });
		item.addEvent('mouseleave', function(){ navSlide[item].start(0.6); });
	});
	
	$('sidebar').addEvent('mouseenter', function(){
		$$('#sidebar .current').each(function(item) { if(navSlide[item].timer == null) navSlide[item].start(0.7); });
	});
	$('sidebar').addEvent('mouseleave', function(){ 
		$$('#sidebar .current').each(function(item) { navSlide[item].start(0.99); });
	});
	
	$$('#sidebar .current').each(function(item) { navSlide[item].start(0.99); });
	
	menuSlide = new Fx.Style($('navpresmenu'), 'height',{duration: 1000, transition: Fx.Transitions.Expo.easeOut});
	menuErrorSlide = new Fx.Style($('menuerror'), 'height',{duration: 500, transition: Fx.Transitions.Bounce.easeOut});
});
