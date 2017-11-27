var StreamObj = {
	readSingle: function(fn){
		process.stdin.setEncoding('utf8');
		process.stdin.resume();
		process.stdin.once('data', function(str) {
	        fn(str); 
	    });
	},
	stopStream: function(){
		process.stdin.pause();
	}
};

module.exports = StreamObj

    