/**
 * Created by wuxuefeng on 2017/12/4.
 * 外层添加commonjs规则块
 */

module.exports = function (file) {
    var content = file.content;
    var fileModule = '';
    var prefix = 'bnc_define(\'' + file.moduleId + '\',' + ' function(require, exports, module) {\n\n';
    var affix = '\n\n("undefined"!=typeof module) && (module.exports = BNC)\n});\n';

    fileModule = prefix + content + affix;
    return fileModule;
};
