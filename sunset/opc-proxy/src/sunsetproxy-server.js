//TcpServer等待连接
var tcpServer = require('./tcp-server'),
	httpServer = require('./http-server'),
	WebsocketProxy = require('./websocket-proxy'),
	serverOptions = require('../conf/config').SERVER_OPTIONS;



module.exports = {
	start: function() {
		//启动Tcp等待服务
		tcpServer.start({
			port: serverOptions.CLOUD_TCP_SERVER_PORT,
			maxConnections: serverOptions.MAX_CONNECTIONS
		});
		//启动Http服务
		httpServer.start({
			port: serverOptions.CLOUD_HTTP_SERVER_PORT
		});
		//启动websocket服务
		WebsocketProxy.startCloudServer();
	}
};