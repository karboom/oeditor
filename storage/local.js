const _ = require('lodash')
const qiniu = require('qiniu')
const moment = require('moment')
const bluebird = require('bluebird')
const co = require('co')
const fs = require('fs')
const glob = require('glob')
const mkdirp = require('mkdirp')
const fse = require('fs-extra')

function Local (opt) {
    this.dir = opt.dir || '/tmp/oeditor'
    this.prefix = opt.prefix || '/public'

    mkdirp.sync(this.dir)
}

Local.prototype.list_file = function (prefix, start, count) {
    let self = this
    let getFiles = bluebird.promisify(glob)
    
    return co(function*() {
        let whole = getFiles({
            cwd: self.dir + prefix,
            nodir: true,
            realpath: true
        })
        
        console.log(whole)
    })
}

Local.prototype.upload = function (file, key)  {
    let self = this
    return co(function*() {
        let segment = key.split('/')
        segment.pop()
        segment.unshift(self.dir)

        mkdirp.sync(segment.join('/'))
        fse.copySync(file, self.dir + '/' + key)
        
        return self.prefix + '/' + key
    })
}

module.exports = Local