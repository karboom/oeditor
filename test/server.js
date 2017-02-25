/**
 * Created by karboom on 17-2-25.
 */
var koa = require('koa')
var bodyParser = require('koa-body')
var staticCache = require('koa-static-cache')
var router = require('koa-router')();

var app = koa()

// 静态文件
app.use(staticCache(__dirname + '/public', {
    prefix: '/public'
}))
app.use(bodyParser({multipart: true}))

const env = process.env
// 路由部分
var oeditor = require('../index')
var qiniu = new oeditor.storage.Qiniu({
    bucket: env.BUCKET,
    domain: env.DOMAIN,
    key: env.KEY,
    secret: env.SECRET
})

var mid = oeditor.api({
    config: __dirname + '/editor_config.json',
    storage: qiniu
})

router.get('/UE', mid)
router.post('/UE', mid)
app.use(router.routes())


let port = process.env.RUN_PORT || 3000
app.listen(port, function () {
    console.log(`浏览器访问：http://localhost:${port}/public/test.html进行测试`)
})
module.exports = app