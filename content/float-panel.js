(function() {
  // 防止重复注入
  if (window.__ccInspectorFloatPanel) return;
  window.__ccInspectorFloatPanel = true;

  // 检测 Cocos Creator 是否存在
  function detectCocosCreator() {
    return window.cc || (window.CC && window.CC.game);
  }

  // 等待 Cocos Creator 加载后再初始化
  function waitForCocos(callback, maxRetries = 100, interval = 200) {
    let retries = 0;
    const check = () => {
      if (detectCocosCreator()) {
        console.log('[CC Inspector] 检测到 Cocos Creator，初始化浮窗按钮');
        callback();
      } else if (retries++ < maxRetries) {
        setTimeout(check, interval);
      } else {
        console.log('[CC Inspector] 未检测到 Cocos Creator 游戏，浮窗按钮不显示');
      }
    };
    check();
  }

  // 初始化浮窗按钮
  function initFloatPanel() {
    // 创建样式
    const style = document.createElement('style');
  style.textContent = `
    .cc-inspector-float-btn {
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      z-index: 999999;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
      user-select: none;
    }
    .cc-inspector-float-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .cc-inspector-float-btn.dragging {
      opacity: 0.8;
      transform: scale(1.05);
    }
    .cc-inspector-menu {
      position: fixed;
      right: 80px;
      bottom: 20px;
      background: #1e1e2e;
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 999998;
      display: none;
      min-width: 180px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .cc-inspector-menu.show {
      display: block;
      animation: ccMenuFadeIn 0.2s ease;
    }
    @keyframes ccMenuFadeIn {
      from { opacity: 0; transform: translateX(10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .cc-inspector-menu-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: #e0e0e0;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.2s;
      font-size: 14px;
      gap: 10px;
    }
    .cc-inspector-menu-item:hover {
      background: rgba(102, 126, 234, 0.2);
    }
    .cc-inspector-menu-item.active {
      background: rgba(102, 126, 234, 0.3);
      color: #667eea;
    }
    .cc-inspector-menu-icon {
      font-size: 18px;
    }
    /* 性能面板 */
    .cc-inspector-perf-panel {
      position: fixed;
      left: 20px;
      top: 20px;
      background: rgba(30, 30, 46, 0.95);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 999997;
      display: none;
      min-width: 280px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-family: 'Consolas', 'Monaco', monospace;
      color: #e0e0e0;
    }
    .cc-inspector-perf-panel.show {
      display: block;
      animation: ccPanelFadeIn 0.3s ease;
    }
    @keyframes ccPanelFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .cc-inspector-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: move;
    }
    .cc-inspector-panel-title {
      font-size: 16px;
      font-weight: bold;
      color: #667eea;
    }
    .cc-inspector-panel-close {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      font-size: 18px;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .cc-inspector-panel-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
    .cc-inspector-perf-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .cc-inspector-perf-label {
      color: #888;
      font-size: 13px;
    }
    .cc-inspector-perf-value {
      font-size: 13px;
      font-weight: bold;
    }
    .cc-inspector-perf-value.good { color: #4ade80; }
    .cc-inspector-perf-value.warning { color: #fbbf24; }
    .cc-inspector-perf-value.bad { color: #f87171; }
    /* 节点替换面板 */
    .cc-inspector-replace-panel {
      position: fixed;
      right: 20px;
      top: 20px;
      background: rgba(30, 30, 46, 0.95);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 999997;
      display: none;
      min-width: 320px;
      max-height: 80vh;
      overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #e0e0e0;
    }
    .cc-inspector-replace-panel.show {
      display: block;
      animation: ccPanelFadeIn 0.3s ease;
    }
    .cc-inspector-node-search {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.3);
      color: #e0e0e0;
      font-size: 14px;
      margin-bottom: 12px;
      box-sizing: border-box;
    }
    .cc-inspector-node-search:focus {
      outline: none;
      border-color: #667eea;
    }
    .cc-inspector-node-list {
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 12px;
    }
    .cc-inspector-node-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      margin-bottom: 4px;
    }
    .cc-inspector-node-item:hover {
      background: rgba(102, 126, 234, 0.15);
    }
    .cc-inspector-node-item.selected {
      background: rgba(102, 126, 234, 0.3);
      border: 1px solid rgba(102, 126, 234, 0.5);
    }
    .cc-inspector-node-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .cc-inspector-node-name {
      font-size: 14px;
      color: #e0e0e0;
    }
    .cc-inspector-node-type {
      font-size: 11px;
      color: #888;
    }
    .cc-inspector-node-icon {
      font-size: 20px;
    }
    .cc-inspector-replace-section {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .cc-inspector-section-title {
      font-size: 13px;
      color: #888;
      margin-bottom: 8px;
    }
    .cc-inspector-file-input-wrapper {
      position: relative;
      margin-bottom: 8px;
    }
    .cc-inspector-file-input {
      display: none;
    }
    .cc-inspector-file-btn {
      display: block;
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      cursor: pointer;
      text-align: center;
      transition: opacity 0.2s;
    }
    .cc-inspector-file-btn:hover {
      opacity: 0.9;
    }
    .cc-inspector-file-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cc-inspector-selected-file {
      font-size: 12px;
      color: #4ade80;
      margin-top: 8px;
      word-break: break-all;
    }
    .cc-inspector-action-btns {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .cc-inspector-action-btn {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .cc-inspector-action-btn.primary {
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
      color: white;
    }
    .cc-inspector-action-btn.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #e0e0e0;
    }
    .cc-inspector-action-btn:hover {
      opacity: 0.9;
    }
    .cc-inspector-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cc-inspector-toast {
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 30, 46, 0.95);
      color: #e0e0e0;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: ccToastIn 0.3s ease;
    }
    .cc-inspector-toast.success { border-left: 4px solid #4ade80; }
    .cc-inspector-toast.error { border-left: 4px solid #f87171; }
    .cc-inspector-toast.info { border-left: 4px solid #667eea; }
    @keyframes ccToastIn {
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);

  // 创建浮窗按钮
  const floatBtn = document.createElement('button');
  floatBtn.className = 'cc-inspector-float-btn';
  floatBtn.innerHTML = '🎮';
  floatBtn.title = 'CC Inspector 工具';
  document.body.appendChild(floatBtn);

  // 创建菜单
  const menu = document.createElement('div');
  menu.className = 'cc-inspector-menu';
  menu.innerHTML = `
    <div class="cc-inspector-menu-item" data-action="perf">
      <span class="cc-inspector-menu-icon">📊</span>
      <span>性能监控</span>
    </div>
    <div class="cc-inspector-menu-item" data-action="replace">
      <span class="cc-inspector-menu-icon">🎨</span>
      <span>节点资源替换</span>
    </div>
  `;
  document.body.appendChild(menu);

  // 创建性能面板
  const perfPanel = document.createElement('div');
  perfPanel.className = 'cc-inspector-perf-panel';
  perfPanel.innerHTML = `
    <div class="cc-inspector-panel-header">
      <span class="cc-inspector-panel-title">📊 性能监控</span>
      <button class="cc-inspector-panel-close">✕</button>
    </div>
    <div class="cc-inspector-perf-content">
      <div class="cc-inspector-perf-row">
        <span class="cc-inspector-perf-label">FPS</span>
        <span class="cc-inspector-perf-value" id="ccPerfFps">--</span>
      </div>
      <div class="cc-inspector-perf-row">
        <span class="cc-inspector-perf-label">Draw Calls</span>
        <span class="cc-inspector-perf-value" id="ccPerfDrawcalls">--</span>
      </div>
      <div class="cc-inspector-perf-row">
        <span class="cc-inspector-perf-label">三角形数</span>
        <span class="cc-inspector-perf-value" id="ccPerfTriangles">--</span>
      </div>
      <div class="cc-inspector-perf-row">
        <span class="cc-inspector-perf-label">节点数</span>
        <span class="cc-inspector-perf-value" id="ccPerfNodes">--</span>
      </div>
      <div class="cc-inspector-perf-row">
        <span class="cc-inspector-perf-label">引擎版本</span>
        <span class="cc-inspector-perf-value" id="ccPerfVersion">--</span>
      </div>
      <div class="cc-inspector-perf-row">
        <span class="cc-inspector-perf-label">内存使用</span>
        <span class="cc-inspector-perf-value" id="ccPerfMemory">--</span>
      </div>
    </div>
  `;
  document.body.appendChild(perfPanel);

  // 创建节点替换面板
  const replacePanel = document.createElement('div');
  replacePanel.className = 'cc-inspector-replace-panel';
  replacePanel.innerHTML = `
    <div class="cc-inspector-panel-header">
      <span class="cc-inspector-panel-title">🎨 节点资源替换</span>
      <button class="cc-inspector-panel-close">✕</button>
    </div>
    <input type="text" class="cc-inspector-node-search" placeholder="搜索节点名称..." id="ccNodeSearch">
    <div class="cc-inspector-node-list" id="ccNodeList"></div>
    <div class="cc-inspector-replace-section">
      <div class="cc-inspector-section-title">选择图片替换 Sprite</div>
      <div class="cc-inspector-file-input-wrapper">
        <input type="file" class="cc-inspector-file-input" id="ccFileInput" accept="image/*">
        <button class="cc-inspector-file-btn" id="ccFileBtn">📁 选择图片文件</button>
      </div>
      <div class="cc-inspector-selected-file" id="ccSelectedFile"></div>
      <div class="cc-inspector-action-btns">
        <button class="cc-inspector-action-btn secondary" id="ccResetBtn">重置</button>
        <button class="cc-inspector-action-btn primary" id="ccApplyBtn" disabled>应用替换</button>
      </div>
    </div>
  `;
  document.body.appendChild(replacePanel);

  // 状态
  let menuOpen = false;
  let perfOpen = false;
  let replaceOpen = false;
  let selectedNodeUuid = null;
  let selectedFile = null;
  let nodeList = [];
  let perfUpdateInterval = null;

  // 拖拽功能
  function makeDraggable(element, handle) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = element.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      element.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      element.style.left = (initialX + dx) + 'px';
      element.style.top = (initialY + dy) + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      element.classList.remove('dragging');
    });
  }

  // 使浮窗按钮可拖拽
  makeDraggable(floatBtn, floatBtn);
  makeDraggable(perfPanel, perfPanel.querySelector('.cc-inspector-panel-header'));
  makeDraggable(replacePanel, replacePanel.querySelector('.cc-inspector-panel-header'));

  // Toast提示
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `cc-inspector-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // 切换菜单
  floatBtn.addEventListener('click', (e) => {
    if (floatBtn.classList.contains('dragging')) return;
    menuOpen = !menuOpen;
    menu.classList.toggle('show', menuOpen);
    // 更新菜单位置
    const rect = floatBtn.getBoundingClientRect();
    menu.style.right = (window.innerWidth - rect.left + 10) + 'px';
    menu.style.bottom = (window.innerHeight - rect.bottom) + 'px';
  });

  // 点击外部关闭菜单
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== floatBtn) {
      menuOpen = false;
      menu.classList.remove('show');
    }
  });

  // 菜单项点击
  menu.querySelectorAll('.cc-inspector-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'perf') {
        togglePerfPanel();
      } else if (action === 'replace') {
        toggleReplacePanel();
      }
      menu.classList.remove('show');
      menuOpen = false;
    });
  });

  // 关闭按钮
  perfPanel.querySelector('.cc-inspector-panel-close').addEventListener('click', () => {
    togglePerfPanel(false);
  });
  replacePanel.querySelector('.cc-inspector-panel-close').addEventListener('click', () => {
    toggleReplacePanel(false);
  });

  // 切换性能面板
  function togglePerfPanel(forceState) {
    perfOpen = forceState !== undefined ? forceState : !perfOpen;
    perfPanel.classList.toggle('show', perfOpen);
    menu.querySelector('[data-action="perf"]').classList.toggle('active', perfOpen);
    
    if (perfOpen) {
      startPerfUpdate();
    } else {
      stopPerfUpdate();
    }
  }

  // 切换替换面板
  function toggleReplacePanel(forceState) {
    replaceOpen = forceState !== undefined ? forceState : !replaceOpen;
    replacePanel.classList.toggle('show', replaceOpen);
    menu.querySelector('[data-action="replace"]').classList.toggle('active', replaceOpen);
    
    if (replaceOpen) {
      refreshNodeList();
    }
  }

  // 性能更新
  function startPerfUpdate() {
    updatePerf();
    perfUpdateInterval = setInterval(updatePerf, 500);
  }

  function stopPerfUpdate() {
    if (perfUpdateInterval) {
      clearInterval(perfUpdateInterval);
      perfUpdateInterval = null;
    }
  }

  function updatePerf() {
    window.postMessage({ source: 'cc-inspector-float', type: 'getPerf' }, '*');
  }

  // 刷新节点列表
  function refreshNodeList() {
    window.postMessage({ source: 'cc-inspector-float', type: 'getSpriteNodes' }, '*');
  }

  // 高亮节点
  function highlightNode(uuid) {
    window.postMessage({ source: 'cc-inspector-float', type: 'highlightNode', uuid: uuid }, '*');
  }

  // 渲染节点列表
  function renderNodeList(nodes, filter = '') {
    nodeList = nodes;
    const container = document.getElementById('ccNodeList');
    const filtered = filter ? nodes.filter(n => n.name.toLowerCase().includes(filter.toLowerCase())) : nodes;
    
    container.innerHTML = filtered.map(node => `
      <div class="cc-inspector-node-item ${node.uuid === selectedNodeUuid ? 'selected' : ''}" data-uuid="${node.uuid}">
        <div class="cc-inspector-node-info">
          <span class="cc-inspector-node-name">${node.name}</span>
          <span class="cc-inspector-node-type">${node.spriteFrame || '无纹理'}</span>
        </div>
        <span class="cc-inspector-node-icon">🖼️</span>
      </div>
    `).join('');

    container.querySelectorAll('.cc-inspector-node-item').forEach(item => {
      item.addEventListener('click', () => {
        selectedNodeUuid = item.dataset.uuid;
        container.querySelectorAll('.cc-inspector-node-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        updateApplyBtn();
        // 发送高亮请求
        highlightNode(selectedNodeUuid);
      });
    });
  }

  // 搜索
  document.getElementById('ccNodeSearch').addEventListener('input', (e) => {
    renderNodeList(nodeList, e.target.value);
  });

  // 文件选择
  const fileInput = document.getElementById('ccFileInput');
  const fileBtn = document.getElementById('ccFileBtn');
  const selectedFileEl = document.getElementById('ccSelectedFile');
  const applyBtn = document.getElementById('ccApplyBtn');
  const resetBtn = document.getElementById('ccResetBtn');

  fileBtn.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedFile = file;
      selectedFileEl.textContent = `已选择: ${file.name}`;
      updateApplyBtn();
    }
  });

  function updateApplyBtn() {
    applyBtn.disabled = !(selectedNodeUuid && selectedFile);
  }

  // 应用替换
  applyBtn.addEventListener('click', () => {
    if (!selectedNodeUuid || !selectedFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      window.postMessage({
        source: 'cc-inspector-float',
        type: 'replaceSpriteTexture',
        uuid: selectedNodeUuid,
        imageData: dataUrl
      }, '*');
    };
    reader.readAsDataURL(selectedFile);
  });

  // 重置
  resetBtn.addEventListener('click', () => {
    if (selectedNodeUuid) {
      window.postMessage({
        source: 'cc-inspector-float',
        type: 'resetSpriteTexture',
        uuid: selectedNodeUuid
      }, '*');
    }
  });

  // 监听来自注入脚本的消息
  window.addEventListener('message', (e) => {
    if (e.data && e.data.source === 'cc-inspector-float-inject') {
      if (e.data.type === 'perf') {
        const data = e.data.data;
        document.getElementById('ccPerfFps').textContent = data.fps;
        document.getElementById('ccPerfFps').className = 'cc-inspector-perf-value ' + 
          (data.fps >= 55 ? 'good' : data.fps >= 30 ? 'warning' : 'bad');
        document.getElementById('ccPerfDrawcalls').textContent = data.drawcalls;
        document.getElementById('ccPerfDrawcalls').className = 'cc-inspector-perf-value ' + 
          (data.drawcalls < 100 ? 'good' : data.drawcalls < 300 ? 'warning' : 'bad');
        document.getElementById('ccPerfTriangles').textContent = data.triangles;
        document.getElementById('ccPerfNodes').textContent = data.nodes;
        document.getElementById('ccPerfVersion').textContent = data.version;
        document.getElementById('ccPerfMemory').textContent = data.memory;
      } else if (e.data.type === 'spriteNodes') {
        renderNodeList(e.data.nodes);
      } else if (e.data.type === 'replaceResult') {
        if (e.data.success) {
          showToast('纹理替换成功！', 'success');
        } else {
          showToast('替换失败: ' + e.data.error, 'error');
        }
      } else if (e.data.type === 'resetResult') {
        if (e.data.success) {
          showToast('已重置纹理', 'success');
        } else {
          showToast('重置失败: ' + e.data.error, 'error');
        }
      }
    }
  });
  } // 结束 initFloatPanel 函数

  // 等待 Cocos Creator 加载后初始化浮窗
  waitForCocos(initFloatPanel);
})();
