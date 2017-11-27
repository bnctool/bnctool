#!/usr/bin/env node

var http = require('https');
var util = require('util');
var chalk = require('chalk');

var showAbility = function (array) {
    console.log();

    array.forEach(function (item) {
        var name = item.ability;
        var desc = item.description;

        console.log(util.format('name: %s\ndescription: %s', name, desc));
        console.log();
    });

    if(array.length >= 0) {
        console.log('If you want to see more abilities, please input \n' + chalk.green('      bnc -o call'));
    }

    console.log();
};

var req = http.get('https://bnc.baidu.com/api/call/getAllAbilityInfo?order=asc&offset=0&limit=20', function (res) {
    var statusCode = res.statusCode;

    var error;
    if(statusCode !== 200) {
        error = new Error('请求失败。\n' + '状态码: ' + statusCode);
    }
    if(error) {
        console.error('请求遇到问题: ' + error.message);
        res.resume();
        return;
    }

    res.setEncoding('utf8');
    var rawData = '';
    res.on('data', function (chunk) {
        rawData += chunk;
    });
    res.on('end', function () {
        try {
            var parsedData = JSON.parse(rawData);
            showAbility(parsedData.data);
        } catch (e) {
            console.error(e.message);
        }
    })
});

req.on('error', function (e) {
    console.error('请求遇到问题: ' + e.message);
});