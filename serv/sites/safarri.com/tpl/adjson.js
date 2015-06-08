var domain = window.location.href.split("//")[1].split("/")[0],url='http://' + domain + '/export.atis-tpl-json',cat,adsLoading,adList,adFilters,message,adsOnPage=0,page=1,adJson,providers=new Object;
var tree;
var parentNodeID;

//Domready

window.addEvent('domready', function() {
	
	window.fireEvent('resize'); //Set height of Ad list
	
	adList = $('adList');
	adFilters = $('xtrafilters');
	
	//Ads Loading Box
	//adsLoading = new Fx.Style($('adsLoading'), 'height',{duration: 1000, transition: Fx.Transitions.elasticOut});
	adsLoading = $('adsLoading');
	adsLoading.set('slide', {duration: 'long', transition: 'elastic:out'});
				
	//Message Box
	message = new Fx.Style($('message'), 'height',{duration: 1000, transition: Fx.Transitions.elasticOut});
	
	//Ad List Stuff
	var adScroller = new Scroller('adFrame', {area: 50, velocity: 0.7});
	$('adFrame').addEvent('mouseenter', adScroller.start.bind(adScroller));
	$('adFrame').addEvent('mouseleave', adScroller.stop.bind(adScroller));
	//$('adFrame').makeResizable({modifiers: {x: false, y: 'height'}, limit: {y: [80, 2000]}});
	showAdsAsList();
	
	//Load Ads!
	loadAds();
	
	tree = new MooTreeControl({
		div: 'cattree',
		//mode: 'folders',
		//grid: true,
		theme: '/_inc/mt/mootree/tree.png',
		loader: {icon:'/_inc/mt/mootree/loading.gif', text:'Loading...'},
		onClick: function(node, state) {
			cat = node.id; //Cat is used to build the filter URL
			updateAds();
			//tree.select(node);
			tree.collapse();
			node.toggle(false,true);
			var nodePar = node;
			while(true) {
				var nodePar = nodePar.parent;
				if(!nodePar) break;
				nodePar.toggle(false,true);
			}
		}
	},{
		text: 'View All Ads',
		open: true
	});
	
	tree.root.load('/data/xml/cats.atis');
	tree.select(tree.root);
	tree.root.toggle(false,true);
	
	//Filter Form Event Catching
	$('filters').addEvent('submit', function(e) {
		new Event(e).stop();
		updateAds();
	});
	
	//Location Updating - if they change the location we need to clear the latitude and longitude
	$('location').addEvent('change', function(e) {
		$('latitude').value = '';
		$('longitude').value = '';
	});
});

function checkParent() {
	
}

window.addEvent('resize', function(){$('adFrame').style.height = (window.getHeight() > 400 ? window.getHeight() - $('adFrame').getTop() - 30 : 300) + "px";});

function getFilters() {
	return $('filters').toQueryString() + (cat ? "&cat=" + cat : '');
}

function updateAds() {
	clearAds();
	loadAds();
}

