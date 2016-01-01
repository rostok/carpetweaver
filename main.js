var xxx;
var carpetOptions = {};

function updateStateLinks() {
    if (!window.localStorage) return
    $("#states").html("");
    a = Object.getOwnPropertyNames(window.localStorage);
    for (i in a)
    {
        n = a[i];
        $("#states").append($("<span class='label label-primary statelink'>"+n+"</span>"));
        $("#states").append($("<span statename='"+n+"' class='label label-success downloadstatelink'><span class='glyphicon glyphicon-download-alt'/></span>"));
        $("#states").append($("<span statename='"+n+"' class='label label-danger removestatelink'><span class='glyphicon glyphicon-remove'></span>"));
        $("#states").append($("<br/>"));
    }
    $(".statelink").click(function(){
        load($(this).html());
    });
    $(".removestatelink").click(function(e){
        if (e.shiftKey || window.confirm("Do you really want to remove this?")) {
            remove($(this).attr('statename'));
        }
    });
    $(".downloadstatelink").click(function(e){
        name = $(this).attr('statename');
        saveAs(new Blob([window.localStorage[name]]), name+".carpet");
    });
    $("#states").append($("<br/><span id='zipall' class='label label-success downloadstatelink'>zip all carpets <span class='glyphicon glyphicon-download-alt'/></span>"));
    $("#zipall").click(function(){
        var zip = new JSZip();
        a = Object.getOwnPropertyNames(window.localStorage);
        for (i in a)
        {
            n = a[i];
            b = window.localStorage[n];
            zip.file(n+".carpet", b);
        }
        var content = zip.generate({type:"blob"});
        d = new Date().toISOString();
        saveAs(content, "allcarpets"+d.slice(0, 10)+"-"+d.slice(11, 19).split(":").join("-")+".zip");
    });
    $("#states").append($("<br/><span id='renderall' class='label label-success downloadstatelink'>render all carpets <span class='glyphicon glyphicon-camera'/></span>"));
    $("#renderall").click(function(){
        loaders = [];
        var zip = new JSZip();
        a = Object.getOwnPropertyNames(window.localStorage);
        for (var i in a)
        {
            var n = a[i];
            loaders.push(loadState(JSON.parse(window.localStorage.getItem(n)), function() {
                                                console.log("callback() state loaded and weaved", carpetOptions.name, i);
                                                setupAndWeave();
                                                zip.file(carpetOptions.name+".png", dataURL2bin(carpet.toDataURL()) );
                                            } ));
        }
        $.when.apply(null, loaders).done(function() {
            console.log("when.done()");
            // callback when everything's done
            var content = zip.generate({type:"blob"});
            d = new Date().toISOString();
            saveAs(content, "renderedcarpets"+d.slice(0, 10)+"-"+d.slice(11, 19).split(":").join("-")+".zip");
        });
    });
}

function copy(src, dst) {
    if (window.localStorage) window.localStorage.setItem('dst', window.localStorage.getItem(name));
    updateStateLinks();
}

function remove(name) {
    if (window.localStorage) delete window.localStorage[name];
    updateStateLinks();
}

function save(name) {
    console.log("saving state", name);
    if (window.localStorage) {
        state = {
            name : name,
            tassel : carpetOptions.tassel.toDataURL("image/png"),
            palette : carpetOptions.palette.toDataURL("image/png"),
            corner : carpetOptions.corner.toDataURL("image/png"),
            border1 : carpetOptions.border1.toDataURL("image/png"),
            border2 : carpetOptions.border2.toDataURL("image/png"),
            outside : carpetOptions.outside.toDataURL("image/png"),
            inside : carpetOptions.inside.toDataURL("image/png"),
            borderStyle : carpetOptions.borderStyle,
            zoom : carpetOptions.zoom,
            update : carpetOptions.update,
            width : carpetOptions.width,
            height : carpetOptions.height,
        };
        history.pushState(state, "", window.location.href);
        if (window.localStorage) {
            window.localStorage.setItem(name, JSON.stringify(state, null, "\t"));
        }
    }
    updateStateLinks();
}

window.onpopstate = function(event) {
    console.log("state popped");
    if (event.state !== null) {
      loadState(event.state);
    }
}

