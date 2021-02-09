/*
 * @Author: your name
 * @Date: 2020-07-02 10:25:24
 * @LastEditTime: 2021-01-29 11:23:20
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /wstock/config/config.js
 */
"use strict";

const path = require('path');

exports.stockAPI = {
    query: "http://xueqiu.com/stock/search.json?code={key}",
    info: "http://xueqiu.com/v4/stock/quote.json?code={code}",
    site: "http://xueqiu.com",
    // data: "https://stock.xueqiu.com/v5/stock/chart/kline.json?symbol={code}&begin={timestamp}&period=day&type=before&count=-6&indicator=kline,pe,pb,ps,pcf,market_capital,agt,ggt,balance"
    data: "https://stock.xueqiu.com/v5/stock/chart/kline.json?symbol={code}&begin={timestamp}&period=day&type=before&count={count}"
};

exports.stockDataFile = path.join(__dirname, "./stock.json");

exports.stockTermMap = {
    "name": "股票名称",
    "code": "股票代码",
    "open": "今日开盘",
    "current": "当前价格",
    "high": "今日最高",
    "low": "今日最低",
    "marketCapital": "当前市值",
    "pe_ttm": "市盈率",
    "raise": "年初至今",
    "percentage": "今日涨幅",
};

// exports.stockTermMap = {
//     "name": "股票名称",
//     "code": "股票代码",
//     "open": "今日开盘",
//     "current": "当前价格",
//     "marketCapital": "当前市值",
//     "raise": "年初至今",
//     "percentage": "今日涨幅",
// };

exports.stockShortMap = {
    "name": "NAME",
    "code": "CODE",
    "current": "CURRENT",
    "high": "HIGH",
    "percentage": "PER",
}
exports.stockCheckInterval = 5000;
