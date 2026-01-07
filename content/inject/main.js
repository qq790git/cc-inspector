/**
 * CC Inspector - 主入口文件
 * 加载所有模块并处理消息通信
 */
(function() {
  // 确保全局命名空间存在
  window.__CCInspector = window.__CCInspector || {};

  // 等待所有模块加载完成
  function waitForModules(callback, maxRetries = 50) {
    const required = ['utils', 'nodeTree', 'nodeProps', 'performance', 'textureReplace', 'nodeHighlight'];
    let retries = 0;
    
    const check = () => {
      const allLoaded = required.every(mod => window.__CCInspector[mod]);
      if (allLoaded) {
        callback();
      } else if (retries++ < maxRetries) {
        setTimeout(check, 50);
      } else {
        console.error('[CC Inspector] 模块加载超时');
      }
    };
    check();
  }

  waitForModules(() => {
    const { utils, nodeTree, nodeProps, performance, textureReplace, nodeHighlight } = window.__CCInspector;

    // ========== DevTools 面板消息处理 ==========
    window.addEventListener('message', e => {
      if (e.data && e.data.source === 'cc-inspector') {
        const cc = utils.getCC();
        if (!cc) {
          window.postMessage({ source: 'cc-inspector-inject', type: 'error', msg: 'no cc' }, '*');
          return;
        }

        const scene = utils.getScene();

        switch (e.data.type) {
          case 'getTree': {
            const tree = scene ? [nodeTree.buildTree(scene)] : [];
            window.postMessage({ 
              source: 'cc-inspector-inject', 
              type: 'tree', 
              tree: tree, 
              version: utils.getVersion() 
            }, '*');
            break;
          }
          
          case 'getProps': {
            const node = utils.getNodeByUuid(scene, e.data.uuid);
            const props = nodeProps.getProps(node);
            window.postMessage({ source: 'cc-inspector-inject', type: 'props', props: props }, '*');
            break;
          }
          
          case 'setProp': {
            const node = utils.getNodeByUuid(scene, e.data.uuid);
            if (node) {
              nodeProps.setProp(node, e.data.comp, e.data.prop, e.data.value);
            }
            break;
          }
          
          case 'setVec': {
            const node = utils.getNodeByUuid(scene, e.data.uuid);
            if (node) {
              nodeProps.setVec(node, e.data.comp, e.data.prop, e.data.value);
            }
            break;
          }
          
          case 'setSize': {
            const node = utils.getNodeByUuid(scene, e.data.uuid);
            if (node) {
              nodeProps.setSize(node, e.data.comp, e.data.prop, e.data.value);
            }
            break;
          }
          
          case 'setColor': {
            const node = utils.getNodeByUuid(scene, e.data.uuid);
            if (node) {
              nodeProps.setColor(node, e.data.comp, e.data.prop, e.data.value);
            }
            break;
          }
        }
      }

      // ========== 浮窗功能消息处理 ==========
      if (e.data && e.data.source === 'cc-inspector-float') {
        const cc = utils.getCC();
        if (!cc) return;

        switch (e.data.type) {
          case 'getPerf': {
            const perfData = performance.getPerfData();
            window.postMessage({ 
              source: 'cc-inspector-float-inject', 
              type: 'perf', 
              data: perfData 
            }, '*');
            break;
          }
          
          case 'getSpriteNodes': {
            const scene = utils.getScene();
            const nodes = nodeTree.findSpriteNodes(scene);
            window.postMessage({ 
              source: 'cc-inspector-float-inject', 
              type: 'spriteNodes', 
              nodes: nodes 
            }, '*');
            break;
          }
          
          case 'replaceSpriteTexture': {
            textureReplace.replaceSpriteTexture(e.data.uuid, e.data.imageData)
              .then(result => {
                window.postMessage({ 
                  source: 'cc-inspector-float-inject', 
                  type: 'replaceResult', 
                  ...result 
                }, '*');
              });
            break;
          }
          
          case 'resetSpriteTexture': {
            const result = textureReplace.resetSpriteTexture(e.data.uuid);
            window.postMessage({ 
              source: 'cc-inspector-float-inject', 
              type: 'resetResult', 
              ...result 
            }, '*');
            break;
          }
          
          case 'highlightNode': {
            nodeHighlight.highlightNode(e.data.uuid);
            break;
          }
        }
      }
    });

    console.log('[CC Inspector] 注入脚本已加载，版本: 模块化');
  });
})();
