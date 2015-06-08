<?php
/**
 * patSysinfo Version 2.x 
 * 
 * $Id: patSysinfo.php 10 2004-03-23 15:11:56Z gerd $
 * 
 * This version of patSysinfo was completely rewritten and redesigned. 
 * Now patSysinfo is based on driver which implement the the interface 
 * for each supported operation system. Currently there are only two 
 * supported OS: 
 *  - Linux
 *  - Windows
 * 
 * 
 * Class to get a lot of information about the system. Very easy to use but 
 * powerful and configurable. Now this class supports: 
 * 
 * - Hardware sensors (uses lm_sensors http://www.netroedge.com/~lm78/ )
 * - Kernel Version
 * - Hostname and IP, number of users, 
 * - System uptime and CPU-load
 * - Networking devices
 * - PCI devices
 * - IDE devices
 * - SCSI devices
 * - Momory information
 * - Mountpoint information
 * 
 * Special thanks to:
 * - Chris Hubbard for the MacOS X port "Darwin"
 */
 
/**
 * The patSysinfo Factory 
 * 
 * This class implements a checker for detecting the operation-system
 * and the factory method (create), which returns the concrete implementation
 * of patSysinfo
 *
 * @access	public
 * @package	patSysinfo
 * @version	0.2
 * @author gERD Schaufelberger <gerd@php-tools.net>
 * @copyright 2004 php-application-tools http://www.php-tools.net
 * @license	LGPL
 * @link http://www.php-tools.net
 */
class patSysinfo
{
   /**
	* create concrete patSysinfo object 
	*
	* @access public
	* @return object &patSysinfo 
	*/
    function &create()
    {
		$os	=	patSysinfo::getOSName();
	
		// include base
		include_once dirname( __FILE__ ) . '/patSysinfo/OS.php';
		include_once dirname( __FILE__ ) . '/patSysinfo/OS/'. $os .'.php';

		$class	=	'patSysinfo_OS_' . $os;
		$driver	=	&new $class();
		
		return $driver;
    }
	
   /**
	* get name of operation system
	* 
	* Guesses the name of the server's operating system. 
	* Currently only Linux and Windows can be recogniced
	*
	* @access public
	* @return string $name name of the operation system
	* @todo enhance this very poor test
	*/
    function getOSName()
    {
		$name	=	'Linux';
		
		// windows usually keeps the OS-name in environment
		if( isset( $_ENV['OS'] ) && $_ENV['OS'] == 'Windows_NT' )
		{
			$name	=	'Windows';
		}
		
		// Darwin - Mac OS X, based on Linux, but something special
		if( isset( $_SERVER['SERVER_SOFTWARE'] ) && strpos( $_SERVER['SERVER_SOFTWARE'], 'Darwin' ) )
		{
			$name = 'Darwin';
		}
		
		return $name;
    }
}
?>