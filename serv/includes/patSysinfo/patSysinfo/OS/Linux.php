<?php
/**
 * patSysinfo for Linux
 *
 * $Id: Linux.php 10 2004-03-23 15:11:56Z gerd $
 * 
 * Running this piece of code requires:
 * - /proc-filesystem
 * - the command 'who' in your path
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
if( !defined( 'SENSOR_PROG' ) )
{
	/**
	 * the program reading hardware-sensors: lm_sensors (http://www.netroedge.com/~lm78/)
	 */ 
	define( 'PATSYSINFO_OS_LINUX_SENSOR_PROG', 'sensors' );
}
 
/**
 * patSysinfo_OS_Linux
 *
 * @package patSysinfo
 * @version 0.1
 * @author gERD Schaufelberger <gerd@php-tools.net>
 * @copyright 2004 php-application-tools http://www.php-tools.net
 * @license	LGPL
 * @link http://www.php-tools.net
 */
class patSysinfo_OS_Linux extends patSysinfo_OS
{

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
		if ( !$fh = fopen( '/proc/version', 'r' ) ) 
		{
			if ( $this->useFillString )
				return $this->fillString;
				
			return '';
		}
		
		
		$buffer = fgets( $fh, 4096 );
		fclose( $fh );
	
		// search and grep the kernel-version
		if ( !preg_match( '/version (.*?) /', $buffer, $matches ) ) 
		{
			if ( $this->useFillString )
				return $this->fillString;
				
			return '';
		} 
		$result = $matches[1];
		if ( preg_match( '/SMP/', $buffer ) )
			$result .= ' (SMP)';
		
		return $result;
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
		$uptime	=	array( 'days' => null, 'hours' => null, 'mins' => null );
		if( $this->_useFillString )
		{
			$uptime['days']	=	$this->_fillString;
			$uptime['hours']=	$this->_fillString;
			$uptime['mins']	=	$this->_fillString;
		}
		
		if( !$fh = fopen( '/proc/uptime', 'r' ) )
		{
			return $uptime;
		}
		
		$buffer = split( ' ', fgets( $fh, 4096 ) );
		fclose( $fh );
		
		$ticks = trim( $buffer[0] );
		$mins	=	$ticks / 60;
		$hours	=	$mins / 60;
		$days	=	floor( $hours / 24 );
		$hours	=	floor( $hours - $days * 24 );		
		$mins	=	floor( $mins - $hours * 60 - $days * 24 * 60 );
		
