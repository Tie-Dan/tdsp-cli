// 存放用户所需要的常量
const {
  version,
} = require('../package.json');
// 存储模版的位置
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;
module.exports = {
  version,
  downloadDirectory,
};
