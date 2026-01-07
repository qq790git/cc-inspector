/**
 * CC Inspector - 节点树构建模块
 * 负责构建场景节点树和节点类型检测
 */
(function() {
  const utils = window.__CCInspector?.utils;
  if (!utils) {
    console.error('[CC Inspector] cc-utils.js 未加载');
    return;
  }

  const NodeTree = {
    /**
     * 获取节点类型
     */
    getNodeType(node) {
      if (!node) return 'node';
      const components = utils.getComponents(node);
      
      // 优先级顺序检查组件类型
      for (let i = 0; i < components.length; i++) {
        const comp = components[i];
        if (!comp) continue;
        const compName = utils.getComponentName(comp);
        
        // UI组件
        if (compName.includes('Button')) return 'button';
        if (compName.includes('Label') || compName.includes('RichText')) return 'label';
        if (compName.includes('Sprite')) return 'sprite';
        if (compName.includes('EditBox')) return 'editbox';
        if (compName.includes('ScrollView')) return 'scrollview';
        if (compName.includes('PageView')) return 'pageview';
        if (compName.includes('Toggle')) return 'toggle';
        if (compName.includes('ProgressBar')) return 'progressbar';
        if (compName.includes('Slider')) return 'slider';
        if (compName.includes('Layout')) return 'layout';
        if (compName.includes('Widget')) return 'widget';
        if (compName.includes('Mask')) return 'mask';
        
        // 渲染组件
        if (compName.includes('ParticleSystem')) return 'particle';
        if (compName.includes('TiledMap')) return 'tilemap';
        if (compName.includes('Spine') || compName.includes('sp.Skeleton')) return 'spine';
        if (compName.includes('DragonBones')) return 'dragonbones';
        if (compName.includes('Graphics')) return 'graphics';
        
        // 音频
        if (compName.includes('AudioSource')) return 'audio';
        
        // 摄像机和光照
        if (compName.includes('Camera')) return 'camera';
        if (compName.includes('Light')) return 'light';
        
        // 动画
        if (compName.includes('Animation')) return 'animation';
        
        // Canvas
        if (compName.includes('Canvas')) return 'canvas';
      }
      
      return 'node';
    },

    /**
     * 构建节点树
     */
    buildTree(node) {
      if (!node) return null;
      const children = [];
      const nodeChildren = node.children || node._children || [];
      for (let i = 0; i < nodeChildren.length; i++) {
        const child = this.buildTree(nodeChildren[i]);
        if (child) children.push(child);
      }
      return {
        uuid: node.uuid || node._id || String(Math.random()),
        name: node.name || 'unnamed',
        active: node.active !== false && node.activeInHierarchy !== false,
        nodeType: this.getNodeType(node),
        children: children
      };
    },

    /**
     * 查找所有 Sprite 节点
     */
    findSpriteNodes(node, result = []) {
      if (!node) return result;
      
      const spriteComp = utils.findComponent(node, 'Sprite');
      if (spriteComp) {
        let spriteFrameName = '';
        if (spriteComp.spriteFrame) {
          spriteFrameName = spriteComp.spriteFrame.name || spriteComp.spriteFrame._name || '';
        }
        result.push({
          uuid: node.uuid || node._id,
          name: node.name || 'unnamed',
          spriteFrame: spriteFrameName
        });
      }
      
      const children = node.children || node._children || [];
      for (let i = 0; i < children.length; i++) {
        this.findSpriteNodes(children[i], result);
      }
      
      return result;
    }
  };

  // 导出到全局命名空间
  window.__CCInspector.nodeTree = NodeTree;
})();
