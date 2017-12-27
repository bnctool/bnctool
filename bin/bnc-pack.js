
var program = require('commander');
var chalk = require('chalk');
var path = require('path');
var util = require('util');
var fs = require('fs');
// var UglifyJS = require("uglify-js");
var UglifyJS = require("uglify-es");
var CleanCSS = require('clean-css');
var less = require('less');
var file = require('../lib/file');
var logger = require('../lib/logger');
var tools = require('../lib/tools');
var JSZip = require('jszip');

program.parse(process.argv);

var zip = new JSZip();

var Pack = {
    whiteList: ['readme.md', 'config.json'],
    //执行命令所在目录
    baseDir: process.cwd(),
    //执行命令目录下所有的文件
    baseList: [],
    //需要打包的项目目录
    workDir: '',
    //需要打包的项目目录下的所有文件
    workList: [],
    //产出的临时目录
    releaseDir: '',
    //产出的临时目录下的图片
    releaseImgDir: '',
    //打包的项目名
    name: ''
};

/**
 * 查找config.json确定需要打包的目录
 */
Pack.findConfig = function () {
    this.baseList = file.scanDirectory(this.baseDir);
    var configPath = tools.arraySearch(this.baseList, 'config.json');
    if(!configPath) {
        logger.log(chalk.red('cannot find config.json!'));
        this.quit();
    }

    this.workDir = path.dirname(configPath);
    logger.log('work directory ' + this.workDir);

    var config = file.read(configPath);
    if(config) {
        config = JSON.parse(config);
        this.name = config.id;
    } else {
        logger.log(chalk.red('cannot read config.json!'));
        this.quit();
    }
};


/**
 * 读取目录下的所有文件路径
 */
Pack.scanDir = function () {
    this.workList = file.scanDirectory(this.workDir);
    // this.releaseDir = path.join(this.baseDir, this.name);
    // file.mkdir(this.releaseDir);
    // this.releaseImgDir = path.join(this.releaseDir, 'images');
    // file.mkdir(this.releaseImgDir);
};

/**
 * 编译文件less->css es6->es5, 拷贝到产出目录[project-name]
 */
Pack.compile = function () {
    var self = this;
    this.workList.forEach(function (item) {
        var basename = path.basename(item);
        var reg = new RegExp(self.whiteList.join('|'), 'ig');
        if(reg.test(item)) {
            // readme.md config.json 不作处理，只拷贝
            zip.file(basename,fs.createReadStream(item));
            // file.copy(item, path.join(self.releaseDir, basename));
        } else if(/images/ig.test(item)){
            // images只拷贝
            zip.file(path.join('images' , basename),fs.createReadStream(item));
            // file.copy(item, path.join(self.releaseImgDir, basename));
        } else {
            // 需要压缩
            var cache = file.read(item);

            if(/\.less/ig.test(basename)) {
                basename = basename.replace(/\.less/i, '.css');
                less.render(cache, function (e, output) {
                    cache = output.css;
                });
            }

            if(/\.css/ig.test(basename)) {
                // cache = new CleanCSS({}).minify(cache).styles;
            }

            if(/\.js/ig.test(basename)) {
                cache = UglifyJS.minify(cache).code;
            }

            zip.file(basename,cache)
            // file.write(path.join(self.releaseDir, basename), cache);
        }
    });
};

Pack.replace = function () {

};

/**
 * 压缩产出目录
 */
Pack.zipDir = function () {
    var time = new Date();
    var ts = tools.dateFormat(time, 'yyyyMMddhhmm');
    var zipName = this.name + '_' + ts + '.zip';
    var output = fs.createWriteStream(path.join(this.baseDir, zipName));
    output.on('close', function() {
        // logger.log(zipName + ' ...... ' + zip.pointer() + ' total bytes');
        // Pack.removeDir();
    });
    zip
        .generateNodeStream({type:'nodebuffer',streamFiles:true})
        .pipe(fs.createWriteStream(zipName))
        .on('finish', function () {
            // JSZip generates a readable stream with a "end" event,
            // but is piped here in a writable stream which emits a "finish" event.
        });
};

/**
 * 删除过程目录[project-name]
 */
Pack.removeDir = function () {
    setTimeout(function () {
        file.rmdir(Pack.releaseDir);
    }, 500)
};

Pack.quit = function () {
    console.log();
    process.abort();
};

Pack.init = function () {
    if(program.args.length > 0) {
        this.baseDir = path.join(process.cwd(), program.args[0]);
    }
    this.findConfig();
    this.scanDir();
    this.compile();
    this.zipDir();
};


Pack.init();