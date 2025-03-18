<template>
  <div class="home">
    <!-- 顶部栏 -->
    <header class="header">
      <div class="user-info">
        <img :src="userInfo.avatarUrl" alt="用户头像" class="avatar" />
        <h1 class="welcome">{{ userInfo.nickname }}</h1>
      </div>
      <!-- 退出登录按钮 -->
      <button
          v-if="userInfo.nickname"
          @click="logout"
          class="logout-button"
      >
        退出登录
      </button>
    </header>

    <!-- 歌单展示 -->
    <div v-if="loading" class="loading">加载中...</div>
    <Playlist v-else :playlists="playlists" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Playlist from '../components/Playlist.vue'
import axios from 'axios'

// 引入你“手搓的”消息组件
import Message from '../components/message/message'

const router = useRouter()

const userInfo = ref({})
const playlists = ref([])
const loading = ref(false)

onMounted(async () => {
  // 获取用户信息
  const data = localStorage.getItem('loginData')
  if (data) {
    const loginData = JSON.parse(data)
    userInfo.value = loginData.profile.profile || {}

    // 获取歌单
    if (loginData.profile.profile.userId) {
      try {
        loading.value = true
        const response = await fetch(`/api/playlist/show?uid=${loginData.profile.profile.userId}`)
        const result = await response.json()
        if (result.code === 200) {
          playlists.value = result.data.playlist.map(p => ({
            id: p.id,
            name: p.name,
            coverImgUrl: p.coverImgUrl,
            trackCount: p.trackCount,
            playCount: p.playCount
          }))
        }
      } finally {
        loading.value = false
      }
    }
  }
})

// 退出登录方法
const logout = async () => {
  try {
    const res = await axios.get('/api/user/logout')
    if (res.data.code === 200) {
      // 使用自定义 Message 组件提示
      Message.success("退出登录成功")

      // ---- 新增清除 cookies 逻辑 ----
      const hostname = window.location.hostname
      // 下面举例使用 expires 方式，你也可以使用 Max-Age=0
      document.cookie = `MUSIC_U=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}`
      document.cookie = `NMTID=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}`
      document.cookie = `__csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}`
      // 同时清除 axios 默认请求头里的 Cookie
      delete axios.defaults.headers.common['Cookie']

      // 清除本地存储
      localStorage.removeItem('loginData')

      // 跳转回登录页
      router.push('/login')
    } else {
      Message.error("退出登录失败")
    }
  } catch (error) {
    console.error("登出请求异常：", error)
    Message.error("退出登录请求异常")
  }
}

</script>

<style scoped>
/* 整体居中布局可选 */
.home {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 顶部栏样式 */
.header {
  display: flex;
  justify-content: space-between; /* 左右分散布局 */
  align-items: center;
  margin-top: 20px;
}

/* 用户信息区 */
.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 16px;
}

.welcome {
  font-size: 20px;
  margin: 0;
}

/* 退出登录按钮 */
.logout-button {
  background-color: #fa4a4a;
  border: none;
  color: #fff;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.logout-button:hover {
  background-color: #e33e3e;
}

/* 加载提示 */
.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>