function loadImageDataIntoCanvas(canvas, imageData) {
    var deferred = $.Deferred();
    var img = new Image();
    img.onload = function() {
        if (img.width==0) {
            console.error("image empty", img);
            return;
        }
        canvasClear(canvas);
        canvasSetSize(canvas, img.width, img.height);
        canvasScaleCSS(canvas, canvas.sclx, canvas.scly);
        canvas.getContext("2d").drawImage(img, 0, 0);
        deferred.resolve();
    }
    img.src = imageData;
    return deferred.promise();
}

function loadState(state, callback = undefined) {
    console.log("loadState()")
    var deferred = $.Deferred();

    // deferring image loading http://stackoverflow.com/questions/8645143/wait-for-image-to-be-loaded-before-going-on
    var loaders = [];
    loaders.push(loadImageDataIntoCanvas(corner, state.corner));
    loaders.push(loadImageDataIntoCanvas(border1, state.border1));
    loaders.push(loadImageDataIntoCanvas(border2, state.border2));
    loaders.push(loadImageDataIntoCanvas(outside, state.outside));
    loaders.push(loadImageDataIntoCanvas(inside, state.inside));
    loaders.push(loadImageDataIntoCanvas(tassel, state.tassel));
    loaders.push(loadImageDataIntoCanvas(palette, state.palette));

    $.when.apply(null, loaders).done(function() {
        carpetOptions.borderStyle = state.borderStyle;
        carpetOptions.width = parseInt(state.width);
        carpetOptions.height = parseInt(state.height);
        carpetOptions.update = state.update;
        carpetOptions.zoom = state.zoom;
        if (state.name!="history") carpetOptions.name = state.name;

        // callback when everything was loaded
        updateInterface();
        // colorArray = getUniqueColors(palette);
        // setPaletteColors(colorArray);
        setupAndWeave();
        if (callback) callback();
        deferred.resolve();
    });

    return deferred.promise();
}

function load(name, callback = undefined) {
    if (window.localStorage) {
        state = JSON.parse(window.localStorage.getItem(name));
        if (!state)
        {
            console.error("no such state",name);wung
            return;
        }
        console.log("loading state:",state.name);

        // var backlen = history.length - 1;
        // history.go(-backlen);
        // history.replaceState({}, null, 'index.html');

        loadState(state, callback);
        updateStateLinks();
    }
}

function createState(name, stateData) {
    if (typeof stateData === 'object') stateData = JSON.stringify(state, null, "\t");
    if (window.localStorage && (window.localStorage[name]==undefined || window.confirm("Overwrite "+name+"?"))) {
        window.localStorage.setItem(name, stateData);
    }
    //updateStateLinks();
}

function updateInterface() {
    $("#width").val(carpetOptions.width).trigger("change");
    $("#height").val(carpetOptions.height).trigger("change");
    $("#zoom").val(carpetOptions.zoom).trigger("change");
    $("#name").val(carpetOptions.name);
    $("#"+carpetOptions.borderStyle).prop("checked", true).button('refresh');;
    $("#up"+carpetOptions.update).prop('checked',true).button('refresh');;
    canvasScaleCSS(carpetOptions.tassel, 30, 10);
    canvasScaleCSS(carpetOptions.outside, 30, 10);
    canvasScaleCSS(carpetOptions.inside, 30, 10);
    canvasSetSize(carpetOptions.carpet,carpetOptions.width,carpetOptions.height);
    canvasScaleCSS(carpetOptions.carpet, carpetOptions.zoom);
    $("#dropzone").hide();
    $("#states").show();
}

