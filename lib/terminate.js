"use strict";

const colors = require('colors');

const config = require('../config/config');

/**
 * 字符串右边补空白
 */
function padRight (str,len) {
	if (str) {
		let strLen = str.length;
		let cnWords = str.match(/[\u4e00-\u9fa5]/g);
		//中文词按两个字符算
		if (cnWords) {
			strLen += cnWords.length;
		}
		len = Math.max(strLen,len);
		return str + Array(len - strLen + 1).join('0').replace(/0/g,' ');
	} else {
		return ''
	}
}

/**
 * 显示配置表里的股票状态
 */
exports.showStockListStatus = (listStatus, nocolor, short) => {
	exports.clearScreen();
	const stdout = process.stdout;
	let items = short ? Object.keys(config.stockShortMap) : Object.keys(config.stockTermMap);

	stdout.write(padRight('板块', 10));

	items.forEach(item => {
		stdout.write(padRight(short ? config.stockShortMap[item] : config.stockTermMap[item], 10));
	});

	stdout.write('\n');
	// listStatus.sort((stock) => stock.buy)
	// !!~listStatus.findIndex((stock) => stock.buy) && listStatus.splice(listStatus.findIndex((stock) => stock.buy), 0, 'line')


	// const { data, originCode } = listStatus;
	listStatus.map((singleTypeData) => {
		const { items: stockItems, type } = singleTypeData;

		for (let index = 0; index < stockItems.length; index++) {
			const stock = stockItems[index];
			// console.log(stock)
			if (index === 0) {	// 输出一个板块名称
				stdout.write(padRight(type, 10));		
			} else {
				stdout.write(padRight('  ', 10));
			}    
			const { stockData } = stock;
			let color = stockData.percentage.startsWith('-') ? "green" : "red";
			items.forEach(item => {
				let originString = stockData[item];
				if (item === 'percentage') {
					originString += '%';
				}
				let str = padRight(originString, 10);

				if (item === 'current') {
					let icon = stockData.percentage.startsWith('-') ? '🍜' : '🚀'
					str = icon + ' ' + padRight(stockData[item], 8);
				}
				if (nocolor) {
					stdout.write(str);
				} else {
					stdout.write(colors[color](str));				
				}
			});
			stdout.write('\n');
		}
		stdout.write('\n');
	});
};

/**
 * 显示股票状态
 */
exports.showStockStatus = (stockStauts,nocolor) => {
	exports.showStockListStatus([stockStauts],nocolor);
};

/**
 * 显示股票信息
 */
exports.showStockInfo = stocks => {
	const stdout = process.stdout;
	
	let items = ['name','code'];
	
	items.forEach(item => {
		stdout.write(padRight(config.stockTermMap[item],10));
	});
	
	stdout.write('\n');
	
	stocks.forEach(stock => {
		items.forEach(item => {
			console.log(item)
			let str = padRight(stock[item],10);
			stdout.write(str);
			stdout.write(' ');
		});
		stdout.write('\n');
	})
	
};

exports.showMsg = msg => {
	process.stdout.write(colors.red(msg));
};

exports.clearScreen = function(){
	//clear console in windows : http://stackoverflow.com/questions/9006988/node-js-on-windows-how-to-clear-console
	process.stdout.write("\u001b[2J\u001b[0;0H");
};