function loadAds() {
	adsLoading.slide('in');
	
	if(adJson) adJson.cancel();
	adJson = new Json.Remote(url + '-adpage-' + page + '?' + getFilters(), {method: 'get', onComplete: function(response) {
		//Ads Loaded Successfully
		adsLoading.slide('out');
		
		//Update Page Title to match filterset
		document.title = response.title;
		
		//Location Handling
		$('location').value = response.location.str;
		$('latitude').value = response.location.latitude;
		$('longitude').value = response.location.longitude;
		
		//Message handling
		displayMessage(response.message);
		
		//Filter Handling
		adFilters.empty();
		if(response.filters) response.filters.each(function(filter) {
			var field = '';
			if(filter.type == 'yn') field = '<select class="input" name="' + filter.param + '"><option value="false">No</option><option value="true"' + (filter.val == 'true' ? ' selected' : '') + '>Yes</option></select>';
			else if(filter.type == 'ro') field = '<select class="input" name="' + filter.param + '"><option value="false">Optional</option><option value="true"' + (filter.val == 'true' ? ' selected' : '') + '>Required</option></select>';
			else if(filter.type == 'input') field = '<input class="input" type="text" name="' + filter.param + '" />';
			if(field) new Element('div', {}).setHTML("<div>" + filter.name + ":</div>" + field).injectInside(adFilters);
		});
		styleHTML(adFilters);
		
		//Check if there were ads
		if(response.stats.totalads < 1) {
			new Element('div', {'class': 'ebox'}).setHTML("There were no ads which matched your filter set. Please try \"broadening\" your filter set.").injectInside(adList);
			if($('loadLink')) $('loadLink').remove();
			$('totalItems').innerHTML = 0;
			adJson.removeTimer(); //Dragonhere: no idea why this is not done automatically
		}
		
		else {
			//Provider List
			var totalAds = 0;
			response.providers.each(function(provider) {
				if(!providers[provider.name]) providers[provider.name] = new Object;
				if(!provider.total) provider.total = 0;
				providers[provider.name]['total'] = provider.total;	//Total ads
				if(!providers[provider.name]['page']) providers[provider.name]['page'] = provider.page;
				else providers[provider.name]['page'] = provider.page.toInt() + providers[provider.name]['page'].toInt();		//Shown Ads (Keeps Getting larger)
				providers[provider.name]['domain'] = provider.domain;	//Provider domain name
				providers[provider.name]['name'] = provider.name;		//Provider name
				providers[provider.name]['weight'] = provider.weight;	//Provider quantizer weight
				totalAds = totalAds + provider.total.toInt();
			});
			$('totalItems').innerHTML = totalAds.numberFormat(0);
			
			//Add ads to ad list
			response.items.each(function(ad) {
				var tools = "<div class=\"hoverTainer tools\"><div class=\"trigger\"><img src=\"/images/icons/adtools.png\" /></div><div class=\"hoverBox linkList\"><div class=\"header\">Ad Tools:</div>";
				//if(providers[ad.provider]) tools = tools + "<a href=\"http://" + providers[ad.provider].domain + "\" target=\"_blank\"><img src=\"/images/providers/ad" + ad.provider + ".png\" /> Found on " + ad.provider.capitalize() + "</a>";
				tools = tools + "</div></div>";
				if(providers[ad.provider]) tools = tools + "<div class=\"hoverTainer provider\"><div class=\"trigger\"><img src=\"/images/providers/ad" + ad.provider + ".png\" /></div><div class=\"hoverBox linkList\"><div class=\"header\">Ad Details:</div><a href=\"http://" + providers[ad.provider].domain + "\" target=\"_blank\"><img src=\"/images/providers/ad" + ad.provider + ".png\" /> Found via " + ad.provider.capitalize() + "</a></div></div>";
				
				var adDiv = new Element('div', {'class': 'adDiv ' + (adsOnPage % 2 ? 'odd' : 'even')}).setHTML(tools);
				var adSpecs = new Element('a', {'href': ad.url, 'target':'_blank'}).injectInside(adDiv); ///*'onClick': 'MOOdalBox.open("/tpl/iframe.atis-id-' + escape(encode64(ad.url)) + '","Viewing Ad: ' + ad.title + '<br />' + ad.url + '","90% 80%");'*/
				new Element('img', {'class': 'thumb','src': ad.thumb}).injectInside(adSpecs);
				new Element('div', {'class': 'title'}).setHTML(ad.title).injectInside(adSpecs);
				new Element('div', {'class': 'specs'}).setHTML(ad.specs).injectInside(adSpecs);
				new Element('div', {'class': 'date'}).setHTML(ad.date).injectInside(adSpecs);
				new Element('div', {'class': 'price'}).setHTML(ad.price).injectInside(adSpecs);
				new Element('div', {'class': 'location'}).setHTML(ad.location).injectInside(adSpecs);
				adDiv.injectInside(adList);
				adsOnPage++;
			});
			
			//Spacer to keep things from going insane in gallery mode
			new Element('div', {'class': 'spacer'}).injectInside(adList);
			
			//Page Handling
			page++;
		}
		
		//Providers
		$("adProviders").empty();
		$("quantizer").innerHTML = '<div><div>Total:</div><select name="adsppage" class="input"><option value="50"' + (response.stats.adsppage == '50' ? ' selected' : '') + '>50 Ads/Page</option><option value="25"' + (response.stats.adsppage == '25' ? ' selected' : '') + '>25 Ads/Page</option><option value="10"' + (response.stats.adsppage == '10' ? ' selected' : '') + '>10 Ads/Page</option></select></div>';
		for(var i in providers) {
			$("quantizer").innerHTML = $("quantizer").innerHTML + '<div><div>' + providers[i]['name'].capitalize() + ':</div><select name="' + providers[i]['name'] + 'ads" class="input"><option value="fill"' + (providers[i]['weight'] == 'fill' ? ' selected' : '') + '>Fill Page</option><option' + (providers[i]['weight'] == 3 ? ' selected' : '') + '>3</option><option' + (providers[i]['weight'] == 2 ? ' selected' : '') + '>2</option><option' + (providers[i]['weight'] == 1 ? ' selected' : '') + '>1</option><option value="off"' + (providers[i]['weight'] == 'off' ? ' selected' : '') + '>Off</option></select></div>';
			$("adProviders").innerHTML = $("adProviders").innerHTML + "&nbsp;&nbsp;<a href=\"http://" + providers[i]['domain'] + "\" target=\"_blank\"><img src=\"/images/providers/ad" + providers[i]['name'] + ".png\" /> " + providers[i]['name'].capitalize() + " <span class=\"smallText hidden\">(" + providers[i]['page'] + " shown, " + providers[i]['total'] + " total)</span></a>";
		}
		styleHTML($("quantizer"));
		
		//Load More Ads Link
		if(!$('loadLink')) new function() {new Element('div', {'id': 'loadLink', 'class': 'lbtn', 'onClick': 'loadAds();', 'style': 'margin-top:10px;'}).setHTML("View More Ads >>").injectInside($('adFrame'))};
		
	}, timeout: 15000, onTimeout: function(){displayMessage('Safarri server could not be contacted. Please make sure you are online!'); adsLoading.slide('out'); }}).send();
}
function clearAds() {
	//Providers Array
	providers = new Object;
	$("adProviders").empty();
	
	//Ad List
	adsOnPage = 0;
	$('adList').empty();
	if($('loadLink')) $('loadLink').remove();
	
	//Pagination
	page=1;
}

