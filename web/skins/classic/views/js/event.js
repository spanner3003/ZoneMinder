var vid = null;

function setButtonState( element, butClass )
{
  if ( element ) {
    element.className = butClass;
    element.disabled = (butClass != 'inactive');
  }
}

function changeScale() {
  var scale = $j('#scale').get('value');
  var baseWidth = eventData.Width;
  var baseHeight = eventData.Height;
  var newWidth = ( baseWidth * scale ) / SCALE_BASE;
  var newHeight = ( baseHeight * scale ) / SCALE_BASE;

	if ( vid ) {
    // Using video.js
		vid.width = newWidth;
		vid.height = newHeight;
	} else {
    streamScale( scale );
		var streamImg = $j('#evtStream');
		streamImg.style.width = newWidth + "px";
		streamImg.style.height = newHeight + "px";
	}
  Cookie.write( 'zmEventScale'+eventData.MonitorId, scale, { duration: 10*365 } );
}

function changeReplayMode() {
    var replayMode = $j('#replayMode').get('value');

    Cookie.write( 'replayMode', replayMode, { duration: 10*365 })

    refreshWindow();
}

var streamParms = "view=request&request=stream&connkey="+connKey;
var streamCmdTimer = null;

var streamStatus = null;
var lastEventId = 0;

function streamReq( command ) {
    $j.getJSON( thisUrl, streamParms+'&'+command, getCmdResponse );
}

function getCmdResponse( respObj, respText ) {
    if ( checkStreamForErrors( "getCmdResponse" ,respObj ) )
        return;

    if ( streamCmdTimer )
        streamCmdTimer = clearTimeout( streamCmdTimer );

    streamStatus = respObj.status;

    var eventId = streamStatus.event;
    if ( eventId != lastEventId ) {
        eventQuery( eventId );
        lastEventId = eventId;
    }
    if ( streamStatus.paused == true ) {
        $j('#modeValue').html("Paused" );
        $j('#rate').addClass( 'hidden' );
        streamPause( false );
    } else {
        $j('#modeValue').html( "Replay" );
        $j('#rateValue').html( streamStatus.rate );
        $j('#rate').removeClass( 'hidden' );
        streamPlay( false );
    }
    $j('#progressValue').html( secsToTime( parseInt(streamStatus.progress) ) );
    $j('#zoomValue').html( streamStatus.zoom );
    if ( streamStatus.zoom == "1.0" )
        setButtonState( $j('#zoomOutBtn'), 'unavail' );
    else
        setButtonState( $j('#zoomOutBtn'), 'inactive' );

    updateProgressBar();

    if ( streamStatus.auth ) {
      // Try to reload the image stream.
      var streamImg = $j('#evtStream');
      if ( streamImg )
        streamImg.src = streamImg.src.replace( /auth=\w+/i, 'auth='+streamStatus.auth );
    } // end if haev a new auth hash

    streamCmdTimer = streamQuery.delay( streamTimeout );
}


function streamPause( action )
{
    setButtonState( $j('#pauseBtn'), 'active' );
    setButtonState( $j('#playBtn'), 'inactive' );
    setButtonState( $j('#fastFwdBtn'), 'unavail' );
    setButtonState( $j('#slowFwdBtn'), 'inactive' );
    setButtonState( $j('#slowRevBtn'), 'inactive' );
    setButtonState( $j('#fastRevBtn'), 'unavail' );
    streamReq( "command="+CMD_PAUSE );
}

function streamPlay( action ) {
    setButtonState( $j('#pauseBtn'), 'inactive' );
    if (streamStatus)
        setButtonState( $j('#playBtn'), streamStatus.rate==1?'active':'inactive' );
    setButtonState( $j('#fastFwdBtn'), 'inactive' );
    setButtonState( $j('#slowFwdBtn'), 'unavail' );
    setButtonState( $j('#slowRevBtn'), 'unavail' );
    setButtonState( $j('#fastRevBtn'), 'inactive' );
    streamReq( "command="+CMD_PLAY );
}

