function prepareCanvas(cnv) {
    ctx = cnv.getContext("2d");
    cnv.ctx = ctx;
    ctx.lineCap = "round";
    ctx.save();
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
}

function canvasCreate(w = 1, h = 1) {
    t = document.createElement('canvas');
    canvasSetSize(t, w, h);
    return t;
}

function canvasSetSize(cnv, w, h) {
    img = cnv.getContext("2d").getImageData(0, 0, cnv.width, cnv.height);
    if (w > 0) cnv.width = w;
    if (h > 0) cnv.height = h;
    prepareCanvas(cnv);
    cnv.ctx = ctx = cnv.getContext("2d");
    ctx.putImageData(img, 0, 0);
    if (parseFloat(cnv.sclx) > 0 && parseFloat(cnv.scly) > 0) canvasScaleCSS(cnv, cnv.sclx, cnv.scly);
}

function canvasScaleCSS(cnv, scaleX, scaleY = -1) {
    if (scaleX === undefined || scaleX < 0) scaleX = 1;
    if (scaleY < 0) scaleY = scaleX;
    $(cnv).css('width', cnv.width * scaleX);
    $(cnv).css('height', cnv.height * scaleY);
    cnv.sclx = scaleX;
    cnv.scly = scaleY;
}

function canvasClear(canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

// Manuel Rülke / http://homecoded.com/blog-entry-148.html
function getUniqueColors(canvas) {
    var context = canvas.getContext('2d');
    var imgd;

    var w = canvas.width;
    var h = canvas.height;

    try {
        try {
            imgd = context.getImageData(0, 0, w, h);
        } catch (e) {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
            imgd = context.getImageData(0, 0, w, h);
        }
    } catch (e) {
        throw new Error("unable to access image data: " + e);
    }

    var report = document.getElementById("report");
    var elementsToProcess = w * h;
    var elementsProcessed = 0;

    var colorArray = [];
    var colorArrayOut = [];

    for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
            var i = (y * 4) * w + (x * 4);
            var red = imgd.data[i];
            var green = imgd.data[i + 1];
            var blue = imgd.data[i + 2];
            elementsProcessed++;

            var color = red << 16 | green << 8 | blue;
            var colorString = color.toString();
            if (colorArray[colorString] === null)
                colorArray[colorString] = 1;
            else
                colorArray[colorString] += 1;
        }
    }

    var repString = "";
    var colors = 0;
    var htmlColor;

    for (var c in colorArray) {
        colorArray[c] = [c >> 16, (c >> 8) & 0xff, c & 0xff, 255];
        colorArrayOut[colors] = colorArray[c];
        colors++;
        //        htmlColor = "#" + parseInt(c, 10).toString(16).toUpperCase();
        //        repString += "<sp"+"an style='background-color:" + htmlColor +"; border: 1px solid black;'>&nbsp;&nbsp;&nbsp;&nbsp;<"+"/span> color " + htmlColor + " : " + colorArray[i] + "<br>";
    }

    //    r = "There are " + colors + " different colors in this image.<br>";
    //    r += repString;
    //    return r;
    //    console.log("colros found",colors, colorArrayOut.length);
    return colorArrayOut;
}

// http://stackoverflow.com/questions/3318565/any-way-to-clone-html5-canvas-element-with-its-content
function canvasClone(oldCanvas) {
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;
    context.drawImage(oldCanvas, 0, 0);
    return newCanvas;
}

function canvasCloneInto(src, dst) {
    canvasSetSize(dst, src.width, src.height);
    canvasClear(dst);
    dst.getContext('2d').drawImage(src, 0, 0);
}

