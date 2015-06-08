<?php
/**
 * Base class for all patSysinfo os-specific implementations
 * 
 * $Id: OS.php 10 2004-03-23 15:11:56Z gerd $
 * 
 * patSysinfo_OS defines the interface of patSysinfo and implements 
 * some OS-independent functions.
 */

/**
 * error definition: funcion not implemented for this operation system
 */									
define( 'PATSYSINFO_WARNING_NOT_IMPLEMENTED', 11 );

/**
 * error definition: command execution failed
 */									
define( 'PATSYSINFO_ERROR_COMMAND_FAILED', 12 );

/**
 * base class for all patSysinfo os-specific implementations
 * 
 * The Class patSysinfo_OS implements all knwon functions to recieve information
 * about the running Operation system.
 * 
 * @access	public
 * @package	patSysinfo
 * @version	0.1 
 * @author gERD Schaufelberger <gerd@php-tools.net>
 * @copyright 2004 php-application-tools http://www.php-tools.net
 * @license	LGPL
 * @link http://www.php-tools.net
 */
class patSysinfo_OS
{
   /**
	* useHtmlChars
	* whether chars should be convertet to html-entities
	* 
	* @var bool useHtmlChars
	* @see setUseHtmlChars()
	*/
	 var $_useHtmlChars	=	true;
	 
   /**
	* fillString
	* @var string fillString The default String to replace empty values/strings
	* @access	private
	* @see useFillString, setFillString(), setUseFillString()
	*/
	var $_fillString = 'NA';
	
   /**
	* useFillString
	* @var bool useFillString Should empty values replaced? 
	* @access	private
	* @see fillString, setFillString(), setUseFillString()
	*/
	var $_useFillString = true;
	
   /**
	* useUnitCalc
	* @var bool useFillString Should empty values replaced? 
	* @access	private
	* @see setUnitCalcConfig, 
	*/
	var $_useUnitCalc = true;
	
   /**
	* unitCalcDiv
	* @var int calcDiv 
	* @access	private
	* @see setUnitCalcConfig(), unitCalc(), unitCalcUnits
	*/
	var $_unitCalcDiv = 1024;
	
   /**
	* UnitCalcUnits
	* @var array calcUnits
	* @access	private
	* @see setUnitCalcConfig(), unitCalc(), unitCalcDiv
	*/
	var $_unitCalcUnits = array( 'Byte', 'kByte', 'MByte', 'GByte' );
	
   /**
	* sensorParam
	* @var array sensorParam The name of each sensor-parameter
	* @access	private
	* @see getSensot()
	*/
	var $_sensorParam = array( 'min', 'max', 'limit', 'hysteresis', 'div' );
	
   /**
	* sensorHideLabel
	* @var array sensorHideLabel A list of labels which were removed from output
	* @access	private
	* @see setHideLabel(), addHideLabel()
	*/ 
	var $_sensorHideLabel = array();
	
   /**
	* sensorReplace
	* @var mixed sensorReplace A list of regular expressions to replace any field
	* @access	private
	* @see setSensorReplace(), addSensorReplace()
	*/ 
	var $_sensorReplace= array( array() );
	
   /**
	* whether chars should be convertet to html-entities, switch feature on or off
	* 
	* @param bool $on true if html chars should be used
	* @see useHtmlChars
	*/
	 function setUseHtmlChars( $on = true )
	 {
	 	$this->_useHtmlChars	=	$on;
		return $on;
	 }

   /**
	* This function sets the String in order to replace emtpy values.
	* 
	* @access public
	* @return bool
	* @param string $fillString The replace-string
	* @param bool $useFillString Switch replacement on or off.
	* @see useFillString(), fillString, useFillString
	*/
	function setFillString( $fillString, $useFillString = true )
	{
		$this->_fillString		=	$fillString;
		$this->_useFillString	=	$useFillString;
		return $useFillString;
	}

   /**
	* Configure the calcUnits function in order to format numbers
	* 
	* @access	public
	* @return bool
	* @param int unitCalcDiv
	* @param mixed unitCalcDiv
	* @param bool unitCalcOn
	* @see setCalcConfig(), calcUnits(), calcDiv, calcUnits
	*/
	function setUnitCalcConfig( $on = true , $div = 1024, $units = array( 'Byte', 'kByte', 'MByte', 'GByte' ) )
	{
		if ( !is_array( $units ) & is_int( $div ) )
		{ 
			return false; 
		}
		
		$this->_useUnitCalc		= $on;
		$this->_unitCalcDiv		= $div;
		$this->_unitCalcUnits	= $units;
		return true;
	}

