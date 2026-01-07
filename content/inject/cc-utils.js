/**
 * CC Inspector - Cocos Creator 工具函数
 * 提供与 Cocos Creator 引擎交互的基础方法
 */
(function() {
  // 创建全局命名空间
  window.__CCInspector = window.__CCInspector || {};
  
  const CCUtils = {
    /**
     * 获取 Cocos Creator 引擎实例
     */
    getCC() {
      return window.cc || (window.CC && window.CC.game && window.CC);
    },

    /**
     * 获取引擎版本
     */
    getVersion() {
      const cc = this.getCC();
      if (!cc) return null;
      return cc.ENGINE_VERSION || cc.version || 'unknown';
    },

    /**
     * 判断是否为 3.x 版本
     */
    is3x() {
      const version = this.getVersion();
      return version && (version.startsWith('3.') || version.startsWith('4.'));
    },

    /**
     * 获取当前场景
     */
    getScene() {
      const cc = this.getCC();
      if (!cc) return null;
      // Cocos Creator 3.x
      if (cc.director && cc.director.getScene) return cc.director.getScene();
      // Cocos Creator 2.x
      if (cc.director && cc.director._scene) return cc.director._scene;
      return null;
    },

    /**
     * 根据 UUID 查找节点
     */
    getNodeByUuid(node, uuid) {
      if (!node) return null;
      if ((node.uuid || node._id) === uuid) return node;
      const children = node.children || node._children || [];
      for (let i = 0; i < children.length; i++) {
        const found = this.getNodeByUuid(children[i], uuid);
        if (found) return found;
      }
      return null;
    },

    /**
     * 计算节点数量
     */
    countNodes(node) {
      if (!node) return 0;
      let count = 1;
      const children = node.children || node._children || [];
      for (let i = 0; i < children.length; i++) {
        count += this.countNodes(children[i]);
      }
      return count;
    },

    /**
     * 获取节点的组件列表
     */
    getComponents(node) {
      return node.components || node._components || [];
    },

    /**
     * 获取组件名称
     */
    getComponentName(comp) {
      if (!comp) return '';
      return comp.__classname__ || comp.constructor?.name || '';
    },

    /**
     * 查找指定类型的组件
     */
    findComponent(node, typeName) {
      const components = this.getComponents(node);
      for (let i = 0; i < components.length; i++) {
        const comp = components[i];
        if (!comp) continue;
        const compName = this.getComponentName(comp);
        if (compName.includes(typeName)) {
          return comp;
        }
      }
      return null;
    }
  };

  // 导出到全局命名空间
  window.__CCInspector.utils = CCUtils;
})();
