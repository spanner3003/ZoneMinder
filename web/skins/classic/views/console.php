<?php
//
// ZoneMinder web console file, $Date$, $Revision$
// Copyright (C) 2001-2008 Philip Coombes
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
//

$servers = Server::find_all();
require_once('includes/Storage.php');
$storage_areas = Storage::find_all();
require_once('includes/Monitor.php');
$show_storage_areas = count($storage_areas) > 1 and canEdit( 'System' ) ? 1 : 0;
if ( $running == null ) 
  $running = daemonCheck();

$eventCounts = array(
    array(
        "title" => translate('Events'),
        "filter" => array(
            "terms" => array(
            )
        ),
        "total" => 0,
    ),
    array(
        "title" => translate('Hour'),
        "filter" => array(
            "terms" => array(
                array( "attr" => "DateTime", "op" => ">=", "val" => "-1 hour" ),
            )
        ),
        "total" => 0,
    ),
    array(
        "title" => translate('Day'),
        "filter" => array(
            "terms" => array(
                array( "attr" => "DateTime", "op" => ">=", "val" => "-1 day" ),
            )
        ),
        "total" => 0,
    ),
    array(
        "title" => translate('Week'),
        "filter" => array(
            "terms" => array(
                array( "attr" => "DateTime", "op" => ">=", "val" => "-7 day" ),
            )
        ),
        "total" => 0,
    ),
    array(
        "title" => translate('Month'),
        "filter" => array(
            "terms" => array(
                array( "attr" => "DateTime", "op" => ">=", "val" => "-1 month" ),
            )
        ),
        "total" => 0,
    ),
    array(
        "title" => translate('Archived'),
        "filter" => array(
            "terms" => array(
                array( "attr" => "Archived", "op" => "=", "val" => "1" ),
            )
        ),
        "total" => 0,
    ),
);

$displayMonitors = NULL;

# Also populates displayMonitors
$navbar = getNavBarHTML();
$zoneCount = 0;

for( $i = 0; $i < count($displayMonitors); $i += 1 ) {
  $monitor = $displayMonitors[$i];
  $monitor['zmc'] = zmcStatus( $monitor );
  $monitor['zma'] = zmaStatus( $monitor );
  $monitor['ZoneCount'] = dbFetchOne( 'select count(Id) as ZoneCount from Zones where MonitorId = ?', 'ZoneCount', array($monitor['Id']) );
  $counts = array();
  for ( $j = 0; $j < count($eventCounts); $j += 1 ) {
    $filter = addFilterTerm( $eventCounts[$j]['filter'], count($eventCounts[$j]['filter']['terms']), array( "cnj" => "and", "attr" => "MonitorId", "op" => "=", "val" => $monitor['Id'] ) );
    parseFilter( $filter );
    $counts[] = "count(if(1".$filter['sql'].",1,NULL)) as EventCount$j";
    $monitor['eventCounts'][$j]['filter'] = $filter;
  }
  $sql = "select ".join($counts,", ")." from Events as E where MonitorId = ?";
  $counts = dbFetchOne( $sql, NULL, array($monitor['Id']) );
  if ( $counts )
    $displayMonitors[$i] = $monitor = array_merge( $monitor, $counts );
  for ( $j = 0; $j < count($eventCounts); $j += 1 ) {
    $eventCounts[$j]['total'] += $monitor['EventCount'.$j];
  }
  $zoneCount += $monitor['ZoneCount'];
}

noCacheHeaders();

$eventsView = ZM_WEB_EVENTS_VIEW;
$eventsWindow = 'zm'.ucfirst(ZM_WEB_EVENTS_VIEW);
$left_columns = 3;
if ( count($servers) ) $left_columns += 1;
if ( ZM_WEB_ID_ON_CONSOLE ) $left_columns += 1;
if ( $show_storage_areas ) $left_columns += 1;

xhtmlHeaders( __FILE__, translate('Console') );
?>
<body>
    <form name="monitorForm" method="get" action="<?php echo $_SERVER['PHP_SELF'] ?>">
    <input type="hidden" name="view" value="<?php echo $view ?>"/>
    <input type="hidden" name="action" value=""/>

    <?php echo $navbar ?>

    <div class="container-fluid">
    <div id="content">
      <div id="consoleTable" class="table table-striped table-hover table-condensed">
        <div class="thead">
          <div class="tr">
<div class="MonitorInfo">
<?php if ( ZM_WEB_ID_ON_CONSOLE ) { ?>
            <div class="colId"><?php echo translate('Id') ?></div>
<?php } ?>
            <div class="colName"><?php echo translate('Name') ?></div>
            <div class="colFunction"><?php echo translate('Function') ?></div>
