#!/usr/bin/env node

var program = require('commander');
var Build = require('../lib/builder');

program
    .option('-w, --watch', 'monitor the changes of project, auto build')
    .option('-u, --uglify', 'uglify all files')
    .parse(process.argv);


Build.init(program, {
    mode: 'inject'
});