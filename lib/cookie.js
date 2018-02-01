const cookie = require('cookie')

let cookieOptions = ['Path', 'Max-Age', 'Domain', 'Expires', 'SameSite']

function cookieParser(str) {
    if (Array.isArray(str)) {
        let arr = str
        str = ''
        arr.forEach(item => {
            str += item + '; '
        })
    }
    let obj = cookie.parse(str)
    cookieOptions.forEach(key => {
        delete obj[key]
    });
    return obj
}

function cookieSerialize(cookies) {
    let str = ''
    let keys = Object.keys(cookies)
    keys.forEach(key => {
        str += key + '=' + cookies[key] + '; '
    })
    return str
}

console.log(cookieParser(['JSESSIONID=ABAAABAAADEAAFI8E4D72F8D58045301737668FA427B1AC; Path=/; HttpOnly',
'user_trace_token=20180201142649-13a3c8b5-ff3a-4efe-bd5f-d3157b24c06d; Max-Age=31536000; Path=/; Domain=.lagou.com; ' ]))

module.exports = {
    cookieParser,
    cookieSerialize
}
