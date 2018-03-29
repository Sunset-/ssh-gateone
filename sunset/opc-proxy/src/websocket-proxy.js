var http = require('http'),
	https = require('https'),
	Q = require('q'),
	WebSocket = require('ws'),
	fs = require('fs'),
	sshOptions = require('../conf/config').SSH_OPTIONS;

var INSTANCE = {};

/**
 * 启动websocket云服务器
 * @return {[type]} [description]
 */
var socketMap = {};
var clearTimerMap = {};

function startCloudServer() {
	stopCloudServer();

	//内部wss对接站
	var serverOptions = {
		key: fs.readFileSync(sshOptions.key),
		cert: fs.readFileSync(sshOptions.cert)
	};
	var wssServer = INSTANCE.wssServer = https.createServer(serverOptions, function(req, res) { //要是单纯的https连接的话就会返回这个东西
		res.writeHead(403);
		res.end("This is a WebSockets server!\n");
	}).listen(sshOptions.cloudWssServerPort);

	var wss = INSTANCE.wss = new WebSocket.Server({
		server: wssServer
	});
	wss.on('connection', function(wsConnect) {
		wsConnect.on('message', function(message) {
			if (message == 'LINK_SSH') {
				//来自OPC
				var token = new Date().getTime() + Math.floor(Math.random() * 10000);
				console.log('生成TOKEN：' + token);
				socketMap[token] = wsConnect;
				wsConnect.send('TOKEN=' + token);
				clearTimerMap[token] = setTimeout(function() {
					wsConnect.close();
				}, 60000);
			}
		});
		console.log('终端已连接');
	});

	//外部ws对接站
	var wsServer = INSTANCE.wsServer = http.createServer(function(req, res) { //要是单纯的https连接的话就会返回这个东西
		res.writeHead(403);
		res.end("This is a WebSockets server!\n");
	}).listen(sshOptions.cloudWsServerPort);

	var ws = INSTANCE.ws = new WebSocket.Server({
		server: wsServer
	});
	ws.on('connection', function(wsConnect) {
		wsConnect.on('message', function(message) {
			if (/^LINK_TERMINAL=/.test(message)) {
				//来自用户
				var token = message.split('LINK_TERMINAL=')[1];
				var sshConnect = socketMap[token];
				console.log('连接至TOKEN：' + token);
				if (sshConnect) {
					clearTimeout(clearTimerMap[token]);
					sshConnect.on('message', function(message) {
						wsConnect.send(message);
					});
					wsConnect.on('message', function(message) {
						sshConnect.send(message);
					});
					wsConnect.on('close', function() {
						console.log('终端已断开');
						sshConnect.close();
					});
				}
			}
		});
		console.log('终端已连接');
	});
	console.log('云端Websocket服务已启动，监听端口：' + sshOptions.cloudServerPort);
}

function stopCloudServer() {
	try {
		INSTANCE.wssServer && INSTANCE.wssServer.close();
		INSTANCE.wss && INSTANCE.wss.close();
		INSTANCE.wsServer && INSTANCE.wsServer.close();
		INSTANCE.ws && INSTANCE.ws.close();
	} catch (e) {
		console.error(e);
	}
}



/**
 * 连接gateone与云服务
 * @return {[type]} [description]
 */
function linkSSHToCloud() {
	var q = new Q.defer();
	var gateoneSocket = new WebSocket(sshOptions.localSSHUrl, null, {
		origin: 'http://127.0.0.1',
		rejectUnauthorized: false
	});
	gateoneSocket.on('open', function() {
		console.log('已建立与gateone的连接');
		var cloudSocket = new WebSocket(sshOptions.cloudServerUrl, null, {
			origin: 'http://127.0.0.1',
			rejectUnauthorized: false
		});
		cloudSocket.on('open', function() {
			console.log('已建立与cloud的连接');
			console.log('gateone与cloud连接完成');
			//获取token
			cloudSocket.send('LINK_SSH');
			cloudSocket.once('message', function(message) {
				if (/^TOKEN=/.test(message)) {
					gateoneSocket.on('message', function(message) {
						cloudSocket.send(message);
					});
					cloudSocket.on('message', function(message) {
						gateoneSocket.send(message);
					});
					console.log('从云服务中获取token:' + message.split('TOKEN=')[1]);
					q.resolve(message.split('TOKEN=')[1]);
				} else {
					console.log('未从云服务中获取token');
					gateoneSocket.close();
					cloudSocket.close();
				}
			});
		});
		cloudSocket.on('close', function() {
			console.log('OPC与CLOUD长连接断开');
			gateoneSocket.close();
		});
	});
	gateoneSocket.on('close', function() {
		console.log('OPC与SSH长连接断开');
	});
	return q.promise;
}



// /**
//  * 启动websocket代理客户端
//  * @return {[type]} [description]
//  */
// function proxy(socket, options) {
// 	var proxySocket = new WebSocket(options.proxyUrl, null, {
// 		origin: options.origin,
// 		rejectUnauthorized: false
// 	});
// 	proxySocket.on('open', function open() {
// 		console.log('客户端已启动');
// 		socket.on('message', function(message) {
// 			proxySocket.send(message);
// 		});
// 		proxySocket.on('message', function(message) {
// 			socket.send(message);
// 		});
// 	});
// }


module.exports = {
	startCloudServer: startCloudServer,
	stopCloudServer: stopCloudServer,
	linkSSHToCloud: linkSSHToCloud
};