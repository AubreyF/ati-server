window.addEvent('domready', function() {
	//Select Correct Language in settings menu
	if(self.location.href.contains('langpair=en')) var lang = unescape(self.location.href).substring(45,47);
	else var lang = 'en';
	if(lang != 'en') alert(lang);
	$$('#ATISettings .' + lang).addClass('down');
	$('loading').setStyle('display','none');
});