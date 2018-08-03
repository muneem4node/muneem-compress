const Accept = require('accept');
const pump = require('pump');
const zlib = require('zlib');
const intoStream = require('into-stream');

const isStream = function(data){
    return data && data.pipe && (typeof data.pipe === "function")
}

const defaultOptions = {
    //preference : [], //apply encoding as per given preference
    //if accepted encoding is supported but not in preference still compression will be applied
    //stickToPreference: false,
    // minimum length of data to apply compression. Not applicable on stream
    defaultEncoding: "gzip",
    skipIfNotSupported: false,
    errorOnInvalidData : true,
    threshold : 1024,
    filter : function(asked, answer){//return true when not to compress
        if(asked.headers['x-no-compression'] || asked.headers['cache-control'] === 'no-transform'){
            return true;
        }else{
            return false;
        }
    }
};

var desiredOptions;
const supportedEncodings = {
    "gzip" : zlib.createGzip,
    "deflate" : zlib.createDeflate,
    //"*" : zlib.createGzip()
    //"identity" : function(data){ return data;}
};

module.exports = (muneem, options, keepItOn) => {
    desiredOptions = Object.assign( {}, defaultOptions, options);
    if( ! supportedEncodings [desiredOptions.defaultEncoding ] ) {
        throw Error("You must set default encoding to one of the supported encoding");
    }
    muneem.addToAnswer("compress", compress );
    if(keepItOn !== false){
        muneem.before("answer", compressEvent );
    }
}

function compressEvent(asked, answer){
    compress( null, asked, answer);
}

function compress(options, asked, answer){
    if(!asked) asked = this._for;
    if(!answer) answer = this;

    if(options === false || answer._compressed ){
        return answer;
    }

    if(options){
        options = Object.assign( {}, desiredOptions, options);
        if( ! supportedEncodings [options.defaultEncoding ] ) {
            throw Error("You must set default encoding to one of the supported encoding");
        }
    }else{
        options = desiredOptions;
    }

    var isItAStream = isStream(answer.data);
    if( options.filter(asked, answer) ) return true;

    if( !isItAStream ){
        if( typeof answer.data === 'string' || Buffer.isBuffer( answer.data ) ){
            if( options.threshold > Buffer.byteLength( answer.data ) ){
                return answer;
            }
        }else{
            if( options.errorOnInvalidData ){
                throw Error("Invalid data to compress");
            }else{
                //answer.logger.info("Data can not be compressed");
                return answer;
            }
        }
    }

    const encodingHeader = asked.headers["accept-encoding"];
    if( !encodingHeader ) return;

    let encodingName = encodingHeader;
    if(encodingName === "*"){
        encodingName = options.defaultEncoding;
    }

    let encodingStream = supportedEncodings[ encodingName ];//when only one encoding name is given

    if( !encodingStream ){//when multiple encoding schems are acceptable 
        const acceptTypes = Accept.encodings( encodingHeader );
        for(let i=0;i<acceptTypes.length && !encodingStream; i++){
            encodingName = acceptTypes[i];
            if(encodingName === "*"){
                encodingName = options.defaultEncoding;
            }
            encodingStream = supportedEncodings[ encodingName  ];
        }

        if( !encodingStream){
            return answer;
            /* if(options.skipIfNotSupported || encodingName === "identity"){
                return;
            }else{
                answer.data = '';
                answer.end(406,"Accepted encodings are not supported");
                return;
            } */
        }
    }

    var dataStream;
    answer.setHeader("content-encoding", encodingName);
    answer.removeHeader("content-length");
    //answer.data = pump(answer.data, encodingStream);
    if( !isItAStream ){
        dataStream = intoStream(answer.data);    
    }else{
        dataStream = answer.data;
    }
    answer.data = pump(dataStream,   encodingStream() );
    answer._compressed = true;
    return answer;
}