/**
 * 中央服务
 *
 * sunset
 */

var http2 = require('../lib/node-http2'),
	config = require('../conf/config') || {};

var http2Servers = {}; //客户端Http2代理服务

//服务
var ServerService = {
	addHttp2Server: function(token, s) {
		this.removeHttp2Server(token);
		s._token = token;
		http2Servers[token] = s;
		console.log('已连接代理服务：' + token);
	},
	getHttp2Server: function(token) {
		return http2Servers[token];
	},
	removeHttp2Server: function(token) {
		if (!token) {
			return;
		}
		var s;
		if (typeof token === 'object') {
			s = token;
			token = s._token;
		} else {
			s = http2Servers[token]
		}
		if (s) {
			//s.destroy();
			var eps = http2.globalAgent.endpoints,
				suffix = new RegExp(':' + token + '$'),
				arr = [];
			for (var k in eps) {
				if (eps.hasOwnProperty(k) && suffix.test(k)) {
					arr.push(k);
				}
			}
			arr.map(function(k) {
				delete eps[k];
			});
			console.log('移除Http2服务连接：' + token);
		}
	}
};

//变量

var Utils = {
	formatHttpHeader2To1: function(header) {
		var hs = ['connection',
			'host',
			'keep-alive',
			'proxy-connection',
			'te',
			'transfer-encoding',
			'upgrade'
		];
		hs.map(function(h) {
			delete header[h];
		});
		return header;
	}
}

module.exports = {
	Utils: Utils,
	Server: ServerService
};