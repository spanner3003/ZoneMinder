//var requestQueue = new Request.Queue( { concurrent: 2 } );

function Monitor( monitorData ) {
  this.id = monitorData.id;
  this.connKey = monitorData.connKey;
  this.server_url = monitorData.server_url;
  this.status = null;
  this.alarmState = STATE_IDLE;
  this.lastAlarmState = STATE_IDLE;
  this.streamCmdParms = "view=request&request=stream&connkey="+this.connKey;
  this.streamCmdTimer = null;

  this.start = function( delay ) {
    this.streamCmdTimer = setTimeout( delay, this );
  };

  this.setStateClass = function( element, stateClass ) {
    if ( !element.hasClass( stateClass ) ) {
      if ( stateClass != 'alarm' )
        element.removeClass( 'alarm' );
      if ( stateClass != 'alert' )
        element.removeClass( 'alert' );
      if ( stateClass != 'idle' )
        element.removeClass( 'idle' );
      element.addClass( stateClass );
    }
  };

  this.getStreamCmdResponse = function( respObj, respText ) {
    if ( this.streamCmdTimer )
      this.streamCmdTimer = clearTimeout( this.streamCmdTimer );

    var stream = $j( "#liveStream"+this.id );
    if ( respObj.result == 'Ok' ) {
      this.status = respObj.status;
      this.alarmState = this.status.state;

      var stateClass = '';
      if ( this.alarmState == STATE_ALARM )
        stateClass = 'alarm';
      else if ( this.alarmState == STATE_ALERT )
        stateClass = 'alert';
      else
        stateClass = 'idle';

      if ( !COMPACT_MONTAGE ) {
        $('fpsValue'+this.id).set( 'text', this.status.fps );
        $('stateValue'+this.id).set( 'text', stateStrings[this.alarmState] );
        this.setStateClass( $('monitorState'+this.id), stateClass );
      }
      this.setStateClass( $('monitor'+this.id), stateClass );

      /*Stream could be an applet so can't use moo tools*/
      stream.className = stateClass;

      var isAlarmed = ( this.alarmState == STATE_ALARM || this.alarmState == STATE_ALERT );
      var wasAlarmed = ( this.lastAlarmState == STATE_ALARM || this.lastAlarmState == STATE_ALERT );

      var newAlarm = ( isAlarmed && !wasAlarmed );
      var oldAlarm = ( !isAlarmed && wasAlarmed );

      if ( newAlarm ) {
        if ( false && SOUND_ON_ALARM ) {
          // Enable the alarm sound
          $j('#alarmSound').removeClass( 'hidden' );
        }
        if ( POPUP_ON_ALARM ) {
          windowToFront();
        }
      }
      if ( false && SOUND_ON_ALARM ) {
        if ( oldAlarm ) {
          // Disable alarm sound
          $j('#alarmSound').addClass( 'hidden' );
        }
      }
      if ( this.status.auth ) {
        // Try to reload the image stream.
        if ( stream )
          stream.attr( 'src', stream.attr('src').replace( /auth=\w+/i, 'auth='+this.status.auth ) );
        console.log("Changed auth to " + this.status.auth );
      } // end if haev a new auth hash
    } else {
      console.error( respObj.message );
      // Try to reload the image stream.
      if ( stream )
        stream.attr('src', stream.attr( 'src').replace(/rand=\d+/i, 'rand='+Math.floor((Math.random() * 1000000) )) );
    } // end if ok
    var streamCmdTimeout = statusRefreshTimeout;
    if ( this.alarmState == STATE_ALARM || this.alarmState == STATE_ALERT )
      streamCmdTimeout = streamCmdTimeout/5;
    this.streamCmdTimer = setTimeout( this.streamCmdQuery, this );
    this.lastAlarmState = this.alarmState;
  }; // this.getStreamCmdResponse

  this.streamCmdQuery = function( resent ) {
    //if ( resent )
    //console.log( this.connKey+": Resending" );
    //this.streamCmdReq.cancel();
    //this.streamCmdReq.send( this.streamCmdParms+"&command="+CMD_QUERY );
    if ( this.streamCmdReq )
      this.streamCmdReq.abort();
    this.streamCmdReq = $j.getJSON( this.server_url, this.streamCmdParms+"&command="+CMD_QUERY, this.getStreamCmdResponse );
  };

  //this.streamCmdReq = new Request.JSON( { url: this.server_url, method: 'get', timeout: AJAX_TIMEOUT, onSuccess: this.getStreamCmdResponse.bind( this ), onTimeout: this.streamCmdQuery.bind( this, true ), link: 'cancel' } );

  //requestQueue.addRequest( 'cmdReq'+this.id, this.streamCmdReq );
}

