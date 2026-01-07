chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'panel') {
    port.onMessage.addListener(msg => {
      if (msg.type === 'refresh') {
        chrome.tabs.sendMessage(msg.tabId, { type: 'getTree' }, response => {
          if (response && response.tree) {
            port.postMessage({ type: 'tree', data: response.tree });
            port.postMessage({ type: 'status', data: 'Cocos Creator ' + (response.version || '') });
          } else {
            port.postMessage({ type: 'status', data: '未检测到Cocos Creator' });
          }
        });
      } else if (msg.type === 'getProps') {
        chrome.tabs.sendMessage(msg.tabId, { type: 'getProps', uuid: msg.uuid }, response => {
          if (response && response.props) {
            port.postMessage({ type: 'props', data: response.props });
          }
        });
      } else if (msg.type === 'setProp' || msg.type === 'setVec' || msg.type === 'setSize' || msg.type === 'setColor') {
        chrome.tabs.sendMessage(msg.tabId, msg);
      }
    });
  }
});