var draw = {
    isDrawing: false,
    colorSaved: [-1, -1, [0, 0, 0], undefined],
    saveColor: function(x, y, ctx=undefined) {
        this.colorSaved[0] = x;
        this.colorSaved[1] = y;
        if (ctx!=undefined && ctx instanceof CanvasRenderingContext2D) {
            this.colorSaved[2] = ctx.getPixel(coordinates.x, coordinates.y)
        }
        this.colorSaved[3] = ctx;
    },
    restoreColor: function() {
        if (this.colorSaved[3] != undefined && this.colorSaved[3] instanceof CanvasRenderingContext2D)
            this.colorSaved[3].setPixel(this.colorSaved[0], this.colorSaved[1], this.colorSaved[2]);
    },
    mouseenter: function(ctx, coordinates, color) {
        this.saveColor(-1, -1, [0,0,0], ctx);
    },
    mousedown: function(ctx, coordinates, color) {
        this.isDrawing = true;
        this.colorSaved[2] = color.slice();
    },
    mousemove: function(ctx, coordinates, color) {
        this.restoreColor();
        this.saveColor(coordinates.x, coordinates.y, ctx)
        ctx.setPixel(coordinates.x, coordinates.y, color);
        if (this.isDrawing) {
            this.colorSaved[2] = color.slice();
            needToWeave = true;
        }
    },
    mouseup: function(ctx, coordinates, color) {
        this.isDrawing = false;
        save("history");
    },
    mouseout: function() {
        this.mouseleave();
    },
    mouseleave: function() {
        this.restoreColor();
    }
};

var move = {
    isMoving: false,
    cx:0,
    cy:0,
    mouseenter: function(ctx, coordinates) {
    },
    mousedown: function(ctx, coordinates) {
        if (!this.isMoving)
        {
            cx = coordinates.x;
            cy = coordinates.y;
            //save("history");
        }
        this.isMoving = true;
    },
    mousemove: function(ctx, coordinates) {
        if (this.isMoving) {
            img = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
            ctx.putImageData(img, coordinates.x-cx, coordinates.y-cy);
            cx = coordinates.x;
            cy = coordinates.y;
            needToWeave = true;
        }
    },
    mouseup: function(ctx, coordinates) {
        this.isMoving = false;
        save("history");
    },
    mouseout: function() {
        this.mouseleave();
    },
    mouseleave: function() {
        this.isMoving = false;
    }
};

var foregroundColor = [0,0,0,255];

function mouseEventHandler(e) {
    scaleX = $(this).outerWidth()/this.width;
    scaleY = $(this).outerHeight()/this.height;
    coordinates = {
        x: (e.pageX - this.offsetLeft)/scaleX,
        y: (e.pageY - this.offsetTop)/scaleY
    };
    // truncate to integer
    coordinates.x = ~~coordinates.x;
    coordinates.y = ~~coordinates.y;
    if (!this.ctx) ctx = ctx.getContext("2d");
    ctx = this.ctx;

    if ((e.buttons & 1)==0)
    {
        if (draw.isDrawing || move.isMoving)
        {
            save("history");
        }
        draw.isDrawing = false;
        move.isMoving = false;
    }

    if (e.shiftKey){
        $(this).css( 'cursor', 'move' );
        if (draw.isDrawing) draw.mouseout();
        draw.restoreColor();
        move[e.type](ctx, coordinates);
    }
    else if (e.ctrlKey) {
        $(this).css('cursor', 'url(img/eyedropper.png) 2 29, default');
        draw.restoreColor();
        draw.saveColor(-1,-1);
        setPaintColors(ctx.getPixel(coordinates.x, coordinates.y));
    }
    else {
        $(this).css( 'cursor', 'crosshair' );
        draw[e.type](ctx, coordinates, foregroundColor);
    }
};

function addDragDropHandler(canvas, onLoadCallback = undefined) {
    var context = canvas.getContext("2d"),
    img = document.createElement("img"),
    loadCallback = onLoadCallback,
    mouseDown = false,
    brushColor = "rgb(0, 0, 0)";

    // Image for loading
    img.addEventListener("load", function () {
        canvasSetSize(canvas, img.width, img.height);
        canvasClear(canvas);
        context.drawImage(img, 0, 0);
        if (loadCallback) loadCallback(context);
    }, false);

    // To enable drag and drop
    canvas.addEventListener("dragover", function (evt) {
        evt.preventDefault();
    }, false);

    // Handle dropped image file - only Firefox and Google Chrome
    canvas.addEventListener("drop", function (evt) {
        var files = evt.dataTransfer.files;
        if (files.length > 0) {
            var file = files[0];
            if (typeof FileReader !== "undefined" && file.type.indexOf("image") != -1) {
                var reader = new FileReader();
                // Note: addEventListener doesn't work in Google Chrome for this event
                reader.onload = function (evt) {
                    img.src = evt.target.result;
                    needToWeave = true;
                    updateInterface();
                };
                reader.readAsDataURL(file);
            }
        }
        evt.preventDefault();
    }, false);
}

