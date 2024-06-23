// 引入 ws 模块，用于 WebSocket 连接
const WebSocket = require('ws');

class Bot {
  constructor(config) {
    // 存储机器人配置
    this.config = config;
    // 上次回复的时间戳
    this.lastReplyTime = 0;
    // 初始化 WebSocket 连接（正向）
    this.ws = new WebSocket('ws://127.0.0.1:6700/ws');

    // 绑定 WebSocket 事件处理函数
    this.ws.on('open', this.onOpen.bind(this));
    this.ws.on('message', this.handleMessage.bind(this));
    this.ws.on('error', this.onError.bind(this));
    this.ws.on('close', this.onClose.bind(this));
  }

  // WebSocket 连接成功时的处理函数
  onOpen() {
    console.log('WebSocket服务器链接成功，机器人已正常运行!');
  }

  // WebSocket 发生错误时的处理函数
  onError(error) {
    console.error('WebSocket错误:', error);
  }

  // WebSocket 连接关闭时的处理函数
  onClose() {
    console.log('WebSocket连接已关闭');
  }

  // 接收到消息时的处理函数
  handleMessage(data) {
    try {
      // 解析收到的消息
      const message = JSON.parse(data);

      // 检查消息类型是否为群消息
      if (message.post_type !== 'message' || message.message_type !== 'group') return;

      // 检查消息是否来自目标群
      if (!this.config.targetGroups.has(message.group_id.toString())) return;

      // 获取并去除消息文本的前后空白字符
      const text = message.message.trim();

      // 检查是否为冷却命令
      if (this.isCooldownCommand(text)) {
        this.replyWithCooldown(message.group_id, "冷却时间内");
      } else if (text === '/帮助' || text === '?帮助') {
        // 回复菜单文本
        this.delayedReply(message.group_id, this.config.menuText);
      } else if (text === '/帮助' || text === '?帮助') {
        // 回复帮助文本
        this.delayedReply(message.group_id, this.config.helpText);
      } else if (text === '/随机数' || text === '?随机数') {
        // 回复随机二进制字符串
        this.delayedReply(message.group_id, `你随机的二进制数字: ${this.generateRandomBinaryString(10)}`);
      }
    } catch (error) {
      // 捕捉并打印消息解析错误
      console.error('解析消息时出错:', error);
    }
  }

  // 检查是否为冷却命令，并检查冷却时间是否已过
  isCooldownCommand(text) {
    return ['/c', '?c'].includes(text) && new Date().getTime() - this.lastReplyTime < this.config.coolDownTime;
  }

  // 在冷却时间内回复消息，并记录回复时间
  replyWithCooldown(group_id, message) {
    this.lastReplyTime = new Date().getTime();
    this.delayedReply(group_id, message);
  }

  // 延迟回复消息，模拟人工回复时间
  delayedReply(group_id, message) {
    setTimeout(() => {
      this.replyMessage(group_id, message);
    }, this.config.replyDelay);
  }

  // 发送群消息
  replyMessage(group_id, message) {
    const data = {
      action: 'send_group_msg',
      params: { group_id, message },
    };
    this.ws.send(JSON.stringify(data));
  }

  // 生成指定长度的随机二进制字符串
  generateRandomBinaryString(length) {
    // 使用 Math.random().toString(2) 生成随机二进制字符串
    return Math.random().toString(2).substring(2, 2 + length);
  }
}

// 机器人配置
const botConfig = {
  botQQ: '123456', // 机器人 QQ 号
  targetGroups: new Set(['123456', '123456']), // 目标群 ID 集合
  coolDownTime: 5000, // 冷却时间（毫秒）
  replyDelay: 9000, // 回复延迟时间（毫秒）
  menuText: `功能&帮助[菜单]\n=======================\n获得一串随机的二进制数字(/ej)\n菜单()\n菜单()\n=======================\n更多功能调试开发中，敬请期待\n帮助(/help)`, // 菜单文本
  helpText: `帮助[菜单]\n=======================\n•键入'/帮助'获取帮助\n•键入'/菜单'打开菜单\n更多功能调试开发中，敬请期待~\n=======================`, // 帮助文本
};

// 实例化并运行机器人
new Bot(botConfig);
