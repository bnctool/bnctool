#!/usr/bin/env node

var program = require('commander');
var open = require('open');
var config = require('../package.json');


var jump = function (site) {
    console.log();
    var url = {
        doc: 'https://bnc.baidu.com/contact/docs?docName=platformDoc',
        home: 'https://bnc.baidu.com/',
        publish: 'https://bnc.baidu.com/publish',
        call: 'https://bnc.baidu.com/call'
    };
    if(url[site]) {
        open(url[site]);
        console.log(url[site]);
    } else {
        console.log('bnc -o [site]:');
        for(var i in url) {
            if(url.hasOwnProperty(i)) {
                console.log('    ' + i + '  :  ' + url[i]);
            }
        }
    }
    console.log();
};

program
    .version('v' + config.version)
    .usage('<command>')
    .option('-v, --version', 'output the version number')
    .option('-o, --open <site>', 'open page. site in [doc, home, publish, call]. for example: bnc -o doc', jump)
    .command('init', 'generate a new project from template')
    .command('debug', 'build ability and launch a http server')
    .command('pack', 'pack project to upload')
    .command('build', 'build project for debug')
    .command('server', 'launch a http server')
    .command('list', 'list available abilities')
    .parse(process.argv);