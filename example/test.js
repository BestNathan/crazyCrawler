
function transBefore(lastTask, task, state, beforeTask) {
    return function __hahaha() {
		beforeTask({ lastTask, task, state })
	}
	
}

function a({ lastTask, task, state }) {
	return 'haha'
}

console.log(a.name)

a = transBefore(a)

console.log(a.name)
