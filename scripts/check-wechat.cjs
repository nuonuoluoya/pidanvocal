const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tools = process.env.WECHAT_DEVTOOLS_HOME || 'D:/微信web开发者工具';
const bin = path.join(tools, 'resources/app.asar.unpacked/node_modules/wcc-exec');
if (!fs.existsSync(path.join(bin, 'wcc.exe')))
    throw Error('找不到微信编译器，请设置 WECHAT_DEVTOOLS_HOME 为开发者工具安装目录');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'quill-native-check-'));
function walk(dir) { return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name).replaceAll('\\', '/')]); }
const files = [...walk('pages'), ...walk('components'), ...walk('wxss'), 'app.wxss'];
function compile(exe, input, out) { const result = spawnSync(path.join(bin, exe), ['-o', path.join(output, out), ...input], { cwd: root, encoding: 'utf8', windowsHide: true }); if (result.error || result.status !== 0 || !fs.existsSync(path.join(output, out)))
    throw Error(result.error || result.stderr || result.stdout || '微信编译失败'); }
const templates = files.filter(f => f.endsWith('.wxml'));
compile('wcc.exe', templates, 'templates.js');
const styles = files.filter(f => f.endsWith('.wxss'));
styles.forEach((f, i) => compile('wcsc.exe', [f, ...styles.filter(s => s !== f)], 'style-' + i + '.js'));
console.log(`微信原生编译器通过：${templates.length} 个 WXML、${styles.length} 个 WXSS。编译输出：${output}`);
