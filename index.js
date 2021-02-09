"use strict";

const fs = require('fs');
const url = require('url');

const request = require('request');

const config = require('./config/config');

const http = request.defaults({
	//proxy: "http://127.0.0.1:8888",	//for fiddler
	jar: true,
	headers: {
		Accept: '*/*',
		"User-Agent": 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36'
	}
});

/**
 * 读取股票代码配置
 */
function readStockCodeFile () {
	return new Promise((resolve,reject) => {
		fs.readFile(config.stockDataFile, (err,data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data.toString());
			}
		})
	})
}

/**
 * 更新股票代码配置
 */
function writeStockCodeFile (data) {
	return new Promise((resolve,reject) => {
		fs.writeFile(config.stockDataFile, data, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		})
	})
}

/**
 * 访问雪球财经站点
 */
function visitStockSite () {
	return new Promise((resolve,reject) => {
		if (http.authed) {
			return resolve();
		}
		http.get(config.stockAPI.site, (err,res,body) => {
			if (err) {
				reject(err);
			} else {
				http.authed = true;
				resolve();
			}
		})
	})
}

/**
 * 根据股票名称/代码获取股票详情
 */
function fetchStockInfo (key) {
	return visitStockSite()
		.then(()=> {
			key = encodeURIComponent(key);
			return new Promise((resolve,reject) => {
				http.get(config.stockAPI.query.replace(/\{key\}/,key), (err,res,body) => {
					if (err) {
						reject(err);
					} else {
						resolve(body);
					}
				})
			})
		})
}

/**
 * 根据股票代码获取股票状态信息,支持多个
 */ 
function fetchStockStatus (code) {
	var isMulti = Array.isArray(code);
	if (isMulti) {
		code = code.join(',');
	}
	return visitStockSite()
		.then(()=> {
			code = encodeURIComponent(code);
			return new Promise((resolve,reject) => {
				http.get(config.stockAPI.info.replace(/\{code\}/,code), (err,res,body) => {
					if (res.statusCode == 400) {
						http.authed = false;
					}
					if (err) {
						reject(err);
					} else {
						resolve(body)
					}
				})
			})
		})
}

function round(v, e) {
	var t=1;
	for(;e>0;t*=10,e--);
	for(;e<0;t/=10,e++);
	return Math.round(v*t)/t;
}

function getStockRSI(items) {
	console.log('-----------------------')
	let zhengChg = 0;	// 正数
	let fuChg = 0;	// 负数
	// 从小到大排列
	for (let index = 0; index < items.length; index++) {
		const item = items[index];
		const open = item[2];
		const close = item[5];
		const change = round((close - open), 2);
		console.log('item', item)
		console.log('open', open)
		console.log('close', close)
		console.log('change', change)


		console.log('\n');

		if (change < 0) {
			fuChg = fuChg + change * -1
		} else {
			zhengChg = zhengChg + change
		}
	}

	// const count = items.length
	// const RS = round((round((zhengChg / count), 3) / round((fuChg / count), 3)), 3);
	// const rsi = 100 - round(100 / (1 + RS), 3);


	zhengChg = round(zhengChg, 2) 
	fuChg = round(fuChg, 2)

	const rsi = zhengChg / (zhengChg + fuChg) * 100

	console.log('fuChg', fuChg)
	console.log('zhengChg', zhengChg)
	console.log('rsi', rsi)
	console.log('-----------------------')

	return rsi.toFixed(3)
}

/**
 * @description: 获取股票的所有数据
 */
function fetchStockTotalData(stock) {
	const { code, stockData } = stock;

	return new Promise((resolve, reject) => {
		// const timestamp = Date.now();
		const timestamp = 1609430400000
		const count  = -1;

		const url = config.stockAPI.data
		.replace(/\{code\}/, code)
		.replace(/\{timestamp\}/, timestamp)
		.replace(/\{count\}/, count);

		http.get(url, (err, res, body) => {
			if (err) {
				reject(err)
			} else {
				const stockOldData = JSON.parse(body);
				const items = stockOldData.data.item;	// 取出获得的数据

				const oldMoney = items[0][5] // 第一个对象，的第6个元素 为收盘价格
				const { current: currentMoney } = stockData;
				const raise = (currentMoney - oldMoney) / oldMoney * 100;

				stockData.raise = raise.toFixed(2) + '%';
				// const rsi = getStockRSI(items);
				// stock.rsi = rsi;
				resolve(stock);
			}
	})
	});
}

exports.queryStockInfo = key => {
	return fetchStockInfo(key)
		.then(data => {
			data = JSON.parse(data);
			
			if (!data.stocks.length) {
				return `无相关股票记录: ${key}`;
			}
			
			return data.stocks;
		})
};

exports.queryStockStatus = code => {
	code = code.toUpperCase();
	return fetchStockStatus(code)
		.then(data => {
			data = JSON.parse(data);
			
			if (data.error_code) {
				return `无此股票代码: ${code}`
			}
			return Object.assign({},data[code],{code:code});
		})
};

exports.queryStockListStatus = () => {
	return readStockCodeFile()
		.then(data => {
			let stockData = JSON.parse(data);

			const codes = [];
			stockData.forEach(singleData => {
				singleData.items.forEach(stock => {
					codes.push(stock.code)
				});
			});
			
			return fetchStockStatus(codes)
				.then(data => {
					data = JSON.parse(data);
					
					if (data.error_code) {
						return [];
					}
					
					stockData.forEach(singleData => {
						singleData.items.forEach(stock => {
							const { code } = stock;
							const stockData = data[code.toUpperCase()];
							const { marketCapital: m } = stockData;
							stockData.raise = ' / ';

							let marketCapital = new Number(m)	// 原始数据市值
							marketCapital = round((marketCapital / 100000000), 0);
							stockData.marketCapital = marketCapital.toString() + '亿';

							if (stockData.pe_ttm === '') {
								stockData.pe_ttm = '亏损';
							} 
							stock.stockData = stockData;
						});
					});

					return stockData;
				})
		})
};

exports.queryStockAnalyseData = (stockData) => {

	const task = [];
	stockData.forEach(singleData => {
		singleData.items.forEach(stock => {
			task.push(fetchStockTotalData(stock));
		});
	});

	return new Promise((resolve,reject) => {
		Promise.all(task).then((results) => {
			resolve(stockData)
		}).catch((err) => {
			reject(err)
		}); 
	})
}

exports.addStock = code => {
	
	return Promise.all([readStockCodeFile(),exports.queryStockInfo(code)])
		.then(results => {
			let stockData = JSON.parse(results[0]);
			
			if (typeof results[1] === "string") {
				return `无此股票代码: ${code}`
			}
			
			let stock = results[1].find(item => item.code.toLowerCase() === code.toLowerCase());
			
			stockData = stockData.filter(item => item.code.toLowerCase() !== code.toLowerCase()).concat({
				code: stock.code,
				name: stock.name
			});
			
			return writeStockCodeFile(JSON.stringify(stockData))	
				.then(()=>`添加股票代码 ${code} 成功`)
		})
};

exports.removeStock = code => {
	return readStockCodeFile()
		.then(data => {
			let stockData = JSON.parse(data);
			
			var index = stockData.findIndex(item => code.toLowerCase() === item.code.toLowerCase());
			
			if (index !== -1) {
				stockData.splice(index,1);
				return writeStockCodeFile(JSON.stringify(stockData))	
					.then(()=>`删除股票代码 ${code} 成功`)
			} else {
				return `列表中无此股票代码: ${code}`;
			}
		})
}

