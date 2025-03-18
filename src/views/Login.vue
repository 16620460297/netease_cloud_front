<template>
  <div class="login-container">
    <h1>登录网易云音乐</h1>
    <!-- 登录状态判断 -->
    <div v-if="isLoggedIn">
      <p>欢迎，{{ userProfile?.profile?.nickname }}</p>
      <button @click="logout">退出登录</button>
    </div>
    <div v-else>
      <div v-if="qrCodeUrl">
        <img :src="qrCodeUrl" alt="二维码登录" />
      </div>
      <p v-else>生成二维码中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// 引入你手搓的消息组件
import Message from '../components/message/message'

const qrCodeUrl = ref('')
const unikey = ref('')
const userProfile = ref(null)
const isLoggedIn = ref(false)
let checkInterval = null
const router = useRouter()

// 从 localStorage 中读取登录信息
const checkLocalStorageLogin = () => {
  const data = localStorage.getItem('loginData')
  if (data) {
    try {
      userProfile.value = JSON.parse(data)
      if (userProfile.value?.cookies && userProfile.value?.profile) {
        isLoggedIn.value = true
        return
      }
    } catch (e) {
      console.error("解析登录数据失败", e)
    }
  }
  isLoggedIn.value = false
}

const fetchQRCode = async () => {
  try {
    const res = await axios.get('/api/user/qrcode')
    if (res.data.code === 200) {
      unikey.value = res.data.data.unikey
      qrCodeUrl.value = 'data:image/png;base64,' + res.data.data.qrCodeBase64
      // 开始轮询登录状态
      checkInterval = setInterval(checkLoginStatus, 3000)
    } else {
      console.error("获取二维码失败", res.data.msg)
    }
  } catch (error) {
    console.error(error)
  }
}

const checkLoginStatus = async () => {
  if (!unikey.value) return
  try {
    const res = await axios.get('/api/user/check_login', {
      params: { unikey: unikey.value }
    })
    // 如果 cookies 存在，自动保存到 localStorage
    if (res.data.code === 803) {
      // 登录成功提示
      Message.success('登录成功！')
      // 保存登录数据到 localStorage
      localStorage.setItem('loginData', JSON.stringify({
        cookies: res.data.cookies,
        profile: res.data.profile
      }))

        try {
          const cookies =  res.data.cookies
          if (cookies) {
            document.cookie = `MUSIC_U=${cookies.MUSIC_U}; path=/; domain=${window.location.hostname};`
            document.cookie = `NMTID=${cookies.NMTID}; path=/; domain=${window.location.hostname};`
            document.cookie = `__csrf=${cookies.__csrf}; path=/; domain=${window.location.hostname};`
            axios.defaults.headers.common['Cookie'] = `MUSIC_U=${cookies.MUSIC_U}; NMTID=${cookies.NMTID}; __csrf=${cookies.__csrf};`
          }
        } catch (error) {
          console.error("读取 登录数据存储cookies失败", error)
        }

      userProfile.value = res.data
      isLoggedIn.value = true
      clearInterval(checkInterval)
      // 登录成功后跳转到首页
      router.push({name: 'Home'})
    } else if (res.data.code === 800) {
      // 二维码过期提示
      Message.warning('二维码已过期，请刷新页面重新生成二维码')
      clearInterval(checkInterval)
      localStorage.removeItem('loginData')
      isLoggedIn.value = false
      fetchQRCode()
    }
  } catch (error) {
    console.error(error)
  }
}

const logout = async () => {
  try {
    const res = await axios.get('/api/user/logout')
    if (res.data.code === 200) {
      // 退出登录成功提示
      Message.success('退出登录成功')
      localStorage.removeItem('loginData')
      isLoggedIn.value = false
      router.push('/login')
    } else {
      // 退出登录失败提示
      Message.error('退出登录失败')
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  checkLocalStorageLogin()
  if (!isLoggedIn.value) {
    fetchQRCode()
  }
})

onBeforeUnmount(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})
</script>

<style scoped>
.login-container {
  text-align: center;
  margin-top: 50px;
}
</style>
