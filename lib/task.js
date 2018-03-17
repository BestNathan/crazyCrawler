'use strict'
const { noop, randomIP, isEmpty, parseHeader } = require('./util')
const taskState = require('./taskState')
const cookieHelper = require('./cookieHelper')
const axios = require('axios')
const cheerio = require('cheerio')
const util = require('util')
const onerror = e => {
	console.log(e.message)
}

module.exports = class Task {
	constructor({
		name = 'task',
		url = '',
		method = 'get',
		data = {},
		headers = {},
		cookies = {},
		axiosOptions,
		limit,
		functional = false,
		baseUrl,
		baseData,
		paramSetters,
		baseUrlPattern = ':',
		repeat = false,
		beforeTask = noop,
		afterTask = noop,
		inChain = false,
		errorHandler = onerror,
		handler = noop,
		fakeIP = false
	}) {
		//base properties
		this.taskState = taskState.INIT
		this.name = name

		if (util.isString(headers)) {
			headers = parseHeader(headers)
		}

		this.axiosOptions = Object.assign({}, { url, method, data, headers }, axiosOptions)
		this.headers = Object.assign({}, this.headers)
		if (!util.isString(this.data)) {
			this.data = Object.assign({}, this.data)
		}

		//handle Cookie
		this.cookies = cookies
		let cookie = this.axiosOptions.headers && this.axiosOptions.headers['Cookie']
		if (cookie) {
			this.cookies = cookieHelper.cookieParser(cookie)
		}

		//functional properties
		this.counter = 0
		this.limit = limit
		this.functional = functional
		this.baseUrl = baseUrl
		this.baseData = baseData
		this.paramSetters = paramSetters
		this.baseUrlPattern = baseUrlPattern
		this.repeat = repeat

		//other properties
		this.fakeIP = fakeIP
		this.handler = handler
		this.errorHandler = errorHandler

		//inchain properties
		this.inChain = inChain
		this.beforeTask = beforeTask
		this.afterTask = afterTask
	}
	changeState(state) {
		this.taskState = state
	}
	set url(url) {
		this.axiosOptions.url = url
	}
	get url() {
		return this.axiosOptions.url
	}
	set data(data) {
		this.axiosOptions.data = data
	}
	get data() {
		return this.axiosOptions.data
	}
	set method(method) {
		this.axiosOptions.method = method
	}
	get method() {
		return this.axiosOptions.method
	}
	set headers(headers) {
		this.axiosOptions.headers = headers
	}
	get headers() {
		return this.axiosOptions.headers
	}
	async exec() {
		try {
			let hookResult = true
			if (this.inChain) {
				hookResult = await this.beforeTask()
			}

			if (util.isBoolean(hookResult) && !hookResult) {
				return false
			}

			let options = this._toAxios()
			this.taskState = taskState.DOWNLOADING
			let response = await axios(options)
			let result = await this._handleResponse(response)
			this.taskState = taskState.FINISH

			if (this.inChain) {
				hookResult = await this.afterTask(response)
			}

			if (util.isBoolean(hookResult) && !hookResult) {
				return false
			}

			return result
		} catch (e) {
			this.errorHandler(e)
		}
	}
	_handleResponse(res) {
		res.task = this

		let type = res.headers['content-type']
		let cookie = res.headers['set-cookie']

		//parse cookie string to object
		if (cookie) {
			res.cookies = cookieHelper.cookieParser(cookie)
		}

		//if content-type contains 'html' add $ property handled by cheerio to this
		if (~type.indexOf('html')) {
			res.$ = cheerio.load(res.data)
		}

		//get result handled by custom handler
		let result = this.handler(res)

		return result
	}
	_toAxios() {
		let options = Object.assign({}, this.axiosOptions)
		//cookie serilize
		if (!isEmpty(this.cookies)) {
			options.headers['Cookie'] = cookieHelper.cookieSerialize(this.cookies)
		}

		//fake ip header
		if (this.fakeIP) {
			let ip = randomIP()
			options.headers['X-Forwarded-For'] = ip
			options.headers['CLIENT_IP'] = ip
		}
		return options
	}
	checkLimit() {
		if (!this.functional && !this.repeat) {
			return true
		}

		if (util.isNumber(this.limit)) {
			return this.counter < this.limit
		}

		if (util.isFunction(this.limit)) {
			return this.limit(this.counter)
		}

		return false
	}
	copy() {
		let task = new Task(this)
		task.copyFrom = this
		return task
	}
	repeatTask() {
		let { name, axiosOptions, cookies, fakeIP, handler, afterTask, beforeTask, errorHandler, inChain } = this

		axiosOptions = Object.assign({}, axiosOptions)
		cookies = Object.assign({}, cookies)

		this.counter++
		return new Task({ name, axiosOptions, cookies, fakeIP, handler, afterTask, beforeTask, errorHandler, inChain })
	}
	generateTask() {
		// if (this.repeat) {
		// 	return this.repeatTask()
		// }

		if (!this.functional) {
			return this.copy()
		}

		let url = this.baseUrl
		let data = util.isString(this.baseData) ? this.baseData : Object.assign({}, this.baseData)
		let pattern = this.baseUrlPattern
		let params = {}

		for (let key in this.paramSetters) {
			let setter = this.paramSetters[key]
			if (!util.isFunction(setter)) {
				continue
			}

			params[key] = setter(this.counter)

			url = url.replace(new RegExp(pattern + key, 'gm'), params[key])

			if (this.method.toLowerCase() === 'post') {
				if (util.isString(data)) {
					data = data.replace(new RegExp(pattern + key, 'gm'), params[key])
				} else {
					data[key] = params[key]
				}
			}
		}

		let { name, axiosOptions, cookies, fakeIP, handler, afterTask, beforeTask, errorHandler, inChain } = this

		name = name + '.' + this.counter
		axiosOptions = Object.assign({}, axiosOptions)
		cookies = Object.assign({}, cookies)

		axiosOptions.url = url
		axiosOptions.data = data

		let task = new Task({ name, axiosOptions, cookies, fakeIP, handler, afterTask, beforeTask, errorHandler, inChain })
		task.params = Object.assign({}, params)

		this.counter++
		return task
	}
}