function streamFastFwd( action ) {
    setButtonState( $j('#pauseBtn'), 'inactive' );
    setButtonState( $j('#playBtn'), 'inactive' );
    setButtonState( $j('#fastFwdBtn'), 'inactive' );
    setButtonState( $j('#slowFwdBtn'), 'unavail' );
    setButtonState( $j('#slowRevBtn'), 'unavail' );
    setButtonState( $j('#fastRevBtn'), 'inactive' );
    streamReq( "command="+CMD_FASTFWD );
}

function streamSlowFwd( action ) {
    setButtonState( $j('#pauseBtn'), 'inactive' );
    setButtonState( $j('#playBtn'), 'inactive' );
    setButtonState( $j('#fastFwdBtn'), 'unavail' );
    setButtonState( $j('#slowFwdBtn'), 'active' );
    setButtonState( $j('#slowRevBtn'), 'inactive' );
    setButtonState( $j('#fastRevBtn'), 'unavail' );
    streamReq( "command="+CMD_SLOWFWD );
    setButtonState( $j('#pauseBtn'), 'inactive' );
    setButtonState( $j('#slowFwdBtn'), 'inactive' );
}

function streamSlowRev( action ) {
    setButtonState( $j('#pauseBtn'), 'inactive' );
    setButtonState( $j('#playBtn'), 'inactive' );
    setButtonState( $j('#fastFwdBtn'), 'unavail' );
    setButtonState( $j('#slowFwdBtn'), 'inactive' );
    setButtonState( $j('#slowRevBtn'), 'active' );
    setButtonState( $j('#fastRevBtn'), 'unavail' );
    streamReq( "command="+CMD_SLOWREV );
    setButtonState( $j('#pauseBtn'), 'inactive' );
    setButtonState( $j('#slowRevBtn'), 'inactive' );
}

function streamFastRev( action ) {
    setButtonState( $j('#pauseBtn'), 'inactive' );
    setButtonState( $j('#playBtn'), 'inactive' );
    setButtonState( $j('#fastFwdBtn'), 'inactive' );
    setButtonState( $j('#slowFwdBtn'), 'unavail' );
    setButtonState( $j('#slowRevBtn'), 'unavail' );
    setButtonState( $j('#fastRevBtn'), 'inactive' );
    streamReq( "command="+CMD_FASTREV );
}

function streamPrev( action ) {
	if ( action )
    streamReq( "command="+CMD_PREV );
}

function streamNext( action ) {
	if ( action )
    streamReq( "command="+CMD_NEXT );
}


function streamZoomIn( x, y ) {
    streamReq( "command="+CMD_ZOOMIN+"&x="+x+"&y="+y );
}

function streamZoomOut() {
    streamReq( "command="+CMD_ZOOMOUT );
}

function streamScale( scale ) {
    streamReq( "command="+CMD_SCALE+"&scale="+scale );
}

function streamPan( x, y ) {
    streamReq( "command="+CMD_PAN+"&x="+x+"&y="+y );
}

function streamSeek( offset ) {
    streamReq( "command="+CMD_SEEK+"&offset="+offset );
}

function streamQuery() {       
    streamReq( "command="+CMD_QUERY );
}       

var slider = null;
var scroll = null;

function getEventResponse( respObj, respText )
{
    if ( checkStreamForErrors( "getEventResponse", respObj ) )
        return;

    eventData = respObj.event;
    var eventStills = $j('#eventStills');
  
    if ( eventStills && !$j('#eventStills').hasClass( 'hidden' ) && currEventId != eventData.Id )
        resetEventStills();
    currEventId = eventData.Id;

    $j('#dataId').html( eventData.Id );
    if ( eventData.Notes ) {
        $j('#dataCause').attr( 'title', eventData.Notes );
    } else {
        $j('#dataCause').attr( 'title', causeString );
    }
    $j('#dataCause').html( eventData.Cause );
    $j('#dataTime').html(eventData.StartTime );
    $j('#dataDuration').html(eventData.Length );
    $j('#dataFrames').html(eventData.Frames+"/"+eventData.AlarmFrames );
    $j('#dataScore').html(eventData.TotScore+"/"+eventData.AvgScore+"/"+eventData.MaxScore );
    $j('#eventName').setProperty( 'value', eventData.Name );

    if ( canEditEvents ) {
        if ( parseInt(eventData.Archived) ) {
            $j('#archiveEvent').addClass( 'hidden' );
            $j('#unarchiveEvent').removeClass( 'hidden' );
        } else {
            $j('#archiveEvent').removeClass( 'hidden' );
            $j('#unarchiveEvent').addClass( 'hidden' );
        }
    }
    //var eventImg = $j('#eventImage');
    //eventImg.setStyles( { 'width': eventData.width, 'height': eventData.height } );
    drawProgressBar();
    nearEventsQuery( eventData.Id );
}


