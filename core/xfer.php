<?

//******************************************************************************
//********************************** MIXFER ************************************
//******************* Modular, Interactive File Transfer ***********************
//********* Written By Aubrey Falconer - http://AubreyFalconer.com *************
//********* Freely distrabutable and modifiable with credit intact *************
//******************************************************************************


//****************************** Configuration *********************************

ini_set('memory_limit',				"128M");
//ini_set('error_reporting',			E_ALL);

define('_root',						substr(__FILE__,0,strrpos(__FILE__,'/') - 5));
define('N',							chr(10));
define('_startTime',				time());

$GLOBALS['encoder']					= '/usr/local/eaccelerator-0.9.4-rc1/encoder.php';
$GLOBALS['test'] 					= 0;
$GLOBALS['encode'] 					= 0; 	//0,1
$GLOBALS['deleteOrphans'] 			= 0; 	//Update, Mirror
$GLOBALS['verbose'] 				= 0; 	//Little Text, Lotza Text
$GLOBALS['cloakedFiles']			= array('data/logs','data/cache/func','data/cache/misc','data/cache/gz','data/cache/page','chron/');
$GLOBALS['hiddenFiles']				= array('#','source','_notes/','_vti_cnf','_util/','.marks','.lck','.ds_store','thumbs.db');
$GLOBALS['cloakedFilesAll']			= array('data/cache/func','data/cache/misc','data/cache/gz','data/cache/page');
$GLOBALS['hiddenFilesAll']			= array('#','_notes/','_vti_cnf','.marks','.lck','.ds_store','thumbs.db');
$GLOBALS['copyErrors']				= 0;
$GLOBALS['compiled']				= 0;
$GLOBALS['files']					= 0;
$GLOBALS['encoded']					= 0;
$GLOBALS['alreadyDone']				= 0;
$GLOBALS['directories']				= 0;
$GLOBALS['filesSeen']				= 0;
$GLOBALS['directoriesSeen']			= 0;
$GLOBALS['cacheRefreshed']			= 0;
$GLOBALS['skipped']					= 0;
$GLOBALS['timeout']					= 0;
$GLOBALS['silent']					= 0;
$GLOBALS['foreverTrue']				= 0;
$GLOBALS['help']					= 0;
$GLOBALS['transferAll']				= 0;
$GLOBALS['timeOffset']				= 0;
$GLOBALS['temp']					= '';
$GLOBALS['errors']					= array();

$GLOBALS['sftp']['nonFatalErrors'] = array(
	'Couldn\'t create directory'=>true,
	'Couldn\'t stat remote file'=>'rmprev',
);

//******************************** Initilization *******************************

foreach ($_SERVER['argv'] as $key=>$val) {
	$arg = explode('=',$val);
	$arg['0'] = strtolower($arg[0]);
	if($arg[0] == '--from')				$GLOBALS['from'] = $arg[1];
	else if($arg[0] == '--to')			$GLOBALS['to'] = $arg[1];
	else if($arg[0] == '--skipcache')	$GLOBALS['cache'] = 'none';
	else if($arg[0] == '--test')		$GLOBALS['test'] = 1;
	else if($arg[0] == '--encode')		$GLOBALS['encode'] = 1;
	else if($arg[0] == '--h')			$GLOBALS['help'] = 1;
	else if($arg[0] == '--silent')		$GLOBALS['silent'] = 1;
	else if($arg[0] == '--promptyes')	$GLOBALS['foreverTrue'] = 1;
	else if($arg[0] == '--all')			$GLOBALS['transferAll'] = 1;
	else if($arg[0] == '--overwrite')	$GLOBALS['overwrite'] = 1;
	else if($arg[0] == '--timeout')		$GLOBALS['timeout'] = $arg[1];
	else if($arg[0] == '--basedir')		$GLOBALS['basedir'] = $arg[1];
}

pblock('Welcome to MIXFER');