function canvasRotate90(cnv) {
    old = canvasClone(cnv);
    canvasSetSize(cnv, cnv.height, cnv.width);
    canvasClear(cnv);
    ctx = cnv.getContext('2d');
    ctx.save();
    ctx.translate(old.height, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(old, 0, 0);
    canvasCloneInto(cnv, old);
    canvasCloneInto(old, cnv);
}

function canvasFlip(cnv) {
    old = canvasClone(cnv);
    canvasClear(cnv);
    ctx = cnv.getContext('2d');
    ctx.save();
    ctx.translate(old.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(old, 0, 0);
    canvasCloneInto(cnv, old);
    canvasCloneInto(old, cnv);
}

function canvasFlop(cnv) {
    old = canvasClone(cnv);
    canvasClear(cnv);
    ctx = cnv.getContext('2d');
    ctx.save();
    ctx.translate(0, old.height);
    ctx.scale(1, -1);
    ctx.drawImage(old, 0, 0);
    canvasCloneInto(cnv, old);
    canvasCloneInto(old, cnv);
}

function canvasRectPx(cnv, x, y, x2, y2, color = [0, 0, 0], width = 1.05) {
    ctx.lineWidth = width;
    ctx.strokeStyle = color2rgba(color);
    ctx.strokeRect(x, y, x2 - x, y2 - y);
}

function canvasAddRim(cnv, color) {
    if (typeof(color) == 'object' && typeof(color[0]) == 'object') {
        for (i = color.length - 1; i >= 0; --i) canvasAddRim(cnv, color[i]);
    } else {
        old = canvasClone(cnv);
        canvasSetSize(cnv, cnv.width + 2, cnv.height + 2);
        canvasClear(cnv);
        canvasRectPx(cnv, 0.5, 0.5, cnv.width - 0.5, cnv.height - 0.5, color, 1);
        //canvasRectPx(cnv, 0,0,cnv.width-1, cnv.height-1, color, 1);
        ctx.drawImage(old, 1, 1);
    }
}

function canvasInsertColumns(cnv, x, w = 1) {
    old = canvasClone(cnv);
    canvasSetSize(cnv, cnv.width + w, cnv.height);
    canvasClear(cnv);
    ctx = cnv.getContext('2d');
    if (x > 0) ctx.drawImage(old, 0, 0, x, old.height, 0, 0, x, old.height);
    if (old.width > x) ctx.drawImage(old, x, 0, old.width - x, old.height, x + w, 0, old.width - x, old.height);
}

function canvasDuplicateColumn(cnv, x, w = 1) {
    canvasInsertColumns(cnv, x, w);
    ctx = cnv.getContext('2d');
    ctx.drawImage(cnv, x + w, 0, 1, cnv.height, x, 0, w, cnv.height);
}

function canvasInsertRows(cnv, y, h = 1) {
    old = canvasClone(cnv);
    canvasSetSize(cnv, cnv.width, cnv.height + h);
    canvasClear(cnv);
    if (y > 0) cnv.ctx.drawImage(old, 0, 0, old.width, y, 0, 0, old.width, y);
    if (old.height > y) cnv.ctx.drawImage(old, 0, y, old.width, old.height - y, 0, y + h, old.width, old.height - y);
}

function canvasPaste(cnv, src, x, y) {
    cnv.getContext('2d').drawImage(src, x, y);
}

function canvasPaste2(cnv, src, sx, sy, sw, sh, x, y, dw, dh) {
    cnv.getContext('2d').drawImage(src, sx, sy, sw, sh, x, y, dw, dh);
}

function canvasConcat(cnv, newcnv) {
    //    console.log("concat");
    if (arguments.length == 2) {
        newcnv = canvasClone(newcnv);
        canvasSetSize(cnv, cnv.width + newcnv.width, Math.max(cnv.height, newcnv.height));
        cnv.ctx.drawImage(newcnv, cnv.width - newcnv.width, 0);
    }
    //    console.log("concat");
    else {
        for (i = 1; i < arguments.length; i++) {
            canvasConcat(cnv, arguments[i]);
        }
    }
}

function canvasStack(cnv, newcnv) {
    if (arguments.length == 2) {
        newcnv = canvasClone(newcnv);
        canvasSetSize(cnv, Math.max(cnv.width, newcnv.width), cnv.height + newcnv.height);
        cnv.ctx.drawImage(newcnv, 0, cnv.height - newcnv.height);
    } else {
        for (i = 1; i < arguments.length; i++) {
            canvasStack(cnv, arguments[i]);
        }
    }
}

// https://gist.github.com/binarymax/4071852
function canvasFloodfill(cnv, x, y, fillcolor, width, height, tolerance = 1) {
    if (fillcolor.length == 3) fill.color[3] = 255;
    ctx = cnv.getContext('2d');
    var img = ctx.getImageData(0, 0, width, height);
    var data = img.data;
    var length = data.length;
    var Q = [];
    var i = (x + y * width) * 4;
    var e = i,
        w = i,
        me, mw, w2 = width * 4;
    var targetcolor = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    var targettotal = data[i] + data[i + 1] + data[i + 2] + data[i + 3];

    if (!pixelCompare(i, targetcolor, targettotal, fillcolor, data, length, tolerance)) {
        return false;
    }
    Q.push(i);
    while (Q.length) {
        i = Q.pop();
        if (pixelCompareAndSet(i, targetcolor, targettotal, fillcolor, data, length, tolerance)) {
            e = i;
            w = i;
            mw = parseInt(i / w2) * w2; //left bound
            me = mw + w2; //right bound
            while (mw < (w -= 4) && pixelCompareAndSet(w, targetcolor, targettotal, fillcolor, data, length, tolerance)); //go left until edge hit
            while (me > (e += 4) && pixelCompareAndSet(e, targetcolor, targettotal, fillcolor, data, length, tolerance)); //go right until edge hit
            for (var j = w; j < e; j += 4) {
                if (j - w2 >= 0 && pixelCompare(j - w2, targetcolor, targettotal, fillcolor, data, length, tolerance)) Q.push(j - w2); //queue y-1
                if (j + w2 < length && pixelCompare(j + w2, targetcolor, targettotal, fillcolor, data, length, tolerance)) Q.push(j + w2); //queue y+1
            }
        }
    }
    ctx.putImageData(img, 0, 0);
}

function pixelCompare(i, targetcolor, targettotal, fillcolor, data, length, tolerance) {
    if (i < 0 || i >= length) return false; //out of bounds
    if (data[i + 3] === 0) return true; //surface is invisible

    if (
        (targetcolor[3] === fillcolor[3]) &&
        (targetcolor[0] === fillcolor[0]) &&
        (targetcolor[1] === fillcolor[1]) &&
        (targetcolor[2] === fillcolor[2])
    ) return false; //target is same as fill

    if (
        (targetcolor[3] === data[i + 3]) &&
        (targetcolor[0] === data[i]) &&
        (targetcolor[1] === data[i + 1]) &&
        (targetcolor[2] === data[i + 2])
    ) return true; //target matches surface

    if (
        Math.abs(targetcolor[3] - data[i + 3]) <= (255 - tolerance) &&
        Math.abs(targetcolor[0] - data[i]) <= tolerance &&
        Math.abs(targetcolor[1] - data[i + 1]) <= tolerance &&
        Math.abs(targetcolor[2] - data[i + 2]) <= tolerance
    ) return true; //target to surface within tolerance

    return false; //no match
}

function pixelCompareAndSet(i, targetcolor, targettotal, fillcolor, data, length, tolerance) {
    if (pixelCompare(i, targetcolor, targettotal, fillcolor, data, length, tolerance)) {
        //fill the color
        data[i] = fillcolor[0];
        data[i + 1] = fillcolor[1];
        data[i + 2] = fillcolor[2];
        data[i + 3] = fillcolor[3];
        return true;
    }
    return false;
}

function colormCmp(a, b) {
    if (a.length != 4 || b.length != 4) return false;
    for (i = 0; i < 4; i++)
        if (a[i] != b[i]) return false;
    return true;
}

function canvasFloodfill2(cnv, x, y, fillcolor) {
    ctx = cnv.getContext('2d');
    src = ctx.getPixel(x, y);
    if (colormCmp(src, fillcolor)) return;
    Q = [];
    Q.push(x, y);
    while (Q.length) {
        y = Q.pop();
        x = Q.pop();
        if (x < 0 || x >= ctx.canvas.width || y < 0 || y >= ctx.canvas.height || !colormCmp(src, ctx.getPixel(x, y))) continue;
        ctx.setPixel(x, y, fillcolor);
        Q.push(x + 1, y);
        Q.push(x - 1, y);
        Q.push(x, y + 1);
        Q.push(x, y - 1);
    }
}