function eventQuery( eventId ) {
  var eventParms = "view=request&request=status&entity=event&id="+eventId;
  $j.getJSON( thisUrl, eventParms, getEventResponse );
}

var prevEventId = 0;
var nextEventId = 0;
var PrevEventDefVideoPath = "";
var NextEventDefVideoPath = "";

function getNearEventsResponse( respObj, respText ) {
    if ( checkStreamForErrors( "getNearEventsResponse", respObj ) )
        return;
    prevEventId = respObj.nearevents.PrevEventId;
    nextEventId = respObj.nearevents.NextEventId;
    PrevEventDefVideoPath = respObj.nearevents.PrevEventDefVideoPath;
    NextEventDefVideoPath = respObj.nearevents.NextEventDefVideoPath;

    var prevEventBtn = $j('#prevEventBtn');
    if ( prevEventBtn ) prevEventBtn.disabled = !prevEventId;
    var nextEventBtn = $j('#nextEventBtn');
    if ( nextEventBtn ) nextEventBtn.disabled = !nextEventId;
}

function nearEventsQuery( eventId ) {
  var parms = "view=request&request=status&entity=nearevents&id="+eventId;
  $j.getJSON( thisUrl, parms, getNearEventsResponse );
}

var frameBatch = 40;

function loadEventThumb( event, frame, loadImage ) {
    var thumbImg = $j('#eventThumb'+frame.FrameId);
    if ( !thumbImg ) {
        console.error( "No holder found for frame "+frame.FrameId );
        return;
    }
    var img = new Asset.image( imagePrefix+frame.Image.imagePath,
        {
            'onload': ( function( loadImage )
                {
                    thumbImg.setProperty( 'src', img.getProperty( 'src' ) );
                    thumbImg.removeClass( 'placeholder' );
                    thumbImg.setProperty( 'class', frame.Type=='Alarm'?'alarm':'normal' );
                    thumbImg.setProperty( 'title', frame.FrameId+' / '+((frame.Type=='Alarm')?frame.Score:0) );
                    thumbImg.removeEvents( 'click' );
                    thumbImg.bind( 'click', function() { locateImage( frame.FrameId, true ); } );
                    if ( loadImage )
                        loadEventImage( event, frame );
                } ).pass( loadImage )
        }
    );
}

function updateStillsSizes( noDelay ) {
    var containerDim = $j('#eventThumbs').getSize();

    var containerWidth = containerDim.x;
    var containerHeight = containerDim.y;
    var popupWidth = parseInt($j('#eventImage').getStyle( 'width' ));
    var popupHeight = parseInt($j('#eventImage').getStyle( 'height' ));

    var left = (containerWidth - popupWidth)/2;
    if ( left < 0 ) left = 0;
    var top = (containerHeight - popupHeight)/2;
    if ( top < 0 ) top = 0;
    if ( popupHeight == 0 && !noDelay ) // image not yet loaded lets give it another second
    {
        updateStillsSizes.pass( true ).delay( 50 );
        return;
    }
    $j('#eventImagePanel').setStyles( {
        'left': left,
        'top': top
    } );
}

