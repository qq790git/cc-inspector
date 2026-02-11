let panelPorts = new Map();

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'panel') {
    let currentTabId = null;
    port.onMessage.addListener(msg => {
      if (msg.tabId) currentTabId = msg.tabId;
      if (currentTabId) panelPorts.set(currentTabId, port);

      if (msg.type === 'refresh') {
        chrome.tabs.sendMessage(msg.tabId, { type: 'getTree' }, response => {
          if (chrome.runtime.lastError) {
            port.postMessage({ type: 'status', data: '未检测到Cocos Creator (等待中...)' });
            return;
          }
          if (response && response.tree) {
            port.postMessage({ type: 'tree', data: response.tree });
            port.postMessage({ type: 'status', data: 'Cocos Creator ' + (response.version || '') });
          } else {
            port.postMessage({ type: 'status', data: '未检测到Cocos Creator' });
          }
        });
      } else if (msg.type === 'getProps') {
        chrome.tabs.sendMessage(msg.tabId, { type: 'getProps', uuid: msg.uuid }, response => {
          if (chrome.runtime.lastError) return;
          if (response && response.props) {
            port.postMessage({ type: 'props', data: response.props });
          }
        });
      } else if (msg.type === 'setProp' || msg.type === 'setVec' || msg.type === 'setSize' || msg.type === 'setColor' || msg.type === 'highlightNode' || msg.type === 'clearHighlight') {
        chrome.tabs.sendMessage(msg.tabId, msg);
      }
    });

    port.onDisconnect.addListener(() => {
      for (let [tabId, p] of panelPorts.entries()) {
        if (p === port) {
          panelPorts.delete(tabId);
          break;
        }
      }
    });
  }
});

// 监听来自 content script 的主动推送
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.source === 'cc-inspector-content' && sender.tab) {
    const port = panelPorts.get(sender.tab.id);
    if (port) {
      if (msg.type === 'status' && msg.data === 'detected') {
        port.postMessage({ type: 'status', data: 'Cocos Creator ' + (msg.version || '') });
        // 检测到 Cocos 后自动请求一次树
        chrome.tabs.sendMessage(sender.tab.id, { type: 'getTree' }, response => {
          if (chrome.runtime.lastError) return;
          if (response && response.tree) {
            port.postMessage({ type: 'tree', data: response.tree });
          }
        });
      } else if (msg.type === 'tree') {
        port.postMessage({ type: 'tree', data: msg.tree });
      } else if (msg.type === 'props') {
        port.postMessage({ type: 'props', data: msg.props });
      }
    }
  }
});