var listCss, galleryCss;
function showAdsAsList() {
	if (galleryCss) galleryCss.remove();
	new Asset.css('/tpl/adliststyle.css', {id: 'listCss'});
	listCss = $('listCss');
	$('showAdsAsList').className = 'checked';
	$('showAdsAsGallery').className = '';
}

function showAdsAsGallery() {
	if (listCss) listCss.remove();
	new Asset.css('/tpl/adgallerystyle.css', {id: 'galleryCss'});
	galleryCss = $('galleryCss');
	$('showAdsAsList').className = '';
	$('showAdsAsGallery').className = 'checked';
}

function displayMessage(txt) {
	if(txt) {
		$("message").setHTML("<a style=\"float:right;\" href=\"#\" onClick=\"displayMessage();\">>> Close</a>" + txt);
		message.start(50);
		setTimeout("window.fireEvent('resize')",1010);
	}
	else if($("message").getStyle('height').toInt() > 0) {
		message.start(0);
		setTimeout("window.fireEvent('resize')",1010);
	}
}

// Base64 - rumkin.com
function encode64(input) {
	var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
	do {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		if (isNaN(chr2)) enc3 = enc4 = 64;
		else if (isNaN(chr3)) enc4 = 64;
		output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + 
		keyStr.charAt(enc3) + keyStr.charAt(enc4);
	} while (i < input.length);
	return output;
}

//Add timeout functionality to MooTools remote - http://www.blackmac.de/archives/44-Mootools-AJAX-timeout.html
Json.Remote = Json.Remote.extend({
	send: function(){
	if (this.options.timeout) {
		this.timeoutTimer=window.setTimeout(this.callTimeout.bindAsEventListener(this), this.options.timeout);
		this.addEvent('onComplete', this.removeTimer);
	}
	this.parent();
	},
	callTimeout: function () {
		//this.transport.abort();
		this.onFailure();
		if (this.options.onTimeout) {
			this.options.onTimeout();
		}
	},
	removeTimer: function() {
		window.clearTimeout(this.timeoutTimer);
	}
});

//Add Number formatting functionality - http://forum.mootools.net/viewtopic.php?pid=27439
Number.extend({
	numberFormat : function(decimals, dec_point, thousands_sep) {
		decimals = Math.abs(decimals) + 1 ? decimals : 2;
		dec_point = dec_point || '.';
		thousands_sep = thousands_sep || ',';
		var matches = /(-)?(\d+)(\.\d+)?/.exec((isNaN(this) ? 0 : this) + ''); // returns matches[1] as sign, matches[2] as numbers and matches[2] as decimals
		var remainder = matches[2].length > 3 ? matches[2].length % 3 : 0;
		return (matches[1] ? matches[1] : '') + (remainder ? matches[2].substr(0, remainder) + thousands_sep : '') + matches[2].substr(remainder).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep) + 
				(decimals ? dec_point + (+matches[3] || 0).toFixed(decimals).substr(2) : '');
	}
});