function loadEventImage( event, frame )
{
    console.debug( "Loading "+event.Id+"/"+frame.FrameId );
    var eventImg = $j('#eventImage');
    var thumbImg = $j('#eventThumb'+frame.FrameId);
    if ( eventImg.getProperty( 'src' ) != thumbImg.getProperty( 'src' ) )
    {
        var eventImagePanel = $j('#eventImagePanel');

        if ( eventImagePanel.getStyle( 'display' ) != 'none' )
        {
            var lastThumbImg = $j('#eventThumb'+eventImg.getProperty( 'alt' ));
            lastThumbImg.removeClass('selected');
            lastThumbImg.setOpacity( 1.0 );
        }

        eventImg.setProperties( {
            'class': frame.Type=='Alarm'?'alarm':'normal',
            'src': thumbImg.getProperty( 'src' ),
            'title': thumbImg.getProperty( 'title' ),
            'alt': thumbImg.getProperty( 'alt' ),
            'width': event.Width,
            'height': event.Height
        } );
        $j('#eventImageBar').setStyle( 'width', event.Width );
        if ( frame.Type=='Alarm' )
            $j('#eventImageStats').removeClass( 'hidden' );
        else
            $j('#eventImageStats').addClass( 'hidden' );
        thumbImg.addClass( 'selected' );
        thumbImg.setOpacity( 0.5 );

        if ( eventImagePanel.getStyle( 'display' ) == 'none' )
        {
            eventImagePanel.setOpacity( 0 );
            updateStillsSizes();
            eventImagePanel.setStyle( 'display', 'block' );
            new Fx.Tween( eventImagePanel, { duration: 500, transition: Fx.Transitions.Sine } ).start( 'opacity', 0, 1 );
        }

        $j('#eventImageNo').html(frame.FrameId );
        $j('#prevImageBtn').disabled = (frame.FrameId==1);
        $j('#nextImageBtn').disabled = (frame.FrameId==event.Frames);
    }
}

function hideEventImageComplete() {
  var eventImg = $j('#eventImage');
  var thumbImg = $j('#eventThumb'+$j('#eventImage').getProperty( 'alt' ));
  if ( thumbImg ) {
    thumbImg.removeClass('selected');
    thumbImg.setOpacity( 1.0 );
  } else {
    console.log("Unable to find eventThumb at " + 'eventThumb'+eventImg.getProperty( 'alt' ) );
  }
  $j('#prevImageBtn').disabled = true;
  $j('#nextImageBtn').disabled = true;
  $j('#eventImagePanel').setStyle( 'display', 'none' );
  $j('#eventImageStats').addClass( 'hidden' );
}

function hideEventImage() {
    if ( $j('#eventImagePanel').getStyle( 'display' ) != 'none' )
        new Fx.Tween( $j('#eventImagePanel'), { duration: 500, transition: Fx.Transitions.Sine, onComplete: hideEventImageComplete } ).start( 'opacity', 1, 0 );
}

function resetEventStills()
{
    hideEventImage();
    $j('#eventThumbs').empty();
    if ( true || !slider ) {
        slider = new Slider( $j('#thumbsSlider'), $j('#thumbsKnob'), {
            /*steps: eventData.Frames,*/
            onChange: function( step )
            {
                if ( !step )
                    step = 0;
                var fid = parseInt((step * eventData.Frames)/this.options.steps);
                if ( fid < 1 )
                    fid = 1;
                else if ( fid > eventData.Frames )
                    fid = eventData.Frames;
                checkFrames( eventData.Id, fid );
                scroll.toElement( 'eventThumb'+fid );
            }
        } ).set( 0 );
    }
    if ( $j('#eventThumbs').getStyle( 'height' ).match( /^\d+/ ) < (parseInt(eventData.Height)+80) )
        $j('#eventThumbs').setStyle( 'height', (parseInt(eventData.Height)+80)+'px' );
}

function getFrameResponse( respObj, respText )
{
    if ( checkStreamForErrors( "getFrameResponse", respObj ) )
        return;

    var frame = respObj.frameimage;

    if ( !eventData )
    {
        console.error( "No event "+frame.EventId+" found" );
        return;
    }

    if ( !eventData['frames'] )
        eventData['frames'] = new Object();

    eventData['frames'][frame.FrameId] = frame;
    
    loadEventThumb( eventData, frame, respObj.loopback=="true" );
}

function frameQuery( eventId, frameId, loadImage ) {
    var parms = "view=request&request=status&entity=frameimage&id[0]="+eventId+"&id[1]="+frameId+"&loopback="+loadImage;
    $j.getJSON( thisUrl, parms, getFrameResponse );
}

