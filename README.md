# Quill 原生微信小程序

在微信开发者工具中导入 **D:\Quill**。根目录 `app.json` 是页面入口，`miniprogramRoot` 为 `./`。修改 JS、WXML、WXSS 后直接在开发者工具编译，无需 npm 安装、uni-app、Vue 或先生成 dist。

## 配置

- AppID：根目录 `project.config.json` 的 `appid`。将 `touristappid` 替换为自己的微信小程序 AppID。后端微信登录配置须使用同一个 AppID。AppSecret 只放后端。
- API 地址和环境隔离：`config/config.js` 的 `apiBaseUrl`、`environment`。
- 运营联系方式：`config/config.js` 的 `operatorContact`。
- 本机个性化开发设置：`project.private.config.json`，迁移时保留用户原文件。

调试基础库为 `3.17.2`。`project.private.config.json` 中的 `libVersion` 会覆盖项目配置，两处应保持一致。

当前兼容方案在 `app.json` 明确使用 `renderer: webview` 和 `componentFramework: exparser`，所有自定义组件在对应页面或组件的 JSON 中显式声明，不使用全局组件注册及 `lazyCodeLoading` 按需注入。工程只有 5 个页面和 4 个组件，采用启动时注入，避免继续依赖此前出现 `loadLibFiles`、`appLaunch timeout`、`navigateTo timeout` 的加载组合。此方案使用 3.17.2 基础库提供的传统组件框架，不要求降级基础库；它不能单独证明 glass-easel 存在缺陷。真实运行结果仍以模拟器和真机验收为准。

默认 API 为 `http://127.0.0.1:3210/v1`。微信开发者工具本地调试可关闭合法域名校验；真机须使用可访问的服务器地址，127.0.0.1 在手机上指手机自身。正式环境配置 HTTPS 请求域名及音频域名。

## 目录与 Hmall 的对应方式

```text
app.js / app.json / app.wxss   应用生命周期、页面注册、全局样式
config/                      环境和接口配置
pages/library/               书架入口
pages/book/                  章节目录
pages/reader/                原文、搜索、逐句与整章播放
pages/settings/              微信登录、速度与进度管理
pages/privacy/               隐私说明
components/                  原生图标、底部弹层、播放器、冲突选择组件
models/                      内容、认证、播放器、进度等业务模块
core/                        独立的播放状态机与并发安全进度同步
utils/                       wx.request、存储、事件订阅、契约辅助函数
wxss/                        共用样式
imgs/                        本地图标
tests/ scripts/              Node 校验（不进入小程序包）
```

每个页面使用原生 `.js / .json / .wxml / .wxss`。业务模块使用微信支持的 CommonJS；页面只管理事件与展示，组件通过 properties / triggerEvent 通信。参考 Hmall 的组织方式，不引入商城业务、商城 AppID 或不需要的 UI 依赖。

## 功能与后端

保留多书书架、分页、最近阅读、章节目录、章内搜索、逐句/整章音频、四档倍速、循环/章内连播、后台暂停、微信登录、游客进度、云端版本冲突与清除确认。进入阅读页不自动播放，搜索保留原句编号，音频授权和进度 API 沿用原后端。

后端仍在 `D:\agent\pidanvocal\_mini\backend`，按 `D:\agent\pidanvocal\_mini\README.md` 启动：在 `_mini` 执行 `npm run dev:api`。前端不内置虚假登录或伪造内容。云端登录需要后端真实微信配置。

`D:\Quill` 中的旧 `frontend/`（uni-app 源码及构建产物）和旧 `contracts/` 副本已清理，直接维护根目录原生工程。AppID 统一在根目录 `project.config.json` 配置。`.codex-tools/` 是已有的本地工具目录，不进入小程序包。

## 校验

安装 Node.js 18 或更高版本后执行 `npm run check`、`npm test`，无需安装依赖。check 检查所有页面四件套、JSON、JS 语法、模块引用和组件引用；test 验证播放取消、音频不可用、并发同步与页面生命周期。

后端运行时可执行 `node scripts/smoke-api.cjs` 检查公开书籍、正文和音频授权接口。

真实微信音频表现、微信登录和发布预览还需在开发者工具/真机中验收。
