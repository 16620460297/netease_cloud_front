<template>
  <div class="playlist-container">
    <div v-for="playlist in playlists" :key="playlist.id" class="playlist-item">
      <router-link :to="`/playlist/detail?id=${playlist.id}`">
      <div class="cover-box">
        <img
            :src="playlist.coverImgUrl"
            :alt="playlist.name"
            @error="handleImageError"
            class="cover-img"
        >
        <div class="play-count">
          <i class="icon-play"></i>
          {{ formatCount(playlist.playCount) }}
        </div>
      </div>
      <div class="info">
        <h3 class="name">{{ playlist.name }}</h3>
        <p class="count">{{ playlist.trackCount }}首歌曲</p>
      </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  playlists: {
    type: Array,
    default: () => []
  }
})

const handleImageError = (e) => {
  e.target.src = 'https://p1.music.126.net/VnZiScyynLG7atLIZ2YPkw==/18686200114669622.jpg'
}

const formatCount = (count) => {
  return count > 10000 ? `${Math.floor(count / 10000)}万` : count
}
</script>

<style scoped>
.playlist-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}

.playlist-item {
  cursor: pointer;
  transition: transform 0.3s;
}

.playlist-item:hover {
  transform: translateY(-5px);
}

.cover-box {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-count {
  position: absolute;
  right: 5px;
  top: 5px;
  color: white;
  font-size: 12px;
  background: rgba(0,0,0,0.5);
  padding: 2px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
}

.info {
  padding: 8px 0;
}

.name {
  font-size: 14px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.count {
  font-size: 12px;
  color: #666;
  margin: 4px 0 0;
}
</style>
