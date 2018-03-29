#!/bin/sh

export NODE_HOME=/home/sunset/node-v4.3.1-linux-x64
export PATH=$NODE_HOME/bin:$PATH

ps -ef | grep opc-proxy | awk '{print $2}' |xargs kill -9

ps -ef | grep gateone | awk '{print $2}' |xargs kill -9

ps -ef | grep ssh_connect | awk '{print $2}' | xargs kill -9

#gateone

service gateone start


#proxy

forever start -l /home/sunset/proxy.log -a /home/sunset/opc-proxy/bin/client.js
