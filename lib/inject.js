var chalk = require('chalk');
var path = require('path');
var util = require('util');
var cheerio = require('cheerio');
var CleanCSS = require('clean-css');
var less = require('less');
var UglifyJS = require("uglify-js");
var file = require('../lib/file');
var logger = require('../lib/logger');
var tools = require('../lib/tools');
var wrap = require('../lib/wrap');
var injectMod = require('../lib/inject-mod');

var Inject = {
    data: {
        whiteList: ['readme.md', 'config.json'],
        //执行命令所在目录
        baseDir: process.cwd(),

        template: '(function(){\nvar bncStatic=%s;\n%s})();\n',

        timer: null,

        program: null,
        // 存放下载的源码
        downloadPath: '',
        // 可以存放多个源码包
        downloadList: [],
        // bnc_modules路径
        modulesPath: '',
        // 存储html,js,css
        abilityList: {},
        // 存储用到的plugin列表
        pluginList: []

    }
};

Inject.findPath = function (abilityName) {
    this.data.abilityList[abilityName].workList = file.scanDirectory(this.data.abilityList[abilityName].workDir);
    var configPath = tools.arraySearch(this.data.abilityList[abilityName].workList, 'config.json');
    if (!configPath) {
        logger.fatal('cannot find config.json!');
    }

    logger.log('work directory ' + this.data.abilityList[abilityName].workDir);

    var config = file.read(configPath);
    logger.log('config:');
    console.log(chalk.blue(config));
    if (config) {
        this.data.abilityList[abilityName].config = JSON.parse(config);
        this.data.abilityList[abilityName].name = JSON.parse(config).id;
    } else {
        logger.fatal('cannot read config.json!');
    }
};

/**
 * 创建产出目录
 */
Inject.creatReleaseDir = function (abilityName) {
    this.data.abilityList[abilityName].releaseImgDir = path.join(this.data.abilityList[abilityName].releaseDir, 'images');
    this.data.abilityList[abilityName].releaseFile = path.join(this.data.abilityList[abilityName].releaseDir, 'entry.js');
    file.mkdir(this.data.abilityList[abilityName].releaseDir);
    file.mkdir(this.data.abilityList[abilityName].releaseImgDir);
};

/**
 * 编译文件less->css es6->es5, 拷贝到产出目录[project-name]
 */
Inject.compile = function (abilityName) {
    var self = this;
    this.data.abilityList[abilityName].workList.forEach(function (item) {
        self.compileFile(item, abilityName);
    });
};