function selectLayout( element ) {
  var layout = $j(element).val();
  var cssFile = skinPath+'/css/'+Cookies.get('zmCSS')+'/views/'+layout;

  var css = $j('#dynamicStyles');
  css.remove();

  css = $j( '<link/>' );
  css.attr( 'rel', 'stylesheet' );
  css.attr( 'type', 'text/css' );
  css.attr( 'id', 'dynamicStyles' );

  css.attr( 'href', cssFile );
  $j('head').append(css);
  Cookies.set( 'zmMontageLayout', layout );
  for ( var x = 0; x < monitors.length; x++ ) {
    var monitor = monitors[x];
    var streamImg = $j('#liveStream'+monitor.id );
    if ( streamImg ) {
      var src = streamImg.attr('src');
      src = src.replace(/rand=\d+/i, 'rand='+Math.floor((Math.random() * 1000000) ));
      src = src.replace(/scale=[\.\d]+/i, '' );
      src = src.replace(/width=[\.\d]+/i, '' );
      src = src.replace(/height=[\.\d]+/i, '' );
      streamImg.attr('src', src);
      streamImg.css('width', '100%' );
      streamImg.css('height', '');
    } else {
      console.log("No stream img found for liveStream"+monitor.id );
    }
  }
  $j('#scale').val('');
  Cookies.set( 'zmMontageScale', '' );
  Cookies.set( 'zmMontageWidth', width );
}

function changeWidth() {
  var width = $j('#width').val();

  for ( var x = 0; x < monitors.length; x++ ) {
    var monitor = monitors[x];
    var streamImg = $j('#liveStream'+monitor.id );
    if ( streamImg ) {
      var src = streamImg.attr('src');
      src = src.replace(/rand=\d+/i, 'rand='+Math.floor((Math.random() * 1000000) ));
      streamImg.attr('src', src);
      streamImg.css('width', width + 'px' );
      streamImg.css('height', '');
    } else {
      console.log("No stream img found for liveStream"+monitor.id );
    }
  }
  $j('#scale').val('');
  Cookies.set( 'zmMontageScale', '' );
  Cookies.set( 'zmMontageWidth', width );
} // end function changeWidth()

function changeHeight() {
  var height = $j('#height').val();

  for ( var x = 0; x < monitors.length; x++ ) {
    var monitor = monitors[x];
    /*Stream could be an applet so can't use moo tools*/
    var streamImg = $j('#liveStream'+monitor.id );
    if ( streamImg ) {
      streamImg.attr('src', streamImg.attr('src').replace(/rand=\d+/i, 'rand='+Math.floor((Math.random() * 1000000) )) );
      streamImg.css('height', height + 'px' );
    }
  }
  $j('#scale').val('' );
  Cookies.set( 'zmMontageHeight', height );
  Cookies.set( 'zmMontageScale', '' );
} // end function changeHeight()

function changeScale() {
  var scale = $j('#scale').val();

  for ( var x = 0; x < monitors.length; x++ ) {
    var monitor = monitors[x];
    var newWidth = ( monitorData[x].width * scale ) / SCALE_BASE;
    var newHeight = ( monitorData[x].height * scale ) / SCALE_BASE;
    /*Stream could be an applet so can't use moo tools*/
    var streamImg = $j( '#liveStream'+monitor.id );
    if ( streamImg ) {
      var src = streamImg.attr( 'src' );
      //streamImg.src='';

      streamImg.css( 'width', newWidth + 'px' );
      streamImg.css( 'height', newHeight + 'px' );
      //src = src.replace(/rand=\d+/i,'rand='+Math.floor((Math.random() * 1000000) ));
      src = src.replace( /scale=[\.\d]+/i, 'scale='+ scale );
      src = src.replace( /width=[\.\d]+/i, 'width='+newWidth );
      src = src.replace( /height=[\.\d]+/i, 'height='+newHeight );
      streamImg.attr( 'src', src );
    }
  }
  $j('#width').val('');
  $j('#height').val('');
  Cookies.set( 'zmMontageScale', scale );
  Cookies.set( 'zmMontageWidth', '' );
  Cookies.set( 'zmMontageHeight', '' );
} // end function changeScale


var monitors = new Array();
function initPage() {
  for ( var i = 0; i < monitorData.length; i++ ) {
    monitors[i] = new Monitor( monitorData[i] );
    var delay = Math.round( (Math.random()+0.5)*statusRefreshTimeout );
    monitors[i].start( delay );
  }
  selectLayout( $j('#layout') );
}

// Kick everything off
$j( initPage );
