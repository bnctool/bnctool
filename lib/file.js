
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var chokidar = require('chokidar');
var logger = require('../lib/logger');

var blackList = ['\.DS_Store', '\.git', '\.idea', 'node_module', 'output', '\.swp', '\.tmp'];

var File = {

    data: [],
    // 存放子目录
    subDirList: [],

    getData: function () {
        return Object.assign([], this.data);
    },

    clean: function () {
        this.data = [];
    },

    cleanSubDirList: function() {
        this.subDirList = [];
    },

    readDir: function (root) {
        var self = this;
        var files = fs.readdirSync(root);
        files.map(function (value) {
            var filename = path.join(root, value);
            var status = fs.statSync(filename);
            if(status.isDirectory()) {
                self.readDir(filename);
            } else {
                self.filter(filename);
            }
        });
    },

    filter: function (filename) {
        var self = this;
        var reg = new RegExp(blackList.join('|'), 'g');
        if(reg.test(filename)) {
            return;
        }
        self.data.push(filename);
    },

    replace: function (filename, from, to) {
        var reg = new RegExp(from, 'ig');

        fs.readFile(filename, {encoding: 'utf-8'}, function (err, data) {
            if(reg.test(data)) {
                var tmp = data.replace(reg, to);
                // logger.log(chalk.blue('replace: ' + filename));
                fs.writeFile(filename, tmp);
            }
        })
    },

    rename: function (oldPath, newPath, callback) {
        fs.rename(oldPath, newPath, callback);
    },

    read: function (filename) {
        if(filename) {
            return fs.readFileSync(filename, {encoding: 'utf-8'});
        } else {
            return '';
        }
    },

    write: function (filename, content) {
        fs.writeFile(filename, content, 'utf8')
    },

    mkdir: function (dir, option) {
        try{
            var stats = fs.statSync(dir);
            if(!stats.isDirectory()) {
                fs.mkdirSync(dir, option);
            }
        }catch(e){
            fs.mkdirSync(dir, option);
        }

    },

    mkdtemp: function (dir, option) {
        return fs.mkdtempSync(dir, option);
    },

    rmdir: function (dir) {
        var self = this;
        var files = fs.readdirSync(dir);
        files.map(function (value) {
            var filename = path.join(dir, value);
            var status = fs.statSync(filename);
            if(status.isDirectory()) {
                self.rmdir(filename);
            } else {
                fs.unlink(filename);
            }
        });
        fs.rmdirSync(dir);
    },

    watchDir: function (dir, cb) {
        var reg = new RegExp(blackList.join('|'), 'g');
        var watcher = chokidar.watch(dir, {
            ignored: reg,
            ignoreInitial: true
        });
        watcher.on('all', function (event, path) {
            cb && cb(event, path);
        });
    },

    copy: function (from, to) {
        var readStream = fs.createReadStream(from);
        var writeStream = fs.createWriteStream(to);
        readStream.pipe(writeStream);
    },

    // 查找子目录，并返回子目录列表
    findSubDir: function(root) {
        var self = this;
        var files = fs.readdirSync(root);
        self.cleanSubDirList();
        files.map(function (value) {
            var filename = path.join(root, value);
            var status = fs.statSync(filename);
            if(status.isDirectory()) {
                self.subDirList.push(value);
            }
        });
        return self.subDirList;
    },

    // 检测文件或者文件夹是否存在
    isExist: function(path) {
        try {
            fs.accessSync(path, fs.F_OK);
        } catch(e) {
            return false;
        }
        return true;
    }
};

module.exports = {
    scanDirectory: function (path) {
        if(File.getData().length > 0) {
            File.clean();
        }
        File.readDir(path);
        return File.getData();
    },
    replace: function (filename, from, to) {
        File.replace(filename, from, to);
    },
    rename: function (oldPath, newPath, callback) {
        File.rename(oldPath, newPath, callback);
    },
    read: function (filename) {
        return File.read(filename);
    },
    write: function (filename, content) {
        File.write(filename, content);
    },
    mkdir: function (dir, option) {
        File.mkdir(dir, option);
    },
    mkdtemp: function (dir, option) {
        return File.mkdtemp(dir, option);
    },
    rmdir: function (dir) {
        File.rmdir(dir);
    },
    watchDir: function (dir, cb) {
        File.watchDir(dir, cb);
    },
    copy: function (from, to) {
        File.copy(from, to);
    },
    findSubDir: function(path) {
        return File.findSubDir(path);
    },
    isExist: function(path) {
        return File.isExist(path);
    }
};