var currFrameId = null;

function checkFrames( eventId, frameId, loadImage )
{
    if ( !eventData )
    {
        console.error( "No event "+eventId+" found" );
        return;
    }

    if ( !eventData['frames'] )
        eventData['frames'] = new Object();

    currFrameId = frameId;

    var loFid = frameId - frameBatch/2;
    if ( loFid < 1 )
        loFid = 1;
    var hiFid = loFid + (frameBatch-1);
    if ( hiFid > eventData.Frames )
        hiFid = eventData.Frames;

    for ( var fid = loFid; fid <= hiFid; fid++ ) {
        if ( ! $j('#eventThumb'+fid) ) {
            var img = new Element( 'img', { 'id': 'eventThumb'+fid, 'src': 'graphics/transparent.gif', 'alt': fid, 'class': 'placeholder' } );
            img.bind( 'click', function () { eventData['frames'][fid] = null; checkFrames( eventId, fid ) } );
            frameQuery( eventId, fid, loadImage && (fid == frameId) );
            var imgs = $j('#eventThumbs').find( 'img' );
            var injected = false;
            if ( fid < imgs.length ) {
                img.inject( imgs[fid-1], 'before' );
                injected = true;
            } else {
                injected = imgs.some(
                    function( thumbImg, index ) {
                        if ( parseInt(img.getProperty( 'alt' )) < parseInt(thumbImg.getProperty( 'alt' )) ) {
                            img.inject( thumbImg, 'before' );
                            return( true );
                        }
                        return( false );
                    }
                );
            }
            if ( ! injected ) {
                img.inject( $j('#eventThumbs') );
            }
            var scale = parseInt(img.getStyle('height'));
            img.setStyles( {
                'width': parseInt((eventData.Width*scale)/100),
                'height': parseInt((eventData.Height*scale)/100)
            } );
        } else if ( eventData['frames'][fid] ) {
            if ( loadImage && (fid == frameId) ) {
                loadEventImage( eventData, eventData['frames'][fid], loadImage );
            }
        }
    } // end foreach frame
    $j('#prevThumbsBtn').disabled = (frameId==1);
    $j('#nextThumbsBtn').disabled = (frameId==eventData.Frames);
}

function locateImage( frameId, loadImage ) {
    if ( slider )
        slider.fireEvent( 'tick', slider.toPosition( parseInt((frameId-1)*slider.options.steps/eventData.Frames) ));
    checkFrames( eventData.Id, frameId, loadImage );
    scroll.toElement( 'eventThumb'+frameId );
}

function prevImage() {
    if ( currFrameId > 1 )
        locateImage( parseInt(currFrameId)-1, true );
}

function nextImage() {
    if ( currFrameId < eventData.Frames )
        locateImage( parseInt(currFrameId)+1, true );
}

function prevThumbs() {
    if ( currFrameId > 1 )
        locateImage( parseInt(currFrameId)>10?(parseInt(currFrameId)-10):1, $j('#eventImagePanel').getStyle('display')!="none" );
}

function nextThumbs() {
    if ( currFrameId < eventData.Frames )
        locateImage( parseInt(currFrameId)<(eventData.Frames-10)?(parseInt(currFrameId)+10):eventData.Frames, $j('#eventImagePanel').getStyle('display')!="none" );
}

function prevEvent() {
    if ( prevEventId ) {
        eventQuery( prevEventId );
        streamPrev( true );
    }
}

function nextEvent() {
    if ( nextEventId ) {
        eventQuery( nextEventId );
        streamNext( true );
    }
}

function getActResponse( respObj, respText ) {
    if ( checkStreamForErrors( "getActResponse", respObj ) )
        return;

    if ( respObj.refreshParent )
        refreshParentWindow();

    if ( respObj.refreshEvent )
        eventQuery( eventData.Id );
}

function actQuery( action, parms ) {
    var actParms = "view=request&request=event&id="+eventData.Id+"&action="+action;
    if ( parms != null )
        actParms += "&"+Object.toQueryString( parms );
    $j.getJSON( thisUrl, actParms, getActResponse );
}

function deleteEvent() {
    actQuery( 'delete' );
    streamNext( true );
}

