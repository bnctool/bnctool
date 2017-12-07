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
const glob = require('glob');
const staticPath = path.join(__dirname, '../static');
// 下载重试次数
let retryNum = 2;
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
    const allFile = new Set(fs.readdirSync(staticPath));
    return allFile.has(pluginName);
};

/***
 * 启动注入开关
 * */
const injectSwitch = () => {
    if (hasInjectMod()) {
        assembling();
    } else if (retryNum && !hasInjectMod()) {
        setTimeout(() => {
            retryNum--;
            downloadPlugin();
        }, 1000);
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
    const fileMap = file.fileMap(path.join());

    // 根据用户配置遍历
    for (let value of opts) {
        if (value) {
            // 获取配置中的bnc_require
            let requireList = gainBncRequire(value);

            for (let v of fileMap) {
                // 读取并插入 script 标签
                const $ = cheerio.load(v.content);
                let scriptString = '';
                $('script').each(function (i, elem) {
                    const src = $(this).attr('src');
                    // 如果标签为后期插入，则删掉
                    if ($(this).data('from') === 'bnc') {
                        $(this).remove();
                        return;
                    }

                    let endDir = relativeToAbsolute(v.dir, src);
                    const optsSet = new Set(opts);
                    endDir = process.cwd() + endDir;

                    // script标签与用户配置相匹配
                    if (endDir !== value) return;
                    if (optsSet.has(endDir)) {
                        if (requireList.length !== 0) {
                            for (let abilityName of requireList) {
                                scriptString += `<script src="/bnc_modules/${abilityName}/entry.js" data-from="bnc"></script>\r\n`
                            }
                        }
                        $(this).before(`<script src="/bnc_modules/bnc-common.js" data-from="bnc"></script>\r\n${scriptString}`);
                        fs.writeFile(path.join(process.cwd(), v.dir), $.html(), 'utf8', (err) => {
                            if (err) throw err;
                        });
                    }
                });
            }
        }
    }


};


const getFromBetween = {
    results: [],
    string: "",
    getFromBetween: function (sub1, sub2) {
        if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
        let SP = this.string.indexOf(sub1) + sub1.length;
        let string1 = this.string.substr(0, SP);
        let string2 = this.string.substr(SP);
        let TP = string1.length + string2.indexOf(sub2);
        return this.string.substring(SP, TP);
    },
    removeFromBetween: function (sub1, sub2) {
        if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
        let removal = sub1 + this.getFromBetween(sub1, sub2) + sub2;
        this.string = this.string.replace(removal, "");
    },
    getAllResults: function (sub1, sub2) {
        // first check to see if we do have both substrings
        if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;

        // find one result
        let result = this.getFromBetween(sub1, sub2);
        // push it to the results array
        this.results.push(result);
        // remove the most recently found one from the string
        this.removeFromBetween(sub1, sub2);

        // if there's more substrings
        if (this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
            this.getAllResults(sub1, sub2);
        }
        else return;
    },
    get: function (string, sub1, sub2) {
        this.results = [];
        this.string = string;
        this.getAllResults(sub1, sub2);
        return this.results;
    }
};

/***
 * 获取配置中的bnc_require
 * @string fileDir 配置中require路径
 */
const gainBncRequire = (fileDir) => {
    const content = file.read(fileDir);
    const between = getFromBetween.get(content, "bnc_require(", ")");
    const result = between.map(value => {
        return value.replace(/\"/g, "").replace(/\'/g, "");
    });

    return result;
};
/***
 * 匹配配置中规则
 * @string fileDir 配置中require路径
 * 垃圾glob，cwd参数无效
 */
const globOpts = (fileDir) => {
    const options = {
        nodir: true,
    };
    const globFile = glob.sync(process.cwd() + fileDir, options);
    return globFile;
};

/***
 * 相对路径转绝对路径
 * @param file 页面所在路径
 * @param src 页面内引用路径
 * @returns {*}
 */
const relativeToAbsolute = (file, src) => {
    if (src === undefined) {
        return '';
    }
    const first = src.trim().substring(0, 1);
    if (first === '/') {
        return src;
    } else {
        return path.join('/', file, '..', src);
    }
};

/***
 * 数组扁平化并去重
 * @param arr
 * @returns {[*]}
 * @constructor
 */
const ArrayFlatten = (arr) => {

    while (arr.some(item => Array.isArray(item))) {
        arr = [].concat(...arr);
    }
    const unique = [...new Set(arr)];
    return unique;
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

    if (opts && opts.length === 0) {
        return;
    }
    let solid = opts.map((value) => {
        const normal = path.normalize(value);
        if (path.isAbsolute(normal)) {

            return globOpts(normal);
        } else {
            return globOpts(`/${normal}`);
        }
    });
    opts = ArrayFlatten(solid);
    init(plugin);
};

