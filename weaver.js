// count colors in first/single column and return array
function getSingleColumnColors(ctx)
{
    r = [];
    for (y=0; y<ctx.canvas.height; y++)
    {
        c = ctx.getPixel(0,y);
        if (c[3]==255) r.push(c);
    }
    return r;
}

// o output, maxWidth, bordersStyle (AA/AB/ABA), border1, border2, corner
function createBorderStrip(o, maxWidth, borderStyle, br1, br2, cor)
{
    // this object has 4 arrays with columns that can be duplicated according to dup. option
    var possibleRowDuplicates = { Af:[], Bf:[], Al:[], Bl:[] };
    var cor_width = 0;

    if (cor===undefined) {
        canvasCloneInto(br1, o);
        possibleRowDuplicates.Af.push(0);
        possibleRowDuplicates.Al.push(br1.width-1);
    }
    else {
        cor_width = cor.width;
        canvasCloneInto(cor, o);
        canvasConcat(o, br1);
        possibleRowDuplicates.Af.push(cor.width);
        possibleRowDuplicates.Al.push(cor.width+br1.width-1);
    }
    switch (borderStyle)
    {
        default:
        case "AA":
            next = br1;
            while (o.width + next.width + cor_width <= maxWidth) {
                canvasConcat(o, next);
                possibleRowDuplicates.Af.push(o.width-br1.width);
                possibleRowDuplicates.Al.push(o.width-1);
            }
            break;
        case "AB":
            next = br2;
            while (o.width + next.width + cor_width <= maxWidth) {
                canvasConcat(o, next);
                switch (next)
                {
                    case br1:
                        possibleRowDuplicates.Af.push(o.width-br1.width);
                        possibleRowDuplicates.Al.push(o.width-1);
                        break;
                    case br2:
                        possibleRowDuplicates.Bf.push(o.width-br2.width);
                        possibleRowDuplicates.Bl.push(o.width-1);
                        break;
                }
                next = next == br1 ? br2 : br1;
            }
            break;
        case "ABA":
            next = canvasClone(br2);
            canvasConcat(next, br1); // next is BA
            while (o.width + next.width + cor_width <= maxWidth) {
                canvasConcat(o, next);

                possibleRowDuplicates.Af.push(o.width-br1.width);
                possibleRowDuplicates.Al.push(o.width-1);
                possibleRowDuplicates.Bf.push(o.width-br2.width-br1.width);
                possibleRowDuplicates.Bl.push(o.width-br1.width-1);
            }
            break;
    }
    if (cor!==undefined) {
        t = canvasClone(cor);
        //canvasRotate90(t);
        canvasFlip(t);
        canvasConcat(o, t);
    }
    o.possibleRowDuplicates = possibleRowDuplicates;
}

// duplicate rows in canvas according to style
// args: dest canvas, number of added rows, border style (AA/AB/ABA), corner width if any, border 1 width, border 2 width
function duplicateRows(cnv, rowNum, style, cw, b1w, b2w)
{
    if (rowNum<=0 || style=="none") return;

    // first proper array with columns to be duplicated is chosen
    var arr;
    switch (style)
    {
        case "Afirst":
            arr = cnv.possibleRowDuplicates.Af;
            break;

        case "Alast":
            arr = cnv.possibleRowDuplicates.Al;
            break;

        case "Bfirst":
            arr = cnv.possibleRowDuplicates.Bf;
            break;

        case "Blast":
            arr = cnv.possibleRowDuplicates.Bl;
            break;
    }
    if (arr===undefined || !arr.length) return;

    // create zero filled array for every possible column duplicate
    // this array's value indicates how many columns will be inserted here
    var a = Array.apply(null, Array(arr.length)).map(Number.prototype.valueOf,0);
    var distributed = 0;
    // evenly distribute 'rowNum' number into 'a' array
    for (var i=0; i<arr.length; i++)
    {
    	distributed += a[i] = Math.round((i+1)*rowNum/(arr.length)-distributed);
    }
    // insert columns
    for (var j=arr.length-1; j>=0; j--)
    {
        canvasDuplicateColumn(cnv, arr[j], a[j]);
    }
}

