let selectedNode = null;
let lastTreeJson = '';
let lastPropsJson = '';
let expandedNodes = new Set();
let treeData = null;
let searchResults = [];
let currentSearchIndex = -1;

const port = chrome.runtime.connect({ name: 'panel' });

port.onMessage.addListener(msg => {
  if (msg.type === 'tree') {
    const json = JSON.stringify(msg.data);
    if (json !== lastTreeJson) {
      lastTreeJson = json;
      treeData = msg.data;
      renderTree(msg.data);
      // 更新节点数量显示
      const count = countNodes(msg.data);
      document.getElementById('nodeCount').textContent = `(${count}个节点)`;
      
      // 如果有搜索内容，重新应用搜索
      const searchTerm = document.getElementById('searchInput').value;
      if (searchTerm) {
        performSearch(searchTerm, false);
      }
    }
  } else if (msg.type === 'props') {
    const json = JSON.stringify(msg.data);
    if (json !== lastPropsJson) {
      lastPropsJson = json;
      renderProps(msg.data);
    }
  } else if (msg.type === 'status') {
    document.getElementById('status').textContent = msg.data;
  }
});

function countNodes(nodes) {
  if (!nodes) return 0;
  let count = 0;
  nodes.forEach(n => {
    count++;
    if (n.children) count += countNodes(n.children);
  });
  return count;
}

document.getElementById('refreshBtn').onclick = () => {
  lastTreeJson = '';
  lastPropsJson = '';
  port.postMessage({ type: 'refresh', tabId: chrome.devtools.inspectedWindow.tabId });
};

// 节点类型对应的图标
const nodeTypeIcons = {
  node: '📦',
  button: '🔘',
  label: '🔤',
  sprite: '🖼️',
  editbox: '✏️',
  scrollview: '📜',
  pageview: '📄',
  toggle: '☑️',
  progressbar: '📊',
  slider: '🎚️',
  layout: '📐',
  widget: '📌',
  mask: '🎭',
  particle: '✨',
  tilemap: '🗺️',
  spine: '🦴',
  dragonbones: '🐉',
  graphics: '🎨',
  audio: '🔊',
  camera: '📷',
  light: '💡',
  animation: '🎬',
  canvas: '🖥️',
  asset: '📄'
};

function getNodeIcon(nodeType) {
  return nodeTypeIcons[nodeType] || nodeTypeIcons.node;
}

function renderTree(nodes) {
  const container = document.getElementById('nodeTree');
  container.innerHTML = '';
  if (!nodes) return;
  
  function createNode(node, depth = 0) {
    const wrapper = document.createElement('div');
    wrapper.className = 'tree-item';
    
    const div = document.createElement('div');
    div.className = 'tree-node' + (node.active === false ? ' active-false' : '');
    div.style.paddingLeft = (depth * 16) + 'px';
    div.dataset.uuid = node.uuid;
    
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.uuid);
    const icon = getNodeIcon(node.nodeType);
    div.innerHTML = `<span class="toggle">${hasChildren ? (isExpanded ? '▼' : '▶') : '  '}</span><span class="node-icon">${icon}</span><span class="name">${escapeHtml(node.name)}</span>`;
    
    if (node.uuid === selectedNode) div.classList.add('selected');
    
    wrapper.appendChild(div);
    
    let childrenContainer = null;
    if (hasChildren) {
      childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-children';
      childrenContainer.style.display = isExpanded ? '' : 'none';
      node.children.forEach(child => childrenContainer.appendChild(createNode(child, depth + 1)));
      wrapper.appendChild(childrenContainer);
    }
    
    div.onclick = e => {
      e.stopPropagation();
      const toggle = div.querySelector('.toggle');
      if (hasChildren && e.target === toggle) {
        const isCollapsed = childrenContainer.style.display === 'none';
        childrenContainer.style.display = isCollapsed ? '' : 'none';
        toggle.textContent = isCollapsed ? '▼' : '▶';
        if (isCollapsed) expandedNodes.add(node.uuid);
        else expandedNodes.delete(node.uuid);
      } else {
        document.querySelectorAll('.tree-node.selected').forEach(n => n.classList.remove('selected'));
        div.classList.add('selected');
        selectedNode = node.uuid;
        port.postMessage({ type: 'getProps', tabId: chrome.devtools.inspectedWindow.tabId, uuid: node.uuid });
      }
    };

    div.onmouseenter = () => {
      port.postMessage({ type: 'highlightNode', tabId: chrome.devtools.inspectedWindow.tabId, uuid: node.uuid });
    };

    div.onmouseleave = () => {
      port.postMessage({ type: 'clearHighlight', tabId: chrome.devtools.inspectedWindow.tabId });
    };
    
    return wrapper;
  }
  
  nodes.forEach(n => container.appendChild(createNode(n)));
}

