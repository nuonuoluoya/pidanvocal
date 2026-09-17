// 首次克隆后生成本地配置。已有配置不覆盖。
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const [example, local] of [
  ['project.config.example.json', 'project.config.json'],
  ['config/config.example.js', 'config/config.js'],
]) {
  const destination = path.join(root, local);
  if (fs.existsSync(destination)) {
    console.log('保留已有配置：' + local);
    continue;
  }
  fs.copyFileSync(path.join(root, example), destination, fs.constants.COPYFILE_EXCL);
  console.log('已生成本地配置：' + local);
}
console.log('请在 project.config.json 填写自己的 AppID，在 config/config.js 设置接口地址。');
