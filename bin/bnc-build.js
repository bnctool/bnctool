#!/usr/bin/env node

var program = require('commander');
var Builder = require('../lib/builder');

program
    .option('-w, --watch', 'monitor the changes of project, auto build')
    .option('-u, --uglify', 'uglify all files')
    .parse(process.argv);

Builder.init(program);