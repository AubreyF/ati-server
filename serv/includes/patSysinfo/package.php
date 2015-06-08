<?php
/**
 * package.xml generation file for patForms
 *
 * $Id: package.php 8 2004-03-02 23:35:37Z gerd $
 *
 * @author		Stephan Schmidt <schst@php-tools.net>
 * @author		gERD Schaufelberger <gerds@php-tools.net>
 * @package		pat
 * @subpackage	patTools
 */

/**
 * uses the great PEAR_PackageFileManager
 * praise Greg Beaver!!
 */
    require_once 'PEAR/PackageFileManager.php';
	
    $packagexml = new PEAR_PackageFileManager;
	
    $e = $packagexml->setOptions(
                                array(
                                        'baseinstalldir' => 'pat',
                                        'version' => '2.0',
                                        'packagedirectory' => 'C:\www\pat\patSysinfo',
                                        'state' => 'alpha',
                                        'filelistgenerator' => 'cvs', // generate from cvs, use file for directory
                                        'notes' => 'first public release',
                                        'ignore' => array('package.xml', '.cvsignore', 'package.php' ),
                                        'installexceptions' => array(), // baseinstalldir ="/" for phpdoc
                                        'dir_roles' => array('examples' => 'doc', 'docs' => 'doc' ),
										'file_roles' => array(),
                                        'exceptions' => array()
                                      )
                                 );
    if (PEAR::isError($e)) {
        echo $e->getMessage();
        die();
    }

    // note use of  - this is VERY important
    if (isset($_GET['make']) || $_SERVER['argv'][2] == 'make') {
        $e = $packagexml->writePackageFile();
    } else {
        $e = $packagexml->debugPackageFile();
    }
    if (PEAR::isError($e)) {
    echo $e->getMessage();
    die();
}
?>