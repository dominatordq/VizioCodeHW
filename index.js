let fetchUrl = require("fetch").fetchUrl;
let jsdom = require('jsdom');
let dom = new jsdom.JSDOM();
let window = dom.window;
let document = window.document;

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

fetchUrl("https://www.vizio.com/en/smartcast", function(error, meta, body) {
    let htmlBody = body.toString(); // convert html of website to a string
    //console.log(htmlBody);
    //console.log(htmlBody.match(regexp));
    let images = htmlBody.match(regexp); // match all the img tags and return
    let i = 0;
    // iterate through each image
    for (let img of images) {
        let $content = $($.parseHTML(img)); // convert string to html so jquery can parse it
        $content.attr('id', i); // add and id to each image
        // if a src exists
        if ($content.attr('src') !== undefined) {
            let url = "https://www.vizio.com" + $content.attr('src');
            //console.log(url);
            let width, height;
            
            // create an img tag from the url, display width and height
            $(document).ready(function() {
                $("<img/>").attr('src', url)
                  .on('load', function() {
                    console.log(`${this.width} x ${this.height}`);
                    width = this.width;
                    height = this.height;
                  });
            });
            
            //getMeta(url);
        //    imgArray.push(new Image($content.attr('id'), $content.attr('src'), 0, 0, url));
        }
        //console.log(i, img);
        //console.log('id:', $content.attr('id'));
        i++;
    } 
});
