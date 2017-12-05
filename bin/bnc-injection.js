#!/usr/bin/env node

var program = require('commander');
var Inject = require('../lib/inject');

program
    .option('-w, --watch', 'monitor the changes of project, auto build')
    .option('-u, --uglify', 'uglify all files')
    .parse(process.argv);


Inject.init(program);