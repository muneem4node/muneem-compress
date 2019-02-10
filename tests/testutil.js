const MockReq = require('mock-req');
const zlib = require('zlib');

module.exports = {
    buildReq : buildReq,
    assertAnswerObject : assertAnswerObject,
    assertResponse : assertResponse,
    assertCompressedResponse : assertCompressedResponse,
    assertUncompressedResponse : assertUncompressedResponse
}

    function buildReq(muneem, encoding){
        if(encoding === undefined) encoding = "deflate, gzip";
        muneem.route({
            url: "/test",
            to: "main"
        });

        return new MockReq({
            url: '/test',
            headers : {
                "accept-encoding" : encoding 
            }
        });
    }

    function assertAnswerObject(answer, data, type, length){
        expect(answer.data ).toEqual(data);
        expect(answer.type() ).toEqual(type);
        expect(answer.length() ).toEqual(length);
    }

    function uncompress(data, encoding){
        if(encoding === "gzip"){
            return zlib.gunzipSync(data);
        }else if(encoding === "deflate"){
            return zlib.inflateSync(data);
        }
    }

    function assertResponse(response, data, status, done){
        response.on('finish', function() {
            expect(response._getString() ).toEqual(data);
            expect(response.statusCode ).toEqual(status);
            done();
        });
    }

    function assertCompressedResponse(response, data, status, done, type, encoding){

        let chunks = [];   
        response.on('data', chunk => {
            chunks.push(chunk);
        });
        response.on('finish', function() {
            chunks = Buffer.concat(chunks);
            expect( response.getHeader("content-type")).toEqual( type );
            expect( response.getHeader("content-length")).toEqual( undefined );
            expect( response.getHeader("content-encoding") ).toEqual( encoding );
            expect( uncompress( chunks, encoding ).toString() ).toEqual( data );
            expect( response.statusCode ).toEqual( status );
            done();
        });

    }


    function assertUncompressedResponse(response, data, status, done){

        let chunks = [];   
        response.on('data', chunk => {
            chunks.push(chunk);
        });
        response.on('finish', function() {
            chunks = Buffer.concat(chunks);
            expect( response.getHeader("content-encoding") ).toEqual( undefined );
            expect( chunks.toString() ).toEqual( data );
            expect( response.statusCode ).toEqual( status );
            done();
        });

    }