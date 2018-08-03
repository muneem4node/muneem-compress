const zlib = require('zlib');
const MockRes = require('mock-res');
const MockReq = require('mock-req');
const Muneem = require('muneem');
const compressor = require('./../src/compressor');
const { buildReq, assertCompressedResponse, assertUncompressedResponse} = require("./testutil");
const intoStream = require('into-stream');

describe ('Compressor', () => {

    it('should compress by event', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold : 10
        });

        muneem.addHandler("main", (asked,answer) => {
            answer.write('{hello: "world"}', "application/json", 16);
            //answer.compress();

            //assertAnswerObject(answer, '{hello: "world"}' , undefined );
            //done();
        } ) ;

        var request = buildReq(muneem);
        
        var response = new MockRes();

        assertCompressedResponse(response,'{hello: "world"}', 200, done, "application/json" , "deflate");
        muneem.routesManager.router.lookup(request,response);
    });


    it('should not compress multiple times and should compress string', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold : 10
        }, true);

        muneem.addHandler("main", (asked,answer) => {
            answer.write('{hello: "world"}', "application/json", 16);
            answer.compress();//global compress will be ignored
        } ) ;

        var request = buildReq(muneem);
        
        var response = new MockRes();

        assertCompressedResponse(response,'{hello: "world"}', 200, done, "application/json" , "deflate");
        muneem.routesManager.router.lookup(request,response);
    });

    it('should compress when buffer is given', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold : 10
        }, true);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( Buffer.from('{hello: "world"}'), "application/json", 16);
        } ) ;

        var request = buildReq(muneem);
        
        var response = new MockRes();

        assertCompressedResponse(response,'{hello: "world"}', 200, done, "application/json" , "deflate");
        muneem.routesManager.router.lookup(request,response);
    });

    it('should compress when a stream is given', (done) => {
        const muneem = Muneem();
        compressor(muneem, null, true);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( intoStream('{hello: "world"}'), "application/json");
        } ) ;

        var request = buildReq(muneem);
        
        var response = new MockRes();

        assertCompressedResponse(response,'{hello: "world"}', 200, done, "application/json" , "deflate");
        muneem.routesManager.router.lookup(request,response);
    });

    it('should compress with default encoding when all (*) encodings are acceptable by client', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold: 10
        }, true);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( '{hello: "world"}', "application/json");
        } ) ;

        var request = buildReq(muneem, "*");
        
        var response = new MockRes();

        assertCompressedResponse(response,'{hello: "world"}', 200, done, "application/json" , "gzip");
        muneem.routesManager.router.lookup(request,response);
    });

    it('should compress with encoding with high priority when supported', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold: 10
        }, true);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( '{hello: "world"}', "application/json");
        } ) ;

        var request = buildReq(muneem, "gzip;q=1.0, identity; q=0.5, *;q=0");
        
        var response = new MockRes();

        assertCompressedResponse(response,'{hello: "world"}', 200, done, "application/json" , "gzip");
        muneem.routesManager.router.lookup(request,response);
    });

    it('should compress with encoding with next higher priority when top priority encoding is not supported', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold: 10
        }, true);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( '{hello: "world"}', "application/json");
        } ) ;

        var request = buildReq(muneem, "other;q=1.0, identity; q=0.5, *;q=0");
        
        var response = new MockRes();

        assertUncompressedResponse(response,'{hello: "world"}', 200, done);
        //assertCompressedResponse(response,'{hello: "world"}', 200, done, "application/json" , "gzip");
        muneem.routesManager.router.lookup(request,response);
    });

    it('should not compress when encoding is empty', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold: 10
        }, true);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( '{hello: "world"}', "application/json");
        } ) ;

        var request = buildReq(muneem, "");
        
        var response = new MockRes();

        assertUncompressedResponse(response,'{hello: "world"}', 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

});