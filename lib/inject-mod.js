/**
 * Created by wuxuefeng on 2017/12/4.
 * 拼合并注入bnc-common.js
 *
 * 组装顺序
 * bnc-sdk
 * mod
 * bnc-plugin
 *
 * plugin:[] bnc-plugin组合
 */

const file = require('../lib/file');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const http = require('http');
const staticPath = path.join(__dirname, '../static');
// 下载重试次数
let retryNum = 1;
// 插件名拼装
let pluginJoin = '';
let pluginName = '';
// 引用js文件位置
let opts = [];

/***
 * 判断plugin diff
 * todo：根据diff更新插件
 * **/
const hasPlugin = (plugin) => {
    const allFile = fs.readdirSync(staticPath);

    let hasFile = new Set(allFile);
    let needFile = new Set(plugin);

    let differenceFile = [...needFile].filter(x => !hasFile.has(x));
    // downloadPlugin(differenceFile);
};
const downloadPlugin = () => {

    http.get(`http://bnc.baidu.com/bnc.js?plugin=${pluginJoin}`, (res) => {
        const {statusCode} = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
            error = new Error('请求失败。\n' +
                `状态码: ${statusCode}`);
        }
        if (error) {
            console.error(error.message);
            // 消耗响应数据以释放内存
            res.resume();
            return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                const vPath = path.join(staticPath, pluginName);
                fs.writeFile(vPath, rawData, 'utf8', (err) => {
                    if (err) throw err;
                    injectSwitch();
                });
            } catch (e) {
            }
        });
    }).on('error', (e) => {
        console.error(`错误: ${e.message}`);
    });
};

/***
 * 判断是否已经存在拼合好的注入文件
 * */
const hasInjectMod = () => {
    return true;
};

/***
 * 启动注入开关
 * */
const injectSwitch = () => {
    if (hasInjectMod()) {
        assembling();
    } else if (retryNum && !hasInjectMod()) {
        retryNum--;
        downloadPlugin();
    } else {
        console.error('无法获取所需插件，请检查网络后重试。')
    }
};

/***
 * 拼装注入文件
 * */
const assembling = () => {
    const pluginFile = file.read(path.join(staticPath, pluginName));
    const modFile = file.read(path.join(staticPath, 'bnc-mod'));
    const content = pluginFile + modFile;
    fs.writeFile(path.join('bnc_modules', 'bnc-common.js'), content, 'utf8', (err) => {
        if (err) throw err;
        injectJs();
    });
};

/***
 * 注入项目中
 * */
const injectJs = () => {
    for (let value of opts) {
        if (value) {
            // console.log(path.join(value))
        }
    }

    // function findSync(startPath) {
    //     let result=[];
    //     function finder(filePath) {
    //         let files=fs.readdirSync(filePath);
    //         files.forEach((val,index) => {
    //             let fPath=path.join(filePath,val);
    //             let stats=fs.statSync(fPath);
    //             if(stats.isDirectory()) finder(fPath);
    //             if(stats.isFile()) result.push(fPath);
    //         });
    //
    //     }
    //     finder(startPath);
    //     return result;
    // }
    // let fileNames=findSync('./');
    // console.log(fileNames)
    // console.log(file.scanDirectory(path.join()));
    file.fileMap(path.join())

};

const init = (plugin) => {
    if (plugin.length === 0) {
        return
    }
    pluginJoin = plugin.join(',');
    pluginName = plugin.join('-');
    injectSwitch();
};

module.exports = (plugin) => {
    let conf = file.read(path.join('bnc.conf'));
    conf = JSON.parse(conf);
    opts = conf.require || [];
    plugin = ['ajax', 'zepto', 'tmpl'];
    if (opts && !opts.length) {
        return;
    }
    init(plugin);
};

