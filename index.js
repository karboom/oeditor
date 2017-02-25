exports.api = require('./oeditor')
exports.storage = {
    Qiniu: require('./storage/qiniu'),
    Local: require('./storage/local')
}