function renderProps(props) {
  const container = document.getElementById('properties');
  container.innerHTML = '';
  if (!props) return;
  
  props.forEach(comp => {
    const group = document.createElement('div');
    group.className = 'prop-group';
    group.innerHTML = `<div class="prop-group-title">${comp.name}</div>`;
    
    comp.properties.forEach(p => {
      const row = document.createElement('div');
      row.className = 'prop-row';
      
      if (p.type === 'vec2') {
        row.innerHTML = `<span class="prop-name">${p.name}</span><span class="prop-value prop-multi">
          <label>X</label><input type="number" step="0.1" value="${p.x}" data-field="x">
          <label>Y</label><input type="number" step="0.1" value="${p.y}" data-field="y">
        </span>`;
        row.querySelectorAll('input').forEach(input => {
          input.onchange = () => {
            const vals = { x: row.querySelector('[data-field="x"]').value, y: row.querySelector('[data-field="y"]').value };
            port.postMessage({ type: 'setVec', tabId: chrome.devtools.inspectedWindow.tabId, uuid: selectedNode, comp: comp.name, prop: p.name, value: vals });
          };
        });
      } else if (p.type === 'vec3') {
        row.innerHTML = `<span class="prop-name">${p.name}</span><span class="prop-value prop-multi">
          <label>X</label><input type="number" step="0.1" value="${p.x}" data-field="x">
          <label>Y</label><input type="number" step="0.1" value="${p.y}" data-field="y">
          <label>Z</label><input type="number" step="0.1" value="${p.z}" data-field="z">
        </span>`;
        row.querySelectorAll('input').forEach(input => {
          input.onchange = () => {
            const vals = { x: row.querySelector('[data-field="x"]').value, y: row.querySelector('[data-field="y"]').value, z: row.querySelector('[data-field="z"]').value };
            port.postMessage({ type: 'setVec', tabId: chrome.devtools.inspectedWindow.tabId, uuid: selectedNode, comp: comp.name, prop: p.name, value: vals });
          };
        });
      } else if (p.type === 'size') {
        row.innerHTML = `<span class="prop-name">${p.name}</span><span class="prop-value prop-multi">
          <label>W</label><input type="number" step="1" value="${p.width}" data-field="width">
          <label>H</label><input type="number" step="1" value="${p.height}" data-field="height">
        </span>`;
        row.querySelectorAll('input').forEach(input => {
          input.onchange = () => {
            const vals = { width: row.querySelector('[data-field="width"]').value, height: row.querySelector('[data-field="height"]').value };
            port.postMessage({ type: 'setSize', tabId: chrome.devtools.inspectedWindow.tabId, uuid: selectedNode, comp: comp.name, prop: p.name, value: vals });
          };
        });
      } else if (p.type === 'color') {
        row.innerHTML = `<span class="prop-name">${p.name}</span><span class="prop-value prop-multi">
          <label>R</label><input type="number" min="0" max="255" value="${p.r}" data-field="r">
          <label>G</label><input type="number" min="0" max="255" value="${p.g}" data-field="g">
          <label>B</label><input type="number" min="0" max="255" value="${p.b}" data-field="b">
          <label>A</label><input type="number" min="0" max="255" value="${p.a}" data-field="a">
        </span>`;
        row.querySelectorAll('input').forEach(input => {
          input.onchange = () => {
            const vals = { r: row.querySelector('[data-field="r"]').value, g: row.querySelector('[data-field="g"]').value, b: row.querySelector('[data-field="b"]').value, a: row.querySelector('[data-field="a"]').value };
            port.postMessage({ type: 'setColor', tabId: chrome.devtools.inspectedWindow.tabId, uuid: selectedNode, comp: comp.name, prop: p.name, value: vals });
          };
        });
      } else if (p.type === 'layer' || p.type === 'enum') {
        // 枚举下拉框（Layer、SizeMode、Type等）
        let optionsHtml = '';
        if (p.options && p.options.length > 0) {
          p.options.forEach(opt => {
            const selected = opt.value === p.value ? 'selected' : '';
            optionsHtml += `<option value="${opt.value}" ${selected}>${opt.name}</option>`;
          });
        }
        row.innerHTML = `<span class="prop-name">${p.name}</span><span class="prop-value"><select class="enum-select">${optionsHtml}</select></span>`;
        const select = row.querySelector('select');
        select.onchange = () => {
          port.postMessage({ type: 'setProp', tabId: chrome.devtools.inspectedWindow.tabId, uuid: selectedNode, comp: comp.name, prop: p.name, value: select.value });
        };
      } else if (p.editable && p.type === 'boolean') {
        row.innerHTML = `<span class="prop-name">${p.name}</span><span class="prop-value"><input type="checkbox" ${p.value ? 'checked' : ''}></span>`;
        const checkbox = row.querySelector('input');
        checkbox.onchange = () => {
          port.postMessage({ type: 'setProp', tabId: chrome.devtools.inspectedWindow.tabId, uuid: selectedNode, comp: comp.name, prop: p.name, value: checkbox.checked ? 'true' : 'false' });
        };
      } else if (p.type === 'node-ref') {
        const isNull = !p.uuid && !p.value;
        const typeIcon = isNull ? '📦' : getNodeIcon(p.nodeType);
        const canJump = p.uuid && p.nodeType !== 'asset';
        
        row.innerHTML = `<span class="prop-name">${p.name}</span><span class="prop-value">
          <div class="node-ref-box" title="${canJump ? '点击在节点树中定位' : (isNull ? 'null' : '')}">
            <div class="node-ref-type"><span class="node-ref-type-icon">${typeIcon}</span>${escapeHtml(p.targetType || 'cc.Node')}</div>
            ${isNull ? '<div class="node-ref-null">null</div>' : `<div class="node-ref-name">${escapeHtml(p.value)}</div>`}
          </div>
        </span>`;
        if (canJump) {
          row.querySelector('.node-ref-box').onclick = () => {
            navigateToSearchResultByUuid(p.uuid);
          };
        }
      } else if (p.editable) {
        row.innerHTML = `<span class="prop-name">${p.name}</span><span class="prop-value"><input type="text" value="${escapeHtml(formatValue(p.value))}"></span>`;
        const input = row.querySelector('input');
        input.onchange = () => {
          port.postMessage({ type: 'setProp', tabId: chrome.devtools.inspectedWindow.tabId, uuid: selectedNode, comp: comp.name, prop: p.name, value: input.value });
        };
      } else {
        row.innerHTML = `<span class="prop-name">${p.name}</span><span class="prop-value">${escapeHtml(formatValue(p.value))}</span>`;
      }
      group.appendChild(row);
    });
    
    container.appendChild(group);
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatValue(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// 搜索功能实现
document.getElementById('searchInput').oninput = (e) => {
  performSearch(e.target.value, true);
};

document.getElementById('searchInput').onkeydown = (e) => {
  if (e.key === 'Enter') {
    if (searchResults.length > 0) {
      currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
      navigateToSearchResult(currentSearchIndex);
    }
  }
};

function performSearch(term, shouldScroll) {
  const countSpan = document.getElementById('searchCount');
  if (!term) {
    countSpan.textContent = '';
    searchResults = [];
    currentSearchIndex = -1;
    document.querySelectorAll('.tree-node.search-match').forEach(n => n.classList.remove('search-match'));
    document.querySelectorAll('.tree-node.search-current').forEach(n => n.classList.remove('search-current'));
    return;
  }

  term = term.toLowerCase();
  searchResults = [];
  
  // 递归查找匹配节点
  function findMatches(nodes) {
    nodes.forEach(node => {
      if (node.name.toLowerCase().includes(term)) {
        searchResults.push(node.uuid);
      }
      if (node.children) findMatches(node.children);
    });
  }
  
  if (treeData) findMatches(treeData);
  
  countSpan.textContent = searchResults.length > 0 ? `${searchResults.length} 个结果` : '无结果';
  
  // 高亮所有匹配项
  document.querySelectorAll('.tree-node.search-match').forEach(n => n.classList.remove('search-match'));
  document.querySelectorAll('.tree-node.search-current').forEach(n => n.classList.remove('search-current'));
  
  searchResults.forEach(uuid => {
    const el = document.querySelector(`.tree-node[data-uuid="${uuid}"]`);
    if (el) el.classList.add('search-match');
  });

  if (shouldScroll && searchResults.length > 0) {
    currentSearchIndex = 0;
    navigateToSearchResult(0);
  }
}

function navigateToSearchResultByUuid(uuid) {
  if (!uuid) return;

  // 展开所有父节点
  expandToNode(uuid);
  
  // 重新渲染树
  renderTree(treeData);
  
  // 滚动到目标并选中
  const targetEl = document.querySelector(`.tree-node[data-uuid="${uuid}"]`);
  if (targetEl) {
    document.querySelectorAll('.tree-node.selected').forEach(n => n.classList.remove('selected'));
    targetEl.classList.add('selected');
    selectedNode = uuid;
    targetEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    
    // 获取属性
    port.postMessage({ type: 'getProps', tabId: chrome.devtools.inspectedWindow.tabId, uuid: uuid });
    
    // 触发高亮
    port.postMessage({ type: 'highlightNode', tabId: chrome.devtools.inspectedWindow.tabId, uuid: uuid });
  }
}

function navigateToSearchResult(index) {
  const uuid = searchResults[index];
  navigateToSearchResultByUuid(uuid);
  
  // 重新应用搜索高亮
  searchResults.forEach(u => {
    const el = document.querySelector(`.tree-node[data-uuid="${u}"]`);
    if (el) el.classList.add('search-match');
  });

  const targetEl = document.querySelector(`.tree-node[data-uuid="${uuid}"]`);
  if (targetEl) {
    targetEl.classList.add('search-current');
    // 更新搜索计数显示
    document.getElementById('searchCount').textContent = `${index + 1} / ${searchResults.length}`;
  }
}

function expandToNode(uuid) {
  function findPath(nodes, targetUuid, path) {
    for (const node of nodes) {
      if (node.uuid === targetUuid) return true;
      if (node.children) {
        path.add(node.uuid);
        if (findPath(node.children, targetUuid, path)) return true;
        path.delete(node.uuid);
      }
    }
    return false;
  }

  const path = new Set();
  if (treeData) {
    findPath(treeData, uuid, path);
    path.forEach(id => expandedNodes.add(id));
  }
}

// 初始刷新
setTimeout(() => {
  if (chrome.devtools && chrome.devtools.inspectedWindow) {
    port.postMessage({ type: 'refresh', tabId: chrome.devtools.inspectedWindow.tabId });
  }
}, 500);

// 自动刷新 - 1000ms间隔 (降低轮询频率，依靠主动推送)
setInterval(() => {
  if (chrome.devtools && chrome.devtools.inspectedWindow && chrome.devtools.inspectedWindow.tabId) {
    port.postMessage({ type: 'refresh', tabId: chrome.devtools.inspectedWindow.tabId });
    if (selectedNode) {
      port.postMessage({ type: 'getProps', tabId: chrome.devtools.inspectedWindow.tabId, uuid: selectedNode });
    }
  }
}, 1000);
