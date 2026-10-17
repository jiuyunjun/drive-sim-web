# Drive Sim Web

[English](#english) | [中文](#中文)

A browser-based 3D driving simulator for practicing Japanese driving test courses. No install, no backend — pick a built-in course map (or upload your own top-down image) and drive.

浏览器里的 3D 驾驶模拟器，用于练习日本驾照考试场地路线。无需安装、无需后端——选择内置考场地图（或上传自己的俯视图）即可开车。

**Live demo / 在线体验:** https://drive-sim-web.web.app/

---

## English

### Features

- **Built-in course maps** for 20+ Japanese driving test centers (Kanagawa, Tokyo Fuchu / Samezu, Osaka, Aichi Hirabari, Okinawa, Sapporo, and more), each with a preset scale and start position
- **Custom maps**: upload any top-down image as the ground texture, adjust its real-world width (up to 1000 m) and set your own spawn point
- **Two vehicles**: Toyota Corolla sedan and a CB400-style motorcycle, each with its own steering feel
- **Three camera views**: chase, first-person cockpit, and free orbit camera
- **Driving aids**: left / center / right mirrors, mini map (drag, zoom, click to teleport), turn signals with sound
- **Tunable feel**: max speed, steering sensitivity, auto-centering, adjustable acceleration curve, volume
- **Mobile support**: landscape touch controls (swipe steering, throttle / brake / reverse buttons, optional linear throttle lever), haptic road feedback, installable as a PWA
- **Graphics quality** presets (Low / Medium / High)
- **Trilingual UI**: 中文 / English / 日本語, auto-selected from the browser language
- All settings persist in the browser's local storage

### Controls (keyboard)

| Key | Action |
| --- | --- |
| W A S D / Arrow keys | Drive & steer |
| Space | Brake |
| Q / E | Left / right turn signal |
| V | Cycle camera views |
| O | Reset vehicle |

### Running locally

The site is pure static files under `public/`. It must be served over HTTP (opening `index.html` directly from disk will not work because of ES modules).

```bash
# Option 1: helper script (opens the browser, falls back to a free port if 8000 is taken)
python scripts/serve.py
# Windows: double-click start.bat

# Option 2: any static server
cd public
python -m http.server 8000
```

Then open http://localhost:8000/. Three.js `0.180.0` is loaded from unpkg via an import map, so an internet connection is required.

### Project structure

```text
public/
  index.html               Language router (redirects to /zh/, /en/ or /ja/)
  zh/ en/ ja/index.html    Localized entry pages
  assets/
    app.js                 Scene, vehicle physics, audio, mirrors, mini map, settings
    i18n.js                Translations for all three languages
    car-model.js, corolla-model.js, cb400-model.js   Procedural vehicle models
    mobile-experience.js   Haptics and render-quality helpers
    ui-layout.js, style.css
    maps/                  Built-in maps: <name>.webp/.jpg + <name>.json, listed in index.json
  sw.js                    Service worker (PWA)
scripts/
  serve.py                 Local static server
  generate-map-assets.ps1  Builds .webp + default .json for new map images (needs ImageMagick)
  test-mobile-experience.mjs   Unit tests: node scripts/test-mobile-experience.mjs
```

### Adding a built-in map

1. Put the course image (e.g. `MyCourse.jpg`) into `public/assets/maps/`.
2. Run `generate-map-assets.bat` (Windows + ImageMagick). It creates `MyCourse.webp`, a default `MyCourse.json` and adds the map to `index.json`.
3. Tune the JSON in-game: adjust scale, park at the start position, click **Set Spawn**, then **Copy Current JSON** and paste it into the file.

```json
{
  "image": "MyCourse.webp",
  "mapWidth": 450,
  "maxSpeed": 17,
  "startPose": { "x": 51.6, "z": -82.3, "heading": 0.2758 }
}
```

### Deployment

`main` is deployed to Firebase Hosting automatically by GitHub Actions (`.github/workflows/`). To deploy your own fork, change the project ID in `.firebaserc` and the workflows, and add a `FIREBASE_SERVICE_ACCOUNT_*` repository secret.

### Contributing

Issues and pull requests are welcome. Any user-facing text must be updated in all three languages (`public/assets/i18n.js` and the three `index.html` pages). Use UTF-8 for all files.

### License

Source code is released under the [MIT License](LICENSE).

The course map images in `public/assets/maps/` are based on publicly available course diagrams and are included for practice reference only; rights belong to their respective owners, and they are **not** covered by the MIT License. The LazyDog Lab logos in `logos/` and `public/assets/logos/` are also excluded. If you are a rights holder and want an image removed, please open an issue.

---

## 中文

### 功能

- **内置考场地图**：收录 20 多个日本驾照考试场（神奈川、东京府中 / 鲛洲、大阪、爱知平针、冲绳、札幌等），每张图都预设了比例与起点
- **自定义地图**：上传任意俯视图作为地面贴图，可调整实际宽度（最大 1000 米）并设置自己的起点
- **两种车型**：丰田卡罗拉轿车与 CB400 风格摩托车，转向手感各不相同
- **三种视角**：跟车视角、第一人称驾驶舱、自由观察视角
- **驾驶辅助**：左 / 中 / 右后视镜，小地图（拖拽、缩放、点击传送），带提示音的转向灯
- **手感可调**：最高车速、转向灵敏度、方向盘自动回正、可调加速曲线、音量
- **移动端支持**：横屏触控操作（滑动转向，油门 / 刹车 / 倒车按钮，可选线性油门拨杆）、路面震动反馈，可作为 PWA 安装
- **画质档位**：低 / 中 / 高
- **三语界面**：中文 / English / 日本語，按浏览器语言自动切换
- 所有设置自动保存在浏览器本地

### 键盘操作

| 按键 | 功能 |
| --- | --- |
| W A S D / 方向键 | 驾驶与转向 |
| 空格 | 刹车 |
| Q / E | 左 / 右转向灯 |
| V | 切换视角 |
| O | 重置车辆 |

### 本地运行

站点是 `public/` 下的纯静态文件，必须通过 HTTP 访问（直接双击打开 `index.html` 会因 ES Module 限制而无法运行）。

```bash
# 方式一：辅助脚本（自动打开浏览器，8000 端口被占用时自动换端口）
python scripts/serve.py
# Windows：双击 start.bat

# 方式二：任意静态服务器
cd public
python -m http.server 8000
```

然后访问 http://localhost:8000/。Three.js `0.180.0` 通过 import map 从 unpkg 加载，需要联网。

### 目录结构

```text
public/
  index.html               语言分流入口（跳转到 /zh/、/en/ 或 /ja/）
  zh/ en/ ja/index.html    三种语言的入口页面
  assets/
    app.js                 场景、车辆物理、音效、后视镜、小地图、设置
    i18n.js                三语文案
    car-model.js, corolla-model.js, cb400-model.js   程序化生成的车辆模型
    mobile-experience.js   震动反馈与画质辅助函数
    ui-layout.js, style.css
    maps/                  内置地图：<名称>.webp/.jpg + <名称>.json，在 index.json 中登记
  sw.js                    Service Worker（PWA）
scripts/
  serve.py                 本地静态服务器
  generate-map-assets.ps1  为新地图生成 .webp 和默认 .json（需要 ImageMagick）
  test-mobile-experience.mjs   单元测试：node scripts/test-mobile-experience.mjs
```

### 添加内置地图

1. 把考场图片（如 `MyCourse.jpg`）放进 `public/assets/maps/`。
2. 运行 `generate-map-assets.bat`（Windows + ImageMagick），会生成 `MyCourse.webp`、默认的 `MyCourse.json`，并登记到 `index.json`。
3. 在游戏里微调：调整比例，把车停到起点，点击“设为起点”，再点“复制当前 JSON”，粘贴回文件即可。

JSON 格式见上方英文部分示例。

### 部署

`main` 分支由 GitHub Actions（`.github/workflows/`）自动部署到 Firebase Hosting。若要部署自己的 fork，请修改 `.firebaserc` 与 workflow 中的项目 ID，并添加 `FIREBASE_SERVICE_ACCOUNT_*` 仓库 Secret。

### 参与贡献

欢迎提交 Issue 和 Pull Request。任何用户可见文案都必须同步更新三种语言（`public/assets/i18n.js` 以及三个 `index.html` 页面）。所有文件请使用 UTF-8 编码。

### 许可证

源代码基于 [MIT License](LICENSE) 开源。

`public/assets/maps/` 中的考场地图图片基于公开的考场路线图制作，仅供练习参考，版权归各自权利人所有，**不**属于 MIT 许可范围。`logos/` 与 `public/assets/logos/` 中的 LazyDog Lab 标志同样不在授权范围内。如您是权利人并希望移除某张图片，请提交 Issue。
