# muneem-compress

[![Greenkeeper badge](https://badges.greenkeeper.io/node-muneem/muneem-compress.svg)](https://greenkeeper.io/)

Compression package for muneem framework

Compression is by default applied to all the routes based on accept encoding header. "gzip" is the default encoding applied when header value is "*". 

You can either disable compression globally and use on your routes only. Or you can keep it globally enabled but disable for particular route. 

As the compression require CPU and time, you may avoid it for small responses by setting `threshold`. Or you may also use [निम्न (Nimn)](http://nimn.in) data format which is already smaller than compressed JSON.

```
JSON :  551
JSON + gzip:  294
JSON + deflate:  282

Msgpack :  420
Msgpack + gzip:  291
Msgpack + deflate:  279

Nimn :  190
Nimn + gzip:  165
Nimn + deflate:  153
```

As you've noticed in above statistics, the size of Nimn data format without compression (190 bytes) is smaller than compressed JSON (282 bytes). So you may decide to avoid compression in this case. 

As you can send only string or buffer data to the user, this module also accepts string or buffer only data and error when invalid data is provided. However, you may set `errorOnInvalidData` to false when you want to disable compression in case of invalid data (not recommend).

Some of the clients may not handle compressed response, and some of the projects want to apply compression through some API gateway for particular routes. In such conditions, you can overwrite `filter()`. Currently it disable compression when  `x-no-compression` header is present or when `cache-control` header is set to 'no-transform'.

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
    },
    keepItOn : true //keep the compression on for all routes by default
}
var muneem = new Muneem();
var compressor = require("muneem-compress")( muneem , options );

var reqHandler = function(asked, answer) {
    //:
    answer.write(..);
    //answer.compress(false)//to by pass compression
    //answer.compress(options)//to compress with different settings
    answer.compress()//to manually compress
}
muneem.start();
```

Please note that as the client can accept multiple encodings define in `accept-encoding` header, this package use encoding with maximum priority.

```
// Multiple algorithms, weighted with the quality value syntax:
Accept-Encoding: deflate, gzip;q=1.0, *;q=0.5
```

Currently this package supports **gzip**, and **deflate** compression. You may raise a request to support more encodings.