<?php if ( count($servers) ) { ?>
			<div class="colServer"><?php echo translate('Server') ?></div>
<?php } ?>
            <div class="colSource"><?php echo translate('Source') ?></div>
<?php if ( $show_storage_areas ) { ?>
            <div class="colStorage"><?php echo translate('Storage') ?></div>
<?php } ?>
</div>
<div class="Events">
<?php
for ( $i = 0; $i < count($eventCounts); $i++ ) {
?>
            <div class="colEvents <?php echo $eventCounts[$i]['title'] ?>"><?php echo $eventCounts[$i]['title'] ?></div>
<?php
}
?>
</div>
            <div class="colZones"><?php echo translate('Zones') ?></div>
            <div class="colMark"><?php echo translate('Mark') ?></div>
          </div>
        </div>
        <div class="tfoot">
          <div class="tr">
            <div class="colLeftButtons" colspan="<?php echo $left_columns ?>">
              <input type="button" class="btn btn-primary" value="<?php echo translate('Refresh') ?>" onclick="location.reload(true);"/>
              <input type="button" class="btn btn-primary" name="addBtn" value="<?php echo translate('AddNewMonitor') ?>" onclick="addMonitor( this )"/>
              <!-- <?php echo makePopupButton( '?view=monitor', 'zmMonitor0', 'monitor', translate('AddNewMonitor'), (canEdit( 'Monitors' ) && !$user['MonitorIds']) ) ?> -->
              <?php echo makePopupButton( '?view=filter&amp;filter[terms][0][attr]=DateTime&amp;filter[terms][0][op]=%3c&amp;filter[terms][0][val]=now', 'zmFilter', 'filter', translate('Filters'), canView( 'Events' ) ) ?>
            </div>
			<div class="Events">
<?php
for ( $i = 0; $i < count($eventCounts); $i++ )
{
    parseFilter( $eventCounts[$i]['filter'] );
?>
            <div class="colEvents <?php echo $eventCounts[$i]['title'] ?>"><?php echo makePopupLink( '?view='.$eventsView.'&amp;page=1'.$eventCounts[$i]['filter']['query'], $eventsWindow, $eventsView, $eventCounts[$i]['total'], canView( 'Events' ) ) ?></div>
<?php
}
?>
			</div>
            <div class="colZones"><?php echo $zoneCount ?></div>
            <div class="colRightButtons"><input class="btn btn-primary" type="button" name="editBtn" value="<?php echo translate('Edit') ?>" onclick="editMonitor( this )" disabled="disabled"/></div>
            <div><input class="btn btn-danger" type="button" name="deleteBtn" value="<?php echo translate('Delete') ?>" onclick="deleteMonitor( this )" disabled="disabled"/></div>
          </div>
        </div>
        <div class="tbody">
