var net = require('net'),
	http2 = require('../lib/node-http2'),
	http = require('http'),
	url = require('url'),
	BaseService = require('./service'),
	WebsocketProxy = require('../src/websocket-proxy'),
	clientOptions = require('../conf/config').CLIENT_OPTIONS;


//本地http代理转发
function proxyHandle(req, res) {
	var u = url.parse(req.url);
	req.headers.host = clientOptions.localHost + ':' + clientOptions.localPort;
	console.log('穿透访问：' + u.path);
	if (/^\/SUNSET_WEBSOCKET_SSH/.test(u.path)) {
		//请求发起SSH代理
		WebsocketProxy.linkSSHToCloud().then(function(token) {
			res.write(token);
			res.end();
		});
	} else {
		//常规穿透请求
		var httpOpts = {
			hostname: clientOptions.localHost,
			port: clientOptions.localPort,
			path: u.path,
			method: req.method,
			headers: req.headers
		};
		var pReq = http.request(httpOpts, function(pRes) {
			var headers = BaseService.Utils.formatHttpHeader2To1(pRes.headers);
			res.writeHead(pRes.statusCode, headers);
			pRes.pipe(res);
		}).on('error', function(e) {
			res.writeHead(200);
			res.write('Can not reach the local service!');
			res.end();
			return;
		});

		req.pipe(pReq);
	}
}


//创建Tcp连接
var activePort = clientOptions.localTcpMinPort,
	maxPort = clientOptions.localTcpMaxPort,
	portLife = clientOptions.localPortLife * 1000,
	skipReconnect = false;

function createTcpConnection() {
	var socket = new net.Socket();
	console.log(clientOptions.remoteHost + ':' + clientOptions.remotePort);
	if (activePort >= maxPort) {
		activePort = clientOptions.localTcpMinPort;
	}
	socket.__port = activePort;
	socket.connect({
		host: clientOptions.remoteHost,
		port: clientOptions.remotePort,
		localPort: activePort
	}, function() {
		socket.write('HTTP2-PROXY-SERVER:' + clientOptions.OPC_ID);
	});
	socket.on('data', function(data) {
		var data = data.toString();
		if (/^ALLOW-CONNECT/.test(data)) {
			var sp = data.split('='),
				natAddrPort = sp[1];
			console.log('已连接中心服务器,' + (activePort));
			//启动http2代理服务
			var http2Server = http2.raw.createServer({
				plain: true,
				createServer: function(start) {
					console.log('已创建本地http2代理服务');
					start(socket);
					socket.close = function() {
						console.log('-----关闭Socket:' + socket.__port);
						skipReconnect = true;
						socket.end();
						socket.destroy();
						socket = null;
						http2Server = null;
					}
					return socket;
				}
			}, proxyHandle);
			setTimeout(function() {
				activePort++;
				Connector.close(http2Server);
				Connector.isReconnect = false;
				Connector.connect();
			}, portLife);
		}
	});
	socket.on('end', function(data) {
		console.log('end');
	});
	socket.on('close', function(data) {
		skipReconnect || Connector.connect();
		skipReconnect = false;
	});
	socket.on('error', function(data) {
		console.log(data);
		skipReconnect || Connector.connect();
		skipReconnect = false;
	});
};


//断线重连
var Connector = {
	connectTimer: null,
	/**
	 * 连接
	 * @param  {[type]} options [description]
	 * @param  {[type]} delay   [description]
	 * @return {[type]}         [description]
	 */
	isReconnect: false,
	connect: function() {
		var self = this;
		delay = this.isReconnect ? 5000 : 0;
		if (this.connectTimer) {
			return;
		}
		this.isReconnect = true;
		if (delay > 0) {
			console.log(delay + 'ms后重连');
		}
		this.connectTimer = setTimeout(function() {
			clearTimeout(self.connectTimer);
			self.connectTimer = null;
			createTcpConnection();
		}, delay);
	},
	close: function(http2Server) {
		setTimeout(function() {
			http2Server.close();
		}, portLife);
	}
}


module.exports = {
	start: function() {
		Connector.connect();
	}
};