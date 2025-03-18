// src/components/message/message.ts
import {type App, createApp} from 'vue';
import MessageContainer, {type MessageItem} from './MessageContainer.vue';

interface MessageOptions {
    content: string;
    type?: MessageItem['type'];
}

class Message {
    private app: App<Element> | null = null;
    private container: HTMLDivElement | null = null;
    private containerComponent: any = null; // 用于拿到 exposed

    constructor() {
        // 预先创建一个挂载点
        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        // 创建Vue应用并挂载
        this.app = createApp(MessageContainer);
        // 拿到组件实例
        this.containerComponent = this.app.mount(this.container);
    }

    // 添加一条消息
    add(options: MessageOptions) {
        if (!this.containerComponent) return;
        const { content, type = 'info' } = options;
        this.containerComponent.addMessage({
            content,
            type,
        });
    }

    // 快捷方法
    success(content: string) {
        this.add({ content, type: 'success' });
    }

    error(content: string) {
        this.add({ content, type: 'error' });
    }

    warning(content: string) {
        this.add({ content, type: 'warning' });
    }

    info(content: string) {
        this.add({ content, type: 'info' });
    }
}

// 创建一个单例
let messageInstance: Message | null = null;

function getMessageInstance() {
    if (!messageInstance) {
        messageInstance = new Message();
    }
    return messageInstance;
}

// 导出全局方法
export default {
    success(content: string) {
        getMessageInstance().success(content);
    },
    error(content: string) {
        getMessageInstance().error(content);
    },
    warning(content: string) {
        getMessageInstance().warning(content);
    },
    info(content: string) {
        getMessageInstance().info(content);
    },
};
