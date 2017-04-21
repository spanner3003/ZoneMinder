var events = {};

function showEvent( event ) {
  var url = '?view=event&eid='+event.data.eid+'&fid='+event.data.fid;
  url += filterQuery;
  var pop = createPopup( url, 'zmEvent', 'event', event.data.width, event.data.height );
  pop.vid=$j('#preview');

  //video element is blocking video elements elsewhere in chrome possible interaction with mouseover event?
  //FIXME unless an exact cause can be determined should store all video controls and do something to the other controls when we want to load a new video seek etc or whatever may block
  /*var vid= $j('#preview');
    vid.oncanplay=null;
  //    vid.currentTime=vid.currentTime-0.1;
  vid.pause();*/
}

function createEventHtml( event, frame ) {
  var eventHtml = $j('<div/>');

  if ( event.Archived > 0 )
    eventHtml.addClass( 'archived' );

  eventHtml.append( '<p>' + monitors[event.MonitorId].Name + '</p>' );
  eventHtml.append( '<p>'+ event.Name+(frame?("("+frame.FrameId+")"):"") + '</p>' );
  eventHtml.append( '<p>'+ event.StartTime+" - "+event.Length+"s</p>" );
  eventHtml.append( '<p>'+event.Cause+'</p>' );
  if ( event.Notes )
    eventHtml.append( '<p>'+ event.Notes + '</p>' );
  if ( event.Archived > 0 )
    eventHtml.append( '<p>'+ archivedString + '</p>' );

  return( eventHtml );
}

function showEventDetail( eventHtml ) {
  $j('#instruction').addClass( 'hidden' );
  $j('#eventData').empty();
  $j('#eventData').append( eventHtml );
  $j('#eventData').removeClass( 'hidden' );
}

function eventDataResponse( respObj, respText ) {
  var event = respObj.event;
  if ( !event ) {
    console.log( "Null event" );
    return;
  }
  events[event.Id] = event;

  if ( respObj.loopback ) {
    requestFrameData( event.Id, respObj.loopback );
  }
}

function frameDataResponse( respObj, respText )
{
  var frame = respObj.frameimage;
  if ( !frame.FrameId ) {
    console.log( "Null frame" );
    return;
  }

  var event = events[frame.EventId];
  if ( !event ) {
    console.error( "No event "+frame.eventId+" found" );
    return;
  }

  if ( !event['frames'] )
    event['frames'] = new Object();

  event['frames'][frame.FrameId] = frame;
  event['frames'][frame.FrameId]['html'] = createEventHtml( event, frame );

  previewEvent(frame.EventId, frame.FrameId);
}

function requestFrameData( eventId, frameId ) {
  if ( !events[eventId] ) {
    $j.getJSON( thisUrl, "view=request&request=status&entity=event&id="+eventId+"&loopback="+frameId, eventDataResponse );
  } else {
    $j.getJSON( thisUrl, "view=request&request=status&entity=frameimage&id[0]="+eventId+"&id[1]="+frameId, frameDataResponse );
  }
}

function previewEvent( eventId, frameId ) {
    
  if ( events[eventId] ) {
    var event = events[eventId];
    if ( event['frames'] ) {
      if ( event['frames'][frameId] ) {
        showEventDetail( event['frames'][frameId]['html'] );
        var imagePath = '/index.php?view=image&eid='+eventId+'&fid='+frameId;
        var videoName = event.DefaultVideo;
        loadEventImage( imagePath, eventId, frameId, event.Width, event.Height, event.Frames/event.Length, videoName, event.Length, event.StartTime, monitors[event.MonitorId]);
        return;
      }
    }
  }
  requestFrameData( eventId, frameId );
}

function loadEventImage( imagePath, eid, fid, width, height, fps, videoName, duration, startTime, Monitor ) {
  var vid= $j('#preview');
  var imageSrc = $j('#imageSrc');
  if ( videoName && vid && vid.currentSrc) {
    vid.show();
    imageSrc.hide();
    var newsource=imagePath.slice(0,imagePath.lastIndexOf('/'))+"/"+videoName;
    //console.log(newsource);
    //console.log(sources[0].src.slice(-newsource.length));
    if(newsource!=vid.currentSrc.slice(-newsource.length) || vid.readyState==0)
    {
      //console.log("loading new");
      //it is possible to set a long source list here will that be unworkable?
      var sources = vid.getElementsByTagName('source');
      sources[0].src=newsource;
      var tracks = vid.getElementsByTagName('track');
      if(tracks.length){
        tracks[0].parentNode.removeChild(tracks[0]);
      }
      vid.load();
      addVideoTimingTrack(vid, Monitor.LabelFormat, Monitor.Name, duration, startTime)
        vid.currentTime = fid/fps;
    } else {
      if(!vid.seeking)
        vid.currentTime=fid/fps;
    }
  } else {
    if ( vid ) vid.hide();
    imageSrc.show();
    imageSrc.attr('src', imagePath );
    imageSrc.unbind( 'click' );
    imageSrc.bind( 'click', { eid: eid, fid: fid, width: width, height: height }, showEvent );
  }

  var eventData = $j('#eventData');
  eventData.unbind( 'click' );
  eventData.bind( 'click', [ eid, fid, width, height ], showEvent );
}

function tlZoomBounds( minTime, maxTime ) {
  console.log( "Zooming" );
  window.location = '?view='+currentView+filterQuery+'&minTime='+minTime+'&maxTime='+maxTime;
}

function tlZoomRange( midTime, range ) {
  window.location = '?view='+currentView+filterQuery+'&midTime='+midTime+'&range='+range;
}

function tlPan( midTime, range ) {
  window.location = '?view='+currentView+filterQuery+'&midTime='+midTime+'&range='+range;
}