		$uptime['days']		=	$days;
		$uptime['hours']	=	$hours;
		$uptime['mins']		=	$mins;

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
		return trim( `who | wc -l`);
    }

   /**
	* Returns process information, ordered by CPU-usage
	* Emulates the behavior of "top".
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
		$cmd	=	"ps auxc --sort '-%cpu'";
		$result	=	exec( $cmd, $out, $ret );
		
		$top	=	array();
		
		// get keys from headline
		$head	=	preg_split( '/\s+/' , trim( $out[0] ) );
		$fields	=	array(
							'pid'		=> 'pid',
							'user'		=>	'user',
							'command'	=>	'name',
							'%mem'		=>	'mem',
							'time'		=>	'time',
							'stat'		=>	'status',
							'tty'		=>	'session'
						);
		$headFields	=	array_keys( $fields );
		
		// lowercase
		for( $i = 0; $i < count( $head ); ++$i )
			$head[$i]	=	strtolower( $head[$i] );

		// add list to top		
		for( $i = 1; $i < count( $out ); ++$i )
		{
			// finish?
			if( $i > $total )
				return $top;
		
			$line	=	preg_split( "/\s+/" , trim( $out[$i] ), count( $head ) );
			for( $j = 0; $j < count( $head ); ++$j )
			{
				if( !in_array( $head[$j], $headFields ) )
				{
					unset( $line[$j] );
					continue;
				}
			
				$line[ $fields[ $head[$j]] ]	=	$line[$j];
				unset( $line[$j] );
			}
			
			// mangle data
			$line['mem']	=	sprintf( '%0.0f', $line['mem'] * 1024 );
			$time			=	explode( ':', $line['time'] );
			$time[1]		=	(int) $time[1] + (int) $time[0] * 60;
			$line['time']	=	$time[1];
			
			if( $this->_useUnitCalc )
			{
				$line['mem']		=	$this->unitCalc( $line['mem'] );
			}
			
			array_push( $top, $line );
		}
		
		return $top;
    }

   /**
	* Get a memory information
	* - physical memory: total, available, percent
	* - virtual memory: total, available, percent
	* 
	* Be careful, this function returns mor information than specified in patSysinfo
	* 
	* @access public
	* @return array	$memory indexed array information 0 => pysical, 1 => virtual memory
	*/
	function getMem()
	{
		$result	=	array();
		if ( !$fh = @fopen( '/proc/meminfo', 'r' ) )
			return $result;

		$keys	=	array( 'total', 'used', 'free', 'shared', 'buffers', 'cache' );
	
		while( $buffer = fgets( $fh, 4096 )) 
		{
			// look for real and virtaul memory
			if ( !preg_match( '/^(Mem|Swap):\s+/', $buffer, $match ) )
				continue;
	
			$split = preg_split( '/\s+/', $buffer );
			
			$mem	=	array();
			$i		=	1;
			foreach( $keys as $key )
			{
				$mem[$key]	=	0;
				if( isset( $split[$i] ) )
					$mem[$key]	=	(int) $split[$i];
				
				++$i;
			}
			
			$mem['available']	=	$mem['free'] + $mem['cache'] + $mem['buffers'];
			$mem['percent']		=	sprintf( '%02.0f', 100 * $mem['available'] / $mem['total'] );
			
			// throw away some information :-(
			unset( $mem['cache'] );
			unset( $mem['free'] );
			unset( $mem['used'] );
			unset( $mem['buffers'] );
			unset( $mem['shared'] );
			
			if( $this->_useUnitCalc )
			{
				$mem['total']		=	$this->unitCalc( $mem['total'] );
				$mem['available']	=	$this->unitCalc( $mem['available'] );
			}
			array_push( $result, $mem );
		}
		
		fclose( $fh );
		return $result;
	}

   /**
	* Returns an entry in array for each CPU, available information: 
	* - no 
	* - model
	* - speed
	* 
	* @access public
	* @return array $cpu index array about all CPUs
	*/
    function getCpu()
    {
		$results = array();
		$buffer = array();
		
		if ( !( $fh = fopen( '/proc/cpuinfo', 'r') ) )
			return $results;
			
		$processors = -1;
		
		while ( $buffer = fgets( $fh, 4096 ) ) 
		{
			$buffer	=	trim( $buffer );
			if( empty( $buffer ) )
			{
				continue;
			}
			
			list( $key, $value ) = preg_split( "/\s+:\s+/", $buffer, 2);
		
			// Maybe you need some other tags if you run this on another architecture.
			// If you find or miss one, please tell me.
			switch ( $key ) 
			{
				case 'model name':	// for ix86
					$results[$processors]['model'] = $value;
					break;
				case 'cpu MHz':
					$results[$processors]['speed'] = sprintf('%.2f', $value );
					break;
				case 'clock': // for PPC
					$results[$processors]['speed'] = sprintf('%.2f', $value );
					break;
				case 'cpu': // for PPC
					$results[$processors]['model'] = $value;
					break;
				case 'revision': // for PPC arch
					$results[$processors]['model'] .= ' ( rev: ' . $value . ')';
					break;
				case 'processor':
					$processors++;
					$results[$processors]['no'] = $value;
					break;
			}	
		}
		fclose( $fh );
		
		return $results;
    }
}
?>