function weave(o, options)
{
    tas = options.tassel;
    out = options.outside;
    ins = options.inside;
    cor = options.corner;
    br1 = options.border1;
    br2 = options.border2;

    tas.ctx = tas.getContext('2d');
    out.ctx = out.getContext('2d');
    ins.ctx = ins.getContext('2d');
    cor.ctx = cor.getContext('2d');
    br1.ctx = br1.getContext('2d');
    br2.ctx = br2.getContext('2d');

    // canvasClear(o);
    // o.ctx = o.getContext('2d');
    // canvasSetSize(o, options.width, options.height);

    outrim = getSingleColumnColors(out.ctx);
    rimwidth = outrim.length;
    insrim =  getSingleColumnColors(ins.ctx);
    tasarr =  getSingleColumnColors(tas.ctx);

    // no rim width & height
    nrw = options.width - rimwidth*2;
    nrh = options.height - rimwidth*2;

    // create top border strip [cor/bor1/bor2.../cor]
    createBorderStrip(o, nrw, options.borderStyle, br1, br2, cor);
    db = canvasClone(o);
    canvasFlop(db);
    // create bottom border strop
    canvasFlip(db);
    canvasStack(o, db);

    // create left & right borders without corners [bor1/bor2/.../borX] and insert them
    t = canvasCreate();
    createBorderStrip(t, nrh-cor.height*2, options.borderStyle, br1, br2);
    duplicateRows(t, nrh-cor.height*2-t.width, options.duplicateRows, 0, br1.width, br2.width);
    canvasRotate90(t);
    db = canvasClone(t);
    canvasFlip(db);
    canvasInsertRows(o, cor.height, db.height);
    canvasPaste(o, db, 0, cor.height);
    canvasFlip(db);
    canvasFlop(db);
    canvasPaste(o, db, o.width-cor.width, cor.height);

    canvasSetSize(o, o.width, o.height);

    // put inner rims
    x = cor.width;
    y = cor.height;
    x2 = o.width-x-1;
    y2 = o.height-y-1;
    for(var index in insrim)
    {
        canvasRectPx(o, x+0.5,y+0.5,x2+0.5,y2+0.5,insrim[index],1);
        x++;
        y++;
        x2--;
        y2--;
    }

    var innerStartX = x;
    var innerStartY = y;
    var innerEndX = x2;
    var innerEndY = y2;
	var innerW = innerEndX-innerStartX+1;
	var innerH = innerEndY-innerStartY+1;

    // finaly outer rims
    if (outrim.length>0) canvasAddRim(o, outrim);

    // tassels
    t = canvasCreate(1, o.height);
    m = tasarr.length;
    if (m>0) for (y=0; y<t.height; y++) t.ctx.setPixel(0, y, tasarr[y%m]);
    m = options.width - o.width;
    if (m>0)
    {
        l = Math.round(m/2);
        r = m-l;
        canvasSetSize(o, o.width+r, -1);
        while (l>0) {
            canvasInsertColumns(o, 0, 1);
            canvasPaste(o, t, 0, 0);
            l--;
        }
        while (r>0) {
            canvasPaste(o, t, o.width-r, 0);
            r--;
        }
    }

    ow = o.width;
    oh = o.height;
    while (o.height<options.height)
    {
        if (o.height%2)
            canvasInsertRows(o, 0);
        else
            canvasInsertRows(o, o.height);
    }

    // print the dimensions
    o.ctx.fillStyle = "black";
    o.ctx.font = "bold 14px Arial";
    o.ctx.textAlign="center";
    o.ctx.fillText(
    				"PNG:"+options.width+"x"+options.height+
//    				" / CRP:"+ow+"x"+oh+
    				" / INS:"+innerW+"x"+innerH,
                    o.width/2,o.height/2
    				);
}
