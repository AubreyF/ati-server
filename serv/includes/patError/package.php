<?php
/**
 * package.xml generation file for patForms
 *
 * $Id: package.php 41 2005-09-19 14:43:27Z argh $
 *
 * @author		Stephan Schmidt <schst@php-tools.net>
 * @author		gERD Schaufelberger <gerd@php-tools.net>
 * @package		patError
 * @subpackage	Tools
 */

/**
 * uses PackageFileManager
 */ 
require_once 'PEAR/PackageFileManager.php';

/**
 * current version
 */
$version = '1.1.0';

/**
 * current state
 */
$state = 'stable';

/**
 * release notes
 */
$notes = <<<EOT
Changes since 1.0.2:
- allow strings in error codes (gERD)
- fixed pushExpect() and popExpect() (schst)
- fix PHP5 compatibility (argh)
- added new handler to throw exceptions (schst)
- Fixed return values of methods working with references for compatibility with the new PHP5.1 references behavior (every return value/value passed as reference has to be a variable) (argh)
EOT;

/**
 * package description
 */
$description = <<<EOT
patError - simple and powerful error managemet system. Inspired by error handling of PEAR.
EOT;

$package = new PEAR_PackageFileManager();


$result = $package->setOptions(array(
    'package'           => 'patError',
    'summary'           => 'Simple and powerful error management package.',
    'description'       => $description,
    'version'           => $version,
    'state'             => $state,
    'license'           => 'LGPL',
    'filelistgenerator' => 'cvs',
    'ignore'            => array( 'package.php', 'autopackage.php', 'package.xml', 'package2.xml', '.cvsignore' ),
    'notes'             => $notes,
    'simpleoutput'      => true,
    'baseinstalldir'    => 'pat',
    'packagedirectory'  => './',
    'dir_roles'         => array(
								 'docs' => 'doc',
                                 'examples' => 'doc',
                                 'tests' => 'test',
                                 )
    ));
if (PEAR::isError($result)) {
    echo $result->getMessage();
    die();
}


$package->addMaintainer('schst', 'lead', 'Stephan Schmidt', 'schst@php-tools.net');
$package->addMaintainer('gerd', 'lead', 'Gerd Schaufelberger', 'gerd@php-tools.net');
$package->addMaintainer('argh', 'developer', 'Sebastian Mordziol', 'argh@php-tools.net');

$package->addDependency('php', '4.3.0', 'ge', 'php', false);

if (isset($_GET['make']) || (isset($_SERVER['argv'][1]) && $_SERVER['argv'][1] == 'make')) {
    $result = $package->writePackageFile();
} else {
    $result = $package->debugPackageFile();
}

if (PEAR::isError($result)) {
    echo $result->getMessage();
    die();
}
?>