var path = require('path');

module.exports = {
	SERVER_OPTIONS: {
		CLOUD_TCP_SERVER_PORT: 50000, //云端Tcp服务端口
		CLOUD_HTTP_SERVER_PORT: 50001, //云端Http服务端口
		MAX_CONNECTIONS: 20,
	},
	CLIENT_OPTIONS: {
		OPC_ID: 'sunset',
		remoteHost: '117.34.72.19', //Server IP address
		remotePort: 50000, //Server TCP port
		localTcpMinPort: 18000, //Local web app port
		localTcpMaxPort: 18010, //Local web app port
		localPortLife: 60, //Local web app port
		localHost: '127.0.0.1', //Local web app IP address
		localPort: 16003
	},
	SSH_OPTIONS: {
		cloudWsServerPort: 50002,
		cloudWssServerPort: 50003,
		cloudServerUrl: 'wss://117.34.72.19:50003',
		localSSHUrl: 'wss://127.0.0.1/ws',
		key: path.resolve(__dirname, '../auth/keyfile.pem'),
		cert: path.resolve(__dirname, '../auth/certificate.pem')
	}
};