/**
 * Created by wuxuefeng on 2017/12/4.
 * 拼合并注入bnc-common.js
 *
 * 组装顺序
 * bnc-sdk
 * mod
 * bnc-plugin
 *
 * opts:[] 引用js文件位置
 * plugin:[] bnc-plugin组合
 */

const file = require('../lib/file');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const http = require('http');
const staticPath = path.join(__dirname, '../static');

const getPlugin = function () {

};
const hasPlugin = (plugin) => {
    // const allFile = file.scanDirectory(staticPath);
    const allFile = fs.readdirSync(staticPath);

    let hasFile = new Set(allFile);
    let needFile = new Set(plugin);

    let differenceFile = [...needFile].filter(x => !hasFile.has(x));
    downloadPlugin(differenceFile);
};
const downloadPlugin = (diff) => {

    http.get('http://bnc.baidu.com/bnc.js', (res) => {
        const { statusCode } = res;
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
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                console.log(parsedData);
            } catch (e) {}
        });
    }).on('error', (e) => {
        console.error(`错误: ${e.message}`);
    });
    for (let value of diff) {
        const vPath = path.join(staticPath, value);



        // fs.writeFile(vPath, 'data to append'+ value, 'utf8', (err) => {
        //     if (err) throw err;
        // });
    }
};


module.exports = function(opts, plugin) {
    plugin = ['ajax','zepto','tmpl'];
    hasPlugin(plugin);
    if (opts && !opts.length){
        return;
    }
}();

