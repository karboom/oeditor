# oeditor
ueditor的nodejs + koa 后端实现，目前支持七牛云和本地文件系统两种存储方式

##TODO

- [ ] 完善七牛存储的文件列举功能
- [ ] 完善七牛存储的文件列举功能
- [ ] 增加其他平台的文件存储功能（阿里云，又拍云...)
- [ ] 涂鸦功能
- [ ] 图片抓取功能
- [ ] 截图功能

# 使用方法
1. 生成koa实例
```javascript
var koa = require('koa')
var app = koa()
```

2. 生成存储实例
```javascript
var oeditor = require('oeditor')
var qiniu = new oeditor.storage.Qiniu({
    bucket: env.BUCKET, // 七牛对应的存储空间名称
    domain: env.DOMAIN,	// 七牛对应的存储空间域名
    key: env.KEY,	// 七牛的key
    secret: env.SECRET, // 七牛的secret
	prefix: '/'  // 所有文件在七牛云的前缀
})
var local = new oeditor.storage.Local({
    dir: __dirname + '/public/upload',
    prefix: '/public/upload'
})
var mid = oeditor.api({
    config: __dirname + '/editor_config.json', //配置文件的绝对路径
    storage: qiniu // 这里使用你想要的存储方式
})
```

3. 引用中间件
```javascript
var router = require('koa-router')();
router.get('/UE', mid)
router.post('/UE', mid)
app.use(router.routes())
```

更多细节参见测试目录

# 自定义存储
文档待完善

# 测试环境
1.设置环境变量
2.运行命令
``` bash
cd test && node server.js
```


* * *


如果在使用中出现了问题，可以在github的issue提出来，我会尽快处理。
同时欢迎大家PR～
