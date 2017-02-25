const _ = require('lodash')
const qiniu = require('qiniu')
const moment = require('moment')
const bluebird = require('bluebird')
const co = require('co')

function Qiniu (opt) {
    this.prefix = opt.prefix || '/'
    this.domain = opt.domain
    this.bucket = opt.bucket
    this.key = opt.key
    this.secret = opt.secret
    this.mac = new qiniu.auth.digest.Mac(this.key, this.secret)
}

Qiniu.prototype.list_file = function (prefix, start, count){
    let self = this

    qiniu.conf.ACCESS_KEY = this.key
    qiniu.conf.SECRET_KEY = this.secret

    let list_file = bluebird.promisify(qiniu.rsf.listPrefix)

    return co(function*() {
        let res = yield list_file(self.bucket, self.prefix + prefix, '', count, '')

        let list = []
        for (let item of res.items) {
            let url = self.get_download_token(item.key)
            list.push({
                url
            })
        }

        return list
    })
}

Qiniu.prototype.get_download_token = function  (key) {
    url = this.domain + '/' + key;
    var policy = new qiniu.rs.GetPolicy();

    return policy.makeRequest(url, this.mac);
}

Qiniu.prototype.upload = function (file, key)  {
    let self = this

    let uploadFile = bluebird.promisify(qiniu.io.putFile)
    let putPolicy = new qiniu.rs.PutPolicy(this.bucket + ':' + key)
    let extra = new qiniu.io.PutExtra()
    let token = putPolicy.token(this.mac)

    return co(function*() {

        let res = yield uploadFile(token, key, file, extra)

        return self.get_download_token(res.key)
    })
}

module.exports = Qiniu