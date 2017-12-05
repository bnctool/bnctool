#!/usr/bin/env node

var download = require('download-git-repo');
var program = require('commander');
var chalk = require('chalk');
var path = require('path');
var util = require('util');
var file = require('../lib/file');
var logger = require('../lib/logger');
var streamObj = require('../lib/streamObj');
var lang = require('../lib/lang');

var useLang = lang.CHS;

var Init = {
    name: 'bncDemo',
    baseDir: process.cwd(),
    workDir: null,
    workList: [],
    source: 'BaiduBnc/bnc-project#download'
};

/**
 * Usage.
 */

program
    .usage('<ability-name>');

/**
 * Help.
 */

program.on('--help', function () {
    console.log('  Examples:');
    console.log();
    useLang.helps.forEach(function(item){
        console.log(item);
    });
    console.log();
});

process.on('exit', function () {
    console.log();
});

program.parse(process.argv);

Init.initSet = function(){
    if(program.args.length > 0){
        this.name = program.args[0];
        Init.init();
    }else{
        logger.fatal('请输入您想要创建的能力的名称 example: bnc init wxShare')
    }
}


Init.init = function () {
    if(!/^[a-z][a-z0-9]+$/i.test(this.name)) {
        logger.log(useLang.nameError);
        logger.log(useLang.nameErrorOne);
        logger.log(useLang.nameErrorTwo);
        logger.log(useLang.nameErrorThree);
        return;
    }
    logger.success('能力' + this.name + '正在创建...');
    this.workDir = path.join(this.baseDir, this.name);
    file.mkdir(this.workDir);
    this.workDir.replace('undefined', '');
    logger.log(useLang.createDir + this.workDir);
    Init.download();
};

Init.download = function () {
    logger.log(useLang.download);
    logger.log(useLang.waitTip);
    download(this.source, this.workDir, function (err) {
        if(err) {
            logger.fatal(err);
        } else {
            logger.log(useLang.DownComplete);
            Init.chooseOperate();
        }
    });
};

Init.chooseOperate = function () {
    logger.log(useLang.init);
    this.process();
}

Init.process = function () {
    var self = this;
    Init.workList = file.scanDirectory(this.workDir);
    Init.makeHTML();
    Init.workList.forEach(function (item) {
        if(/bncDemo/.test(item)) {
            var newPath = item.replace('bncDemo', self.name);
            file.rename(item, newPath, function () {
                file.replace(newPath, 'bncDemo', self.name);
            });
        } else {
            file.replace(item, 'bncDemo', self.name);
        }
    });
};

Init.makeHTML = function () {
    var name = path.join(this.workDir, 'debug', 'index.html');
    var cmd = util.format('BNC.ability.%s.init()', Init.name);
    var content = file.read(name);
    var writeContent = content
        .replace(/{{title}}/g, Init.name)
        .replace(/{{caller}}/g, cmd);
    file.write(name, writeContent);
    logger.log(useLang.show + name);
    logger.log(useLang.recommend);
};

Init.initSet();