// text on button, array of id|attribute, change amount
function createSizeButton(text, arrIdAttr, change) {
    b = $("<button/>").html(text);
    b.attr('class', 'smallbut')
    b.first()[0].arr = arrIdAttr;
    b.first()[0].chg = change;
    b.click(function (){
        for (v of this.arr)
        {
            a = v.split("|");
            cnv = $(a[0]).get(0);
            if (a[1]=="width") canvasSetSize(cnv, cnv.width+this.chg, cnv.height);
            if (a[1]=="height") canvasSetSize(cnv, cnv.width, cnv.height+this.chg);
            needToWeave = true;
        }
    });
    return b;
}

// text on button, id
function createRotateButton(text, arrIdAttr) {
    b = $("<button/>").html(text);
    b.attr('class', 'smallbut')
    b.first()[0].trg = arrIdAttr;
    b.click(function (){
        canvasRotate90($(this.trg).get(0));
        needToWeave = true;
    });
    return b;
}

// text on button, id
function createFlipButton(text, arrIdAttr) {
    b = $("<button/>").html(text);
    b.attr('class', 'smallbut')
    b.first()[0].trg = arrIdAttr;
    b.click(function (){
        canvasFlip($(this.trg).get(0));
        needToWeave = true;
    });
    return b;
}

// text selector direction
function createShiftButton(text, sel, drn=1) {
    b = $("<button/>").html(text);
    b.attr('class', 'smallbut')
    b.first()[0].drn = drn;
    b.first()[0].sel = sel;
    b.click(function (){
        a = $(this.sel);
        if (a.length==0) return;
        c = canvasCreate(1, 1);
        canvasCloneInto(a[0], c);
        for (i=1; i<a.length; i++) {
            canvasConcat(c, a[i]);
            canvasClear(a[i]);
        }
        canvasConcat(c, c);
        canvasConcat(c, c);
        canvasClear(a[0]);
        x = this.drn;
        if (x<0) x=a[0].width+a[1].width+this.drn;
        for (i=0; i<a.length; i++) {
            canvasPaste2(a[i], c, x, 0, a[i].width, a[i].height, 0, 0, a[i].width, a[i].height);
            x += a[i].width;//*this.dir;
        }
        needToWeave = true;
    });
    return b;
}

function addPaintBox(parentDivId, id, width, height, scale) {
    r = $("<canvas/>")
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'paintcanvas')
    .attr('id', id)
//    .css('width', width*scale)
//    .css('height', height*scale)
    .bind("mousedown mousemove mouseup mouseout mouseenter mouseleave", mouseEventHandler); // mouseout

    cnv = r.first()[0];
    prepareCanvas(cnv);
    canvasScaleCSS(cnv, scale);
    div = $(parentDivId).first();

    innerdiv = $("<div/>")
    innerdiv.attr('id', id+'div');
    innerdiv.attr('class', 'paintdiv');

    div.append(innerdiv);
    innerdiv.append($("<br/>"));
    innerdiv.append(r);

    //console.log("added paintbox",id);
    return r.get(0);
}

function setPaletteColors(colorArray) {
    ctx = $("#palette").get(0).getContext("2d");
    x=0;
    y=0;
    for(var index in colorArray)
    {
        ctx.setPixel(x, y, colorArray[index]);
        x++;
        if (x>ctx.canvas.width-1) { x=0; y++; }
    }
}

function setPaintColors(forCol, bkgCol=undefined) {
    foregroundColor = forCol;
    $("#forecoldiv").first().css("background-color", color2rgba(foregroundColor));

    if (bkgCol!=undefined) {
        backgroundColor = bkgCol;
        $("#backcoldiv").first().css("background-color", color2rgba(backgroundColor));
    }
}

var ind=0;
var indc="←↖↑↗→↘↓↙";
function setupAndWeave() {
    // console.log("weaving...", carpetOptions.update, needToWeave);
    var start = new Date().getTime();
    weave($("#carpet").get(0), carpetOptions);
    var end = new Date().getTime();
    var time = end - start;
    $("#info").html("weaving took "+time+"ms ["+indc[ind=(++ind)%indc.length]+"]" );
}

