/**
 * CC Inspector - 性能监控模块
 * 获取游戏性能数据 (FPS, DrawCalls, Triangles, 节点数等)
 */
(function() {
  const utils = window.__CCInspector?.utils;
  if (!utils) {
    console.error('[CC Inspector] cc-utils.js 未加载');
    return;
  }

  const Performance = {
    /**
     * 获取性能数据
     */
    getPerfData() {
      const cc = utils.getCC();
      if (!cc) return null;

      const perfData = {
        fps: '--',
        drawcalls: '--',
        triangles: '--',
        nodes: '--',
        version: utils.getVersion() || '--',
        memory: '--'
      };

      try {
        // ========== FPS 获取 ==========
        this.getFPS(cc, perfData);

        // ========== 渲染统计 ==========
        this.getRenderStats(cc, perfData);

        // ========== 节点数量 ==========
        const scene = utils.getScene();
        if (scene) {
          perfData.nodes = utils.countNodes(scene);
        }

        // ========== 内存 ==========
        this.getMemoryStats(perfData);

        // ========== 尝试从 stats 面板获取 ==========
        this.getStatsFromPanel(perfData);

      } catch (err) {
        console.warn('[CC Inspector] 获取性能数据失败', err);
      }

      return perfData;
    },

    /**
     * 获取 FPS
     */
    getFPS(cc, perfData) {
      // 方法1: Cocos 3.x game._frameTime
      if (cc.game && cc.game._frameTime && cc.game._frameTime > 0) {
        perfData.fps = Math.round(1000 / cc.game._frameTime);
      }
      // 方法2: director._deltaTime
      else if (cc.director && cc.director._deltaTime && cc.director._deltaTime > 0) {
        perfData.fps = Math.round(1 / cc.director._deltaTime);
      }
      // 方法3: game.frameRate 配置值
      else if (cc.game && cc.game.frameRate) {
        perfData.fps = cc.game.frameRate;
      }
    },

    /**
     * 获取渲染统计数据
     */
    getRenderStats(cc, perfData) {
      // ========== Cocos Creator 3.x ==========
      // 方法1: cc.profiler._stats
      if (cc.profiler && cc.profiler._stats) {
        const stats = cc.profiler._stats;
        try {
          if (stats.fps && stats.fps.counter) perfData.fps = Math.round(stats.fps.counter.value);
          if (stats.draws && stats.draws.counter) perfData.drawcalls = stats.draws.counter.value;
          if (stats.tricount && stats.tricount.counter) perfData.triangles = stats.tricount.counter.value;
        } catch(e) {}
      }

      // 方法2: director.root.pipeline
      if (cc.director && cc.director.root) {
        const root = cc.director.root;
        try {
          if (root.device && root.device.numDrawCalls !== undefined) {
            perfData.drawcalls = root.device.numDrawCalls;
          }
        } catch(e) {}
      }

      // 方法3: cc.debug._stats
      if (cc.debug && cc.debug._stats) {
        try {
          const stats = cc.debug._stats;
          if (stats.drawcalls !== undefined) perfData.drawcalls = stats.drawcalls;
          if (stats.triangles !== undefined) perfData.triangles = stats.triangles;
        } catch(e) {}
      }

      // ========== Cocos Creator 2.x ==========
      // 方法1: cc.renderer.drawCalls
      if (cc.renderer) {
        try {
          if (cc.renderer.drawCalls !== undefined) {
            perfData.drawcalls = cc.renderer.drawCalls;
          }
          if (cc.renderer._drawCalls !== undefined) {
            perfData.drawcalls = cc.renderer._drawCalls;
          }
        } catch(e) {}
      }

      // 方法2: cc.director._renderStats
      if (cc.director && cc.director._renderStats) {
        try {
          const stats = cc.director._renderStats;
          if (stats.drawCalls !== undefined) perfData.drawcalls = stats.drawCalls;
          if (stats.triangles !== undefined) perfData.triangles = stats.triangles;
        } catch(e) {}
      }

      // 方法3: cc.game._renderStats
      if (cc.game && cc.game._renderStats) {
        try {
          const stats = cc.game._renderStats;
          if (stats.drawCalls !== undefined) perfData.drawcalls = stats.drawCalls;
          if (stats.triangles !== undefined) perfData.triangles = stats.triangles;
        } catch(e) {}
      }

      // 方法4: cc.internal.profiler
      if (cc.internal && cc.internal.profiler && cc.internal.profiler._stats) {
        try {
          const stats = cc.internal.profiler._stats;
          if (stats.draws) perfData.drawcalls = stats.draws.counter ? stats.draws.counter.value : stats.draws;
          if (stats.tricount) perfData.triangles = stats.tricount.counter ? stats.tricount.counter.value : stats.tricount;
        } catch(e) {}
      }
    },

    /**
     * 获取内存统计
     */
    getMemoryStats(perfData) {
      if (performance && performance.memory) {
        const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        const totalMB = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0);
        perfData.memory = `${usedMB}MB / ${totalMB}MB`;
      }
    },

    /**
     * 尝试从显示的 stats 面板获取数据
     */
    getStatsFromPanel(perfData) {
      try {
        const statsPanel = document.getElementById('fps') || document.querySelector('.cc-fps');
        if (statsPanel) {
          const text = statsPanel.textContent || '';
          const drawMatch = text.match(/draw[:\s]*(\d+)/i);
          const triMatch = text.match(/tri[:\s]*(\d+)/i);
          if (drawMatch && perfData.drawcalls === '--') {
            perfData.drawcalls = parseInt(drawMatch[1]);
          }
          if (triMatch && perfData.triangles === '--') {
            perfData.triangles = parseInt(triMatch[1]);
          }
        }
      } catch(e) {}
    }
  };

  // 导出到全局命名空间
  window.__CCInspector.performance = Performance;
})();
