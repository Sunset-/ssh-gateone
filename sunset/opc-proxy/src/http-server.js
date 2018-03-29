//TcpServer等待连接
var http = require('http'),
	http2 = require('../lib/node-http2'),
	url = require('url'),
	querystring = require('querystring'),
	BaseService = require('./service'),
	httpServer;



//http转发
function requestHandle(req, res) {
	var u = url.parse(req.url),
		getParams = querystring.parse(u.query),
		token = getParams.OPC_ID,
		http2Server = BaseService.Server.getHttp2Server(token);
	if (http2Server) {
		var u = url.parse(req.url);
		var headers = BaseService.Utils.formatHttpHeader2To1(req.headers);
		headers['x-real-ip'] = req.connection.remoteAddress;
		console.log('向' + token + '发送HTTP2请求');
		var pReq = http2.raw.request({
			id: token,
			plain: true,
			socket: http2Server,
			//port    : u.port || 443,
			path: u.path,
			method: req.method,
			headers: headers
		}, function(pRes) {
			res.writeHead(pRes.statusCode, pRes.headers);
			console.log('客户端回复');
			pRes.pipe(res);
		});
		pReq.on('error', function(e) {
			console.log('客户端异常');
			res.writeHead(200);
			res.write('something was wrong.' + e);
			res.end();
			return;
		});

		req.pipe(pReq);
	}else{
		res.write('unknow the OPC');
		res.end();
	}
}



module.exports = {
	start: function(options) {
		httpServer = http.createServer(requestHandle);
		httpServer.listen(options.port, function() {
			console.log('云端HTTP服务已启动，监听端口：' + options.port);
		});
	}
};