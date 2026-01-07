/**
 * CC Inspector - 纹理替换模块
 * 支持动态替换 Sprite 组件的纹理
 */
(function() {
  const utils = window.__CCInspector?.utils;
  if (!utils) {
    console.error('[CC Inspector] cc-utils.js 未加载');
    return;
  }

  const TextureReplace = {
    /**
     * 替换 Sprite 纹理
     * @param {string} uuid - 节点 UUID
     * @param {string} imageData - 图片 base64 数据
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    replaceSpriteTexture(uuid, imageData) {
      return new Promise((resolve) => {
        const cc = utils.getCC();
        if (!cc) {
          resolve({ success: false, error: '未找到 Cocos Creator' });
          return;
        }

        const scene = utils.getScene();
        const node = utils.getNodeByUuid(scene, uuid);
        
        if (!node) {
          resolve({ success: false, error: '节点未找到' });
          return;
        }

        const spriteComp = utils.findComponent(node, 'Sprite');
        if (!spriteComp) {
          resolve({ success: false, error: '未找到Sprite组件' });
          return;
        }

        try {
          // 保存原始纹理以便重置
          if (!node.__ccInspectorOriginalSpriteFrame) {
            node.__ccInspectorOriginalSpriteFrame = spriteComp.spriteFrame;
          }

          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            try {
              const is3x = utils.is3x();
              console.log('[CC Inspector] 替换纹理 - 引擎版本:', utils.getVersion(), ', 是否3.x:', is3x);
              
              if (is3x && cc.ImageAsset) {
                this.createTexture3x(cc, img, spriteComp, resolve);
              } else if (cc.Texture2D) {
                this.createTexture2x(cc, img, spriteComp, resolve);
              } else {
                resolve({ success: false, error: '不支持的引擎版本' });
              }
            } catch (err) {
              console.error('[CC Inspector] 纹理替换错误:', err);
              resolve({ success: false, error: err.message });
            }
          };
          
          img.onerror = (err) => {
            console.error('[CC Inspector] 图片加载失败:', err);
            resolve({ success: false, error: '图片加载失败' });
          };
          
          img.src = imageData;
        } catch (err) {
          console.error('[CC Inspector] 纹理替换异常:', err);
          resolve({ success: false, error: err.message });
        }
      });
    },

    /**
     * Cocos Creator 3.x 纹理创建
     */
    createTexture3x(cc, img, spriteComp, resolve) {
      console.log('[CC Inspector] 使用3.x方式创建纹理');
      
      // 创建 ImageAsset
      const imageAsset = new cc.ImageAsset(img);
      
      // 创建 Texture2D
      const texture = new cc.Texture2D();
      texture.image = imageAsset;
      
      // 创建 SpriteFrame
      const spriteFrame = new cc.SpriteFrame();
      spriteFrame.texture = texture;
      
      // 应用到 Sprite 组件
      spriteComp.spriteFrame = spriteFrame;
      
      console.log('[CC Inspector] 3.x纹理替换完成');
      resolve({ success: true });
    },

    /**
     * Cocos Creator 2.x 纹理创建
     */
    createTexture2x(cc, img, spriteComp, resolve) {
      console.log('[CC Inspector] 使用2.x方式创建纹理');
      
      const texture = new cc.Texture2D();
      
      // 2.x 有多种初始化方式
      if (texture.initWithElement) {
        texture.initWithElement(img);
        if (texture.handleLoadedTexture) {
          texture.handleLoadedTexture();
        }
      } else if (texture.initWithData) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        texture.initWithData(imageData.data, cc.Texture2D.PixelFormat.RGBA8888, img.width, img.height);
      } else {
        texture._image = img;
      }
      
      // 创建 SpriteFrame
      let spriteFrame;
      try {
        spriteFrame = new cc.SpriteFrame(texture);
      } catch (e) {
        spriteFrame = new cc.SpriteFrame();
        spriteFrame.setTexture(texture);
      }
      
      // 设置 SpriteFrame 的矩形区域
      if (spriteFrame.setRect) {
        spriteFrame.setRect(cc.rect(0, 0, img.width, img.height));
      }
      
      // 应用到 Sprite 组件
      spriteComp.spriteFrame = spriteFrame;
      
      console.log('[CC Inspector] 2.x纹理替换完成');
      resolve({ success: true });
    },

    /**
     * 重置 Sprite 纹理
     * @param {string} uuid - 节点 UUID
     * @returns {{success: boolean, error?: string}}
     */
    resetSpriteTexture(uuid) {
      const scene = utils.getScene();
      const node = utils.getNodeByUuid(scene, uuid);
      
      if (!node) {
        return { success: false, error: '节点未找到' };
      }

      if (!node.__ccInspectorOriginalSpriteFrame) {
        return { success: false, error: '没有保存的原始纹理' };
      }

      const spriteComp = utils.findComponent(node, 'Sprite');
      if (!spriteComp) {
        return { success: false, error: '未找到Sprite组件' };
      }

      spriteComp.spriteFrame = node.__ccInspectorOriginalSpriteFrame;
      return { success: true };
    }
  };

  // 导出到全局命名空间
  window.__CCInspector.textureReplace = TextureReplace;
})();
