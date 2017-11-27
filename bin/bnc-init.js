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
    type: '1',
    typeObj: {'1': 'BaiduBnc/singlePageFrame','2': 'BaiduBnc/bnc-project'},
    changeObj: {'2': 'process'}
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
    if(program.args.length >= 2){
        this.argTwos();
    }else if(program.args.length == 1){
        this.argOne();
    }else{
        this.oneByOne();
    }
    
}

Init.argOne = function (){
    if(this.typeObj[program.args[0]]){
        this.type = program.args[0];
        logger.log(useLang.goType);
    }else{
        logger.log(useLang.goName);
        this.name = program.args[0];
    }
    Init.init();
}

Init.argTwos = function (){
    if(this.typeObj[program.args[0]]){
        this.type = program.args[0];
    }else{
        logger.log(useLang.typeError);
    }
    this.name = program.args[1];
    Init.init();
}

Init.oneByOne = function(){
    logger.log(useLang.chooseTip);
    logger.log(useLang.chooseOne); 
    logger.log(useLang.chooseTwo); 
    //logger.log(useLang.chooseThree); 
    //logger.log(useLang.chooseFour); 
    streamObj.readSingle(function(str){
        str = str.replace("\n", "");
        if(Init.typeObj[str]){
            Init.type = str;
        }
        logger.log(useLang.name);
        streamObj.readSingle(function(projectName){
            if(projectName){
                Init.name = projectName.replace("\n", "");
            }
            streamObj.stopStream();
            Init.init();
        });
    });
}

Init.init = function () {
    if(!/^[a-z][a-z0-9]+$/i.test(this.name)) {
        logger.log(useLang.nameError);
        logger.log(useLang.nameErrorOne);
        logger.log(useLang.nameErrorTwo);
        logger.log(useLang.nameErrorThree);
        return;
    }
    this.workDir = path.join(this.baseDir, this.name);
    file.mkdir(this.workDir);
    this.workDir.replace('undefined', '');
    logger.log(useLang.createDir + this.workDir);
    Init.download();
};

Init.download = function () {
    logger.log(useLang.download);
    logger.log(useLang.waitTip);
    download(Init.typeObj[Init.type], this.workDir, function (err) {
        if(err) {
            logger.fatal(err);
        } else {
            logger.log(useLang.DownComplete);
            if(Init.changeObj[Init.type]){
                Init.chooseOperate();
            }else{
                Init.overOperate();
            }
        }
    });
};

Init.chooseOperate = function () {
    logger.log(useLang.init);
    Init[Init.changeObj[Init.type]]();
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

Init.overOperate = function () {
    logger.log(useLang.recommend);
}

Init.initSet();