<?php
for( $monitor_i = 0; $monitor_i < count($displayMonitors); $monitor_i += 1 ) {
  $monitor = $displayMonitors[$monitor_i];
?>
          <div class="tr" title="<?php echo $monitor['Id'] ?>">
<?php
    if ( !$monitor['zmc'] )
        $dclass = "errorText";
    else
    {
    // https://github.com/ZoneMinder/ZoneMinder/issues/1082
        if ( !$monitor['zma'] && $monitor['Function']!='Monitor' )
            $dclass = "warnText";
        else
            $dclass = "infoText";
    }
    if ( $monitor['Function'] == 'None' )
        $fclass = "errorText";
    //elseif ( $monitor['Function'] == 'Monitor' )
     //   $fclass = "warnText";
    else
        $fclass = "infoText";
    if ( !$monitor['Enabled'] )
        $fclass .= " disabledText";
    $scale = max( reScale( SCALE_BASE, $monitor['DefaultScale'], ZM_WEB_DEFAULT_SCALE ), SCALE_BASE );
?>
<div class="MonitorInfo">
  <?php if ( ZM_WEB_ID_ON_CONSOLE ) { ?>
            <div class="colId"><?php echo makePopupLink( '?view=watch&amp;mid='.$monitor['Id'], 'zmWatch'.$monitor['Id'], array( 'watch', reScale( $monitor['Width'], $scale ), reScale( $monitor['Height'], $scale ) ), $monitor['Id'], $running && ($monitor['Function'] != 'None') && canView( 'Stream' ) ) ?></div>
  <?php } ?>
            <div class="colName"><?php echo makePopupLink( '?view=watch&amp;mid='.$monitor['Id'], 'zmWatch'.$monitor['Id'], array( 'watch', reScale( $monitor['Width'], $scale ), reScale( $monitor['Height'], $scale ) ), $monitor['Name'], $running && ($monitor['Function'] != 'None') && canView( 'Stream' ) ) ?></div>
            <div class="colFunction"><?php echo makePopupLink( '?view=function&amp;mid='.$monitor['Id'], 'zmFunction', 'function', '<span class="'.$fclass.'">'.translate('Fn'.$monitor['Function']).( empty($monitor['Enabled']) ? ', disabled' : '' ) .'</span>', canEdit( 'Monitors' ) ) ?></div>
<?php if ( count($servers) ) { ?>
			<div class="colServer"><?php 
$Server = new Server( $monitor['ServerId'] );
echo $Server->Name();
 ?></div>
<?php } ?>
<?php if ( $monitor['Type'] == "Local" ) { ?>
            <div class="colSource"><?php echo makePopupLink( '?view=monitor&amp;mid='.$monitor['Id'], 'zmMonitor'.$monitor['Id'], 'monitor', '<span class="'.$dclass.'">'.$monitor['Device'].' ('.$monitor['Channel'].')</span>', canEdit( 'Monitors' ) ) ?></div>
<?php } elseif ( $monitor['Type'] == "Remote" ) { ?>
            <div class="colSource"><?php echo makePopupLink( '?view=monitor&amp;mid='.$monitor['Id'], 'zmMonitor'.$monitor['Id'], 'monitor', '<span class="'.$dclass.'">'.preg_replace( '/^.*@/', '', $monitor['Host'] ).'</span>', canEdit( 'Monitors' ) ) ?></div>
<?php } elseif ( $monitor['Type'] == "File" ) { ?>
            <div class="colSource"><?php echo makePopupLink( '?view=monitor&amp;mid='.$monitor['Id'], 'zmMonitor'.$monitor['Id'], 'monitor', '<span class="'.$dclass.'">'.preg_replace( '/^.*\//', '', $monitor['Path'] ).'</span>', canEdit( 'Monitors' ) ) ?></div>
<?php } elseif ( $monitor['Type'] == "Ffmpeg" || $monitor['Type'] == "Libvlc" ) {
    $domain = parse_url( $monitor['Path'], PHP_URL_HOST );
    $shortpath = $domain ? $domain : preg_replace( '/^.*\//', '', $monitor['Path'] );
    if ( $shortpath == '' ) {
        $shortpath = 'Monitor ' . $monitor['Id'];
    }
?>
            <div class="colSource"><?php echo makePopupLink( '?view=monitor&amp;mid='.$monitor['Id'], 'zmMonitor'.$monitor['Id'], 'monitor', '<span class="'.$dclass.'">'.$shortpath.'</span>', canEdit( 'Monitors' ) ) ?></div>
<?php } elseif ( $monitor['Type'] == "cURL" ) { ?>
            <div class="colSource"><?php echo makePopupLink( '?view=monitor&amp;mid='.$monitor['Id'], 'zmMonitor'.$monitor['Id'], 'monitor', '<span class="'.$dclass.'">'.preg_replace( '/^.*\//', '', $monitor['Path'] ).'</span>', canEdit( 'Monitors' ) ) ?></div>
<?php } else { ?>
            <div class="colSource">&nbsp;</div>
<?php } ?>
<?php if ( $show_storage_areas ) { ?>
			<div class="colStorage"><?php $Storage = new Storage( $monitor['StorageId'] ); echo $Storage->Name(); ?></div>
<?php } ?>
	</div><div class="Events">
<?php
    for ( $i = 0; $i < count($eventCounts); $i++ )
    {
?>
            <div class="colEvents <?php echo $eventCounts[$i]['title'] ?>"><?php echo makePopupLink( '?view='.$eventsView.'&amp;page=1'.$monitor['eventCounts'][$i]['filter']['query'], $eventsWindow, $eventsView, $monitor['EventCount'.$i], canView( 'Events' ) ) ?></div>
<?php
    }
?>
			</div>
            <div class="colZones"><?php echo makePopupLink( '?view=zones&amp;mid='.$monitor['Id'], 'zmZones', array( 'zones', $monitor['Width'], $monitor['Height'] ), $monitor['ZoneCount'], $running && canView( 'Monitors' ) ) ?></div>
            <div class="colMark"><input type="checkbox" name="markMids[]" value="<?php echo $monitor['Id'] ?>" onclick="setButtonStates( this );"<?php if ( !canEdit( 'Monitors' ) ) { ?> disabled="disabled"<?php } ?>/></div>
          </div>
<?php
} # end for each monitor
?>
        </div>
      </div>
    </div>


    </form>
<?php
if ( canEdit('System') ) {
  include("skins/$skin/views/state.php");
}
?>
</body>
</html>
