
var chalk = require('chalk');
var path = require('path');
var util = require('util');
var CleanCSS = require('clean-css');
var less = require('less');
var UglifyJS = require("uglify-js");
var file = require('../lib/file');
var logger = require('../lib/logger');
var tools = require('../lib/tools');

var Build = {
    data: {
        whiteList: ['readme.md', 'config.json'],
        //执行命令所在目录
        baseDir: process.cwd(),
        //执行命令目录下所有的文件
        baseList: [],
        //需要打包的项目目录
        workDir: '',
        //需要打包的项目目录下的所有文件
        workList: [],
        //产出的目录
        releaseDir: '',
        //产出的目录下的图片目录
        releaseImgDir: '',
        //产出的文件
        releaseFile: '',
        //打包的项目名
        name: '',
        //读取的config.json
        config: {},

        bncStatic: {
            html: {},
            css: {}
        },

        template: '(function(){\nvar bncStatic=%s;\n%s})();\n',

        timer: null,

        jsFiles: {},

        program: null,
        // 当开发能力的时候默认为dev模式，当在项目中注入能力的时候为inject模式
        mode: 'dev',
        // 存放下载的源码
        downloadPath: '',
        // 可以存放多个源码包
        downloadList: [],
        // bnc_modules路径
        modulesPath: '',
        // 在当前目录下查找config.json
        packagePath: ''
    }
};

Build.findPath = function () {
    this.data.baseList = file.scanDirectory(this.data.packagePath);
    var configPath = tools.arraySearch(this.data.baseList, 'config.json');
    if(!configPath) {
        logger.fatal('cannot find config.json!');
    }

    this.data.workDir = path.dirname(configPath);
    logger.log('work directory ' + this.data.workDir);

    var config = file.read(configPath);
    logger.log('config:');
    console.log(chalk.blue(config));
    if(config) {
        this.data.config = JSON.parse(config);
        this.data.name = config.id;
    } else {
        logger.fatal('cannot read config.json!');
    }
};

/**
 * 读取目录下的所有文件路径,创建产出目录
 */
Build.scanDir = function () {
    this.data.workList = file.scanDirectory(this.data.workDir);
    if(this.mode == 'dev') {
        this.data.releaseDir = path.join(this.data.baseDir, 'debug');
    }
    this.data.releaseImgDir = path.join(this.data.releaseDir, 'images');
    this.data.releaseFile = path.join(this.data.releaseDir, 'entry.js');
    file.mkdir(this.data.releaseDir);
    file.mkdir(this.data.releaseImgDir);
};

/**
 * 编译文件less->css es6->es5, 拷贝到产出目录[project-name]
 */
Build.compile = function () {
    var self = this;
    this.data.workList.forEach(function (item) {
        self.compileFile(item);
    });
};

Build.release = function () {
    var content = '';
    var jsArray = [];
    for(var f in this.data.jsFiles) {
        if(this.data.jsFiles.hasOwnProperty(f)) jsArray.push(this.data.jsFiles[f]);

    }
    var jsCode = jsArray.join(';').replace(/BNC\.use\(/, 'BNC.use(bncStatic,');
    if(this.data.program.uglify) {
        content = util.format(this.data.template, JSON.stringify(this.data.bncStatic), UglifyJS.minify(jsCode).code);
    } else {
        content = util.format(this.data.template, JSON.stringify(this.data.bncStatic), jsCode);
    }
    logger.log(chalk.green('release: ' + this.data.releaseFile));
    file.write(this.data.releaseFile, content);
};

Build.rebuild = function () {
    var self = this;
    var watchDir = this.data.mode == 'dev' ? this.data.workDir : this.data.downloadPath;

    file.watchDir(watchDir, function (type, fullPath) {
        var filename = path.relative(watchDir, fullPath);
        logger.log('%s..........%s',type, filename);
        self.data.workDir = path.dirname(fullPath);
        self.compileFile(fullPath);

        if(self.data.timer) {
            clearTimeout(self.data.timer);
        }
        var item = path.basename(self.data.workDir);
        self.data.releaseDir = path.join(self.data.modulesPath, item);
        self.data.releaseFile = path.join(self.data.releaseDir, 'entry.js');
        self.data.timer = setTimeout(function () {
            self.release();
        }, 500);
    })

};

Build.compileFile = function (fullPath) {
    var filename = path.relative(this.data.workDir, fullPath);
    var bncStatic = this.data.bncStatic;

    try {
        var cache = file.read(fullPath);
        var reg = new RegExp(this.data.whiteList.join('|'), 'ig');

        if(reg.test(filename)) {
            return false;
        }

        if(/images/ig.test(filename)){
            // images只拷贝
            file.copy(fullPath, path.join(this.data.releaseDir, filename));
        }

        if(/\.htm/ig.test(filename)) {
            bncStatic.html = {};
            bncStatic.html[filename] = cache;
        }

        if(/\.less/ig.test(filename)) {
            filename = filename.replace(/\.less/i, '.css');
            less.render(cache, function (e, output) {
                cache = output.css;
            });
        }

        if(/\.css/ig.test(filename)) {
            cache = new CleanCSS({}).minify(cache).styles;
            bncStatic.css = {};
            bncStatic.css[filename] = cache;
        }

        if(/\.js/ig.test(filename)) {
            this.data.jsFiles = {};
            this.data.jsFiles[filename] = cache;
        }
    } catch (e) {
        if(/\.htm/ig.test(filename)) {
            delete bncStatic.html[filename];
        }

        if(/\.less/ig.test(filename)) {
            filename = filename.replace(/\.less/i, '.css');
        }

        if(/\.css/ig.test(filename)) {
            delete bncStatic.css[filename];
        }

        if(/\.js/ig.test(filename)) {
            delete this.data.jsFiles[filename];
        }
    }

};

/**
 * 重置数据
 */
Build.resetData = function() {
    this.data.bncStatic = {
        html: {},
        css: {}
    };
    this.data.jsFiles = {};
}

/**
 * 查找bnc-download文件
 */
Build.findDownload = function() {
    this.data.downloadPath = path.join(this.data.baseDir, 'bnc-download');
}

/**
 * 查找bnc-download下的源码包列表
 */
Build.setDownloadList = function() {
    this.data.downloadList = file.findSubDir(this.data.downloadPath);
    if(this.data.downloadList.length == 0) {
        console.log('【当前没有可编译的目录】');
        return;
    }
}

/**
 * 创建modules目录
 */
Build.createModules = function() {
    this.data.modulesPath = path.join(this.data.baseDir, 'bnc_modules');
    file.mkdir(this.data.modulesPath);
}

Build.init = function (program, option) {
    var self = this;
    this.data.program = program;
    // 判断参数
    if(program.args.length > 0) {
        this.data.baseDir = path.join(this.data.baseDir, program.args[0]);
    }

    this.data.mode = option.mode || 'dev';
    if (this.data.mode == 'dev') {
        this.data.packagePath = this.data.baseDir;
        this.findPath();
        this.scanDir();
        this.compile();
        this.release();
    } else {
        this.findDownload();
        this.setDownloadList();
        this.createModules();
        this.data.downloadList.map(function(item) {
            self.resetData();
            self.data.packagePath  = path.join(self.data.downloadPath, item);
            self.data.releaseDir = path.join(self.data.modulesPath, item);
            self.findPath();
            self.scanDir();
            self.compile();
            self.release();
        });
    }
    if(program.watch) {
        this.rebuild();
    } else {
        logger.success(chalk.green('bnc build complete!'));
    }

};

module.exports = Build;