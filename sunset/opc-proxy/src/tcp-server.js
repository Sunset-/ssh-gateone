/**
 * Tcp服务
 * sunset
 */
var net = require('net'),
	BaseService = require('./service'),
	tcpServer;

module.exports = {
	start: function(options) {
		if (!tcpServer && options) {
			tcpServer = net.createServer(function(socket) {
				console.log('已连接:' + socket.remoteAddress + ':' + socket.remotePort);
				socket.on('end', function() {
					BaseService.Server.removeHttp2Server(socket);
				});
				socket.on('error', function(err) {
					BaseService.Server.removeHttp2Server(socket);
				});
				socket.on('close', function(err) {
					BaseService.Server.removeHttp2Server(socket);
				});
				socket.on('data', function(data) {
					var data = data.toString();
					if (/^HTTP2-PROXY-SERVER:/.test(data)) {
						var sp = data.split(':'),
							token = sp[1];
						BaseService.Server.addHttp2Server(token, socket);
						socket.write('ALLOW-CONNECT='+socket.remoteAddress + ':' + socket.remotePort);
					}
				});
			});
			tcpServer.maxConnections = options.maxConnections || 10;
			tcpServer.listen(options.port, function() {
				console.log('TCP服务已启动，监听端口：' + options.port);
			});
			tcpServer.on('close', function() {
				tcpServer = null;
			});
			tcpServer.on('error', function() {
				tcpServer = null;
			});
		}
	},
	stop: function() {
		if (tcpServer) {
			tcpServer.close();
			tcpServer = null;
		}
	}
}