   /**
	* setUseUnitCalc
	* 
	* Just an alias of "setUnitCalcConfig()", in order to be compatible to other
	* configuration-functions
	* 
	* @access	public
	* @return bool
	* @param int unitCalcDiv
	* @param mixed unitCalcDiv
	* @param bool unitCalcOn
	* @see setUnitCalcConfig(), setCalcConfig(), calcUnits(), calcDiv, calcUnits
	*/
	function setUseUnitCalc( $on = 1 , $div = 1024, $units = array( 'Byte', 'kByte', 'MByte', 'GByte' ) )
	{
		return $this->setUnitCalcConfig( $on, $div, $units );
	}

	
   /**
	* recieve version of OS-kernel
	*
	* @access public
	* @return string $version 
	*/
    function getOSVersion()
    {
		$this->warnFunctionMissing( 'getOSVersion' );
		if( $this->_useFillString )
		{
			return $this->_fillString;
		}
		return null;
    }

	/**
	 * Returns system uptime
	 * Dummy function, that has to be overwritten by concrete implementation
	 * 
	 * @access public
	 * @param boolean $digit set true in order to prepend leading "0" before minutes
	 * @return array $uptime uptime uptime in days, hours and minutes
	 */
	function getUptime( $digit = false )
	{
		$this->_warnFunctionMissing( 'getUptime' );
		
		$uptime	=	array( 
					'days'	=> null,
					'hours' => null,
					'mins'	=> null,
					);
		if( $this->_useFillString )
		{
			$uptime	=	array( 
						'days'	=> $this->_fillString,
						'hours'	=> $this->_fillString,
						'mins'	=> $this->_fillString,
						);
		}
		return $uptime;
	}

   /**
	* Returns average CPU-load, like "uptime"
	* 
	* @access public
	* @return array CPU-load average
	*/
	function getLoadAvg()
	{
		$this->_warnFunctionMissing( 'getLoadAvg' );
		
		if( $this->_useFillString )
		{
			return array( $this->_fillString, $this->_fillString, $this->_fillString );
		}
		
		return array( '', '', '' );
	}
	
   /**
	* Returns number of current users
	* 
	* @access public
	* @return int $count number of users logged in
	*/
	function getNumberUser()
	{
		$this->_warnFunctionMissing( 'getNumberUser' );
		
		if( $this->_useFillString )
		{
			return $this->_fillString;
		}
		
		return null;
	}

   /**
	* Returns process information, ordered by CPU-usage
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
		$this->_warnFunctionMissing( 'getTopProcesses' );
		return array();
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
		$this->_warnFunctionMissing( 'getMem' );
		return array();
	}

   /**
	* get cpu information
	* 
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
		$this->_warnFunctionMissing( 'getCpu' );
		return array();
    }

   /**
	* Get a list of importand devices
	* 
	* @access public
	* @return array Array of importand devices
	*/
	function getPciDevs()
	{
		$this->_warnFunctionMissing( 'getPciDevs' );
		return array();
	}
	
   /**
	* Get a list of IDE-devices
	* 
	* @access public
	* @return array Array of IDE-Devices
	*/
	function getIdeDevs()
	{
		$this->_warnFunctionMissing( 'getIdeDevs' );
		return array();
	}
	
   /**
	* Get a list of SCSI-devices
	* 
	* @access public
	* @return array Array of SCSI-Devices
	*/
	function getScsiDevs() 
	{
		$this->_warnFunctionMissing( 'getScsiDevs' );
		return array();
	}

   /**
	* getMount
	* 
	* Returns mounted devices with a lot of information
	* 
	* @access public
	* @param array $hide Which mountpoints to hide (reguler-expression)
	* @return string
	*/
	function getMount( $hide = array() )
	{
		$this->_warnFunctionMissing( 'getMount' );
		return array();
	}

   /**
	* getHostName
	* 
	* Returns system hostname or name of "virtual-server"
	* 
	* @access public
	* @return string
	* @param bool virtual
	* @see getHostIp
	*/
	function getHostName( $virtual = false )
	{
		if( $virtual )
			$host	=	$_SERVER['HTTP_HOST'];
		else
			$host	=	$_SERVER['SERVER_NAME'];
		
		return $host;
	}

   /**
	* getHostIp
	* 
	* Returns system hostname or name of "virtual-server"
	* 
	* @access public
	* @return string
	* @param bool virtual
	* @see getHostName
	*/
	function getHostIp( $virtual = false )
	{
		$host	=	$this->getHostName( $virtual );
		$ip		=	gethostbyname( $host );
		
		return $ip;
	}