function renameEvent() {
    var newName = $j('#eventName').get('value');
    actQuery( 'rename', { eventName: newName } );
}

function editEvent() {
    createPopup( '?view=eventdetail&eid='+eventData.Id, 'zmEventDetail', 'eventdetail' );
}

function exportEvent() {
    createPopup( '?view=export&eid='+eventData.Id, 'zmExport', 'export' );
}

function archiveEvent() {
    actQuery( 'archive' );
}

function unarchiveEvent() {
    actQuery( 'unarchive' );
}

function showEventFrames() {
    createPopup( '?view=frames&eid='+eventData.Id, 'zmFrames', 'frames' );
}

function showVideo() {
    $j('#eventStills').addClass( 'hidden' );
    $j('#imageFeed').addClass('hidden');
    $j('#eventVideo').removeClass( 'hidden' );
    
    $j('#stillsEvent').removeClass( 'hidden' );
    $j('#videoEvent').addClass( 'hidden' );
    
    streamMode = 'video';
    
}

function showStills()
{
    $j('#eventStills').removeClass( 'hidden' );
    $j('#imageFeed').removeClass('hidden');
    $j('#eventVideo').addClass( 'hidden' );		

    if (vid && ( vid.paused != true ) ) {
      // Pause the video
      vid.pause();

      // Update the button text to 'Play'
       //if ( playButton )
        //playButton.innerHTML = "Play";
    }
	
    $j('#stillsEvent').addClass( 'hidden' );
    $j('#videoEvent').removeClass( 'hidden' );
	
    streamMode = 'stills';
	
    streamPause( true );
    if ( !scroll ) {
        scroll = new Fx.Scroll( 'eventThumbs', {
            wait: false,
            duration: 500,
            offset: { 'x': 0, 'y': 0 },
            transition: Fx.Transitions.Quad.easeInOut
            }
        );
    }
    resetEventStills();
    $(window).bind( 'resize', updateStillsSizes );
}

function showFrameStats()
{
    var fid = $j('#eventImageNo').get('text');
    createPopup( '?view=stats&eid='+eventData.Id+'&fid='+fid, 'zmStats', 'stats', eventData.Width, eventData.Height );
}


function drawProgressBar()
{
    var barWidth = 0;
    $j('#progressBar').addClass( 'invisible' );
    var cells = $j('#progressBar').find( 'div' );
    var cellWidth = parseInt( eventData.Width/$$(cells).length );
    $$(cells).forEach(
        function( cell, index )
        {
            if ( index == 0 )
                $(cell).setStyles( { 'left': barWidth, 'width': cellWidth, 'borderLeft': 0 } );
            else
                $(cell).setStyles( { 'left': barWidth, 'width': cellWidth } );
            var offset = parseInt((index*eventData.Length)/$$(cells).length);
            $(cell).setProperty( 'title', '+'+secsToTime(offset)+'s' );
            $(cell).removeEvent( 'click' );
            $(cell).bind( 'click', function(){ streamSeek( offset ); } );
            barWidth += $(cell).getCoordinates().width;
        }
    );
    $j('#progressBar').setStyle( 'width', barWidth );
    $j('#progressBar').removeClass( 'invisible' );
}

function updateProgressBar()
{
    if ( eventData && streamStatus )
    {
        var cells = $j('#progressBar').find( 'div' );
        var completeIndex = parseInt((($$(cells).length+1)*streamStatus.progress)/eventData.Length);
        $$(cells).forEach(
            function( cell, index )
            {
                if ( index < completeIndex )
                {
                    if ( !$(cell).hasClass( 'complete' ) )
                    {
                        $(cell).addClass( 'complete' );
                    }
                }
                else
                {
                    if ( $(cell).hasClass( 'complete' ) )
                    {
                        $(cell).removeClass( 'complete' );
                    }
                }
            }
        );
    }
}

