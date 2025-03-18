<template>

  <div v-if="loading" class="spinner">
    <div class="rect1"></div>
    <div class="rect2"></div>
    <div class="rect3"></div>
    <div class="rect4"></div>
    <div class="rect5"></div>
    <div class="rect6"></div>
    <div class="rect7"></div>
    <div class="rect8"></div>
  </div>
  <div v-else-if="fetchFailed" class="error-container">
    <p>数据获取失败，请点击重试</p>
    <button @click="handleRetry">重新获取</button>
  </div>

  <div v-else-if="playlist" class="tracks">

    <div class="song-list">
      <!-- 歌单头部 -->
      <div class="playlist-header">
        <div class="cover">
          <img :src="playlist.coverImgUrl" alt="歌单封面" @error="handleImgError">
        </div>
        <div class="info">
          <h1>{{ playlist.name }}</h1>
          <p class="count">{{ playlist.tracks.length }} 首歌曲</p>
        </div>
      </div>

      <!-- 歌曲列表 -->
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="tracks">
        <div class="header-row">
          <div class="index">#</div>
          <div class="title">歌曲标题</div>
          <div class="duration">时长</div>
          <div class="artist">歌手</div>
          <div class="album">专辑</div>
        </div>
        <div
            v-for="(track, index) in playlist.tracks"
            :key="track.id"
            class="track-item"
            :class="{ 'active': player?.value?.currentSong?.id === track.id }"
            @click="handlePlay(track)"
        >
          <div class="index">{{ track.sort_id }}</div>
          <div class="title">
            <img :src="track.cover" class="song-cover" @error="handleImgError">
            <span>{{ track.name }}</span>
          </div>
          <div class="duration">{{ track.duration }}</div>
          <div class="artist">{{ track.artists }}</div>
          <div class="album">{{ track.album }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { inject } from 'vue'

const fetchFailed = ref(false)


// 修改后（正确获取 ref 值）
const player = inject('player')
// 确保播放的歌曲传递到 Player 组件
const handlePlay = (track) => {
  if (player?.value) {
    player.value.playTrack(track, playlist.value.tracks);
    currentSong.value = track; // 更新当前歌曲状态
  }
};
const props = defineProps({
  playlistId: {
    type: String,
    required: true
  }
})

const playlist = ref({
  coverImgUrl: '',
  name: '',
  tracks: []
})

const loading = ref(false)

const handleImgError = (e) => {
  e.target.src = 'https://p1.music.126.net/VnZiScyynLG7atLIZ2YPkw==/18686200114669622.jpg'
}


const MAX_RETRIES = 5;
const RETRY_INTERVAL = 2000; // 2 seconds
const TIMEOUT = 30000; // 30 seconds



const fetchData = async (retryCount = 0) => {
  try {
    loading.value = true
    const response = await axios.get(`/api/playlist/detail?id=${props.playlistId}`)

    if (response.data.code === 200 && response.data.data && response.data.data.tracks) {
      const data = response.data.data
      playlist.value = {
        coverImgUrl: data.tracks[0]?.picurl || '',
        name: data.name,
        tracks: data.tracks.map(t => ({
          id: t.song_id,
          sort_id: t.sort_id,
          cover: t.picurl,
          name: t.title,
          duration: t.duration,
          artists: t.artists,
          album: t.album
        }))
      }
    } else {
      throw new Error('获取的歌单数据不完整')
    }
  } catch (error) {
    console.error("获取歌单详情失败", error)
    if (retryCount < MAX_RETRIES - 1) {
      // 如果未达到最大重试次数，延迟后再次尝试
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL))
      await fetchData(retryCount + 1)
    }else {
      fetchFailed.value = true
    }
  }finally {
    // 无论成功/失败，最后都要结束 loading
    loading.value = false
  }
}

const handleRetry = () => {
  fetchFailed.value = false
  fetchData()
}

onMounted(async () => {
  const startTime = Date.now()
  const timeoutId = setTimeout(() => {
    if (loading.value) {
      console.error("加载超时")
      loading.value = false
      router.go(-1) // 返回上级页面
    }
  }, TIMEOUT)

  await fetchData()
  loading.value = false
  clearTimeout(timeoutId)
})
</script>

<style scoped>
.playlist-header {
  display: flex;
  padding: 30px;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
}

.playlist-header .cover {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.playlist-header .cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-header .info {
  padding-left: 30px;
  color: white;
}

.playlist-header h1 {
  font-size: 36px;
  margin: 20px 0 10px;
}

.count {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
}

/* 歌曲列表样式 */
.header-row, .track-item {
  display: grid;
  grid-template-columns: 50px 3fr 1fr 2fr 2fr;
  align-items: center;
  padding: 12px 20px;


}

.header-row {
  border-bottom: 1px solid #e0e0e0;
  color: #666;
  font-size: 14px;

}

.track-item {
  transition: background 0.2s;
  cursor: pointer;
}

.track-item:hover {
  background: #f5f5f5;
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 12px;
}

.title {
  display: flex;
  align-items: center;
}

.duration {
  color: #666;
}
/* 添加激活状态样式 */
.track-item.active {
  background: #e3f2fd;
  font-weight: 500;
}

/* 播放按钮动画 */
.track-item.active .index span {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.spinner {
  /* Center the spinner */
  margin: 100px auto;
  /* Increase width and height for a bigger, more noticeable loader */
  width: 150px;
  height: 60px;
  /* Align children and set a default font-size if needed */
  text-align: center;
  font-size: 10px;
}

/* Each 'rect' bar in the wave */
.spinner > div {
  /* Choose your color or use a gradient */
  background-color: #3498db;
  display: inline-block;

  /* Increase width/height for a more prominent animation */
  width: 10px;
  height: 100%;

  /* Add a slight gap between bars */
  margin: 0 3px;

  /* Make the bars a little rounder */
  border-radius: 4px;

  /* Wave animation */
  animation: wave 1.4s infinite ease-in-out;
}

/* Add staggered delays for each bar so they appear to 'wave' */
.spinner .rect1 { animation-delay: -1.3s; }
.spinner .rect2 { animation-delay: -1.2s; }
.spinner .rect3 { animation-delay: -1.1s; }
.spinner .rect4 { animation-delay: -1.0s; }
.spinner .rect5 { animation-delay: -0.9s; }
.spinner .rect6 { animation-delay: -0.8s; }
.spinner .rect7 { animation-delay: -0.7s; }
.spinner .rect8 { animation-delay: -0.6s; }

/* Define the wave keyframes */
@keyframes wave {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1.0);
  }
}


@-webkit-keyframes sk-stretchdelay {
  0%, 40%, 100% { -webkit-transform: scaleY(0.4) }
  20% { -webkit-transform: scaleY(1.0) }
}

@keyframes sk-stretchdelay {
  0%, 40%, 100% {
    transform: scaleY(0.4);
    -webkit-transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1.0);
    -webkit-transform: scaleY(1.0);
  }
}
.song-list {
  margin-bottom: 40px; /* 比原来的 -50px 更大，进一步上移 */
}

</style>
