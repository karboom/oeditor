const _ = require('lodash')
const qiniu = require('qiniu')
const moment = require('moment')
const bluebird = require('bluebird')

function Qiniu (opt) {
    this.domain = opt.domain
    this.bucket = opt.bucket
    this.key = opt.key
    this.secret = opt.secret
    this.mac = new qiniu.auth.digest.Mac(this.key, this.secret)
}

Qiniu.prototype.list_file = function (){

}

Qiniu.prototype.get_download_token = function  (key) {
    url = this.domain + '/' + key;
    var policy = new qiniu.rs.GetPolicy();

    return policy.makeRequest(url, this.mac);
}

Qiniu.prototype.upload = function (file, key)  {
    let uploadFile = bluebird.promisify(qiniu.io.putFile)
    let putPolicy = new qiniu.rs.PutPolicy(this.bucket + ':' + key)
    let extra = new qiniu.io.PutExtra()
    let token = putPolicy.token(this.mac)

    return uploadFile(token, key, file, extra)
}

module.exports = Qiniu