<?php
/**
 * patSysinfo for Microsoft Windows
 * 
 * $Id: Windows.php 7 2004-03-02 23:35:09Z gerd $
 * 
 * Running this piece of code requires some additional software on the windows server:
 * - systeminfo.exe from the "Windows Support Tools" 
 * - tasklist.exe this programme should be included in your windows installation
 * 
 * CAUTION: 
 * This software was developed and testet on Windows XP Pro (5.1.2600 Service Pack 1 Build 2600)
 * I've no idea, what will happen, if you try to use this class on any other version of Windows.
 */

/****************************************************
 * Defines of some used programmes                  *
 *                                                  *
 * ! DO NOT CHANGE THESE DEFINES WITHIN THIS FILE ! *
 *                                                  *
 * If these values has to be adjusted, define these *
 * constants in the configuration section of your   *
 * applcation.                                      *
 *                                                  *
 ****************************************************/
 
if( !defined( 'PATSYSINFO_OS_WINDOWS_SYSTEMINFO' ) )
{
   /**
	* define executable command systeminfo
	*/   
	define( 'PATSYSINFO_OS_WINDOWS_SYSTEMINFO', 'systeminfo' );
}

if( !defined( 'PATSYSINFO_OS_WINDOWS_TASKLIST' ) )
{
   /**
	* define executable command tasklist
	*/   
	define( 'PATSYSINFO_OS_WINDOWS_TASKLIST', 'tasklist' );
}

/**
 * Implementation of patSysinfo for Microsoft Windows
 *
 * @access	public
 * @package	patSysinfo
 * @version	0.1 
 * @author gERD Schaufelberger <gerd@php-tools.net>
 * @copyright 2004 php-application-tools http://www.php-tools.net
 * @license	LGPL
 * @link http://www.php-tools.net
 * @todo Implement a lot of functions
 */
class patSysinfo_OS_Windows extends patSysinfo_OS
{
   /**
	* store result of systeminfo
    * @access private
	* @var array $_sysinfo
	*/
	var $_sysinfo = null;
	
   /**
	* recieve version of OS-kernel
	*
	* Same as "uname --release"
	* 
	* @access public
	* @return string $version 
	*/
    function getOSVersion()
    {
		return $this->_getSysinfo( 'os_version' );
    }
	
	/**
	 * Returns system uptime
	 * 
	 * @access public
	 * @param boolean $digit set true in order to prepend leading "0" before minutes
	 * @return array $uptime uptime uptime in days, hours and minutes
	 */
	function getUptime( $digit = false )
	{
		$uptime	=	array();
		$string	=	$this->_getSysinfo( 'system_up_time' );
		preg_match( "/^(\d+)\s+Days,\s+(\d+)\s+Hours,\s+(\d+)\s+Minutes/", $string, $match );
		
		$uptime['days']		=	$match[1];
		$uptime['hours']	=	$match[2];
		$uptime['mins']		=	$match[3];
		
		if( $digit )
		{
			$uptime['hours']	=	sprintf( '%02d', $uptime['hours'] );
			$uptime['mins']		=	sprintf( '%02d', $uptime['mins'] );
		}
		
		return $uptime;
	}

	
   /**
	* Returns number of current users
	*
	* @access public
	* @return int $number number of users
	* @todo search for a better implementation
	*/
    function getNumberUsers()
    {
		return 0;
    }
	
   /**
	* Returns process information, ordered by CPU-usage
	* Emulates the behavior of "top". This function requires the commandline tools
	* "tasklist" which should be included in your windows installation
	* 
	* - pid
	* - name
	* - user
	* - time
	* - mem
	* - session
	* - status
	* 
	* @access public
	* @param int $total number of processes in result
	* @return array $result The most CPU-consuming processes
	*/
	function getTopProcesses( $total = 10 )
	{
		$list	=	array();
		static $trans	=	array( ',' => '', '.' => '' );
		
		$cmd	=	PATSYSINFO_OS_WINDOWS_TASKLIST . ' /FO CSV /V';
		$result	=	exec( $cmd, $out, $ret );
		
		if( $ret != 0 )
		{
			return patErrorManager::raiseError( 
						PATSYSINFO_ERROR_COMMAND_FAILED,
						'Command "' . PATSYSINFO_OS_WINDOWS_TASKLIST . '" failed',
						'Maybe "tasklist" is not in your path or not installed, try to define PATSYSINFO_OS_WINDOWS_TASKLIST to fix this error. Read the fine documentation!' 
				);
		}
		
		$procs	=	$this->_csv2Array( $out );
		
		// remove idle task
		array_shift( $procs );
		
		for( $i = 0; $i < $total; ++$i )
		{
			if( !isset( $procs[$i] ) )
				break;
				
			$mem	=	explode( ' ', $procs[$i]['mem_usage'] );
			$mem[0]	=	strtr( $mem[0], $trans );
			
			if( strtolower( $mem[1] ) == 'm' )
			{
				$mem[0]	=	$mem[0] * 1024;
				$mem[1] = 'k';
			}
			if( strtolower( $mem[1] ) == 'k' )
			{
				$mem[0]	=	$mem[0] * 1024;
			}
			
			// calulate seconds of operation
			$time	=	explode( ':', $procs[$i]['cpu_time'] );
			$time[1]	=	(int) $time[1] + (int) $time[0] * 24;
			$time[2]	=	( (int) $time[2] + $time[1] * 60 ) * 60;
			
			$proc	=	array();
			$proc['pid']		=	$procs[$i]['pid'];
			$proc['name']		=	$procs[$i]['image_name'];
			$proc['user']		=	$procs[$i]['user_name'];
			$proc['time']		=	$time[2];
			$proc['mem']		=	$mem[0];
			$proc['session']	=	$procs[$i]['session#'];
			$proc['status']		=	$procs[$i]['status'];
			
			if( $this->_useUnitCalc )
			{
				$proc['mem']	=	$this->unitCalc( $proc['mem'] );
			}
			
			array_push( $list, $proc );
		}
		
		return $list;
	}
	