Inject.release = function (abilityName) {
    var content = '';
    var jsArray = [];
    for (var f in this.data.abilityList[abilityName].jsFiles) {
        if (this.data.abilityList[abilityName].jsFiles.hasOwnProperty(f)) jsArray.push(this.data.abilityList[abilityName].jsFiles[f]);

    }
    var jsCode = jsArray.join(';').replace(/BNC\.use\(/, 'BNC.use(bncStatic,');
    if (this.data.program.uglify) {
        content = util.format(this.data.template, JSON.stringify(this.data.abilityList[abilityName].bncStatic), UglifyJS.minify(jsCode).code);
    } else {
        content = util.format(this.data.template, JSON.stringify(this.data.abilityList[abilityName].bncStatic), jsCode);
    }

    var fileModule = {
        content: content,
        moduleId: abilityName
    };
    content = wrap(fileModule);

    logger.log(chalk.green('release: ' + this.data.abilityList[abilityName].releaseFile));
    file.write(this.data.abilityList[abilityName].releaseFile, content);
};

Inject.rebuild = function () {
    var self = this;

    file.watchDir(self.data.downloadPath, function (type, fullPath) {
        var filename = path.relative(self.data.downloadPath, fullPath);
        logger.log('%s..........%s', type, filename);


        var dirname = path.dirname(fullPath);
        var abilityName = path.basename(dirname);
        self.compileFile(fullPath, abilityName);

        if (self.data.timer) {
            clearTimeout(self.data.timer);
        }

        self.data.timer = setTimeout(function () {
            self.release(abilityName);
        }, 500);
    })

};

Inject.compileFile = function (fullPath, abilityName) {
    var filename = path.relative(this.data.abilityList[abilityName].workDir, fullPath);
    var bncStatic = this.data.abilityList[abilityName].bncStatic;
    //替换<img src='xxx.png?bncimg=1'>
    let htmlReg = /(\s*(?!.*http:\/\/|.*https:\/\/)images\/.*?(?=(\?bncimg=1)).*?)/gi;
    //替换url('xxx.png?bncimg=1')
    let cssReg = /url\(\s*([\'"]?\s*(?!.*http:\/\/|.*https:\/\/).*?images\/.*?)/gi;

    try {
        var cache = file.read(fullPath);
        var reg = new RegExp(this.data.whiteList.join('|'), 'ig');

        if (reg.test(filename)) {
            return false;
        }

        if (/images/ig.test(filename)) {
            // images只拷贝
            file.copy(fullPath, path.join(this.data.abilityList[abilityName].releaseDir, filename));
        }

        if (/\.htm/ig.test(filename)) {
            let $ = cheerio.load(cache, {
                decodeEntities: false
            });
            $('img').each(function (i, elem) {
                const src = $(this).attr('src');
                if (!src)return;
                let matchImg = src.match(htmlReg).join('');
                matchImg = `/bnc_modules/${abilityName}/${matchImg}`;
                $(this).attr('src', matchImg);
            });
            bncStatic.html[filename] = $.html();
        }

        if (/\.less/ig.test(filename)) {
            filename = filename.replace(/\.less/i, '.css');
            less.render(cache, function (e, output) {
                cache = output.css;
            });
        }

        if (/\.css/ig.test(filename)) {
            cache = new CleanCSS({}).minify(cache).styles;
            const replaceImage = cache.replace(cssReg, `url(/bnc_modules/${abilityName}/images/`);
            bncStatic.css[filename] = replaceImage;
        }

        if (/\.js/ig.test(filename)) {
            this.data.abilityList[abilityName].jsFiles[filename] = UglifyJS.minify(cache).code;
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
            delete this.data.abilityList[abilityName].jsFiles[filename];
        }
    }

};
/***
 * 获取用到的所有plugin
 */
Inject.pluginList = function (abilityName) {
    let self = this;
    const content = this.data.abilityList[abilityName].jsFiles[abilityName + '.js'];
    const between = tools.getFromBetween(content, 'BNC.use([', ']');
    if (between.length === 0) return;
    const removeQuotes = () => {
        return between.join(',').replace(/[\'\"\s]/g, "");
    };
    const plugin = removeQuotes().split(',');

    self.data.pluginList = new Set([...self.data.pluginList, ...plugin]);
    self.data.pluginList = [...self.data.pluginList];
};
/**
 * 查找bnc_download文件
 */
Inject.findDownload = function () {
    this.data.downloadPath = path.join(this.data.baseDir, 'bnc_download');
    if (!file.isExist(this.data.downloadPath)) {
        logger.fatal('bnc_download目录不存在,需要先使用bnc download下载能力包');
    }
}

/**
 * 查找bnc_download下的源码包列表
 */
Inject.setDownloadList = function () {
    this.data.downloadList = file.findSubDir(this.data.downloadPath);
    if (this.data.downloadList.length == 0) {
        logger.fatal('当前项目的bnc_download下没有可编译的能力包');
    }
}

/**
 * 创建modules目录
 */
Inject.createModules = function () {
    this.data.modulesPath = path.join(this.data.baseDir, 'bnc_modules');
    file.mkdir(this.data.modulesPath);
}

/**
 * 初始化abilityList
 */
Inject.initList = function (abilityName) {
    this.data.abilityList[abilityName] = {
        bncStatic: {
            html: {},
            css: {}
        },
        jsFiles: {},
        // 需要打包的项目目录
        workDir: path.join(this.data.downloadPath, abilityName),
        // 产出的目录
        releaseDir: path.join(this.data.modulesPath, abilityName),
        // 需要打包的项目目录下的所有文件
        workList: [],
        // 产出的目录下的图片目录
        releaseImgDir: '',
        //产出的文件
        releaseFile: '',
        //打包的项目名
        name: '',
        //读取的config.json
        config: {}
    }
}

Inject.init = function (program, option) {
    var self = this;
    this.data.program = program;
    if (program.args.length > 0) {
        this.data.baseDir = path.join(this.data.baseDir, program.args[0]);
    }

    this.findDownload();
    this.setDownloadList();
    this.createModules();
    this.data.downloadList.map(function (abilityName) {
        self.initList(abilityName);
        self.findPath(abilityName);
        self.creatReleaseDir(abilityName);
        self.compile(abilityName);
        self.release(abilityName);
        self.pluginList(abilityName);
    });

    injectMod(self.data.pluginList);

    if (program.watch) {
        this.rebuild();
    } else {
        logger.success(chalk.green('bnc Inject complete!'));
    }

};

module.exports = Inject;