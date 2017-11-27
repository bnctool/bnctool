#!/usr/bin/env node

var program = require('commander');
var chalk = require('chalk');
var path = require('path');
var util = require('util');
var serve = require('serve');
var file = require('../lib/file');
var logger = require('../lib/logger');



var server = serve(path.join(process.cwd(), 'debug'), {
    port: 1234,
    open: true,
    ignore: ['node_modules']
});