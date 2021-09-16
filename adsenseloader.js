;( function( root, factory )
{
  var pluginName = 'adsenseLoader';
  if( typeof define === 'function' && define.amd ) define([], factory( pluginName ));
  else if( typeof exports === 'object' ) module.exports = factory( pluginName );
  else root[ pluginName ] = factory( pluginName );

}( this, function( pluginName )
{
  'use strict';

  var throttleTO = 500,

    defaultOpts =
    {
      laziness: 1,
      onLoad: false,
    },

    extendObj = function( defaults, options )
    {
      var prop, extended = {};
      for( prop in defaults )
        if( Object.prototype.hasOwnProperty.call( defaults, prop ))
          extended[ prop ] = defaults[ prop ];

      for( prop in options )
        if( Object.prototype.hasOwnProperty.call( options, prop ))
          extended[ prop ] = options[ prop ];

      return extended;
    },

    addClass = function( el, className )
    {
      if( el.classList ) el.classList.add( className );
      else el.className += ' ' + className;
    },

    getOffset = function( el )
    {
      var rect = el.getBoundingClientRect();
      return { top: rect.top + document.body.scrollTop, left: rect.left + document.body.scrollLeft };
    },

    throttle = function(a,b){var c,d;return function(){var e=this,f=arguments,g=+new Date;c&&g<c+a?(clearTimeout(d),d=setTimeout(function(){c=g,b.apply(e,f)},a)):(c=g,b.apply(e,f))}},

    adsToLoad = [],
    adsLoaded = [],

    loadAd = function( ad )
    {
      ( adsbygoogle = window.adsbygoogle || []).push({});

      var onLoadFn = ad._adsenseLoaderData.options.onLoad;
      if( typeof onLoadFn === 'function' )
      {
        ad.querySelector( 'iframe' ).addEventListener( 'load', function()
        {
          onLoadFn( ad );
        });
      }
    },
    initAds = function()
    {
      if( !adsToLoad.length ) return true;

      var winScroll = window.pageYOffset,
        winHeight = window.innerHeight;

      adsToLoad.forEach( function( ad )
      {
        var offset = getOffset( ad ).top,
          laziness = ad._adsenseLoaderData.options.laziness + 1;

        // if the element is not in view && is too far below || too far above
        if( ( offset < -1 * winHeight * laziness/2 || offset > winHeight ) && (offset - winScroll > winHeight * laziness || winScroll - offset - ad.offsetHeight - ( winHeight * laziness ) > 0) )
          return true;

        adsToLoad = removeAdFromList( adsToLoad, ad );
        ad._adsenseLoaderData.width = getAdWidth( ad );
        addClass( ad.children[ 0 ], 'adsbygoogle' );
        adsLoaded.push( ad );

        loadAd( ad );

      });
    },
    resizeAds = function()
    {
      if( !adsLoaded.length ) return true;

      var anyNew = false;
      adsLoaded.forEach( function( ad )
      {
        if( ad._adsenseLoaderData.width != getAdWidth( ad ))
        {
          anyNew = true;
          adsLoaded = removeAdFromList( adsLoaded, ad );
          ad.innerHTML = ad._adsenseLoaderData.originalHTML;
          adsToLoad.push( ad );
        }
      });
      if( anyNew ) initAds();
    },
    getAdWidth = function( ad )
    {
      return parseInt( window.getComputedStyle( ad, ':before' ).getPropertyValue( 'content' ).slice( 1, -1 ) || 9999 );
    },
    removeAdFromList = function( list, element )
    {
      return list.filter( function( entry )
      {
        return entry !== element;
      });
    },
    normalizeAdElement = function( ad, options )
    {
      ad._adsenseLoaderData =
      {
        originalHTML: ad.innerHTML,
        options: options
      };
      ad.adsenseLoader = function( method )
      {
        if( method == 'destroy' )
        {
          adsToLoad = removeAdFromList( adsToLoad, ad );
          adsLoaded = removeAdFromList( adsLoaded, ad );
          ad.innerHTML = ad._adsenseLoaderData.originalHTML;
        }
      };
      return ad;
    };


  window.addEventListener( 'scroll', throttle( 250, initAds ));
  window.addEventListener( 'resize', throttle( 1000, initAds ));
  window.addEventListener( 'resize', throttle( 1000, resizeAds ));
  window.addEventListener( 'hashchange', initAds);


  function Plugin( elements, options )
  {
    if( typeof elements === 'string' ) elements = document.querySelectorAll( elements );
    else if( typeof elements.length === 'undefined' ) elements = [ elements ];

    options = extendObj( defaultOpts, options );

    [].forEach.call( elements, function( entry )
    {
      entry = normalizeAdElement( entry, options );
      adsToLoad.push( entry );
    });

    this.elements = elements;

    initAds();
  }

  Plugin.prototype =
  {
    destroy: function()
    {
      this.elements.forEach( function( entry )
      {
        entry.adsenseLoader( 'destroy' );
      });
    }
  };

  window.adsenseLoaderConfig = function( options )
  {
    if( typeof options.throttle !== 'undefined' )
      throttleTO = options.throttle;
  };

  return Plugin;
}));

var lazyads = new adsenseLoader( '.lazyads' );