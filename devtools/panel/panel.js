let selectedNode = null;
let lastTreeJson = '';
let lastPropsJson = '';
let expandedNodes = new Set();
const port = chrome.runtime.connect({ name: 'panel' });

port.onMessage.addListener(msg => {
  if (msg.type === 'tree') {
    const json = JSON.stringify(msg.data);
    if (json !== lastTreeJson) {
      lastTreeJson = json;
      renderTree(msg.data);
      // 更新节点数量显示
      const count = countNodes(msg.data);
      document.getElementById('nodeCount').textContent = `(${count}个节点)`;
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
  canvas: '🖥️'
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
    div.innerHTML = `<span class="toggle">${hasChildren ? (isExpanded ? '▼' : '▶') : '  '}</span><span class="node-icon">${icon}</span><span class="name">${node.name}</span>`;
    
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

// 初始刷新
setTimeout(() => {
  port.postMessage({ type: 'refresh', tabId: chrome.devtools.inspectedWindow.tabId });
}, 500);

// 自动刷新 - 500ms间隔
setInterval(() => {
  port.postMessage({ type: 'refresh', tabId: chrome.devtools.inspectedWindow.tabId });
  if (selectedNode) {
    port.postMessage({ type: 'getProps', tabId: chrome.devtools.inspectedWindow.tabId, uuid: selectedNode });
  }
}, 500);