function handleClick( event )
{
    var target = event.target;
    var x = event.page.x - $(target).getLeft();
    var y = event.page.y - $(target).getTop();
    
    if ( event.shift )
        streamPan( x, y );
    else
        streamZoomIn( x, y );
}
function setupListener()
{
// I think this stuff was to use our existing buttons instead of the videojs controls. 

	// Buttons
	var playButton = $j("#play-pause");
	var muteButton = $j("#mute");
	var fullScreenButton = $j("#full-screen");

	// Sliders
	var seekBar = $j("#seekbar");
	var volumeBar = $j("#volume-bar");

	// Event listener for the play/pause button
	playButton.bind("click", function() {
		if (vid.paused == true) {
			// Play the video
			vid.play();

			// Update the button text to 'Pause'
			playButton.innerHTML = "Pause";
		} else {
			// Pause the video
			vid.pause();

			// Update the button text to 'Play'
			playButton.innerHTML = "Play";
		}
	});


	// Event listener for the mute button
	muteButton.bind("click", function() {
		if (vid.muted == false) {
			// Mute the video
			vid.muted = true;

			// Update the button text
			muteButton.innerHTML = "Unmute";
		} else {
			// Unmute the video
			vid.muted = false;

			// Update the button text
			muteButton.innerHTML = "Mute";
		}
	});


	// Event listener for the full-screen button
	fullScreenButton.bind("click", function() {
		if (vid.requestFullscreen) {
			vid.requestFullscreen();
		} else if (vid.mozRequestFullScreen) {
			vid.mozRequestFullScreen(); // Firefox
		} else if (vid.webkitRequestFullscreen) {
			vid.webkitRequestFullscreen(); // Chrome and Safari
		}
	});


	// Event listener for the seek bar
	seekBar.bind("change", function() {
		// Calculate the new time
		var time = vid.duration * (seekBar.value / 100);

		// Update the video time
		vid.currentTime = time;
	});

	
	// Update the seek bar as the video plays
	vid.bind("timeupdate", function() {
		// Calculate the slider value
		var value = (100 / vid.duration) * vid.currentTime;

		// Update the slider value
		seekBar.value = value;
	});

	// Pause the video when the seek handle is being dragged
	seekBar.bind("mousedown", function() {
		vid.pause();
	});

	// Play the video when the seek handle is dropped
	seekBar.bind("mouseup", function() {
		vid.play();
	});

	// Event listener for the volume bar
	volumeBar.bind("change", function() {
		// Update the video volume
		vid.volume = volumeBar.value;
	});
}

function initPage() {
  //FIXME prevent blocking...not sure what is happening or best way to unblock
  if ( $j('#videoobj') ) {
    vid = videojs("videoobj");
  }
  if ( vid ) {
/*
    setupListener();
      vid.removeAttribute("controls");
    /* window.videoobj.oncanplay=null;
    window.videoobj.currentTime=window.videoobj.currentTime-1;
    window.videoobj.currentTime=window.videoobj.currentTime+1;//may not be symetrical of course

    vid.onstalled=function(){window.vid.currentTime=window.vid.currentTime-1;window.vid.currentTime=window.vid.currentTime+1;} 
    vid.onwaiting=function(){window.vid.currentTime=window.vid.currentTime-1;window.vid.currentTime=window.vid.currentTime+1;}
    vid.onloadstart=function(){window.vid.currentTime=window.vid.currentTime-1;window.vid.currentTime=window.vid.currentTime+1;}
    vid.onplay=function(){window.vid.currentTime=window.vid.currentTime-1;window.vid.currentTime=window.vid.currentTime+1;}
    vid.onplaying=function(){window.vid.currentTime=window.vid.currentTime-1;window.vid.currentTime=window.vid.currentTime+1;}
    //window.vid.hide();//does not help
    var sources = window.videoobj.getElementsByTagName('source');
    sources[0].src=null;
    window.videoobj.load();
    streamPlay();    */
  } else {
    streamCmdTimer = streamQuery.delay( 250 );
    eventQuery.pass( eventData.Id ).delay( 500 );

    if ( canStreamNative ) {
      var streamImg = $j('#imageFeed').getElement('img');
      if ( !streamImg )
        streamImg = $j('#imageFeed').getElement('object');
      $(streamImg).bind( 'click', function( event ) { handleClick( event ); } );
    }
  }
}

// Kick everything off
$j(window).bind( 'domready', initPage );
