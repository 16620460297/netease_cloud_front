<!-- PlaylistDetail.vue -->
<template>
  <div class="playlist-detail">
    <SongList v-if="playlistId" :playlist-id="playlistId" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SongList from '../components/SongList.vue'

const route = useRoute()
const playlistId = ref(route.query.id)
</script>
