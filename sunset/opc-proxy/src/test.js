var https = require('https'),
	Q = require('q'),
	WebSocket = require('ws'),
	fs = require('fs'),
	sshOptions = require('../conf/config').SSH_OPTIONS;


function startCloudServer(path, port) {
	var serverOptions = {
		key: fs.readFileSync(sshOptions.key),
		cert: fs.readFileSync(sshOptions.cert)
	};
	var server = https.createServer(serverOptions, function(req, res) { //要是单纯的https连接的话就会返回这个东西
		res.writeHead(403);
		res.end("This is a WebSockets server!\n");
	}).listen(port || sshOptions.cloudServerPort);
	var wss = new WebSocket.Server({
		server: server,
		path: path
	});
	wss.on('connection', function(wsConnect) {
		wsConnect.on('message', function(message) {
			wsConnect.send('GATEONE 回复 ：' + message);
		});
		console.log('GATEONE:终端已连接');
		wsConnect.on('close', function(wsConnect) {
			console.log('GATEONE:终端已断开');
		});
	});
	console.log('OK!');
}


startCloudServer('/ws', 50005);