   /**
	* Get a memory information
	* - physical memory: total, available, percent
	* - virtual memory: total, available, percent
	* 
	* @access public
	* @return array	$memory indexed array information 0 => pysical, 1 => virtual memory
	*/
	function getMem()
	{
		$memory	=	array();
		
		static $keys	=	array( 
						array(	
							'total' => 'total_physical_memory', 
							'available' => 'available_physical_memory'
							),	
						array( 
							'total' => 'virtual_memory:_max_size', 
							'available' => 'virtual_memory:_available'
							),
						);

		
		// seperators to be removed				
		static $seperator	=	array( ',' => '', '.' => '' );
		
		for( $i = 0; $i < count( $keys ); ++$i )
		{
			$memory[$i]	=	array();
			foreach( $keys[$i] as $key => $value )
			{
				$info		=	explode( ' ', $this->_getSysinfo( $value ) );
				$info[0]	=	strtr( $info[0], $seperator );
				
				if( strtolower( $info[1] ) == 'mb' )
				{
					$info[0]	=	$info[0] * 1024;
					$info[1]	=	'kb';
				}
				if( strtolower( $info[1] ) == 'kb' )
				{
					$info[0]	=	$info[0] * 1024;
					$info[1]	=	'';
				}
				
				$memory[$i][$key]	=	(int) $info[0];
			}
			$memory[$i]['percent']	=	sprintf( '%02.0f', 100 * $memory[$i]['available'] / $memory[$i]['total'] );
			
			if( $this->_useUnitCalc )
			{
				$memory[$i]['total']		=	$this->unitCalc( $memory[$i]['total'] );
				$memory[$i]['available']	=	$this->unitCalc( $memory[$i]['available'] );
			}
		}
		return $memory;
	}

   /**
	* Returns an entry in array for each CPU, available information: 
	* - no 
	* - model
	* - speed
	* 
	* @access public
	* @return array $cpu index array about all CPUs
	* @todo test this function with multiple CPUs installed
	*/
    function getCpu()
    {
		$cpus	=	array();
		
		$info	=	$this->_getSysinfo( 'processor(s)' );
		
		if( preg_match_all( '/\[(\d{2})\]:\s+(.*)\s+\~(\d{0,10})\s*Mhz/', $info, $match, PREG_SET_ORDER ) )
		{
			for( $i = 0; $i < count( $match ); ++$i )
			{
				$cpus[$i]			=	array();
				$cpus[$i]['no']		=	$i;
				$cpus[$i]['model']	=	$match[$i][2];
				$cpus[$i]['speed']	=	$match[$i][3];
			}
		}
		return $cpus;
    }
	
   /**
	* recieve system information with the tool systeminfo
	*
	* @access private
	* @param integer $id	
	* @return boolean $result true on success
	*/
    function _getSysinfo( $key )
    {
		if( $this->_sysinfo !== null )
		{
			// this should not happen
			if( !isset( $this->_sysinfo[$key] ) )
			{
				return null;
			}
			
			return $this->_sysinfo[$key];
		}
		
		$this->_sysinfo	=	array();
		
		$cmd	=	PATSYSINFO_OS_WINDOWS_SYSTEMINFO . ' /FO CSV';
		$result	=	exec( $cmd, $out, $ret );
		
		if( $ret != 0 )
		{
			return patErrorManager::raiseError( 
						PATSYSINFO_ERROR_COMMAND_FAILED,
						'Command "' . PATSYSINFO_OS_WINDOWS_SYSTEMINFO . '" failed',
						'Maybe "systeminfo" is not in your path or not installed, try to define PATSYSINFO_OS_WINDOWS_SYSTEMINFO to fix this error. Read the fine documentation!' 
				);
		}
		
		$result			=	$this->_csv2Array( $out );
		$this->_sysinfo	=	$result[0];
		
		return $this->_sysinfo[$key];
    }
	
   /**
	* convert csv-data to array
	*
	* @access private
	* @param array $csv 
	* @return array $result list of associative array
	*/
    function _csv2Array( $csv )
    {
		$result	=	array();
		
		$head	=	array_shift( $csv );
		// skip first line
		if( empty( $head ) )
			$head	=	array_shift( $csv );
		
		// extract keys and values
		preg_match_all( "/\"(.*)\"/U",  $head, $match );
		$names	=	$match[1];
		for( $i = 0; $i < count( $names ); ++$i )
		{
			$names[$i]	=	str_replace( ' ', '_', strtolower( $names[$i] ) );
		}
		
		// extract all other rows
		for( $j = 0; $j < count( $csv ); ++$j )
		{
			if( empty( $csv[$j] ) )
			{
				continue;
			}
		
			preg_match_all( "/\"(.*)\"/U",  $csv[$j], $match );
			$values	=	$match[1];
		
			$row	=	array();
			for( $i = 0; $i < count( $names ); ++$i )
			{
				$row[$names[$i]]	=	$values[$i];
			}
			array_push( $result, $row );
		}
		
		return $result;
    }
}
?>