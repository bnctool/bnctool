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

        program: null
    }
};

Build.findPath = function () {
    this.data.baseList = file.scanDirectory(this.data.baseDir);
    var configPath = tools.arraySearch(this.data.baseList, 'config.json');
    if (!configPath) {
        logger.fatal('cannot find config.json!');
    }

    this.data.workDir = path.dirname(configPath);
    logger.log('work directory ' + this.data.workDir);

    var config = file.read(configPath);
    logger.log('config:');
    console.log(chalk.blue(config));
    if (config) {
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
    this.data.releaseDir = path.join(this.data.baseDir, 'debug');
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
    var self = this;
    var content = '';
    var jsArray = [];
    for (var f in this.data.jsFiles) {
        if (this.data.jsFiles.hasOwnProperty(f)) jsArray.push(this.data.jsFiles[f]);

    }
    var jsCode = jsArray.join(';').replace(/BNC\.use\(/, 'BNC.use(bncStatic,');
    if (this.data.program.uglify) {
        content = util.format(this.data.template, JSON.stringify(this.data.bncStatic), UglifyJS.minify(jsCode).code);
    } else {
        content = util.format(this.data.template, JSON.stringify(this.data.bncStatic), jsCode);
    }

    logger.log(chalk.green('release: ' + this.data.releaseFile));
    file.write(this.data.releaseFile, content);
};


Build.rebuild = function () {
    var self = this;
    file.watchDir(this.data.workDir, function (type, fullPath) {
        var filename = path.relative(self.data.workDir, fullPath);
        logger.log('%s..........%s', type, filename);
        self.compileFile(fullPath);

        if (self.data.timer) {
            clearTimeout(self.data.timer);
        }
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

        if (reg.test(filename)) {
            return false;
        }

        if (/images/ig.test(filename)) {
            // images只拷贝
            file.copy(fullPath, path.join(this.data.releaseDir, filename));
        }

        if (/\.htm/ig.test(filename)) {
            bncStatic.html[filename] = cache;
        }

        if (/\.less/ig.test(filename)) {
            filename = filename.replace(/\.less/i, '.css');
            less.render(cache, function (e, output) {
                cache = output.css;
            });
        }

        if (/\.css/ig.test(filename)) {
            cache = new CleanCSS({}).minify(cache).styles;
            bncStatic.css[filename] = cache;
        }

        if (/\.js/ig.test(filename)) {
            this.data.jsFiles[filename] = cache;
        }
    } catch (e) {
        if (/\.htm/ig.test(filename)) {
            delete bncStatic.html[filename];
        }

        if (/\.less/ig.test(filename)) {
            filename = filename.replace(/\.less/i, '.css');
        }

        if (/\.css/ig.test(filename)) {
            delete bncStatic.css[filename];
        }

        if (/\.js/ig.test(filename)) {
            delete this.data.jsFiles[filename];
        }
    }

};


Build.init = function (program) {
    this.data.program = program;
    if (program.args.length > 0) {
        this.data.baseDir = path.join(this.data.baseDir, program.args[0]);
    }
    this.findPath();
    this.scanDir();
    this.compile();
    this.release();
    if (program.watch) {
        this.rebuild();
    } else {
        logger.success(chalk.green('bnc build complete!'));
    }
};

module.exports = Build;