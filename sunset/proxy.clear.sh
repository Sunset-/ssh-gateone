#!/bin/sh

ps -ef | grep ssh_connect | awk '{print $2}' | xargs kill -9