if($GLOBALS['help']) die("
	{Mixfer Help}
");

if(!$GLOBALS['from']) {
	$GLOBALS['from'] = _root;
	//echo N.'Please enter "from":	';
	//$GLOBALS['from'] = trim(fgets(STDIN));
}
if(!$GLOBALS['to']) {
	echo N.'Please enter "to":	';
	$GLOBALS['to'] = trim(fgets(STDIN));
	if(!$GLOBALS['to']) die('"To" Needs to be specified');
}
if(substr($GLOBALS['from'], -1) != '/') $GLOBALS['from'] .= '/';
if(substr($GLOBALS['to'], -1) != '/') $GLOBALS['to'] .= '/';

if($GLOBALS['basedir']) {
	if(substr($GLOBALS['basedir'],0,1) == '/') $GLOBALS['basedir'] = substr($GLOBALS['basedir'],1);
	if(substr($GLOBALS['basedir'], -1) != '/') $GLOBALS['basedir'] .= '/';
	$GLOBALS['from'] = $GLOBALS['from'].$GLOBALS['basedir'];
	$GLOBALS['to'] = $GLOBALS['to'].$GLOBALS['basedir'];
}

preg_match('/([^\:]*):\/\/([^\:]*):([^\@]*)@([^\/]*)([^\s]*)/',$GLOBALS['to'],$temp);
list($temp,$GLOBALS['toParams']['mode'],$GLOBALS['toParams']['user'],$GLOBALS['toParams']['pass'],$GLOBALS['toParams']['host'],$GLOBALS['toParams']['path']) = $temp;
if($GLOBALS['toParams']['mode'] == 'ftps') $GLOBALS['toParams']['mode'] = 'ftp'; //Function calls are the same, so this saves extra logic later on

if($GLOBALS['cache'] != 'none') $GLOBALS['cache']	= _root.'/data/cache/misc/xfer-'.$GLOBALS['toParams']['host'].'.ati';

//*********************************** Begin! ***********************************

if(!$GLOBALS['silent']) {
	echo N."
Reading From:		{$GLOBALS['from']}
Writing To: 		{$GLOBALS['to']} (Mode: ".$GLOBALS['toParams']['mode'].")
Cache: 			{$GLOBALS['cache']}
Delete Orphans:		{$GLOBALS['deleteOrphans']}
Encode:			{$GLOBALS['encode']}
Test Mode:  		{$GLOBALS['test']}
Timeout:		".($GLOBALS['timeout'] ? $GLOBALS['timeout']. ' Seconds' : 'Unlimited')."
Memory Limit:		".ini_get('memory_limit');
	
	if(!$GLOBALS['foreverTrue']) {
		echo N.'Ready To Proceed:	Press ENTER to begin copying files, or type C and press ENTER to cancel';
		if(strtolower(trim(fgets(STDIN))) == 'c') die();
	}
}

if($GLOBALS['cache'] != 'none') {
	if(!file_exists($GLOBALS['cache'])) pcent("Specified cache file did not exist");
	else {
		pcent("Loading directory listing cache");
		include($GLOBALS['cache']);
		$GLOBALS['getToCached'] = true;
	}
	if(!$GLOBALS['toFilesCached']) $GLOBALS['toFilesCached'] = array();
}

doDir();

if($GLOBALS['deleteOrphans'] && count($GLOBALS['toFiles'])) {
	pblock('MIXFER Deleting Orphans');
	echo N.count($GLOBALS['toFiles']).'	Orphans to delete';
	foreach ($GLOBALS['toFiles'] as $key=>$val) {
		if(!ati_delete($key)) $GLOBALS['invincibleOrphans'][$key] = $val;
		else unset($GLOBALS['toFilesCached'][$key]);
	}
	if($GLOBALS['invincibleOrphans']) echo N.count($GLOBALS['invincibleOrphans'])." orphans were found to be invincible:\n".print_r($GLOBALS['invincibleOrphans'],true);
}

ati_save_cache();

//if($GLOBALS['toParams']['mode'] == 'sftp') $GLOBALS['conn'] = ati_sftp_close($GLOBALS['conn']);

/*
if($GLOBALS['actions']) {
	echo N;
	pcent('MIXFER Action List');
	foreach ($GLOBALS['actions'] as $key=>$val) pline($val);
}*/

if(!$GLOBALS['silent']) {
	echo N;
echo "
{$GLOBALS['encoded']} 	Files Encoded
{$GLOBALS['files']} 	Files Copied
{$GLOBALS['directories']}	Directories Created
{$GLOBALS['skipped']} 	Files / Directories not copied due to cloaking
".(time() - _startTime)." 	Seconds Elapsed
{$GLOBALS['directoriesSeen']} 	Directories Traversed
{$GLOBALS['filesSeen']} 	Files Scanned";
	if($GLOBALS['copyErrors'])  echo N."{$GLOBALS['copyErrors']} Files could not be uploaded (please try again)";
	if($GLOBALS['test']) pcent('NOTE: Test mode was enabled, so no actions were actually performed');
	
	if($GLOBALS['errors']) {
		if(!$GLOBALS['silent']) echo N;
		pcent('ERRORS ENCOUNTERED - PLEASE TRY AGAIN');
		foreach ($GLOBALS['errors'] as $key=>$val) pline($val);
	}
}

if(!$GLOBALS['silent']) {
	if($GLOBALS['timeout'] && (time() - _startTime) >= $GLOBALS['timeout']) pcent('NOTE: Time ran out before transfers finished. Please run MIXFER again!');
	echo N;
	pblock('MIXFER Finished');
	echo N.N;
	if(!$GLOBALS['foreverTrue']) fgets(STDIN);
}

//********************************* Functions **********************************

//Printing Functions
function pline($txt) {
	if($GLOBALS['silent']) return;
	$txt .= ' ';
	for ($i = (120-strlen($txt)); $i--; $i > 0) $txt .= '*';
	echo N.$txt;
}
function pcent($txt) {
	if($GLOBALS['silent']) return;
	$temp='';
	for ($i = round((117-($t2 = strlen($txt))) / 2); $i--; $i > 0) $temp .= '*';
	echo N.$temp.' '.$txt.' '.$temp.($t2%2==0?'':'*');
}
function pwarn($txt) {
	$txt = 'Warning: '.$txt;
	if($GLOBALS['silent']) return;
	$temp='';
	for ($i = round((117-($t2 = strlen($txt))) / 2); $i--; $i > 0) $temp .= '#';
	echo N.$temp.' '.$txt.' '.$temp.($t2%2==0?'':'#');
}
function perror($txt) {
	$txt = 'Fatal Error: '.$txt;
	for ($i = round((117-($t2 = strlen($txt))) / 2); $i--; $i > 0) $temp .= '#';
	echo N.$temp.' '.$txt.' '.$temp.($t2%2==0?'':'#');
	exit;
}
function pblock($txt) {
	if($GLOBALS['silent']) return;
	echo N.'************************************************************************************************************************';
	pcent($txt);
	echo N.'************************************************************************************************************************';
}

//Cloaked directories do not show file contents, but preserve directory stucture (useful for cache directory or similar)
function ati_is_cloaked($file) {
	if($GLOBALS['transferAll']) {
			if(str_replace($GLOBALS['cloakedFilesAll'],'',$file) != $file) return true;
			return false;
	}
	$file = strtolower($file);
	if(str_replace($GLOBALS['cloakedFiles'],'',$file) != $file) return true;
	else return false;
}

//Hidden files and directories are completley ignored
function ati_is_hidden($file) {
	if($GLOBALS['transferAll']) {
			if(str_replace($GLOBALS['hiddenFilesAll'],'',$file) != $file) return true;
			return false;
	}
	$file = strtolower($file);
	if(str_replace($GLOBALS['hiddenFiles'],'',$file) != $file) return true;
	else return false;
}

//Update cache file
function ati_save_cache() {
	if($GLOBALS['cache'] == 'none' || $GLOBALS['test']) return true;
	$handle = fopen($GLOBALS['cache'], 'w');
	fwrite($handle,
'<?
$GLOBALS[\'toFiles\'] = '.var_export($GLOBALS['toFilesCached'],true).';
$GLOBALS[\'toFilesCached\'] = $GLOBALS[\'toFiles\'];
?>');
	fclose($handle);
}

//Copy File

function ati_copy($from,$to,$diff) {
	echo N.'> '.$from.' ('.($diff ? $diff.' seconds difference' : 'Nonexistent').') ';
	if($GLOBALS['test']) {
		$GLOBALS['actions'][] = 'xfr: '.$from;
		$GLOBALS['files']++;
		return true;
	}
	
	/*
	$temp = ftp_put($GLOBALS['ftpc'], $to, $from, FTP_BINARY);
	if (!$temp) $GLOBALS['copyErrors'] += 1;
	return $temp;
	*/
	/*
	if(!file_put_contents($GLOBALS['to'].$to, file_get_contents($GLOBALS['from'].$from))) $GLOBALS['errors'][] = 'File '.$from.' could not be copied';
	else {
		$GLOBALS['actions'][] = 'xfr: '.$from;
		$GLOBALS['files']++;
	}
	*/
	/*
	//$GLOBALS['context'] = stream_context_create(array('ftp' => array('overwrite' => true)));
	if(!$temp = fopen($GLOBALS['to'].$to, 'w', 0,$GLOBALS['context'])) $GLOBALS['errors'][] = 'Remote file "'.$GLOBALS['to'].$to.'" Could not be opened';
	else if (fwrite($temp, file_get_contents($GLOBALS['from'].$from)) === false) $GLOBALS['errors'][] = 'Local file "'.$GLOBALS['from'].$from.'" Could not be sent';
	else {
		fclose($temp);
		$GLOBALS['actions'][] = 'xfr: '.$from;
		$GLOBALS['files']++;
	}*/
	
	if($GLOBALS['toParams']['mode'] == 'sftp') {
		if(!$GLOBALS['conn'])	$GLOBALS['conn'] = ati_sftp_open();
		ati_sftp_exec($GLOBALS['conn'],'put '.$GLOBALS['from'].$from.' '.$GLOBALS['toParams']['path'].$to,1);
		$GLOBALS['lastTouched'] = $from;
		return true;
	}
	
	$ch = curl_init();	
	$fp = fopen ($GLOBALS['from'].$from, "r");
	curl_setopt($ch, CURLOPT_URL,$GLOBALS['to'].$to);
	curl_setopt($ch, CURLOPT_UPLOAD, 1);
	curl_setopt($ch, CURLOPT_INFILE, $fp);
	curl_setopt($ch, CURLOPT_INFILESIZE, filesize($GLOBALS['from'].$from));
	$success = curl_exec($ch);
	if(curl_error($ch)) {
		pwarn(curl_error($ch));
		die();
	}
	curl_close ($ch);
	
	if($success) {
		$GLOBALS['actions'][] = 'xfr: '.$from;
		$GLOBALS['files']++;
		return true;
	}
}

function ati_mkdir($val) {
	if($GLOBALS['test']) return true;
	echo N.'> '.$val;
	
	if($GLOBALS['toParams']['mode'] == 'sftp') {
		if(!$GLOBALS['conn'])	$GLOBALS['conn'] = ati_sftp_open();
		ati_sftp_exec($GLOBALS['conn'],'mkdir '.$GLOBALS['toParams']['path'].$val);
		$GLOBALS['lastTouched'] = $val;
		return true;
	} else {
		if($GLOBALS['toParams']['mode'] == 'ftp') $temp = ftp_mkdir(ati_ftp(),$GLOBALS['toParams']['path'].$val);
		else $temp = mkdir($GLOBALS['to'].$val);
		
		if($temp) return true;
		else if(/*($ch = curl_init($val)) ? @curl_close($ch) || true : false*/file_exists($val)) {
			echo ' already existed';
			return true;
		}
		else pwarn('Directory "'.str_replace($GLOBALS['to'],'',$val).'" Could not be created');
	}
}

function ati_delete($val) {
	if(is_dir($val))	return unlink($val);
	else 				return rmdir($val);
}

function ati_get_to($path) {
	if($GLOBALS['overwrite']) return; 					//Directory listing not needed, as we are just going to overwrite everything anyway
	echo N.'< '.$path;
	
	if($GLOBALS['toParams']['mode'] == 'ftp') {
		$temp = ftp_nlist(ati_ftp(),$GLOBALS['toParams']['path'].$path);
		if($temp) {
			foreach ($temp as $key=>$val) {
				if($val == "." || $val == "..") continue;
				$GLOBALS['toFiles'][$path.$val] = ftp_mdtm(ati_ftp(),$GLOBALS['toParams']['path'].$path.$val);
				$GLOBALS['toFilesCached'][$path.$val] = $GLOBALS['toFiles'][$path.$val];
			}
		}
	} else if($GLOBALS['toParams']['mode'] == 'sftp') {
		if(!$GLOBALS['conn'])	$GLOBALS['conn'] = ati_sftp_open();
		$temp = ati_sftp_exec($GLOBALS['conn'],'ls -al '.$GLOBALS['toParams']['path'].$path,1);
		if($temp) foreach ($temp as $key=>$val) {
			preg_match('/^(..........)(\s*)([^\s]*)(\s*)([^\s]*)(\s*)([^\s]*)(\s*)([^\s]*)(\s*)([^\s]*)(... .. ..:..)(\s*)(.*)/',$val,$tmp);
			$dte = $tmp[12];
			$nme = $tmp[14];
			if($nme && $dte && $nme != "." && $nme != "..") {
				if(($dte = strtotime($dte)) === false) die('Fatal Error: the date "'.$dte.'" could not be parsed. Name was "'.$nme.'". File Row Was "'.$val.'". Directory Listing was:'.N.print_r($temp,true));
				$GLOBALS['toFiles'][$path.$nme] = (strpos($nme,'.') ? $dte : -1);
				$GLOBALS['toFilesCached'][$path.$nme] = $GLOBALS['toFiles'][$path.$nme];
				//echo $path.$nme.'='.$GLOBALS['toFiles'][$path.$nme].N;
			}
		}
	} else {
		if ($handle = opendir($GLOBALS['to'].$path)) {
		   while ($file = readdir($handle)) {
			   if($file != "." && $file != "..") {
				   $GLOBALS['toFiles'][$path.$file] = filemtime($GLOBALS['to'].$path.$file);
				   $GLOBALS['toFilesCached'][$path.$file] = $GLOBALS['toFiles'][$path.$file];
			   }
		   }
		   closedir($handle);
		}
	}
}

function ati_ftp() {
	if($GLOBALS['ftpConn']) return $GLOBALS['ftpConn'];
	
	echo N."* Connecting to FTP Server";
	$GLOBALS['ftpConn'] = @ftp_connect(@gethostbyname($GLOBALS['toParams']['host']));
	if(!$GLOBALS['ftpConn']) die(": Could not connect to remote ftp server!\nPlease check your internet connection.\n\n\n\n\n");
	echo ": Connection Established";
	if(!ftp_login($GLOBALS['ftpConn'],$GLOBALS['toParams']['user'],$GLOBALS['toParams']['pass'])) die('Could not log in to remote ftp server!');
	echo ": Authentication Completed";
	ftp_pasv($GLOBALS['ftpConn'],true);
	echo ": Passive Mode Set";
	echo ": Connection Successful! *";
	if(!ftp_chdir($GLOBALS['ftpConn'],$GLOBALS['toParams']['path'])) {
		echo '> '.$GLOBALS['toParams']['path'];
		ftp_mkdir($GLOBALS['ftpConn'],$GLOBALS['toParams']['path']);
	}
	
	return $GLOBALS['ftpConn'];
}

function ati_sftp_open() {
	//echo N.'Connecting to SFTP Server';
	$connection = proc_open('sftp -oPasswordAuthentication=no -oIdentityFile=/Users/admin/.ssh/id_dsa '.$GLOBALS['toParams']['user']."@".$GLOBALS['toParams']['host'],array(0 => array("pipe", "r"), 1 => array("pipe", "w"), 2 => array("pipe", "w")), $pipes);
	if ($connection === FALSE) die('Could not connect to remote sftp server!');
	$conn = array('pipes'=>$pipes,'proc'=>$connection);
	stream_set_blocking($conn['pipes'][2], true);
	if (fgets($conn['pipes'][2]) != 'Connecting to '.$GLOBALS['toParams']['host'].'...'.N) die(N.'Fatal Error: Could not connect to SFTP server: Server Response "'.$error.'" - proc_close return value "'.proc_close($connection).'"');
	stream_set_blocking($conn['pipes'][1], false);
	stream_set_blocking($conn['pipes'][2], false);
	//ati_sftp_exec($conn,'cd '.$GLOBALS['toParams']['path']);
	//echo ': Connected Successfully';
	return $conn;
}

function ati_sftp_exec($conn, $cmd, $returnExpected=false, $end = 'sftp>') {
	//echo $cmd;
	ati_sftp_errorCheck($conn,'About to execute command "'.$cmd.'"');
	fwrite($conn['pipes'][0], $cmd.N);							//Send command to STDOUT
	if($returnExpected) {										//This command should return a value - so wait till it does and then grab it :-)
		$i = -2; $a = 1;										//Initialize the timeout counter - it doesn't start ckecking for a timeout until it two lines are read and it is set to 0
		while ($i < 5) {										//More than $i lines in a row have been read with no data coming in - hopefully we have got it all... this is a totally stupid way of doing this... Have spent several hours trying to get "while (!feof($pipe))", but it JUST DOESN'T WORK
			$tmp = fgets($conn['pipes'][1]);					//Check for data in STDIN
			//echo $tmp;
			if($i >= -1 && $tmp) 	$return[] = $tmp;			//Skip first line that only says what command was entered
			if($tmp && $i > 0)		$i = 0;						//Reset $i if data is read
			else if($tmp) {
									$i++;						//Start the counter at the SECOND line of code read... the first line is the server acknowledging that it recieved the command, but the second line is the start of the stuff returned by the command
									echo ',';
			}
			if($a++%40==0)			echo '.';					//Echo "." every 10 lines read for a status update to the bored user staring at the screen
			if($i >= 0)				$i++;						//Increment $i if data has been read before
			if($i != 0) {
									usleep(100000);				//No sense looping at full speed if there is nothing to read...
									ati_sftp_errorCheck($conn,'Just executed command "'.$cmd.'"');
			}
		}
	}
	return $return;												//This doesn't work either: "return stream_get_contents($conn['pipes'][1]);" :-!
}

function ati_sftp_errorCheck($conn,$pos='') {
	do {
        $tmp = fgets($conn['pipes'][2]);
        $err .= $tmp;
    } while (!feof($conn['pipes'][2]) && $buffer);
    if($err) {
		foreach($GLOBALS['sftp']['nonFatalErrors'] as $key=>$val) if(strpos($err,$key) !== false) {
			if($val === true) $warn = true;
			else if ($val == 'rmprev') {
				unset($GLOBALS['toFiles'][$GLOBALS['lastTouched']]);
				unset($GLOBALS['toFilesCached'][$GLOBALS['lastTouched']]);
				$msg = 'Resource "'.$GLOBALS['lastTouched'].'" removed from cache.';
			}
			break;
		}
		if($warn) 	echo N.'NOTICE: SFTP server returned "'.$err.'" '.$msg;
		else 		die(N.'Fatal Error: SFTP Server returned "'.$err.'"'.($pos ? ' in script portion "'.$pos.'"' : ''));
	}
}

function ati_sftp_close($conn) {
	echo N.'Closing SFTP Connection';
	fwrite($conn['pipes'][0], 'quit'.N);
	fclose($conn['pipes'][0]);
	fclose($conn['pipes'][1]);
	fclose($conn['pipes'][2]);
	proc_close($conn['proc']);
	echo ': Successfully Closed';
}

/*function ati_sftp() {
	if($GLOBALS['sftpConn']) return $GLOBALS['sftpConn'];
	
	echo N."***** Connecting to SFTP Server";
	$GLOBALS['sftpConn'] = @ssh2_connect(@gethostbyname($GLOBALS['toParams']['host']),22);
	if(!$GLOBALS['sftpConn']) die(": Could not connect to remote sftp server!\nPlease check your internet connection.\n\n\n\n\n");
	echo ": Connection Established";
	if(!ssh2_auth_password($GLOBALS['sftpConn'],$GLOBALS['toParams']['user'],$GLOBALS['toParams']['pass'])) die('Could not log in to remote sftp server!');
	echo ": Authentication Completed";
	echo ": Connection Successful! ******";
	if(!chdir('ssh2.sftp://'.$GLOBALS['sftpConn'].$GLOBALS['toParams']['path'])) {
		echo '> '.$GLOBALS['toParams']['path'];
		mkdir('ssh2.sftp://'.$GLOBALS['sftpConn'].$GLOBALS['toParams']['path']);
	}
	
	return $GLOBALS['sftpConn'];
}*/

//Traverse directory
function doDir($path = '') {
	
	$pathSlash = '';
	if($path) $pathSlash = $path.'/';
	
	$dirGenerated = false; //We don't need to generate directory listing more than once!
	
	//******************* move stuff around ***********************
	
	if ($handle = opendir($GLOBALS['from'].$pathSlash)) {
		//if($path) echo N.'* '.$path;
		while ($file = readdir($handle)) {
			
			if($GLOBALS['timeout'] && (time() - _startTime) > $GLOBALS['timeout']) return;
				
			if($file == "." || $file == "..") continue;
			
			if(ati_is_hidden($pathSlash.$file)) { //Hidden - do nothing
				$GLOBALS['skipped'] += 1;
				//if($GLOBALS['verbose']) echo N.'Hidden File / Directory Skipped: '.$pathSlash.$file;
				continue;
			}
		   
		   if(is_dir($GLOBALS['from'].$pathSlash.$file)) { //Directory
			   $GLOBALS['directoriesSeen'] ++;
			   if((!$GLOBALS['toFilesCached'] || !array_key_exists($pathSlash.$file,$GLOBALS['toFilesCached'])) && !$dirGenerated) {
					ati_get_to($pathSlash);
					$dirGenerated = true;
					$GLOBALS['cacheRefreshed'] ++;
					//if($GLOBALS['cacheRefreshed'] % 3 == 0)
						ati_save_cache(); //Save cache
			   }
			   
			   if(!$GLOBALS['toFiles'][$pathSlash.$file]) {
				   if(ati_mkdir($pathSlash.$file)) {
					   $GLOBALS['toFilesCached'][$pathSlash.$file] = filemtime($GLOBALS['from'].$pathSlash.$file);
					   $GLOBALS['directories'] ++;
					   //if($GLOBALS['directories'] % 3 == 0)
					   	ati_save_cache(); //Save cache
				   }
			   }
			   
			   if(ati_is_cloaked($pathSlash.$file)) { //Cloaked
				   if($GLOBALS['verbose']) echo N.'Cloaked Directory Skipped: '.$pathSlash.$file;
				   $GLOBALS['skipped'] += 1;
				   $GLOBALS['toFilesCached'][$pathSlash.$file] = -1;
			   }
			   else { //iterate it
				   doDir($pathSlash.$file);
			   }
		   }
		   
		   else { //File
			   $GLOBALS['filesSeen'] += 1;
			   if((!$GLOBALS['toFilesCached'] || !array_key_exists($pathSlash.$file,$GLOBALS['toFilesCached'])) && !$dirGenerated) {
					ati_get_to($pathSlash);
					$dirGenerated = true;
					$GLOBALS['cacheRefreshed'] ++;
					//if($GLOBALS['cacheRefreshed'] % $GLOBALS['saveCacheEveryCaches'] == 0)
							ati_save_cache(); //Save cache
			   }
			   
			   $mTime = filemtime($GLOBALS['from'].$pathSlash.$file);
			   
			   if($mTime > ($GLOBALS['toFiles'][$pathSlash.$file] - $GLOBALS['timeOffset'])) {
					/*$ext = strrchr($file, '.');
					if($GLOBALS['encode'] == true && ($ext == '.ati' || $ext == '.php')) {
						echo "\Compiling File: ".$pathSlash.$file."";
						//$handle = fopen($GLOBALS['toTemp'].$pathSlash.$file,'w');
						//fwrite($handle, eaccelerator_encode(file_get_contents($GLOBALS['from'].$pathSlash.$file)));
						//fclose($handle);
						
						die("php -q ".$GLOBALS['compiler']." ".$GLOBALS['from'].$pathSlash.$file." -o ".$GLOBALS['toTemp'].$pathSlash.$file);
						
						if(ati_copy($GLOBALS['toTemp'].$pathSlash.$file,$GLOBALS['to'].$pathSlash.$file)) $GLOBALS['toFilesCached'][$pathSlash.$file] = $mTime;
						
						unlink($GLOBALS['toTemp'].$pathSlash.$file);
						
						$GLOBALS['compiled'] += 1; 
					}
					else*/
					if(ati_copy($pathSlash.$file,$pathSlash.$file,($GLOBALS['toFiles'][$pathSlash.$file] ? ($mTime - $GLOBALS['toFiles'][$pathSlash.$file] - $GLOBALS['timeOffset']) : 0))) $GLOBALS['toFilesCached'][$pathSlash.$file] = $mTime;
					else die('File could not be copied');
					
					//if($GLOBALS['files'] % $GLOBALS['saveCacheEveryFiles'] == 0)
						ati_save_cache(); //Save cache
			   }
			   else {
				   $GLOBALS['alreadyDone'] += 1;
				   $GLOBALS['toFilesCached'][$pathSlash.$file] = $mTime;
			   }
		   }
		  unset($GLOBALS['toFiles'][$pathSlash.$file]);
	   }
	   closedir($handle);
	}
	else pcent('Error: Directory "'.$GLOBALS['from'].$pathSlash.'" Could Not Be Entered');
}

?>