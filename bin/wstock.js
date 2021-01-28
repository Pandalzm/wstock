#!/usr/bin/env node
"use strict";

const fs = require('fs');
const http = require('http');
const path = require('path');

const program = require('commander');

const stock = require('../index');
const terminate = require('../lib/terminate');
const config = require('../config/config');
const pkg = require('../package');

function comet(promise, interval) {
	promise()
		.then((success) => {
			success && setInterval(promise, interval);
		})
}

program
	.version(pkg.version)
	.usage('[command]')

/**
 * 查询股票信息
 */
program
	.command('query <name|code>')
	.description('search stock info by name or code')
	.action(name => {
		stock.queryStockInfo(name)
			.then(stocks => {
				if (typeof stocks !== "string") {
					terminate.showStockInfo(stocks);
				} else {
					terminate.showMsg(stocks);
				}
			})
	})	
	
/**
 * 查询股票状态
 */
program
	.command('show <code>')
	.description('show stock status by code')
	.option('-n, --nocolor', 'do not mark the stock status red or green')
	.option('-i, --interval <interval>', 'set the stock check interval')
	.action((code, options) => {
		comet(() => {
			return stock.queryStockStatus(code)
				.then(stockStatus => {
					let stockExist = true;
					if (typeof stockStatus === "string") {
						terminate.showMsg(stockStatus);
						stockExist = false;
					} else {
						terminate.showStockStatus(stockStatus,options.nocolor);
					}

					return stockExist;
				})
		}, +options.interval || config.stockCheckInterval)
	})	
	
/**
 * 查询配置表中所有股票状态
 */
program
	.command('list')
	.description('show the stock status list')
	.option('-n, --nocolor', 'do not mark the stock status red or green')
	.option('-i, --interval <interval>', 'set the stock check interval')
	.option('-s, --short', 'only list current, percentage, low')
	.action((options) => {
		comet(() => {
			return stock.queryStockListStatus()
				.then(listStatus => {
					terminate.showStockListStatus(listStatus, options.nocolor, options.short);
					return true;
				})
		}, +options.interval || config.stockCheckInterval);
	})
	
/**
 * 查询配置表中股票数据
 */
program
.command('data')
.description('show the stock status data')
.option('-n, --nocolor', 'do not mark the stock status red or green')
.option('-i, --interval <interval>', 'set the stock check interval')
.option('-s, --short', 'only data current, percentage, low')
.action((options) => {
	comet(() => {
		return stock.queryStockListStatus()
			.then(listStatus => {
				stock.queryStockAnalyseData(listStatus).then((totalData) => {				
					terminate.showStockListStatus(totalData, options.nocolor, options.short);
					return true;
				})
			})
	}, +options.interval || config.stockCheckInterval);
})

/**
 * 添加股票到配置表
 */
program
	.command('add <code>')
	.description('add stock to stock list')
	.action((code) => {
		code = /^00/.test(code) ? `sz${code}` : /^6/.test(code) ? `sh${code}` : code
		stock.addStock(code)
			.then(msg => {
				terminate.showMsg(msg);
			})
	})	

program
	.command('buy <code> <amount>')
	.description('set stock at leader place')
	.action((code, amount) => {
		console.log(code, amount)
		console.log(code.split(','))
		code = /^00/.test(code) ? `sz${code}` : /^6/.test(code) ? `sh${code}` : code
		stock.addStock(code, {buy: amount})
			.then(msg => {
				terminate.showMsg(msg);
			})
	})

program
	.command('sell <code>')
	.description('set stock at leader place')
	.action((code) => {
		console.log(code)
		console.log(code.split(','))
		code = /^00/.test(code) ? `sz${code}` : /^6/.test(code) ? `sh${code}` : code
		stock.addStock(code)
			.then(msg => {
				terminate.showMsg(msg);
			})
	})
/**
 * 从配置表中移除股票
 */
program
	.command('remove <code>')
	.description('remove stock from stock list')
	.action(code => {
		stock.removeStock(code)
			.then(msg=> {
				terminate.showMsg(msg);
			})
	})

program.parse(process.argv);

// display help by default
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
