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
    },

    /**
     * 获取Layers定义
     * 返回Cocos Creator中定义的所有Layer及其值
     */
    getLayers() {
      const cc = this.getCC();
      if (!cc) return [];
      
      const layers = [];
      
      // Cocos Creator 3.x - cc.Layers.Enum
      if (cc.Layers && cc.Layers.Enum) {
        const layerEnum = cc.Layers.Enum;
        for (const name in layerEnum) {
          if (typeof layerEnum[name] === 'number') {
            layers.push({ name: name, value: layerEnum[name] });
          }
        }
      }
      // Cocos Creator 2.x - 通常没有Layer概念，但尝试兼容
      else if (cc.Node && cc.Node.BuiltinGroupIndex) {
        const builtinGroups = cc.Node.BuiltinGroupIndex;
        for (const name in builtinGroups) {
          if (typeof builtinGroups[name] === 'number') {
            layers.push({ name: name, value: builtinGroups[name] });
          }
        }
      }
      
      // 如果没有找到任何Layer，返回默认的Layer列表（3.x常见值）
      if (layers.length === 0) {
        layers.push(
          { name: 'NONE', value: 0 },
          { name: 'IGNORE_RAYCAST', value: 1 << 20 },
          { name: 'GIZMOS', value: 1 << 21 },
          { name: 'EDITOR', value: 1 << 22 },
          { name: 'UI_3D', value: 1 << 23 },
          { name: 'SCENE_GIZMO', value: 1 << 24 },
          { name: 'UI_2D', value: 1 << 25 },
          { name: 'PROFILER', value: 1 << 28 },
          { name: 'DEFAULT', value: 1 << 30 }
        );
      }
      
      // 按值排序
      layers.sort((a, b) => a.value - b.value);
      
      return layers;
    },

    /**
     * 根据Layer值获取Layer名称
     */
    getLayerName(layerValue) {
      const layers = this.getLayers();
      const layer = layers.find(l => l.value === layerValue);
      return layer ? layer.name : String(layerValue);
    },

    /**
     * 获取Sprite的SizeMode枚举
     * Cocos Creator中Sprite.SizeMode定义
     */
    getSpriteSizeModes() {
      const cc = this.getCC();
      if (!cc) return this.getDefaultSpriteSizeModes();
      
      const modes = [];
      
      // Cocos Creator 3.x - cc.Sprite.SizeMode
      if (cc.Sprite && cc.Sprite.SizeMode) {
        const sizeMode = cc.Sprite.SizeMode;
        for (const name in sizeMode) {
          if (typeof sizeMode[name] === 'number') {
            modes.push({ name: name, value: sizeMode[name] });
          }
        }
      }
      // Cocos Creator 2.x - cc.Sprite.SizeMode
      else if (cc.Sprite && cc.Sprite.SizeMode) {
        const sizeMode = cc.Sprite.SizeMode;
        for (const name in sizeMode) {
          if (typeof sizeMode[name] === 'number') {
            modes.push({ name: name, value: sizeMode[name] });
          }
        }
      }
      
      if (modes.length === 0) {
        return this.getDefaultSpriteSizeModes();
      }
      
      modes.sort((a, b) => a.value - b.value);
      return modes;
    },

    /**
     * 默认的Sprite SizeMode枚举值
     */
    getDefaultSpriteSizeModes() {
      return [
        { name: 'CUSTOM', value: 0 },
        { name: 'TRIMMED', value: 1 },
        { name: 'RAW', value: 2 }
      ];
    },

    /**
     * 获取Sprite的Type枚举
     * Cocos Creator中Sprite.Type定义
     */
    getSpriteTypes() {
      const cc = this.getCC();
      if (!cc) return this.getDefaultSpriteTypes();
      
      const types = [];
      
      // Cocos Creator 3.x - cc.Sprite.Type
      if (cc.Sprite && cc.Sprite.Type) {
        const spriteType = cc.Sprite.Type;
        for (const name in spriteType) {
          if (typeof spriteType[name] === 'number') {
            types.push({ name: name, value: spriteType[name] });
          }
        }
      }
      // Cocos Creator 2.x - cc.Sprite.Type
      else if (cc.Sprite && cc.Sprite.Type) {
        const spriteType = cc.Sprite.Type;
        for (const name in spriteType) {
          if (typeof spriteType[name] === 'number') {
            types.push({ name: name, value: spriteType[name] });
          }
        }
      }
      
      if (types.length === 0) {
        return this.getDefaultSpriteTypes();
      }
      
      types.sort((a, b) => a.value - b.value);
      return types;
    },

    /**
     * 默认的Sprite Type枚举值
     */
    getDefaultSpriteTypes() {
      return [
        { name: 'SIMPLE', value: 0 },
        { name: 'SLICED', value: 1 },
        { name: 'TILED', value: 2 },
        { name: 'FILLED', value: 3 }
      ];
    },

    /**
     * 获取Sprite的FillType枚举
     * Cocos Creator中Sprite.FillType定义
     */
    getSpriteFillTypes() {
      const cc = this.getCC();
      if (!cc) return this.getDefaultSpriteFillTypes();
      
      const types = [];
      
      // Cocos Creator 3.x - cc.Sprite.FillType
      if (cc.Sprite && cc.Sprite.FillType) {
        const fillType = cc.Sprite.FillType;
        for (const name in fillType) {
          if (typeof fillType[name] === 'number') {
            types.push({ name: name, value: fillType[name] });
          }
        }
      }
      // Cocos Creator 2.x - cc.Sprite.FillType
      else if (cc.Sprite && cc.Sprite.FillType) {
        const fillType = cc.Sprite.FillType;
        for (const name in fillType) {
          if (typeof fillType[name] === 'number') {
            types.push({ name: name, value: fillType[name] });
          }
        }
      }
      
      if (types.length === 0) {
        return this.getDefaultSpriteFillTypes();
      }
      
      types.sort((a, b) => a.value - b.value);
      return types;
    },

    /**
     * 默认的Sprite FillType枚举值
     */
    getDefaultSpriteFillTypes() {
      return [
        { name: 'HORIZONTAL', value: 0 },
        { name: 'VERTICAL', value: 1 },
        { name: 'RADIAL', value: 2 }
      ];
    },

    /**
     * 获取Label的HorizontalAlign枚举
     */
    getLabelHorizontalAligns() {
      const cc = this.getCC();
      if (!cc) return this.getDefaultLabelHorizontalAligns();
      
      const aligns = [];
      const HorizontalAlign = cc.Label?.HorizontalAlign || cc.HorizontalAlign;
      
      if (HorizontalAlign) {
        for (const name in HorizontalAlign) {
          if (typeof HorizontalAlign[name] === 'number') {
            aligns.push({ name: name, value: HorizontalAlign[name] });
          }
        }
      }
      
      if (aligns.length === 0) return this.getDefaultLabelHorizontalAligns();
      aligns.sort((a, b) => a.value - b.value);
      return aligns;
    },

    getDefaultLabelHorizontalAligns() {
      return [
        { name: 'LEFT', value: 0 },
        { name: 'CENTER', value: 1 },
        { name: 'RIGHT', value: 2 }
      ];
    },

    /**
     * 获取Label的VerticalAlign枚举
     */
    getLabelVerticalAligns() {
      const cc = this.getCC();
      if (!cc) return this.getDefaultLabelVerticalAligns();
      
      const aligns = [];
      const VerticalAlign = cc.Label?.VerticalAlign || cc.VerticalAlign;
      
      if (VerticalAlign) {
        for (const name in VerticalAlign) {
          if (typeof VerticalAlign[name] === 'number') {
            aligns.push({ name: name, value: VerticalAlign[name] });
          }
        }
      }
      
      if (aligns.length === 0) return this.getDefaultLabelVerticalAligns();
      aligns.sort((a, b) => a.value - b.value);
      return aligns;
    },

    getDefaultLabelVerticalAligns() {
      return [
        { name: 'TOP', value: 0 },
        { name: 'CENTER', value: 1 },
        { name: 'BOTTOM', value: 2 }
      ];
    },

    /**
     * 获取Label的Overflow枚举
     */
    getLabelOverflows() {
      const cc = this.getCC();
      if (!cc) return this.getDefaultLabelOverflows();
      
      const overflows = [];
      const Overflow = cc.Label?.Overflow || cc.Overflow;
      
      if (Overflow) {
        for (const name in Overflow) {
          if (typeof Overflow[name] === 'number') {
            overflows.push({ name: name, value: Overflow[name] });
          }
        }
      }
      
      if (overflows.length === 0) return this.getDefaultLabelOverflows();
      overflows.sort((a, b) => a.value - b.value);
      return overflows;
    },

    getDefaultLabelOverflows() {
      return [
        { name: 'NONE', value: 0 },
        { name: 'CLAMP', value: 1 },
        { name: 'SHRINK', value: 2 },
        { name: 'RESIZE_HEIGHT', value: 3 }
      ];
    }
  };

  // 导出到全局命名空间
  window.__CCInspector.utils = CCUtils;
})();
