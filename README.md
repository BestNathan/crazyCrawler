# crazyCrawler 2.0

crawl everything by this

# Usage(使用方法)

## install(安装)

```bash
npm install crazy-crawler
```

## require(引用)

```js
const { CrazyCrawler, Task, TaskChain } = require('crazy-crawler')

const crawler = new CrazyCrawler({ maxTask: 5, sleep: 100 })

crawler.on('done', () => {
	// crawler finish working
})
```

## create crawler task (创建爬虫任务)

```js
const task = new Task({
	name: 'example',
	url: 'http://www.baidu.com',
	handler: function(response) {
		// response is axios response
		console.log(response.data) //data of axios response
		console.log(response.task.name) // example
	},
	errorHandler: function(err) {
		// when error occurs in HTTP request this handler will be invoked
	}
})
```

## queue task to crawler and run (将任务加入到爬虫队列并运行)

```js
crawler.queueTask(task).run() // run crawler
```

## craete crawler taskChain (创建爬虫任务链)

```js
const taskChain = new TaskChain()

const firstTask = new Task({
	name: 'first',
	url: 'http://www.baidu.com',
	beforeTask: function({ lastTask, task, state }) {
		// if this task is the first task of the task chain
		// lastTask will be undefined
		// task is the task will be executed
		// state is the property of taskChain
		// and used by every task
		console.log(task.name) // first
		state.firstStatus = 'before'
	},
	afterTask: function({ task, state, response }) {
		// response is axios response and the same as response in handler
		console.log(state.firstStatus) // before
		state.firstStatus = 'finish'
	}
})

const secondTask = new Task({
	name: 'second',
	url: 'http://www.baidu.com',
	beforeTask: function({ lastTask, task, state }) {
		console.log(lastTask.name) // first
		console.log(state.firstStatus) // finish
	},
	afterTask: function({ task, state, response }) {
		// response is axios response and the same as response in handler
		console.log(response.task.name) // second
	}
})

taskChain.queue([firstTask, secondTask])
```

## queue taskChain to crawler and run (将任务链加入到爬虫队列并运行)

```js
crawler.queueTask(taskChain).run() // run crawler
```

# examples

## repeat task

* example 1

```js
const crawler = new CrazyCrawler({ maxTask: 5, sleep: 100 })
let counter = 0

crawler.on('done', () => {
	console.log(counter) // 3
})

const repaetTask = new Task({
	name: 'repeat',
	url: 'http://example.com',
	handler: function(response) {
		counter++
	},
	repeat: true,
	limit: 3
})

crawler.queueTask(repaetTask).run()
```

* example 2

```js
const crawler = new CrazyCrawler({ maxTask: 5, sleep: 100 })
let counter = 0

crawler.on('done', () => {
	console.log(counter) // 4
})

const repaetTask = new Task({
	name: 'repeat',
	url: 'http://example.com',
	handler: function(response) {
		counter++
	},
	repeat: true,
	limit: 2
})

const repaetTask1 = new Task({
	name: 'repeat',
	url: 'http://example.com',
	handler: function(response) {
		counter++
	},
	repeat: true,
	limit: 2
})

crawler
	.queueTask(repaetTask)
	.queueTask(repaetTask1)
	.run()
```

## functional task

* example 3

```js
const crawler = new CrazyCrawler({ maxTask: 5, sleep: 100 })
let counter = 0

crawler.on('done', () => {
	console.log(counter) // 2
})

const functionalTask = new Task({
	name: 'functional',
	baseUrl: 'http://example.com/:id',
	paramSetters: {
		id: function(counter) {
			return counter + 123
			// url will be http://example.com/123 http://example.com/124 ...
		}
	},
	handler: function(response) {
		counter++
	},
	functional: true,
	limit: 2
})

crawler.queueTask(functionalTask).run()
```

## functional and repeat task

* example 4

```js
const crawler = new CrazyCrawler({ maxTask: 5, sleep: 100 })
let counter = 0

crawler.on('done', () => {
	console.log(counter) // 4
})

const functionalTask = new Task({
	name: 'functional',
	baseUrl: 'http://example.com/:id',
	paramSetters: {
		id: function(counter) {
			return counter + 123
			// url will be http://example.com/123 http://example.com/124 ...
		}
	},
	handler: function(response) {
		counter++
	},
	functional: true,
	limit: 2
})

const repaetTask = new Task({
	name: 'repeat',
	url: 'http://example.com',
	handler: function(response) {
		counter++
	},
	repeat: true,
	limit: 2
})

crawler
	.queueTask(functionalTask)
	.queueTask(reapeatTask)
	.run()
```

# API

## CrazyCrawler

### CrazyCrawler.constructor({ maxTask, sleep })

* maxkTask: max tasks downloader execs at the same time
* sleep: sleep between every task

### CrazyCrawler.queueTask(task: Task | TaskChain)

* add `task` or `taskChain` to crawler

### CrazyCrawler.run()

* run crawler

### events

#### done

* when crawler finish working 'done' event will be emitted

## Task

### Task.constructor({...options})

#### basic options(基础选项)

* name: the name of task
* url: target url
* method: default to 'get'
* data: only work with `method` is post, can be plain object or string
* headers: can be plain object or string
* cookies: cookie object, if `headers` not exist 'Cookie' property, then use `cookies` options
* axiosOptions: any axios supported options, include `url`,`method`, `data`, `headers`
* handler: to handle `response` if success, parameter is axios response
* errorHandler: to handle error if any `Error` occurs in axios progress
* fakeIP: by add 'X-Forword-For' and 'CLIENT_IP' with random IP to `headers`
* repeat: specific task is repeat
* limit: work with task is `repeat` or `functional`, number or function

#### functional task options(函数式任务选项)

* functional: sepecific task is functional
* baseUrl: generate `url` from baseUrl
* baseData: generate `data` from baseData
* paramSetters: sepecific properties to be generated to `url` and `data`
* baseUrlPattern: how to find where to be replaced with generated param

#### task in chain options(任务链有效的选项)

* inChain: specific task is working in chain
* beforeTask: invoke before axios progress and you can modify the task
* afterTask: invoke after axios progress and you can store some useful data to use in chain

### Task.exec()

run task

### Task.CheckLimit()

check if task is over `limit`

### Task.copy()

return a task with `coptFrom` property of this task

### Task.repeatTask()

return a task like this task

### Task.generateTask()

if task is `functional` this will return a generated task with functional options,
otherwise return `this.copy()` with this task

## TaskChain

### TaskChain.constructor({ repeat, functional, limit })

* repeat: sepecific this task chain is repeat chain
* limit: times to repeat, not work with functional
* functional: sepecific this task chain is functional

### TaskChain.queue(task)

queue tasks to `exec` in chain, order is the order with queue

### TaskChain.toTask()

to `Task`

### TaskChain.checkLimit()

if `reapet` this will check if over `limit`, if functional this will invoke `checkLimit` of every task in chain to check

### TaskChain.generateTaskChain()

if `functional`, this will invoke `generateTask` of every task in chain and push them to a new `TaskChain`, then return this new chain

### TaskChain.repeatTaskChain()

if `repeat`, this will return a new `TaskChain` based on this `taskChain`

# welcome pull request

# Lisence

MIT
