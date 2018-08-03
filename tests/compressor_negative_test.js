const MockRes = require('mock-res');
const MockReq = require('mock-req');
const Muneem = require('muneem');
const compressor = require('./../src/compressor');
const { buildReq, assertAnswerObject, assertCompressedResponse, assertUncompressedResponse} = require("./testutil");
const intoStream = require('into-stream');

describe ('Compressor', () => {

    it('should not compress if data is null', () => {
        const muneem = Muneem();
        compressor(muneem, null, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write(null);
            expect(() => {
                answer.compress();
            }).toThrowError("Invalid data to compress");
        } ) ;

        var request = buildReq(muneem);
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });
 
    it('should not compress if data is undefined', () => {
        const muneem = Muneem();
        compressor(muneem, null, false);

        muneem.addHandler("main", (asked,answer) => {
            expect(() => {
                answer.compress();
            }).toThrowError("Invalid data to compress");
        } ) ;

        var request = buildReq(muneem);
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    it('should not compress if data is not string or buffer', () => {
        const muneem = Muneem();
        compressor(muneem, null, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write({hello: "world"});
            expect(() => {
                answer.compress();
            }).toThrowError("Invalid data to compress");
        } ) ;

        var request = buildReq(muneem);
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    it('should not compress for small payload', () => {
        const muneem = Muneem();
        compressor(muneem, null, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write('{hello: "world"}');
            answer.compress();
            assertAnswerObject(answer, '{hello: "world"}');
        } ) ;

        var request = buildReq(muneem);
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    it('should not throw error not compress when invalid data is set and errorOnInvalidData is false', () => {
        const muneem = Muneem();
        compressor(muneem, {
            errorOnInvalidData : false
        }, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( {hello: "world"} );
            answer.compress();

            assertAnswerObject(answer, {hello: "world"} , undefined );
        } ) ;

        var request = buildReq(muneem, "other");
        
        var response = new MockRes();

        //assertUncompressedResponse(response, '{hello: "world"}', 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    it('should not compress if threshhold is not crossed', (done) => {
        const muneem = Muneem();
        compressor(muneem, null, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write('{hello: "world"}');
            answer.compress();

            assertAnswerObject(answer, '{hello: "world"}' , undefined );
            done();
        } ) ;

        var request = buildReq(muneem);
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    it('should not compress if default filter returns true due to header: x-no-compression', (done) => {

        const muneem = Muneem();
        compressor(muneem, null, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write('{hello: "world"}');
            answer.compress();

            assertAnswerObject(answer, '{hello: "world"}' , undefined );
            done();
        } ) ;

        var request = buildReq(muneem);
        request.headers["x-no-compression"] = true;

        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    it('should not compress if default filter returns true due to header: cache-control', (done) => {

        const muneem = Muneem();
        compressor(muneem, null, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write('{hello: "world"}');
            answer.compress();

            assertAnswerObject(answer, '{hello: "world"}' , undefined );
            done();
        } ) ;

        var request = buildReq(muneem);
        request.headers["cache-control"] = "no-transform";
        
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    it('should not compress if custom filter returns true', (done) => {

        const muneem = Muneem();
        compressor(muneem, null, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write('{hello: "world"}');
            answer.compress( {
                filter: () =>true
            });

            assertAnswerObject(answer, '{hello: "world"}' , undefined );
            done();
        } ) ;

        var request = buildReq(muneem);
        request.headers["cache-control"] = "no-transform";
        
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    }); 

    it('should not compress if compress flag is set to false', (done) => {
        const muneem = Muneem();
        compressor(muneem, null, true);

        muneem.addHandler("main", (asked,answer) => {
            answer.write('{hello: "world"}');
            answer.compress(false);

            assertAnswerObject(answer, '{hello: "world"}' , undefined );
            done();
        } ) ;

        var request = buildReq(muneem);
        request.headers["cache-control"] = "no-transform";
        
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    /* it('should not compress when accepted encodings is not supported and return response with 406 when skipIfNotSupported is true', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold : 10
        } , false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write('{hello: "world"}');
            answer.compress();

            //assertAnswerObject(answer, '{hello: "world"}' , undefined );
        } ) ;

        var request = buildReq(muneem, "other");
        
        var response = new MockRes();

        assertCompressedResponse(response, undefined, 406, done, undefined , undefined );
        muneem.routesManager.router.lookup(request,response);
    }); */

    it('should not compress when accepted encodings are not supported', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold : 10,
            //skipIfNotSupported : true
        }, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( '{hello: "world"}');
            answer.compress();

            assertAnswerObject(answer, '{hello: "world"}');
            done();
        } ) ;

        var request = buildReq(muneem, "other");
        
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    it('should not compress when a stream is given but filter() returns true', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            filter : () => true
        }, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( intoStream('{hello: "world"}') );
            answer.compress();

        } ) ;

        var request = buildReq(muneem, "other");
        
        var response = new MockRes();

        assertUncompressedResponse(response, '{hello: "world"}', 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

    

    it('should not compress when encoding is identity', (done) => {
        const muneem = Muneem();
        compressor(muneem, {
            threshold : 10,
        }, false);

        muneem.addHandler("main", (asked,answer) => {
            answer.write( '{hello: "world"}');
            answer.compress();

            assertAnswerObject(answer, '{hello: "world"}');
            done();
        } ) ;

        var request = buildReq(muneem, "identity");
        
        var response = new MockRes();

        //assertResponse(response,"", 200, done);
        muneem.routesManager.router.lookup(request,response);
    });

});