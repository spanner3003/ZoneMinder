// This code is taken from https://github.com/xbgmsharp/videojs-rotatezoom/blob/master/src/videojs.zoomrotate.js
console.log('zoomrotate: Start');

(function() {
    console.log( 'zoomrotate: Init defaults' );
    var defaults = {
      zoom: 1,
      rotate: 0
    };
    console.log( 'zoomrotate: Init Extend' );
    var extend = function() {
      var args = Array.prototype.slice.call(arguments);
      var target = args.shift() || {};
      for ( i in args ) {
        var object = args[i];
        for ( var property in object ) {
          if ( object.hasOwnProperty( property ) ) {
            if ( typeof object[property] === 'object' ) {
              target[property] = extend( target[property], object[property] );
            } else {
              target[property] = object[property];
            }
          }
        }
      }
      return target;
    };

  /**
    * register the zoomrotate plugin
    */
    videojs.plugin( 'zoomrotate', function( options ) {
        console.log('zoomrotate: Register init');
        var settings = extend(defaults, options);
        /* Grab the necessary DOM elements */
        var player = this.el();
        var video = this.el().getElementsByTagName('video')[0];
        var poster = this.el().getElementsByTagName('div')[1]; // div vjs-poster

        console.log('zoomrotate: '+video.style);
        if ( poster )
          console.log('zoomrotate: '+poster.style);
        else
          console.log('zoomrotate: no poster found.');
        console.log('zoomrotate: '+options.rotate);
        console.log('zoomrotate: '+options.zoom);

        /* Array of possible browser specific settings for transformation */
        var properties = ['transform', 'WebkitTransform', 'MozTransform', 'msTransform', 'OTransform'];
        var prop = properties[0];

        /* Iterators */

        /* Find out which CSS transform the browser supports */
        for ( var i=0, j=properties.length; i<j; i++ ) {
          if ( typeof player.style[properties[i]] !== 'undefined' ) {
            prop = properties[i];
            break;
          }
        }

        /* Let's do it */
        player.style.overflow = 'hidden';
        video.style[prop]='scale('+options.zoom+') rotate('+options.rotate+'deg)';
        if ( poster )
          poster.style[prop]='scale('+options.zoom+') rotate('+options.rotate+'deg)';
        console.log('zoomrotate: Register end');
    });
})();

console.log('zoomrotate: End');
