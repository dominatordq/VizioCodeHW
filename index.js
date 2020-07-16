let fetchUrl = require("fetch").fetchUrl;
let jsdom = require('jsdom');
let dom = new jsdom.JSDOM();
var window1 = dom.window;
var document1 = window1.document;
let fs = require("fs");
let request = require('request');
let sizeOf = require('image-size');
const express = require('express');
const app = express();
const port = 3000;

let $ = require('jquery')(window1);
console.log('version:', $.fn.jquery);

let imgArrayCount = 0;
let imgArrayPopulatedCount = 0;

let regexp = /<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/g; // regular experssion for img tags

// Image object to store image properties
let Image = function(id, desc, height, width, url) {
    this.id = id;
    this.desc = desc;
    this.height = height;
    this.width = width;
    this.url = url;
}

let imgArray = new Array(); // create an array of image objects

// function that downloads images from https://www.vizio.com/en/smartcast/... to memory
let download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback); // request/write image from url
    });
};

// function that populates image object array consisting of (<id of img>, <height>, <width>, <url of img>)
let populateArray = function(id, fileName, url) {
    // reads image file from memory to get its properties (width, height, etc.)
    let filedata = fs.readFileSync(__dirname + '\\images\\' + fileName);
    
    let dimensions = sizeOf(filedata); // get dimensions
    imgArray.push(new Image(id, fileName, dimensions.height, dimensions.width, url)); // push this image to the array of imgs
    imgArrayPopulatedCount++; // increment the number of images current in the image array
    console.log("ImageArrayProgress: " + imgArrayPopulatedCount + ":" + imgArrayCount);

    // when the image array is full, populate the html with the image tags!
    if (imgArrayCount === imgArrayPopulatedCount) {
        populateHtmlImages();
    }
}

let populateHtmlImages = function() {
    console.log("Status: Sorting and populating image array");
    // sort function from smallest to greatest height
    imgArray.sort(function(a, b) {
        if (a.height - b.height !== 0)
            return a.height - b.height;
        return a.width - b.width;
    });

    const imageDir = __dirname + "\\images\\"; // directory where the images are stored in memory

    // (line 70-93) display images on webpage (using a regex -- very sloppy hehe)
    console.log("Building index.html file");
    // read html template from memory (will clear img tags from between divs)
    fs.readFile("./baseindex.html", 'utf8', function(err, data) {
        if (err) return console.log(err);

        // write to index.html
        fs.writeFile('./index.html', data, 'utf8', function (err) {
            if (err) return console.log(err);
        });

        let toPrepand = [];
        
        // get each image source and append to an array
        for (let img of imgArray){
            toPrepand.push("<img src=" + "\"" + ".\\images\\" + img.desc + "\"" + ">\n");
        }
        // convert array of sources to string and write it to index.html
        data = data.replace(/\<\/div>/g, toPrepand.join(' ') + '</div>');
        
        // write final code with img tags to index.html
        fs.writeFile('./index.html', data, 'utf8', function (err) {
            if (err) return console.log(err);
        });
        
    });
    // start express server to execute index.html
    app.use(express.static(__dirname));
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/index.html');
    });
    app.listen(port, () => console.log('The server running on Port ' + port));
}

// acts as a main function, gets the images from the vizio url
fetchUrl("https://www.vizio.com/en/smartcast", function(error, meta, body) {
    let htmlBody = body.toString(); // convert html of website to a string
    console.log(htmlBody.match(regexp));
    let images = htmlBody.match(regexp); // match all the img tags and return
    let i = 0;
    
    imgArrayCount = images.length; // stores the number of images present

    // iterate through each image
    for (let img of images) {
        let $content = $($.parseHTML(img)); // convert string to html so jquery can parse it
        $content.attr('id', i); // add an id to each image
        // if a src exists
        if ($content.attr('src') !== undefined) {
            let url = "https://www.vizio.com" + $content.attr('src'); // url to current image from vizio website 
            
            let fileName = url.slice(url.lastIndexOf('/') + 1); // get the name of the image file itself
            // call download function to download image to memory
            download(url, './images/' + fileName, function(){
                console.log('Downloaded: ' + fileName);
                populateArray(i++, fileName, url); // call function to populate array
            });
        }

        // if a data-src exists as opposed to a src
        if ($content.attr('data-src') !== undefined) {
            let url = "https://www.vizio.com" + $content.attr('data-src');
            let fileName = url.slice(url.lastIndexOf('/') + 1);
            
            download(url, "./images/" + fileName, function(){
                console.log('Downloaded: ' + fileName);
                populateArray(i++, fileName, url);
            });
        }
    } 
});
