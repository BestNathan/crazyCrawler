const axios = require('axios')
const cheerio = require('cheerio')
const Model = require('./model')
const cookieHelper = require('./cookie')
const { noop, randomIP, isEmpty } = require('./util')
const { defaultHeaders, defaultCookies } = require('./default')

class Task {
	constructor({
		name = 'crawlerTask',
		axiosOptions,
		handler,
		cookies = {},
		beforeTask,
		afterTask,
		inChain = false,
		repeat = 0
	}) {
		this.name = name
		this.axiosOptions = axiosOptions
		this.handler = handler && typeof handler === 'function' ? handler.bind(this) : noop
		this.inChain = inChain
		this.beforeTask = inChain && beforeTask && typeof beforeTask === 'function' ? beforeTask.bind(this) : noop
		this.afterTask = inChain && afterTask && typeof afterTask === 'function' ? afterTask.bind(this) : noop
		this.cookies = cookies
		this.unshift = false
		this.repeat = repeat
		this.execTimes = 0
		this.beenInChain = false
	}
	handleResponse(res) {
		//add some useful properties to this
		this.headers = res.headers
		this.request = res.request
		this.status = res.status
		this.data = res.data

		let that = this
		let type = this.headers['content-type']
		let cookie = this.headers['set-cookie']

		//parse cookie string to object
		if (cookie) {
			this.cookies = Object.assign(this.cookies, cookieHelper.cookieParser(cookie))
		}

		//if content-type contains 'html' add $ property handled by cheerio to this
		if (~type.indexOf('html')) {
			this.$ = cheerio.load(this.data)
		}

		//get result handled by custom handler
		let result = this.handler(this)

		return result
	}
	async exec() {
		try {
			this.mergeOptions()
			this.handleCookie()
			this.inChain && this.beforeTask()

			let res = await axios(this.axiosOptions)
			res = this.handleResponse(res)

			this.inChain && this.afterTask()
			this.execTimes++

			return res
		} catch (e) {
			return e
		}
	}
	fakeIP() {
		//fake IP by add or update 'X-Forwarded-For' and 'CLIENT_IP' header
		this.axiosOptions.headers = Object.assign({}, this.axiosOptions.headers)
		let ip = randomIP()
		this.axiosOptions.headers['X-Forwarded-For'] = ip
		this.axiosOptions.headers['CLIENT_IP'] = ip
	}
	handleCookie() {
		//serialize Cookie object to string which will be added to axios headers option
		let cookie = this.axiosOptions.headers['Cookie']
		if (!cookie) {
			if (!isEmpty(this.cookies)) {
				this.axiosOptions.headers['Cookie'] = cookieHelper.cookieSerialize(this.cookies)
			}
		} else {
			this.cookies = Object.assign(this.cookies, cookieHelper.cookieParser(cookie))
		}
	}
	mergeOptions() {
		this.axiosOptions.headers = Object.assign({}, defaultHeaders, this.axiosOptions.headers)

		this.cookies = Object.assign({}, defaultCookies, this.cookies)
	}
	unshiftTask() {
		this.unshift = true
	}
}

module.exports = Task
