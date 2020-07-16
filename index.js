let fetchUrl = require("fetch").fetchUrl;
let jsdom = require('jsdom');
let dom = new jsdom.JSDOM();
var window1 = dom.window;
var document1 = window1.document;
let fs = require("fs");
let sizeOf = require('image-size');
const express = require('express');
const app = express();
const port = 3000;

let $ = require('jquery')(window1);
console.log('version:', $.fn.jquery);

let regexp = /<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/g; // regular experssion for img tags

let Image = function(id, desc, height, width, url) {
    this.id = id;
    this.desc = desc;
    this.height = height;
    this.width = width;
    this.url = url;
}

let imgArray = new Array();

//let fs = require('fs'), request = require('request');

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
            let fileName = url.slice(url.lastIndexOf('/') + 1);
            let filedata = fs.readFileSync(__dirname + '\\images\\' + fileName); // read file to get dimensions
            let dimensions = sizeOf(filedata); // get dimensions
            //console.log(fileName);            
            imgArray.push(new Image(i++, fileName, dimensions.height, dimensions.width, url)); // push this image to the array of objs
            //console.log(imgArray[imgArray.length-1].id);
            //console.log(imgArray[imgArray.length-1].desc);
            //console.log(dimensions.width + 'X' + dimensions.height);

            //getMeta(url);
        //    imgArray.push(new Image($content.attr('id'), $content.attr('src'), 0, 0, url));
        }

        // if a data-src exists as opposed to a src
        if ($content.attr('data-src') !== undefined) {
            let url = "https://www.vizio.com" + $content.attr('data-src');
            let fileName = url.slice(url.lastIndexOf('/') + 1);
            let filedata = fs.readFileSync(__dirname + '\\images\\' + fileName);
            let dimensions = sizeOf(filedata);
            imgArray.push(new Image(i++, fileName, dimensions.height, dimensions.width, url));
            //console.log(imgArray[imgArray.length-1].id);
            //console.log(imgArray[imgArray.length-1].desc);
            //console.log(dimensions.width + 'X' + dimensions.height);
            //console.log(url);
        }
        //console.log(i, img);
        //console.log('id:', $content.attr('id'));
    } 

    // sort function from smallest to greatest height
    imgArray.sort(function(a, b) {
        if (a.height - b.height !== 0)
            return a.height - b.height;
        return a.width - b.width;
    })
    console.log(imgArray);

    const imageDir = __dirname + "\\images\\";

    let alreadyDisplayed = true;

    // display images on webpage (using a regex -- very sloppy hehe)
    if (alreadyDisplayed === false) {
    
        fs.readFile("./index.html", 'utf8', function(err, data) {
            if (err) return console.log(err);
        
            let toPrepand = [];
            // get each image source and append to an array
            for (let img of imgArray){
                toPrepand.push("<img src=" + "\"" + ".\\images\\" + img.desc + "\"" + ">");
            }
            // convert array of sources to string and write it to index.html
            data = data.replace(/\<\/div class>/g, toPrepand.join('') + '</div>');
            //console.log(data);
            fs.writeFile('./index.html', data, 'utf8', function (err) {
                if (err) return console.log(err);
            });
            
        });
        alreadyDisplayed = true;
    }
    // open/create express server to display webpage
    app.use(express.static(__dirname));
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/index.html');
    })
    app.listen(port, () => console.log('The server running on Port ' + port));

});
