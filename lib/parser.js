const cheerio = require('cheerio')

class Parser {
    constructor(data, type) {
        this.data = data
        this.init(type)
    }
    init(type) {
        try {
            switch (type) {
                case 'json':
                    this.json = JSON.parse(this.data)
                    break
                case 'html':
                    this.$ = cheerio.load(this.data, {
                        decodeEntities: false
                    })
                    break
                default:
                    this.json = null
                    this.$ = null
            }
        } catch (e) {
            this.json = null
            this.$ = null
        }
    }
    static fromHtml(html) {
        return new Parser(html, 'html')
    }
    static fromJson(jsonStr) {
        return new Parser(jsonStr, 'json')
    }
    getJson() {
        return this.json
    }
    get$() {
        return this.$
    }
    getOriginal() {
        return this.data
    }
    handle(fn) {
        return fn()
    }
}

module.exports = Parser