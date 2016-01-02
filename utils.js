CanvasRenderingContext2D.prototype.setPixel = function(x, y, color){
    var imgdata = this.createImageData(1,1);
    imgdata.data[0] = color[0];
    imgdata.data[1] = color[1];
    imgdata.data[2] = color[2];
    imgdata.data[3] = color[3];
    this.putImageData(imgdata,x,y);
};

CanvasRenderingContext2D.prototype.getPixel = function(x, y) {
    var p = this.getImageData(x, y, 1, 1).data;
    return p;
    //return 'rgba('+p[0]+', '+p[1]+', '+p[2]+', '+p[3]+')';
};

function onResize( element, callback ) {
  var orgHeight = element.height,
      orgWidth = element.width;
  setInterval(function(){
      if( element.height !== orgHeight || element.width !== orgWidth ) {
        callback(element, orgWidth, orgHeight);
        orgHeight = element.height;
        orgWidth = element.width;
      }
  }, 300);
}

function color2rgba(p) {
    if (p.length>3) return 'rgba('+p[0]+','+p[1]+','+p[2]+','+p[3]+')';
    return 'rgba('+p[0]+','+p[1]+','+p[2]+',255)';
}

// https://gist.github.com/edersohe/760885
(function($) {
    //plugin buttonset vertical
    $.fn.buttonsetv = function() {
        $(':radio, :checkbox', this).wrap('<div style="margin: 1px"/>');
        $(this).buttonset();
        $('label:first', this).removeClass('ui-corner-left').addClass('ui-corner-top');
        $('label:last', this).removeClass('ui-corner-right').addClass('ui-corner-bottom');
        mw = 0; // max witdh
        $('label', this).each(function(index) {
            w = $(this).width();
            if (w > mw) mw = w;
        });
        $('label', this).each(function(index) {
            $(this).width(mw);
        });
    };
})(jQuery);

function dataURL2bin(dataURL, callback) {
    var data = atob( dataURL.substring( "data:image/png;base64,".length ) ),
    asArray = new Uint8Array(data.length);
    for( var i = 0, len = data.length; i < len; ++i ) asArray[i] = data.charCodeAt(i);
    return asArray.buffer;
}
