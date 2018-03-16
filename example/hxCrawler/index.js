const { CrazyCrawler, Task, TaskChain } = require('crazy-crawler')
const crypto = require('crypto')
const uuid = require('uuid')
const { read, write, MD5 } = require('./util')
const spinner = require('ora')()

const usersPath = 'a.txt'
const users = read(usersPath)
	.split('\r\n')
	.filter(a => a)

const loginBaseData = `_from_app=main_app&_from_app_version=3.2.6&_from_channel=9037&_from_channel_type=qr_code&_from_device=:device&_from_mall_id=10138&_from_mall_name=%E7%9F%B3%E5%AE%B6%E5%BA%84%E6%96%B9%E5%8C%97%E5%95%86%E5%9C%BA&_from_os=:os&_from_os_version=:osV&appId=C1C50237&appVersion=3.2.6&captcha=&deviceId=:device&fromSource=9037&marketCode=10138&marketName=%E7%9F%B3%E5%AE%B6%E5%BA%84%E6%96%B9%E5%8C%97%E5%95%86%E5%9C%BA&password=:password&username=:username`

const crawler = new CrazyCrawler({ maxTask: 100 })

let loginTask = new Task({
	name: 'login',
	baseUrl: 'https://api-user.mmall.com/api/user/authenticate',
	baseData: loginBaseData,
	method: 'post',
	paramSetters: {
		username: function(i) {
			return users[i].split('----')[0]
		},
		password: function(i) {
			return MD5(users[i].split('----')[1])
		},
		device: function() {
			return uuid()
		},
		os: function() {
			return 'Android'
		},
		osV: function() {
			return '4.4.1'
		}
	},
	beforeTask: function({ task, state }) {
		//console.log(`progess: ${task.params.username}`)
		spinner.start(task.params.username + ' is logining !')
	},
	afterTask: function({ state, response, task }) {
		if (response.data.code !== 200) {
			//console.log(`login fail: ${task.params.username}`)
			spinner.fail(task.params.username + ' login fail !')
			return false
		}

		state.sessionid = response.data.dataMap.sessionid
		state.openid = response.data.dataMap.openid
		state.device = task.params.device
		state.username = task.params.username

		spinner.succeed(task.params.username + ' login success !')
	},
	fakeIP: true,
	functional: true,
	limit: users.length
})

let lotteryTask = new Task({
	name: 'lottery',
	url: 'https://api-promotion.mmall.com/prize/luckyTry',
	method: 'post',
	beforeTask: function({ state, task }) {
		spinner.start(state.username + ' is lotterying !')
		task.data = {
			openId: state.openid,
			prizeActivityId: 576,
			mobileNum: state.username,
			deviceNo: state.device
		}

		task.headers['x-auth-token'] = state.sessionid
	},
	afterTask: function({ response, state }) {
		if (response.data.code !== '200') {
			spinner.stop()
			return false
		}

		let data = response.data.dataMap
		if (data) {
			let prize = data.prizeName
			write(prize + '.txt', state.username)
			spinner.succeed(state.username + ' : ' + prize + ' !')
		} else {
			spinner.fail(state.username + ' no prize !')
		}
	},
	fakeIP: true,
	repeat: true,
	limit: 3
})

let hxChain = new TaskChain({ functional: true }).queue([loginTask, lotteryTask])

console.time('crawler')
crawler.queueTask(hxChain).run()

crawler.on('done', () => {
	console.timeEnd('crawler')
})
