var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	mime = require('mime'),
	chatServer = require('./lib/chat_server'),
	cache = {};

/* 404 error */
function send404 (response){
	response.writeHead(404, {'Content-Type':'text/plain'});
	response.write('Error 404 : Resource not found.');
	response.end();
}

/* Servers a file */
function sendFile (response, filePath, fileContents) {
	response.writeHead(200,
		{'Content-Type' : mime.lookup(path.basename(filePath))});

	response.end(fileContents);
}

/* Serve a file the first time, or access the cache if it was sent before */
function serveStatic (response, cache, absPath) {
	if (cache[absPath]){	/* File is already cached */
		sendFile(response, absPath, cache[absPath]);
	}
	else{ /* New file to add to cache */
		fs.exists(absPath, function (exists){
			if (exists) {
				fs.readFile(absPath, function (err, data){
					if (err) {	 /* File not found */
						send404(response);
					}
					else {
						cache[absPath] = data; 
						sendFile(response, absPath, data);	/* Disk access, and cached */
					}
				});
			}
			else {	/* File not found */
				send404(response);
			}
		});
	}
}

/* Server creation logic */
var server = http.createServer(function (request, response) { 
	var filePath = false;

	if (request.url == '/')	{	/* Home access*/
		filePath = 'public/index.html';
	} 
	else {
		filePath = 'public' + request.url;
	}

	var absPath = './' + filePath;

	serveStatic(response, cache, absPath);
});

chatServer.listen(server);

server.listen(5000, function (){
	console.log('Server listening on port 5000.');
});