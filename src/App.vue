<template>
  <div id="app">
    <router-view />
    <PlayerBar ref="player" />
  </div>
</template>

<script>
import { ref, provide, onMounted } from 'vue'
import axios from 'axios'
import PlayerBar from './components/PlayerBar.vue'

export default {
  name: 'App',
  components: {
    PlayerBar
  },
  setup() {
    const player = ref(null)
    const userProfile = ref(null)
    const isLoggedIn = ref(false)

    // 关键修复：使用 provide 传递 ref 对象本身
    provide('player', player)

    const setCookiesFromLocalStorage = () => {
      const loginData = localStorage.getItem('loginData')
      if (loginData) {
        try {
          const parsedData = JSON.parse(loginData)
          const cookies = parsedData.cookies
          //console.log("读取 localStorage 中的登录数据成功", parsedData, "\ncookies", cookies)

          if (cookies) {
            document.cookie = `MUSIC_U=${cookies.MUSIC_U}; path=/; domain=${window.location.hostname};`
            document.cookie = `NMTID=${cookies.NMTID}; path=/; domain=${window.location.hostname};`
            document.cookie = `__csrf=${cookies.__csrf}; path=/; domain=${window.location.hostname};`

            axios.defaults.headers.common['Cookie'] = `MUSIC_U=${cookies.MUSIC_U}; NMTID=${cookies.NMTID}; __csrf=${cookies.__csrf};`
            userProfile.value = parsedData.profile
            isLoggedIn.value = true
          }
        } catch (error) {
          console.error("读取 localStorage 中的登录数据失败", error)
        }
      }
    }

    onMounted(() => {
      setCookiesFromLocalStorage()
      // 确保组件挂载后初始化
      if (player.value) {
        //console.log('Player component mounted:', player.value)
      }
    })

    return {
      player
    }
  }
}
</script>
