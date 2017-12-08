#!/usr/bin/env node

var program = require('commander');
var lang = require('../lib/lang');
var logger = require('../lib/logger');

var http = require('http');
var path = require('path');
var AdmZip = require('adm-zip');
var url = require('url');
var file = require('../lib/file');

var useLang = lang.CHS;
var apiHost = 'http://yf-rdqa04-dev150-qinhan.epc.baidu.com:8811';


var Download = {
	name: 'bncDemo',
	version: '',
	//执行命令所在目录
    baseDir: process.cwd(),
};


/**
 * Usage.
 */

program
    .usage('<pkg>');

/**
 * Help.
 */

program.on('--help', function () {
	console.log();
    useLang.downloadhelps.forEach(function(item){
        console.log(item);
    });
    console.log();
});

program.parse(process.argv);

process.on('exit', function () {
    console.log();
});


Download.init = function () {
	if (!program.args[0]) {
		console.log();
		logger.fatal('请输入您要下载的能力  example: bnc download bncDemo');
	}

	this.judgeParam();
    this.load();
};

/**
 * download pkg
 */

Download.load = function() {
	let version = this.version.length ? '&version=' + this.version : '';
	let file_url = apiHost + '/bnc/preview/zip?ability=' + this.name + version;
	let file_path = path.join('bnc_download', this.name);
	let self = this;
	var req = http.get(file_url, function(res) {
		var data = [], dataLen = 0;
		res.on('data', function(chunk) {
			data.push(chunk);
			dataLen += chunk.length;
		}).on('end', function() {
			let part = data[0].toString('utf8');
			// 如果返回数据中带errno则表示不能下载
			if (part.indexOf('errno') > -1) {
				let result = JSON.parse(part);
				if(result.errno == '81000056') {
					logger.log(useLang.versionInvalidError);
					self.getVersionList();
				} else if (result.errno == '81000057') {
					logger.log(useLang.versionNotLoadError);
					// self.getVersionList();
				} else {
					logger.fatal('当前能力包不存在');
				}
			} else {
				logger.log(useLang.downloadPkgStart);
				var buf = new Buffer(dataLen);
				for (var i=0, len = data.length, pos = 0; i < len; i++) {
					data[i].copy(buf, pos);
					pos += data[i].length;
				}
				var zip = new AdmZip(buf);
				var zipEntries = zip.getEntries();
				zipEntries.forEach(function(zipEntry) {
					if(!/preview/ig.test(zipEntry.entryName)) {
						if(/images/ig.test(zipEntry.entryName)) {
							zip.extractEntryTo(zipEntry.entryName, file_path + '/images' , false, true);
						} else {
							zip.extractEntryTo(zipEntry.entryName, file_path, false, true);
						}
					}
				});
                // var conf = {
    				// "require":["**"]
                // };
                // if(!file.isExist('bnc.conf')) {
                //     file.writeFileSync('bnc.conf', JSON.stringify(conf));
                // }
				logger.log(useLang.downloadPkgEnd);
			}
		})
	});
	req.on('error', function(err){
	  	console.log(err);
	});
}

/**
 * judge Pkg Param
 */

Download.judgeParam = function() {
	let param = program.args[0];
	let name = '';
	let version = '';
	if (param.indexOf('@') > -1) {
		let paramArr = param.split('@');
		name = paramArr[0];
		version = paramArr[1];
		this.judgeVersion(version);
	} else {
		name = param;
	}
	this.judgeName(name);
}

/**
 * judge pkg name && set name
 */

Download.judgeName = function(name) {
	if (!/^[a-z][a-z0-9]+$/i.test(name)) {
        logger.log(useLang.downloadPkgNameError);
        logger.log(useLang.nameErrorOne);
        logger.log(useLang.nameErrorTwo);
        logger.log(useLang.nameErrorThree);
        process.exit(1);
    }
    this.name = name;
}

/**
 * judge pkg version && set version
 */
Download.judgeVersion = function(version) {
	let reg = /^[0-9]\.[0-9]\.[0-9]+$/;
	if (!reg.test(version)) {
		logger.log(useLang.versionError);
		process.exit(1);
	}
	this.version = version;
}

Download.getVersionList = function () {
	let getMisAbilityVerListUrl = apiHost + '/bnc/node/Ability/getMisAbilityVerList?ability=' + this.name +'&time=' + new Date().getTime();
	let data = '';
	let versionList = [];
	let self = this;
	http.get(getMisAbilityVerListUrl, function(res) {
		res.on('data', function(chunk) {
			data += chunk;
		}).on('end', function() {
			let result = JSON.parse(data);
			result.data['' + self.name].map(function(item) {
				versionList.push(item.version);
			});
			logger.log(useLang.versionListTip);
			logger.log(versionList.join(', '));
		})
	})

}



Download.init();