   /**
	* getNetDevs
	* 
	* 
	* 
	* @access public
	* @return mixed
	* @param array hide Devices to hide from return value (regular-expression)
	* @see getHostName
	*/
	function getNetDevs( $hide = array() )
	{
		$this->_warnFunctionMissing( 'getNetDevs' );
		return array();
	}

   /**
	* setSensorParam
	* 
	* Set the names of each sensor parameter. (Names are like "max", "min", "limit" etc.)
	* 
	* @access public
	* @return bool
	* @param array Names of parameters.
	* @see addSensorParam(), sensorParam, getSensor()
	*/
	function setSensorParam($param = array())
	{
		$this->_warnFunctionMissing( 'setSensorParam' );
		return true;
	}

   /**
	* addSensorParam
	* 
	* Like setSensorParam, but adds names of parameters.
	* 
	* @access public
	* @return bool
	* @param array Names of parameters.
	* @see setSensorParam(), sensorParam, getSensor()
	*/
	function addSensorParam($param = array())
	{
		$this->_warnFunctionMissing( 'addSensorParam' );
		return true;
	}

   /**
	* setSensorHideLabel
	* 
	* Set the names of sensor-label to remove from output
	* 
	* @access public
	* @return bool
	* @param array Names of labels
	* @see addSensorHideLabel(), sensorHideLabel, getSensor()
	*/
	function setSensorHideLabel($label = array())
	{
		$this->_warnFunctionMissing( 'setSensorHideLabel' );
		return true;
	}

   /**
	* Like setSensorParam, but adds names of labels.
	* 
	* @access public
	* @return bool
	* @param array Names of labels
	* @see setSensorHideLabel(), sensorHideLabel, getSensor()
	*/
	function addSensorHideLabel($label = array())
	{
		$this->_warnFunctionMissing( 'addSensorHideLabel' );
		return array();
	}

   /**
	* define replace valiues
	* 
	* Set values to replace any field use regular expressions. Each replacement is
	* controlled by three fields: The name of the field which should be parsed, the
	* regular expression to find and, of course the replace string. So the function
	* parameter is an array of replacements (an array of arrays). 
	* e.g.
	* setSensorReplace(array(array("name","/foo/","bar"), array("name","/bar/","foo")));
	* 
	* 
	* @access public
	* @return bool
	* @param mixed An array of replacements
	* @see addSensorReplace() , getSensor()
	*/
	function setSensorReplace( $replace = array( array() ) )
	{
		$this->_warnFunctionMissing( 'setSensorReplace' );
		return array();
	}

   /**
	* Like setSensorReplace, but adds replacements
	* 
	* @access public
	* @return bool
	* @param mixed An array of replacements
	* @see setSensorReplace(), getSensor()
	*/
	function addSensorReplace($replace = array(array()))
	{
		$this->_warnFunctionMissing( 'addSensorReplace' );
		return true;
	}

   /**
	* get sensor information
	* 
	* This Funktion does real work: getSensor() gets the hardware-sensor
	* information, maybe modifys and return it. The return value looks similar to
	* the returns of database-select-queries, so you can easy display data using
	* patTemplates. 
	* 
	* @access public
	* @return mixed An array containung information and data
	* @see setFillString(), useFillString(), setSensorParam(), setSensorHideLabel(), setSensorReplace()
	*/
	function getSensor() 
	{
		$this->_warnFunctionMissing( 'getSensor' );
		return array();
	}

   /**
	* A helper function to format number and units.
	* 
	* @access public
	* @param int $number
	* @param int $div
	* @param array $units
	* @return string $result 
	*/
	function unitCalc( $number = 0, $div = '', $units = array() )
	{
		if( $div == '' ) 
			$div = $this->_unitCalcDiv;
			
		if( !count($units) )
			$units = $this->_unitCalcUnits;
		
		$calc = pow( $div, ( count( $units ) - 1 ) );
		
		$unit = '';
		do
		{
			$unit = array_pop($units);
			if ( $number >= $calc ) 
			{
				$number = $number / $calc;
				break;
			}
			$calc = $calc / $div;
		} while ( $calc >= 1 );
		
		$number = sprintf( '%.2f', $number );
		$result = $number . ' ' . $unit;
		
		return $result;
	}

   /**
	* raise warning because of missing implementation of a requested information
	*
	* @access protected
	* @param string $name function name
	* @return boolean $result true on success
	*/
    function _warnFunctionMissing( $name )
    {
		patErrorManager::raiseWarning( 
				PATSYSINFO_WARNING_NOT_IMPLEMENTED,
				'Requested information not availeable',
				'Implement the function "'. $name .'" in class "'.  get_class( $this ) .'" to get rid of this message!'
			);
		
		return true;
    }
	
}
?>