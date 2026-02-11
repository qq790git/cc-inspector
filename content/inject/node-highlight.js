/**
 * CC Inspector - 节点高亮模块
 * 在游戏画面中高亮显示选中的节点
 */
(function() {
  const utils = window.__CCInspector?.utils;
  if (!utils) {
    console.error('[CC Inspector] cc-utils.js 未加载');
    return;
  }

  // 高亮覆盖层状态
  let highlightOverlay = null;
  let highlightAnimation = null;

  const NodeHighlight = {
    /**
     * 高亮显示节点
     * @param {string} uuid - 节点 UUID
     */
    highlightNode(uuid) {
      const cc = utils.getCC();
      if (!cc) return;

      const scene = utils.getScene();
      const node = utils.getNodeByUuid(scene, uuid);
      if (!node) return;

      try {
        // 获取节点的世界坐标边界框
        const worldBounds = this.getNodeWorldBounds(node, cc);
        if (!worldBounds) return;

        // 将世界坐标转换为屏幕坐标
        const screenRect = this.worldToScreen(worldBounds, cc);
        if (!screenRect) return;

        // 创建或更新高亮覆盖层
        this.showHighlightOverlay(screenRect);
      } catch (err) {
        console.warn('[CC Inspector] 高亮节点失败', err);
      }
    },

    /**
     * 获取节点的世界坐标边界框
     */
    getNodeWorldBounds(node, cc) {
      try {
        let width, height, anchorX, anchorY;
        let worldPos = { x: 0, y: 0 };

        // 获取尺寸 - 优先从 UITransform (3.x) 获取
        const is3x = utils.is3x();
        const uiTransform = is3x ? utils.findComponent(node, 'UITransform') : null;

        if (uiTransform) {
          // 3.x
          width = uiTransform.contentSize.width;
          height = uiTransform.contentSize.height;
          anchorX = uiTransform.anchorPoint.x;
          anchorY = uiTransform.anchorPoint.y;
        } else if (!is3x && node.width !== undefined && node.height !== undefined) {
          // 2.x
          width = node.width;
          height = node.height;
          anchorX = node.anchorX !== undefined ? node.anchorX : 0.5;
          anchorY = node.anchorY !== undefined ? node.anchorY : 0.5;
        } else if (!is3x && node.contentSize) {
          width = node.contentSize.width;
          height = node.contentSize.height;
          anchorX = node.anchorX !== undefined ? node.anchorX : 0.5;
          anchorY = node.anchorY !== undefined ? node.anchorY : 0.5;
        } else {
          // 默认尺寸
          width = 100;
          height = 100;
          anchorX = 0.5;
          anchorY = 0.5;
        }

        // 获取世界坐标
        if (node.worldPosition) {
          worldPos = { x: node.worldPosition.x, y: node.worldPosition.y };
        } else if (node.getWorldPosition) {
          const wp = node.getWorldPosition();
          worldPos = { x: wp.x, y: wp.y };
        } else if (node.convertToWorldSpaceAR) {
          const wp = node.convertToWorldSpaceAR(cc.v2(0, 0));
          worldPos = { x: wp.x, y: wp.y };
        } else {
          // 使用本地坐标
          worldPos = { x: node.x || 0, y: node.y || 0 };
        }

        // 获取缩放
        let scaleX = 1, scaleY = 1;
        if (node.scale && typeof node.scale === 'object') {
          scaleX = node.scale.x || 1;
          scaleY = node.scale.y || 1;
        } else {
          scaleX = node.scaleX !== undefined ? node.scaleX : 1;
          scaleY = node.scaleY !== undefined ? node.scaleY : 1;
        }

        // 计算世界坐标下的边界框
        const scaledWidth = width * Math.abs(scaleX);
        const scaledHeight = height * Math.abs(scaleY);
        
        return {
          x: worldPos.x - scaledWidth * anchorX,
          y: worldPos.y - scaledHeight * anchorY,
          width: scaledWidth,
          height: scaledHeight
        };
      } catch (err) {
        console.warn('[CC Inspector] 获取节点边界失败', err);
        return null;
      }
    },

    /**
     * 将世界坐标转换为屏幕坐标
     */
    worldToScreen(worldBounds, cc) {
      try {
        const canvas = document.querySelector('canvas');
        if (!canvas) return null;

        const canvasRect = canvas.getBoundingClientRect();
        
        // 获取可视尺寸
        let visibleWidth, visibleHeight;
        if (cc.view && cc.view.getVisibleSize) {
          const vs = cc.view.getVisibleSize();
          visibleWidth = vs.width;
          visibleHeight = vs.height;
        } else if (cc.winSize) {
          visibleWidth = cc.winSize.width;
          visibleHeight = cc.winSize.height;
        } else if (cc.view && cc.view.getDesignResolutionSize) {
          const size = cc.view.getDesignResolutionSize();
          visibleWidth = size.width;
          visibleHeight = size.height;
        } else {
          visibleWidth = canvasRect.width;
          visibleHeight = canvasRect.height;
        }

        // 缩放比例
        const scaleX = canvasRect.width / visibleWidth;
        const scaleY = canvasRect.height / visibleHeight;

        // Cocos 坐标系原点在左下角，y轴向上
        // 屏幕坐标系原点在左上角，y轴向下
        const cocosTopY = worldBounds.y + worldBounds.height;
        
        // 转换到屏幕坐标
        const screenX = canvasRect.left + worldBounds.x * scaleX;
        const screenY = canvasRect.top + (visibleHeight - cocosTopY) * scaleY;
        const screenWidth = worldBounds.width * scaleX;
        const screenHeight = worldBounds.height * scaleY;

        return {
          x: screenX,
          y: screenY,
          width: screenWidth,
          height: screenHeight
        };
      } catch (err) {
        console.warn('[CC Inspector] 坐标转换失败', err);
        return null;
      }
    },

    /**
     * 显示高亮覆盖层
     */
    showHighlightOverlay(rect) {
      // 取消之前的动画
      if (highlightAnimation) {
        clearTimeout(highlightAnimation);
        highlightAnimation = null;
      }

      // 创建或更新高亮元素
      if (!highlightOverlay) {
        highlightOverlay = document.createElement('div');
        highlightOverlay.id = 'cc-inspector-highlight';
        document.body.appendChild(highlightOverlay);
      }

      highlightOverlay.style.cssText = `
        position: fixed;
        left: ${rect.x}px;
        top: ${rect.y}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid #667eea;
        background: rgba(102, 126, 234, 0.25);
        pointer-events: none;
        z-index: 999996;
        box-sizing: border-box;
        transition: all 0.1s ease-out;
        box-shadow: 0 0 8px rgba(102, 126, 234, 0.6);
      `;

      // 添加动画样式
      this.ensureAnimationStyle();

      // 移除自动消失逻辑，改为由鼠标离开事件控制
    },

    /**
     * 确保动画样式存在
     */
    ensureAnimationStyle() {
      if (!document.getElementById('cc-inspector-highlight-style')) {
        const style = document.createElement('style');
        style.id = 'cc-inspector-highlight-style';
        style.textContent = `
          @keyframes ccHighlightFlash {
            0% {
              border-color: #667eea;
              background: rgba(102, 126, 234, 0.2);
              box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
            }
            50% {
              border-color: #f59e0b;
              background: rgba(245, 158, 11, 0.3);
              box-shadow: 0 0 20px rgba(245, 158, 11, 0.8);
            }
            100% {
              border-color: #667eea;
              background: rgba(102, 126, 234, 0.2);
              box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
            }
          }
        `;
        document.head.appendChild(style);
      }
    },

    /**
     * 清除高亮
     */
    clearHighlight() {
      if (highlightAnimation) {
        clearTimeout(highlightAnimation);
        highlightAnimation = null;
      }
      if (highlightOverlay) {
        highlightOverlay.remove();
        highlightOverlay = null;
      }
    }
  };

  // 导出到全局命名空间
  window.__CCInspector.nodeHighlight = NodeHighlight;
})();
