# muneem-compress
Compression package for muneem framework


```JavaScript
var Muneem = require("muneem");
var options = {
    defaultEncoding: "gzip",
    errorOnInvalidData : true,
    threshold : 1024,
    filter : function(asked, answer){//return true when not to compress
        if(asked.headers['x-no-compression'] || asked.headers['cache-control'] === 'no-transform'){
            return true;
        }else{
            return false;
        }
    }
}
var muneem = new Muneem();
var compressor = require("muneem-compress")( muneem , options, keepItOn);//keepItOn to enable compression for all routes

var reqHandler = function(asked, answer) {
    //:
    answer.write(..);
    //answer.compress(false)//to by pass compression
    //answer.compress(options)//to compress with different settings
    answer.compress()//to manually compress
}
muneem.start();
```