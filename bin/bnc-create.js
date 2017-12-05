#!/usr/bin/env node

var download = require('download-git-repo');
var program = require('commander');
var chalk = require('chalk');
var path = require('path');
var util = require('util');
var file = require('../lib/file');
var logger = require('../lib/logger');
var lang = require('../lib/lang');

var useLang = lang.CHS;

var Create = {
    name: 'bncDemo',
    baseDir: process.cwd(),
    workDir: null,
    workList: [],
    source: 'BaiduBnc/singlePageFrame'
};

/**
 * Usage.
 */

program
    .usage('<project-name>');

/**
 * Help.
 */

program.on('--help', function () {
    console.log('  Examples:');
    console.log();
    useLang.createProjectHelps.forEach(function(item){
        console.log(item);
    });
    console.log();
});

process.on('exit', function () {
    console.log();
});

program.parse(process.argv);

Create.initSet = function() {
    if (program.args.length > 0) {
        this.name = program.args[0];
        Create.init();
    } else {
        logger.fatal('请输入您想要创建的项目的名称 example: bnc create project');
    }
}

Create.init = function () {
    if(!/^[a-z][a-z0-9]+$/i.test(this.name)) {
        logger.log(useLang.nameError);
        logger.log(useLang.nameErrorOne);
        logger.log(useLang.nameErrorTwo);
        logger.log(useLang.nameErrorThree);
        return;
    }
    logger.success('项目' + this.name + '正在创建...');
    this.workDir = path.join(this.baseDir, this.name);
    file.mkdir(this.workDir);
    this.workDir.replace('undefined', '');
    logger.log(useLang.createDir + this.workDir);
    Create.download();
};

Create.download = function () {
    logger.log(useLang.download);
    logger.log(useLang.waitTip);
    download(this.source, this.workDir, function (err) {
        if(err) {
            logger.fatal(err);
        } else {
            logger.log(useLang.DownComplete);
        }
    });
};

Create.initSet();
