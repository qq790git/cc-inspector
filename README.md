# CC Inspector

CC Inspector 是一款专为 Cocos Creator 游戏开发的浏览器调试插件。它可以帮助开发者实时查看和调试游戏中的节点树、属性、性能指标，并支持纹理替换等功能。

## 主要功能

- **节点树查看 (Node Tree)**: 实时展示 Cocos Creator 场景中的节点层级结构。
- **属性编辑 (Node Properties)**: 查看并修改选中节点的属性（如坐标、缩放、旋转、颜色等）。
- **性能监控 (Performance Monitoring)**: 实时监控游戏的帧率 (FPS) 和内存占用等关键性能指标。
- **纹理替换 (Texture Replacement)**: 支持在运行时动态替换游戏中的纹理，方便快速验证美术资源。
- **节点高亮 (Node Highlighting)**: 在场景中快速定位并高亮显示选中的节点。

## 安装方法

1. 下载本项目代码到本地。
2. 打开 Chrome 浏览器（或基于 Chromium 的浏览器），进入 `chrome://extensions/`。
3. 开启右上角的“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择本项目所在的根目录。

## 使用说明

1. 打开运行 Cocos Creator 游戏的网页。
2. 按 `F12` 打开开发者工具 (DevTools)。
3. 在顶部页签中找到并点击 **CC Inspector**。
4. 即可开始调试您的游戏。

## 项目结构

- `manifest.json`: 插件配置文件。
- `background/`: 后台脚本，处理插件生命周期和通信。
- `content/`: 内容脚本，负责与游戏页面交互。
- `devtools/`: 开发者工具面板的 UI 和逻辑。
- `icons/`: 插件图标资源。

## 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。