var needToWeave = true;
function weaveInterval() {
    switch (carpetOptions.update)
    {
        case "auto":
                        // do nothing as this is executed on interval
                        break;
        // case "manual":
        case "change":
                        if (!needToWeave) return;
                        needToWeave = false;
                        break;
        default:
                        return;
                        break;
    }
    setupAndWeave();
}

function pickColorHandler(e) {
    scaleX = $(this).outerWidth()/this.width;
    scaleY = $(this).outerHeight()/this.height;
    coordinates = {
        x: (e.pageX - this.offsetLeft)/scaleX,
        y: (e.pageY - this.offsetTop)/scaleY
    };
    coordinates.x = ~~coordinates.x;
    coordinates.y = ~~coordinates.y;
    if (e.ctrlKey || e.buttons==1) setPaintColors(this.getContext("2d").getPixel(coordinates.x, coordinates.y));
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

$(window).load(function() {
    var palette = addPaintBox("#content", "palette", 4, 8, 30);
    $(palette).unbind().attr('class','palettecanvas');
    $("#palettediv").prepend($("<div id=backcoldiv class='currentcolor paintcanvas'/>"));
    $("#palettediv").prepend($("<div id=forecoldiv class='currentcolor paintcanvas'/>"));
    addDragDropHandler(palette, function (ctx) {
        colorArray = getUniqueColors(ctx.canvas);
        colorArray.unshift([255,255,255,0]);
        colorArray.unshift([255,255,255,255]);
        colorArray.unshift([128,128,128,255]);
        colorArray.unshift([0,0,0,255]);
        //$("#info").html(colorArray.join(";"));
        // ctx.canvas.width = 1;
        // ctx.canvas.height = 1;
        canvasSetSize(ctx.canvas, 4, 8);
        setPaletteColors(colorArray);
    });

    $("#palette").mousemove(pickColorHandler);
    $("#palette").mousedown(pickColorHandler);

    setPaletteColors([[0,0,0,255],[128,128,128,255],[255,255,255,255],[0,0,0,0]]);
    setPaintColors([0,0,0,255], [0,0,0,0]);

    // - - - - - - - - -
    var tassel = addPaintBox("#content", "tassel", 1, 8, 10);
    addDragDropHandler(tassel);
    $("#tasseldiv").prepend($("<button id='weave' class='smallbut'><span class='glyphicon glyphicon-flash'/> </button>"));
    $("#weave").click( setupAndWeave );

    var outside = addPaintBox("#content", "outside", 1, 16, 10);
    addDragDropHandler(outside);
    $("#outsidediv").prepend($("<button id='save' class='smallbut'><span class='glyphicon glyphicon-floppy-disk'/></button>"));
    $("#save").click( function() { save(carpetOptions.name);} );

    var inside = addPaintBox("#content", "inside", 1, 16, 10);
    addDragDropHandler(inside);
    $("#insidediv").prepend($("<button id='load' class='smallbut'><span class='glyphicon glyphicon-floppy-open'/></button>"));
    $("#load").click( function() { load(carpetOptions.name);} );

    var corner = addPaintBox("#content", "corner", 16, 16, 10);
    addDragDropHandler(corner);
    $("#cornerdiv").append("<br/>");
    $("#cornerdiv").append(createFlipButton("<span class='glyphicon glyphicon-resize-horizontal'/>", "#corner"));
    $("#cornerdiv").append(createRotateButton("<span class='glyphicon glyphicon-repeat'/>", "#corner"));
    $("#cornerdiv").prepend(createSizeButton("<span class='glyphicon glyphicon-resize-small'/>", ["#corner|height","#corner|width"], -1));
    $("#cornerdiv").prepend(createSizeButton("<span class='glyphicon glyphicon-resize-full'/>", ["#corner|height","#corner|width"], 1));
    onResize( $("#corner").get(0), function(el, ow, oh) {
        canvasSetSize(border1,-1,el.width);
        canvasSetSize(border2,-1,el.width);
    });

    var border1 = addPaintBox("#content", "border1", 24, 16, 10);
    addDragDropHandler(border1);
    $("#border1div").append("<br/>");
    $("#border1div").append(createShiftButton("<span class='glyphicon glyphicon-backward'/>", "#border1, #border2",1));
    $("#border1div").append(createShiftButton("<span class='glyphicon glyphicon-forward'/>", "#border1, #border2",-1));
    $("#border1div").append(createFlipButton("<span class='glyphicon glyphicon-resize-horizontal'/>", "#border1"));
    $("#border1div").append(createRotateButton("<span class='glyphicon glyphicon-repeat'/>", "#border1"));
    $("#border1div").prepend(createSizeButton("W-", ["#border1|width"], -1));
    $("#border1div").prepend(createSizeButton("W+", ["#border1|width"], 1));

    var border2 = addPaintBox("#content", "border2", 8, 16, 10);
    addDragDropHandler(border2);
    $("#border2div").append("<br/>");
    $("#border2div").append(createFlipButton("<span class='glyphicon glyphicon-resize-horizontal'/>", "#border2"));
    $("#border2div").append(createRotateButton("<span class='glyphicon glyphicon-repeat'/>", "#border2"));
    $("#border2div").prepend(createSizeButton("W-", ["#border2|width"], -1));
    $("#border2div").prepend(createSizeButton("W+", ["#border2|width"], 1));

    $("#radioupdate").buttonsetv();
    $("#radioborder").buttonsetv();

    // save
    $(document).bind('keydown', 'ctrl+s', function() { save(carpetOptions.name); } );

    // undo
    $(document).bind('keydown', 'ctrl+z', function() { history.back(); } );

    // flood fill
    $(document).bind('keydown', 'f', function() {
        cnv = draw.colorSaved[3].canvas;
        draw.restoreColor();
        // canvasFloodfill(cnv, draw.colorSaved[0], draw.colorSaved[1], foregroundColor, cnv.width, cnv.height, 1);
        canvasFloodfill2(cnv, draw.colorSaved[0], draw.colorSaved[1], foregroundColor);
        draw.saveColor(draw.colorSaved[0], draw.colorSaved[1], foregroundColor);
    } );

    // swap colors
    $(document).bind('keydown', 'x', function() { setPaintColors(backgroundColor, foregroundColor); } );

    $("#width").change(function() { carpetOptions.width = parseInt($(this).val()); needToWeave=true; });
    $("#height").change(function() { carpetOptions.height = parseInt($(this).val()); needToWeave=true; });
    $("#zoom").change(function() { carpetOptions.zoom = parseFloat($(this).val()); canvasScaleCSS($("#carpet").get(0), carpetOptions.zoom); });
    $("#name").change(function() { carpetOptions.name = $(this).val(); });

    $("#AA, #AB, #ABA").click( function() { carpetOptions.borderStyle = this.id; needToWeave=true;} );
    $("#upauto").click(function() { carpetOptions.update="auto"; })
    $("#upchange").click(function() { carpetOptions.update="change"; })
    $("#upmanual").click(function() { carpetOptions.update="manual";  })

    // dropzone drag http://stackoverflow.com/questions/6848043/how-do-i-detect-a-file-is-being-dragged-rather-than-a-draggable-element-on-my-pa
    var dragTimer;
    $(document).on('dragover', function(evt) {
        evt.preventDefault();
        var dt = evt.originalEvent.dataTransfer;
        if(dt.types != null && (dt.types.indexOf ? dt.types.indexOf('Files') != -1 : dt.types.contains('application/x-moz-file'))) {
            $("#dropzone").show();
            $("#states").hide();
            window.clearTimeout(dragTimer);
        }
    });
    $(document).on('dragleave', function(e) {
        dragTimer = window.setTimeout(function() {
            $("#dropzone").hide();
            $("#states").show();
        }, 25);
    });
    // $("#dropzone").on('dragover', function(evt) {
        // evt.preventDefault();
    // });
    $("#dropzone").on('drop', function(evt) {
        evt.preventDefault();
        evt.dataTransfer = evt.originalEvent.dataTransfer;
        var files = evt.dataTransfer.files;
        for (i=0; i<files.length; i++) {

            readOneFile = function(file)
            {
                // single .carpet file
                if (typeof FileReader !== "undefined" && file.name.indexOf(".carpet") != -1) {
                    var reader = new FileReader();
                    reader.onload = function (evt) {
                        createState(file.name.replace(".carpet", ""), evt.target.result);
                        console.log("dropped", file.name);
                    };
                    reader.readAsText(file);
                }
                // zip archive of .carpet files
                if (typeof FileReader !== "undefined" && file.name.indexOf(".zip") != -1) {
                    var reader = new FileReader();
                    reader.onload = function (evt) {
                        var zip = xxx = new JSZip(evt.target.result);
                        a = zip.file(/\.carpet/);
                        console.log(a);
                        for (i=0; i<a.length; i++)
                        {
                            n = a[i].name;
                            console.log(i, n);
                            createState(n.replace(".carpet", ""), zip.file(n).asText());
                            // console.log(n.replace(".carpet", ""), zip.file(n).asText());
                        }
                        updateStateLinks();
                    }
                }
                reader.readAsBinaryString(file);
            }
            var file = files[i];
            readOneFile(file);
        }
        $("#dropzone").hide();
        $("#states").show();
    });
    //  - + - + - + - +
    //  - SET DEFAULTS
    //  - + - + - + - +

    carpetOptions = {
            name : "defaultStateName",
            tassel : tassel,
            outside : outside,
            inside : inside,
            corner : corner,
            border1 : border1,
            border2 : border2,
            palette : palette,
            carpet : carpet,
            zoom : 2,
            width : 320,
            height : 200,
            borderStyle : 'AA',
            update : "change",
    };
//    if (window.localStorage.getItem('lastStateName'))
    load(carpetOptions.name);

    var updateIntervalId = setInterval(weaveInterval, 250);
    updateStateLinks();
    updateInterface();

    $("#defaultState").click(function(){
        window.localStorage.setItem("defaultStateName", '{"name":"defaultStateName","tassel":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAICAYAAAA4GpVBAAAADklEQVQIW2NkAAJGwgQAANwACRGrlc8AAAAASUVORK5CYII=","palette":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAICAYAAADeM14FAAAAPUlEQVQIW2NkYGD439DQwFBfX8/ACAIggTorFYZ55+0YMr/PY2A8UCD4X8FSkMH4YDXDy0nxDCAVKIAaAgCQ7w+A+BrDqgAAAABJRU5ErkJggg==","corner":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAZ0lEQVQoU2NkIBEwEqO+lYHhP0wdXg3ICvFqwKbwp5UKWA+GDeiKYQqbjt0Bq0XRgE0xTCFWJyFrAJmMrhjFBmIUY9WAzWThrLn/305LRvgBn+kgxTD3gzSBdcE04HI3ThtwaUBODQCMrznw6Ku7GAAAAABJRU5ErkJggg==","border1":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAMCAYAAACX8hZLAAAAw0lEQVQ4T52UwQ3DMAhF8akDZIVMkXV66wqReqjUFXrrOpkiK2SAnlz9SN/CJBS73Gz4fkAgSTptuL3z9rqmHll6imQtmEXKA/dpzI9lLWcAGKtBNs6+eYDgEYIQ/JlGsSALuCxrpbFVJmTBSwTTAGJGFsQYaKnR8fBDQ6t6q0U2G91G+mxbeG+TqiCe6AwQgbSmQP4BtIJ2SGvZ3thGbd4hrR/Qg0QDU+1ENIrRAnqjf5guvRNeG89gv5a46/cQVeL5v6gucPDCqktHAAAAAElFTkSuQmCC","border2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAMCAYAAACnfgdqAAAAKklEQVQIW2NkQAKMrQwM/2F8VE6dlQpCBkUPuRyQXdUMDIyo9oBMg8kAANo2CnTYAFM5AAAAAElFTkSuQmCC","outside":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAQCAYAAADXnxW3AAAAL0lEQVQIW2NkAAJGBNHKwPCfEUzUWan8ZzxQIPif8cFKpf+Mwllz/yOpQ9MG5wIAQWgL9zVxjP8AAAAASUVORK5CYII=","inside":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAQCAYAAADXnxW3AAAAHUlEQVQIW2NkAAJGBNHGwPCfsd5c/j+SGJoSvFwAyaUDareT8JQAAAAASUVORK5CYII=","width":320,"height":200}');
        load('defaultStateName');
    });
});
