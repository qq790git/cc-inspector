/**
 * CC Inspector - 节点属性模块
 * 负责获取和设置节点属性
 */
(function() {
  const utils = window.__CCInspector?.utils;
  if (!utils) {
    console.error('[CC Inspector] cc-utils.js 未加载');
    return;
  }

  const NodeProps = {
    // ========== 属性辅助函数 ==========
    addProp(group, name, value, type) {
      if (value === undefined) return;
      group.properties.push({ name, value, type, editable: true });
    },
    
    addVec2(group, name, v) {
      group.properties.push({ name, type: 'vec2', editable: true, x: v.x || 0, y: v.y || 0 });
    },
    
    addVec3(group, name, v) {
      group.properties.push({ name, type: 'vec3', editable: true, x: v.x || 0, y: v.y || 0, z: v.z || 0 });
    },
    
    addSize(group, name, s) {
      group.properties.push({ name, type: 'size', editable: true, width: s.width || 0, height: s.height || 0 });
    },
    
    addColor(group, name, c) {
      group.properties.push({ name, type: 'color', editable: true, r: c.r || 0, g: c.g || 0, b: c.b || 0, a: c.a !== undefined ? c.a : 255 });
    },

    // ========== 获取节点属性 ==========
    getProps(node) {
      if (!node) return [];
      const result = [];
      
      try {
        // Node基本属性
        const nodeProps = { name: 'Node', properties: [] };
        
        // 基础属性
        try { if (node.name !== undefined) this.addProp(nodeProps, 'name', node.name, 'string'); } catch(e) {}
        try { if (node.active !== undefined) this.addProp(nodeProps, 'active', node.active, 'boolean'); } catch(e) {}
        
        // 位置 - 多分量
        try {
          if (node.position) {
            this.addVec3(nodeProps, 'position', node.position);
          } else {
            if (node.x !== undefined) this.addProp(nodeProps, 'x', node.x, 'number');
            if (node.y !== undefined) this.addProp(nodeProps, 'y', node.y, 'number');
            if (node.z !== undefined) this.addProp(nodeProps, 'z', node.z, 'number');
          }
        } catch(e) {}
        
        // 旋转
        try { if (node.angle !== undefined) this.addProp(nodeProps, 'angle', node.angle, 'number'); } catch(e) {}
        try { if (node.eulerAngles) this.addVec3(nodeProps, 'eulerAngles', node.eulerAngles); } catch(e) {}
        
        // 缩放
        try {
          if (node.scale && typeof node.scale === 'object') {
            this.addVec3(nodeProps, 'scale', node.scale);
          } else {
            if (node.scaleX !== undefined) this.addProp(nodeProps, 'scaleX', node.scaleX, 'number');
            if (node.scaleY !== undefined) this.addProp(nodeProps, 'scaleY', node.scaleY, 'number');
            if (node.scaleZ !== undefined) this.addProp(nodeProps, 'scaleZ', node.scaleZ, 'number');
          }
        } catch(e) {}
        
        // 锚点
        try {
          if (node.anchorX !== undefined || node.anchorY !== undefined) {
            this.addVec2(nodeProps, 'anchor', { x: node.anchorX ?? 0, y: node.anchorY ?? 0 });
          }
        } catch(e) {}
        
        // 尺寸
        try {
          if (node.contentSize) {
            this.addSize(nodeProps, 'contentSize', node.contentSize);
          } else if (node.width !== undefined || node.height !== undefined) {
            this.addSize(nodeProps, 'size', { width: node.width ?? 0, height: node.height ?? 0 });
          }
        } catch(e) {}
        
        // 透明度和颜色
        try { if (node.opacity !== undefined) this.addProp(nodeProps, 'opacity', node.opacity, 'number'); } catch(e) {}
        try { if (node.color) this.addColor(nodeProps, 'color', node.color); } catch(e) {}
        
        // 层级
        try { if (node.zIndex !== undefined) this.addProp(nodeProps, 'zIndex', node.zIndex, 'number'); } catch(e) {}
        try {
          if (node.layer !== undefined) {
            const layers = utils.getLayers();
            nodeProps.properties.push({
              name: 'layer',
              value: node.layer,
              type: 'layer',
              editable: true,
              options: layers
            });
          }
        } catch(e) {}
        
        // UUID只读
        try { if (node.uuid) nodeProps.properties.push({ name: 'uuid', value: node.uuid, type: 'string', editable: false }); } catch(e) {}
        
        result.push(nodeProps);

        // 组件属性
        const components = utils.getComponents(node);
        components.forEach(comp => {
          if (!comp) return;
          try {
            const compName = utils.getComponentName(comp) || 'Component';
            const compProps = { name: compName, properties: [] };
            
            // 通用组件属性
            try { if (comp.enabled !== undefined) this.addProp(compProps, 'enabled', comp.enabled, 'boolean'); } catch(e) {}
            
            // 根据组件类型添加特定属性
            this.addComponentProps(comp, compName, compProps);
            
            // UUID只读
            try { if (comp.uuid) compProps.properties.push({ name: 'uuid', value: comp.uuid, type: 'string', editable: false }); } catch(e) {}
            
            if (compProps.properties.length > 0) result.push(compProps);
          } catch(e) {}
        });
      } catch(e) {}

      return result;
    },

    /**
     * 根据组件类型添加特定属性
     */
    addComponentProps(comp, compName, compProps) {
      const isSprite = compName.includes('Sprite');
      const isLabel = compName.includes('Label');
      const isButton = compName.includes('Button');
      const isUITransform = compName.includes('UITransform');
      const isWidget = compName.includes('Widget');
      const isProgressBar = compName.includes('ProgressBar');
      const isToggle = compName.includes('Toggle');
      
      if (isSprite) {
        try { if (comp.spriteFrame) compProps.properties.push({ name: 'spriteFrame', value: comp.spriteFrame.name || comp.spriteFrame._name || 'SpriteFrame', type: 'string', editable: false }); } catch(e) {}
        try {
          if (comp.type !== undefined) {
            const spriteTypes = utils.getSpriteTypes();
            compProps.properties.push({
              name: 'type',
              value: comp.type,
              type: 'enum',
              editable: true,
              options: spriteTypes
            });
          }
        } catch(e) {}
        try {
          if (comp.sizeMode !== undefined) {
            const sizeModes = utils.getSpriteSizeModes();
            compProps.properties.push({
              name: 'sizeMode',
              value: comp.sizeMode,
              type: 'enum',
              editable: true,
              options: sizeModes
            });
          }
        } catch(e) {}
        try {
          if (comp.fillType !== undefined) {
            const fillTypes = utils.getSpriteFillTypes();
            compProps.properties.push({
              name: 'fillType',
              value: comp.fillType,
              type: 'enum',
              editable: true,
              options: fillTypes
            });
          }
        } catch(e) {}
        try { if (comp.fillStart !== undefined) this.addProp(compProps, 'fillStart', comp.fillStart, 'number'); } catch(e) {}
        try { if (comp.fillRange !== undefined) this.addProp(compProps, 'fillRange', comp.fillRange, 'number'); } catch(e) {}
        try { if (comp.fillCenter) this.addVec2(compProps, 'fillCenter', comp.fillCenter); } catch(e) {}
        try { if (comp.trim !== undefined) this.addProp(compProps, 'trim', comp.trim, 'boolean'); } catch(e) {}
        try { if (comp.grayscale !== undefined) this.addProp(compProps, 'grayscale', comp.grayscale, 'boolean'); } catch(e) {}
        try { if (comp.color) this.addColor(compProps, 'color', comp.color); } catch(e) {}
      } else if (isLabel) {
        try { if (comp.string !== undefined) this.addProp(compProps, 'string', comp.string, 'string'); } catch(e) {}
        try { if (comp.fontSize !== undefined) this.addProp(compProps, 'fontSize', comp.fontSize, 'number'); } catch(e) {}
        try { if (comp.lineHeight !== undefined) this.addProp(compProps, 'lineHeight', comp.lineHeight, 'number'); } catch(e) {}
        try {
          if (comp.horizontalAlign !== undefined) {
            compProps.properties.push({
              name: 'horizontalAlign',
              value: comp.horizontalAlign,
              type: 'enum',
              editable: true,
              options: utils.getLabelHorizontalAligns()
            });
          }
        } catch(e) {}
        try {
          if (comp.verticalAlign !== undefined) {
            compProps.properties.push({
              name: 'verticalAlign',
              value: comp.verticalAlign,
              type: 'enum',
              editable: true,
              options: utils.getLabelVerticalAligns()
            });
          }
        } catch(e) {}
        try {
          if (comp.overflow !== undefined) {
            compProps.properties.push({
              name: 'overflow',
              value: comp.overflow,
              type: 'enum',
              editable: true,
              options: utils.getLabelOverflows()
            });
          }
        } catch(e) {}
        try { if (comp.enableWrapText !== undefined) this.addProp(compProps, 'enableWrapText', comp.enableWrapText, 'boolean'); } catch(e) {}
        try { if (comp.spacingX !== undefined) this.addProp(compProps, 'spacingX', comp.spacingX, 'number'); } catch(e) {}
        try { if (comp.color) this.addColor(compProps, 'color', comp.color); } catch(e) {}
        try { if (comp.isBold !== undefined) this.addProp(compProps, 'isBold', comp.isBold, 'boolean'); } catch(e) {}
        try { if (comp.isItalic !== undefined) this.addProp(compProps, 'isItalic', comp.isItalic, 'boolean'); } catch(e) {}
        try { if (comp.isUnderline !== undefined) this.addProp(compProps, 'isUnderline', comp.isUnderline, 'boolean'); } catch(e) {}
        try { if (comp.cacheMode !== undefined) this.addProp(compProps, 'cacheMode', comp.cacheMode, 'number'); } catch(e) {}
      } else if (isButton) {
        try { if (comp.interactable !== undefined) this.addProp(compProps, 'interactable', comp.interactable, 'boolean'); } catch(e) {}
        try { if (comp.transition !== undefined) this.addProp(compProps, 'transition', comp.transition, 'number'); } catch(e) {}
        try { if (comp.normalColor) this.addColor(compProps, 'normalColor', comp.normalColor); } catch(e) {}
        try { if (comp.pressedColor) this.addColor(compProps, 'pressedColor', comp.pressedColor); } catch(e) {}
        try { if (comp.hoverColor) this.addColor(compProps, 'hoverColor', comp.hoverColor); } catch(e) {}
        try { if (comp.disabledColor) this.addColor(compProps, 'disabledColor', comp.disabledColor); } catch(e) {}
        try { if (comp.duration !== undefined) this.addProp(compProps, 'duration', comp.duration, 'number'); } catch(e) {}
        try { if (comp.zoomScale !== undefined) this.addProp(compProps, 'zoomScale', comp.zoomScale, 'number'); } catch(e) {}
      } else if (isUITransform) {
        try { if (comp.contentSize) this.addSize(compProps, 'contentSize', comp.contentSize); } catch(e) {}
        try { if (comp.anchorPoint) this.addVec2(compProps, 'anchorPoint', comp.anchorPoint); } catch(e) {}
        try { if (comp.priority !== undefined) this.addProp(compProps, 'priority', comp.priority, 'number'); } catch(e) {}
      } else if (isWidget) {
        try { if (comp.isAlignTop !== undefined) this.addProp(compProps, 'isAlignTop', comp.isAlignTop, 'boolean'); } catch(e) {}
        try { if (comp.isAlignBottom !== undefined) this.addProp(compProps, 'isAlignBottom', comp.isAlignBottom, 'boolean'); } catch(e) {}
        try { if (comp.isAlignLeft !== undefined) this.addProp(compProps, 'isAlignLeft', comp.isAlignLeft, 'boolean'); } catch(e) {}
        try { if (comp.isAlignRight !== undefined) this.addProp(compProps, 'isAlignRight', comp.isAlignRight, 'boolean'); } catch(e) {}
        try { if (comp.top !== undefined) this.addProp(compProps, 'top', comp.top, 'number'); } catch(e) {}
        try { if (comp.bottom !== undefined) this.addProp(compProps, 'bottom', comp.bottom, 'number'); } catch(e) {}
        try { if (comp.left !== undefined) this.addProp(compProps, 'left', comp.left, 'number'); } catch(e) {}
        try { if (comp.right !== undefined) this.addProp(compProps, 'right', comp.right, 'number'); } catch(e) {}
        try { if (comp.isAlignHorizontalCenter !== undefined) this.addProp(compProps, 'isAlignHorizontalCenter', comp.isAlignHorizontalCenter, 'boolean'); } catch(e) {}
        try { if (comp.isAlignVerticalCenter !== undefined) this.addProp(compProps, 'isAlignVerticalCenter', comp.isAlignVerticalCenter, 'boolean'); } catch(e) {}
      } else if (isProgressBar) {
        try { if (comp.progress !== undefined) this.addProp(compProps, 'progress', comp.progress, 'number'); } catch(e) {}
        try { if (comp.mode !== undefined) this.addProp(compProps, 'mode', comp.mode, 'number'); } catch(e) {}
        try { if (comp.totalLength !== undefined) this.addProp(compProps, 'totalLength', comp.totalLength, 'number'); } catch(e) {}
        try { if (comp.reverse !== undefined) this.addProp(compProps, 'reverse', comp.reverse, 'boolean'); } catch(e) {}
      } else if (isToggle) {
        try { if (comp.isChecked !== undefined) this.addProp(compProps, 'isChecked', comp.isChecked, 'boolean'); } catch(e) {}
        try { if (comp.interactable !== undefined) this.addProp(compProps, 'interactable', comp.interactable, 'boolean'); } catch(e) {}
      } else {
        // 通用属性遍历
        this.addGenericProps(comp, compProps);
      }
    },

    /**
     * 添加通用组件属性
     */
    addGenericProps(comp, compProps) {
      for (const key in comp) {
        if (key.startsWith('_') || key === 'node' || key === 'enabled' || key === 'uuid' || typeof comp[key] === 'function') continue;
        try {
          let val = comp[key];
          if (val === null || val === undefined) continue;
          let type = typeof val;
          
          if (type === 'number') {
            this.addProp(compProps, key, val, 'number');
          } else if (type === 'string') {
            this.addProp(compProps, key, val, 'string');
          } else if (type === 'boolean') {
            this.addProp(compProps, key, val, 'boolean');
          } else if (type === 'object') {
            if (val.constructor?.name === 'Color' || (val.r !== undefined && val.g !== undefined && val.b !== undefined)) {
              this.addColor(compProps, key, val);
            } else if (val.x !== undefined && val.y !== undefined && val.z !== undefined) {
              this.addVec3(compProps, key, val);
            } else if (val.x !== undefined && val.y !== undefined) {
              this.addVec2(compProps, key, val);
            } else if (val.width !== undefined && val.height !== undefined) {
              this.addSize(compProps, key, val);
            }
          }
        } catch (e) {}
      }
    },

    // ========== 设置属性 ==========
    setProp(node, comp, prop, value) {
      const target = comp === 'Node' ? node : utils.findComponent(node, comp);
      if (target) {
        let v = value;
        if (value === 'true') v = true;
        else if (value === 'false') v = false;
        else if (!isNaN(Number(value))) v = Number(value);
        target[prop] = v;
      }
    },

    setVec(node, comp, prop, value) {
      const target = comp === 'Node' ? node : utils.findComponent(node, comp);
      if (target && target[prop]) {
        target[prop].x = Number(value.x);
        target[prop].y = Number(value.y);
        if (value.z !== undefined) target[prop].z = Number(value.z);
      } else if (target) {
        if (prop === 'position' && target.setPosition) target.setPosition(Number(value.x), Number(value.y), Number(value.z) || 0);
        else if (prop === 'scale' && target.setScale) target.setScale(Number(value.x), Number(value.y), Number(value.z) || 1);
        else if (prop === 'anchor') { target.anchorX = Number(value.x); target.anchorY = Number(value.y); }
      }
    },

    setSize(node, comp, prop, value) {
      const target = comp === 'Node' ? node : utils.findComponent(node, comp);
      if (target) {
        if (target[prop]) {
          target[prop].width = Number(value.width);
          target[prop].height = Number(value.height);
        } else if (prop === 'size' || prop === 'contentSize') {
          if (target.setContentSize) target.setContentSize(Number(value.width), Number(value.height));
          else { target.width = Number(value.width); target.height = Number(value.height); }
        }
      }
    },

    setColor(node, comp, prop, value) {
      const target = comp === 'Node' ? node : utils.findComponent(node, comp);
      if (target && target[prop]) {
        target[prop].r = Number(value.r);
        target[prop].g = Number(value.g);
        target[prop].b = Number(value.b);
        target[prop].a = Number(value.a);
      }
    }
  };

  // 导出到全局命名空间
  window.__CCInspector.nodeProps = NodeProps;
})();
