export interface ConversationContext {
  sessionId: string;
  activeDataSources: Map<string, DataSourceInfo>;
  currentFocus: string;
  conversationHistory: Array<ConversationEntry>;
}

export interface DataSourceInfo {
  requestId: string;
  cacheId: string;
  lastAnalysis: string;
  analysisDepth: number;
}

export interface ConversationEntry {
  timestamp: string;
  userInput: string;
  dataSource: string; // 由AI自动检测
  analysisType: string; // 由AI自动检测
}

export class ConversationManager {
  private context: ConversationContext;

  constructor(sessionId: string) {
    this.context = {
      sessionId,
      activeDataSources: new Map(),
      currentFocus: '',
      conversationHistory: []
    };
  }

  /**
   * 处理用户输入 - 只做状态管理，不做意图分析
   * 让AI模型自己分析用户意图
   */
  async handleUserInput(userInput: string): Promise<{
    context: {
      sessionId: string;
      activeDataSources: string[];
      currentFocus: string;
      conversationHistory: ConversationEntry[];
    };
    conversationHistory: ConversationEntry[];
  }> {
    // 1. 记录对话历史
    this.context.conversationHistory.push({
      timestamp: new Date().toISOString(),
      userInput,
      dataSource: 'auto-detected', // 让AI自动检测
      analysisType: 'auto-detected' // 让AI自动检测
    });

    // 2. 返回当前上下文，让AI自己判断
    return {
      context: this.getContext(),
      conversationHistory: this.context.conversationHistory
    };
  }

  /**
   * 添加数据源到上下文
   */
  addDataSource(queryName: string, requestId: string, cacheId: string): void {
    this.context.activeDataSources.set(queryName, {
      requestId,
      cacheId,
      lastAnalysis: new Date().toISOString(),
      analysisDepth: 1
    });

    // 如果是第一个数据源，设为当前聚焦
    if (!this.context.currentFocus) {
      this.context.currentFocus = queryName;
    }
  }

  /**
   * 更新当前聚焦的数据源
   */
  setCurrentFocus(queryName: string): void {
    if (this.context.activeDataSources.has(queryName)) {
      this.context.currentFocus = queryName;
    }
  }

  /**
   * 获取上下文信息
   */
  getContext(): {
    sessionId: string;
    activeDataSources: string[];
    currentFocus: string;
    conversationHistory: ConversationEntry[];
  } {
    return {
      sessionId: this.context.sessionId,
      activeDataSources: Array.from(this.context.activeDataSources.keys()),
      currentFocus: this.context.currentFocus,
      conversationHistory: this.context.conversationHistory
    };
  }

  /**
   * 获取上下文摘要
   */
  getContextSummary(): string {
    const activeSources = Array.from(this.context.activeDataSources.keys());
    const currentFocus = this.context.currentFocus;
    
    return `
当前对话上下文：
- 活跃数据源：${activeSources.join(', ') || '无'}
- 当前聚焦：${currentFocus || '无'}
- 对话历史：${this.context.conversationHistory.length} 条记录
- 最新输入：${this.context.conversationHistory.length > 0 ? this.context.conversationHistory[this.context.conversationHistory.length - 1].userInput : '无'}

注意：数据源和分析类型由AI模型自动检测，无需硬编码规则。
`;
  }

  /**
   * 检查数据源是否存在
   */
  hasDataSource(queryName: string): boolean {
    return this.context.activeDataSources.has(queryName);
  }

  /**
   * 获取数据源信息
   */
  getDataSourceInfo(queryName: string): DataSourceInfo | undefined {
    return this.context.activeDataSources.get(queryName);
  }

  /**
   * 清理过期的数据源
   */
  cleanupExpiredDataSources(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [queryName, info] of this.context.activeDataSources.entries()) {
      const lastAnalysis = new Date(info.lastAnalysis).getTime();
      if (now - lastAnalysis > maxAge) {
        this.context.activeDataSources.delete(queryName);
      }
    }
  }
} 