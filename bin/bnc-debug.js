#!/usr/bin/env node

var program = require('commander');
var path = require('path');
var serve = require('serve');
var Builder = require('../lib/builder');

program.parse(process.argv);

var Debug = {
    baseDir: process.cwd()
};

Debug.init = function () {
    program.watch = true;
    Builder.init(program);

    if(program.args.length > 0) {
        this.baseDir = path.join(process.cwd(), program.args[0]);
    }

    serve(path.join(this.baseDir, 'debug'), {
        port: 1234,
        open: true,
        ignore: ['node_modules']
    });
};

Debug.init();