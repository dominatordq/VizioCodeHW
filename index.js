let fetchUrl = require("fetch").fetchUrl;
let jsdom = require('jsdom');
let dom = new jsdom.JSDOM();
let window = dom.window;
let document = window.document;
let fs = require("fs");
let readimage = require("readimage");

let $ = require('jquery')(window);
console.log('version:', $.fn.jquery);

let regexp = /<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/g; // regular experssion for img tags

/*let Image = function(id, desc, height, width, url) {
    this.id = id;
    this.desc = desc;
    this.height = height;
    this.width = width;
    this.url = url;
}*/

let imgArray = new Array();
/*
function getMeta(url){
    $("<img/>",{
        on : function(){
            alert(this.width+' '+this.height);
        },
        src : url
    });
}
*/

//let fs = require('fs'), request = require('request');

let download = function(url, filename, callback) {
    request.head(url, function(err, res, body) {
        console.log('content-type', res.headers['content-type']);
        request(url).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}

fetchUrl("https://www.vizio.com/en/smartcast", function(error, meta, body) {
    let htmlBody = body.toString(); // convert html of website to a string
    //console.log(htmlBody);
    console.log(htmlBody.match(regexp));
    let images = htmlBody.match(regexp); // match all the img tags and return
    let i = 0;
    
    // iterate through each image
    for (let img of images) {
        let $content = $($.parseHTML(img)); // convert string to html so jquery can parse it
        $content.attr('id', i); // add an id to each image
        // if a src exists
        if ($content.attr('src') !== undefined) {
            let url = "https://www.vizio.com" + $content.attr('src');
            //console.log(url);
            //console.log($content.attr('src'));
            let width, height;
            let fileName = url.slice(url.lastIndexOf('/') + 1);
            if (!fileName.includes(".svg")) {
                var filedata = fs.readFileSync(__dirname + '\\images\\' + fileName);
                //var filedata = fs.readFileSync("C:/Users/ginoq/Documents/VizioCodeHW/images/2020-v5-series-v585-h1-v585-h11-updated.png");
                readimage(filedata, function (err, image) {
                    if (err) {
                        console.log("failed to parse the image")
                        console.log(err)
                    }
                    console.log(fileName);
                    console.log(image.width + 'X' + image.height);
                });
            } else {
                console.log("Skipping .svg for now");
            }
            // create an img tag from the url, display width and height
            
            //getMeta(url);
        //    imgArray.push(new Image($content.attr('id'), $content.attr('src'), 0, 0, url));
        }
        
        if ($content.attr('data-src') !== undefined) {
            let url = "https://www.vizio.com" + $content.attr('data-src');
            //console.log(url);
        }

        //console.log(i, img);
        //console.log('id:', $content.attr('id'));
        i++;
    } 

    let folder = "images/";
    // add every image
    $.ajax({
        url : folder,
        success: function (data) {
            $(data).find("a").attr("href", function (i, val) {
                if( val.match(/\.(jpe?g|png|gif|svg)$/) ) { 
                    $("body").append( "<img src='"+ folder + val +"'>" );
                } 
            });
        }
    });

});
