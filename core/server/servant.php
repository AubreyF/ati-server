<?

phpinfo();

//*************************************************************************
//**************************** ATIServant **********************************
//******** For use with a standalone webserver (like Apache) ***************
//*************************************************************************



//************************** Include Server Functions **********************

require '../../serv/conf/settings.atii';
require '_includes/core.atii';

//****************************** Variable Init *****************************

if(substr($_SERVER['DOCUMENT_ROOT'], -1) == '/') $_SERVER['DOCUMENT_ROOT'] = substr($_SERVER['DOCUMENT_ROOT'],0, -1);
define('_root', 		$_SERVER['DOCUMENT_ROOT']);

//**************************** Generate The Page! **************************

generatePage();




//*************************************************************************
//********************* ATIServant Specific Functions **********************
//*************************************************************************



function sendPage($content='',$headers='') {
	if($headers) $_SERVER['headers'] = $headers + (array) $_SERVER['headers'];
	sendHeaders();
	print($content);
	exit;
}

function sendData($content='') {
	sendHeaders();
	print($content);
}

function sendFile($location) {
	$_SERVER['headers']['content-length'] = filesize(_root.$_SERVER['REQUEST_URI']);
	if(!$_SERVER['headers']['content-transfer-encoding']) $_SERVER['headers']['content-transfer-encoding'] = 'binary';
	sendHeaders();
	readfile($location);
}

function sendHeaders() {
	if(!$_SERVER['headers']) return;

	foreach ($_SERVER['headers'] as $key=>$val) {
		if($key == 'status') header($val);
		else if(is_array($val)) foreach ($val as $key2=>$val2) header($key.($val2 ? ': '.$val2 : ''));
		else header($key.($val ? ': '.$val : ''));
	}

	unset($_SERVER['headers']);
}

?>