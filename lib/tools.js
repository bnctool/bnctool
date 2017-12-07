exports.arraySearch = function (array, keyword) {
    for (var i = 0; i < array.length; i++) {
        var item = array[i];
        var reg = new RegExp(keyword, 'ig');
        if (reg.test(item)) {
            return item;
        }
    }
    return '';
};

exports.arraySearchAll = function (array, keyword) {
    var ret = [];
    array.forEach(function (value) {
        var reg = new RegExp(keyword, 'ig');
        if (reg.test(value)) {
            ret.push(value);
        }
    });
    return ret;
};

exports.dateFormat = function (date, fmt) {
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

exports.getFromBetween = function (string, sub1, sub2) {
    let results = [];
    const getFromBetween = function (sub1, sub2) {
        if (string.indexOf(sub1) < 0 || string.indexOf(sub2) < 0) return false;
        let SP = string.indexOf(sub1) + sub1.length;
        let string1 = string.substr(0, SP);
        let string2 = string.substr(SP);
        let TP = string1.length + string2.indexOf(sub2);
        return string.substring(SP, TP);
    };
    const removeFromBetween = function (sub1, sub2) {
        if (string.indexOf(sub1) < 0 || string.indexOf(sub2) < 0) return false;
        let removal = sub1 + getFromBetween(sub1, sub2) + sub2;
        string = string.replace(removal, "");
    }
    const getAllResults = function (sub1, sub2) {
        if (string.indexOf(sub1) < 0 || string.indexOf(sub2) < 0) return;

        // find
        let result = getFromBetween(sub1, sub2);
        // push
        results.push(result);
        // remove the most recently found one from the string
        removeFromBetween(sub1, sub2);
        // if there's more substrings
        if (string.indexOf(sub1) > -1 && string.indexOf(sub2) > -1) {
            getAllResults(sub1, sub2);
        }
        else return;
    };
    getAllResults(sub1, sub2);
    return results;
};