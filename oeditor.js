const bluebird = require('bluebird')
const moment = require('moment')
const fs = require('fs')
const fse = require('fs-extra')

if (!fs.existsSync('/tmp/oeditor')) fs.mkdirSync('/tmp/oeditor')

let upload_check = function *(file, config) {
    let size = config['MaxSize']
    let ext = config['AllowFiles']

    if (file.size > size) {
        throw  `文件大小超出限制(小于${size})`
    }

    let file_ext = file.name.split('.')[1]
    if (-1 == ext.indexOf('.' + file_ext)) {
        throw '文件类型不允许'
    }
}

let format_path = function (tpl, file_name) {
    let time = moment()
    let time_segment = time.format('YYYY-YY-MM-DD-HH-mm-ss').split('-')

    let res = tpl
        .replace(/\{yyyy\}/g, time_segment[0])
        .replace(/\{yy\}/g, time_segment[1])
        .replace(/\{mm\}/g, time_segment[2])
        .replace(/\{dd\}/g, time_segment[3])
        .replace(/\{hh\}/g, time_segment[4])
        .replace(/\{ii\}/g, time_segment[5])
        .replace(/\{ss\}/g, time_segment[6])
        .replace(/\{time\}/g, time.unix())

    let rand = Math.random().toString().substr(2)
    res = res.replace(/\{rand.*?\}/g, rand)

    if (file_name) {
        file_name = file_name.replace(/(\\|\:|\*|\?|\"|\<|\>|\|)/g, '')
        res = res.replace(/\{filename\}/g, file_name)
    }

    return res
}

let make_pic_success_body = function (url, name) {
    return {
        state: 'SUCCESS',
        url,
        title: name,
        original:name
    }
}

let get_config_fields = function (config, action) {
    let obj = {}
    for (let key of Object.keys(config)) {
        if (key.indexOf(action) == 0) {
            let new_key = key.replace(action, '')
            obj[new_key] = config[key]
        }
    }

    return obj
}

let file_handle = function*(config, storage) {
    let field_name = config['FieldName']
    let file = this.request.body.files[field_name]

    yield upload_check.call(this, file, config)
    let file_name_tpl = config['PathFormat']
    let file_path = format_path(file_name_tpl, file.name)

    let url = yield storage.upload(file.path, file_path)

    this.body = make_pic_success_body(url, file.name)
}

let handles = {
    image: function *() {
        yield file_handle.apply(this, arguments)
    },

    scrawl: function*(config, storage) {
        // 检查大小，写入缓存文件，上传/转移，删除缓存文件
        let base64 = this.request.body.upfile

        if (base64.length > config['MaxSize']) throw '大小超出限制'

        let tmp_path = '/tmp/oeditor/'+ new Date().getTime()
        fs.writeFileSync(tmp_path, base64, {
            encoding: 'base64',
            flags: 'w'
        })

        let file_path = format_path(config['PathFormat'])

        let url  = yield storage.upload(tmp_path, file_path)

        this.body = make_pic_success_body(url, '')
    },

    video: function*() {
        yield file_handle.apply(this, arguments)
    },

    file: function*() {
        yield file_handle.apply(this, arguments)
    },

    imageManager: function*(config, storage) {
        let prefix = config['ListPath'] + config['UrlPrefix']

        let start = this.query.start
        let size = this.query.size

        let {list,total} = yield storage.list_file(prefix, start, size)

        this.body = {
            state: "SUCCESS",
            list,
            start,
            total
        }
    }
}

module.exports = function (opt) {
    const config_plain = fs.readFileSync(opt.config, {encoding: 'utf8'})
    const config = JSON.parse(config_plain.replace(/\/\*.*?\*\//g, ''))
    const storage = opt.storage
    
    return function *() {
        let query = this.request.query
        let match

        // 找出匹配的处理器
        if (query.action == 'config') {
            this.body = config

            return
        } else {
            for (let action of Object.keys(handles)) {
                if (config[action + 'ActionName'] == query.action) {
                    match = action
                }
            }
        }

        if (match) {
            try {
                yield handles[match].call(this, get_config_fields(config, match), storage)
            } catch (e) {
                console.log(e)
                this.body = {
                    state: e
                }
            }
        } else {
            this.body = {
                state: '请求地址错误'
            }
        }
    }
}