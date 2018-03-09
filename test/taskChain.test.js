const TaskChain = require('../lib/taskChain')
const { CrazyCrawler, Task } = require('../index')

const taskChain = new TaskChain()

const baiduTask = new Task({
	name: 'baiduTask',
	axiosOptions: {
		url: 'https://www.baidu.com'
	},
	beforeTask: function({ lastTask, task, state }) {
        console.log('baiduTask | before state: ', state)
	},
	afterTask: function({ task, state }) {
		console.log('baiduTask | task is : ' + task.name)
		if (state.execTasks) {
			state.execTasks.push(task.name)
		} else {
			state.execTasks = [task.name]
		}
		console.log('baiduTask | after state: ', state)
	},
	inChain: true
})


const taobaoTask = new Task({
	name: 'taobaoTask',
	axiosOptions: {
		url: 'http://taobao.com'
	},
	beforeTask: function({ lastTask, task, state }) {
		console.log('taobaoTask | before state: ', state)
	},
	afterTask: function({ task, state }) {
		if (state.execTasks) {
			state.execTasks.push(task.name)
		} else {
			state.execTasks = [task.name]
		}
		console.log('taobaoTask | after state: ', state)
	},
	inChain: true
})

let testTaskChain = taskChain.queue([baiduTask, taobaoTask]).toTask()

const c = new CrazyCrawler({
	maxConnection: 5,
	maxTask: 0
})

c.queueTask(testTaskChain).exec({})
c.on('finish', res => {
	console.log(res)
})
