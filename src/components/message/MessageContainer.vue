<template>
  <TransitionGroup name="message-fade" tag="div" class="message-container">
    <div
        v-for="item in messages"
        :key="item.id"
        :class="['message-item', item.type]"
    >
      {{ item.content }}
    </div>
  </TransitionGroup>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';

// 定义消息类型
export interface MessageItem {
  id: number;
  content: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default defineComponent({
  name: 'MessageContainer',
  setup() {
    // 维护一个消息队列
    const state = reactive({
      messages: [] as MessageItem[],
    });

    // 暴露一些操作方法（添加、删除消息等）
    const addMessage = (msg: Omit<MessageItem, 'id'>) => {
      // 用一个时间戳或递增id作为唯一标识
      const id = Date.now();
      state.messages.push({ id, ...msg });

      // 默认3秒后自动移除
      setTimeout(() => {
        removeMessage(id);
      }, 3000);
    };

    const removeMessage = (id: number) => {
      const idx = state.messages.findIndex((m) => m.id === id);
      if (idx !== -1) {
        state.messages.splice(idx, 1);
      }
    };

    // 通过 defineExpose 暴露给外部使用
    return {
      messages: state.messages,
      addMessage,
      removeMessage,
    };
  },
});
</script>

<style scoped>
.message-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 各类型的基础样式 */
.message-item {
  min-width: 200px;
  padding: 10px 15px;
  color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  opacity: 0.9;
}
.message-item.success {
  background-color: #67c23a;
}
.message-item.error {
  background-color: #f56c6c;
}
.message-item.warning {
  background-color: #e6a23c;
}
.message-item.info {
  background-color: #909399;
}

/* 进入/离场动画 */
.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s;
}
</style>
