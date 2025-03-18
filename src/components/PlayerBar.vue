<template>
  <div>
    <!-- 歌词展示区域，固定在播放器上方 -->
    <div class="lyrics-display" v-if="parsedLyrics.length" ref="lyricsDisplay">
      <div
          v-for="(line, index) in parsedLyrics"
          :key="index"
          class="lyric-line"
          :class="{ active: index === currentLyricIndex }"
      >
        {{ line.text }}
      </div>
    </div>

    <!-- 播放器 -->
    <div class="player-bar" :class="{ 'is-visible': currentSong }">
      <div class="player-content">
        <!-- 歌曲信息 -->
        <div class="song-info">
          <img :src="currentSong?.cover || defaultCover" class="cover" />
          <div class="meta">
            <div class="title" :title="currentSong?.name">{{ currentSong?.name }}</div>
            <div class="artist" :title="currentSong?.artists">{{ currentSong?.artists }}</div>
          </div>
          <button class="log-btn" @click="showPlayLog">播放记录</button>
        </div>

        <!-- 播放控制 -->
        <div class="controls">
          <div class="playback-controls">
            <button @click="playPrev" title="上一首">◄◄</button>
            <button @click="togglePlay" class="play-pause">
              {{ isPlaying ? '⏸' : '▶' }}
            </button>
            <button @click="playNext" title="下一首">►►</button>
          </div>

          <div class="progress-container">
            <span class="time-current">{{ formatTime(currentTime) }}</span>
            <div class="progress-bar" @mousedown="startSeek" ref="progressBar">
              <div class="progress" :style="{ width: progressPercentage + '%' }"></div>
            </div>
            <span class="time-total">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- 音量与倍速控制 -->
        <div class="right-controls">
          <div class="volume-control">
            <button @click="toggleMute">{{ isMuted ? '🔇' : '🔊' }}</button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                v-model="volume"
                class="volume-slider"
            />
          </div>
          <div class="speed-control">
            <label for="speed-select">倍速:</label>
            <select id="speed-select" v-model="playbackRate">
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      </div>

      <audio
          ref="audioElement"
          @timeupdate="updateTime"
          @loadedmetadata="updateDuration"
          @ended="handleEnded"
      ></audio>

      <!-- 播放记录模态框 -->
      <div v-if="showModal" class="modal">
        <div class="modal-content">
          <!-- 固定顶部区域 -->
          <div class="modal-header">
            <h3>播放记录</h3>
            <button class="close-btn" @click="showModal = false" aria-label="Close">
              <!-- 这是一个“X”形状的矢量图标，随时可根据喜好更换 -->
              <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>



          </div>
          <!-- 可滚动内容区域 -->
          <div class="modal-body">
            <ul class="log-list">
              <li
                  v-for="log in playLogs"
                  :key="log.played_at"
                  class="log-list-item"
              >
                <div class="log-song-info">
                  <div class="log-song-name">
                    {{ log.song_name }}
                  </div>
                  <div class="log-times">
                    <span>上次播放：{{ formatDateTime(log.played_at) }}</span>
                    <span>进度：{{ formatTime(log.adjusted_current_time) }}</span>
                    <span>总时长：{{ formatTime(log.song_duration) }}</span>
                  </div>
                </div>
                <button class="log-replay-btn" @click="playFromLog(log)">
                  继续播放
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

// 这是你“手搓的”消息组件示例，直接在这里 import 即可
import Message from '../components/message/message';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
// 如果不需要测试用的示例提示，可以删除下面这几行
// Message.success('播放成功');
// Message.error('播放失败');
// Message.info('这是一条提示');
// Message.warning('这是一条警告');


const audioElement = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(1);
const isMuted = ref(false);
const progressBar = ref(null);
const isSeeking = ref(false);

const currentSong = ref(null);
const currentPlaylist = ref([]);
const currentIndex = ref(-1);
const showModal = ref(false);
const playLogs = ref([]);
const defaultCover = ref('default-cover.jpg');
const playbackRate = ref(1);

// --------- 歌词相关 ---------
const rawLyric = ref('');
const parsedLyrics = ref([]); // [{ time: number, text: string }, ...]
const currentLyricIndex = ref(0);
const lyricsDisplay = ref(null);

const progressPercentage = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
});

// 监听歌词索引，自动滚动
watch(currentLyricIndex, (newIndex) => {
  if (lyricsDisplay.value) {
    const activeLine = lyricsDisplay.value.querySelector(
        `.lyric-line:nth-child(${newIndex + 1})`
    );
    if (activeLine) {
      const containerHeight = lyricsDisplay.value.clientHeight;
      const lineHeight = activeLine.clientHeight;
      const scrollTop =
          activeLine.offsetTop - containerHeight / 2 + lineHeight / 2;
      lyricsDisplay.value.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }
});

// 倍速播放
watch(playbackRate, (newRate) => {
  if (audioElement.value) {
    audioElement.value.playbackRate = newRate;
  }
});

// 加载播放记录
const getPlayLogs = async () => {
  try {
    const loginData = JSON.parse(localStorage.getItem('loginData'));
    if (!loginData) return;
    const response = await axios.get(
        `/api/play_log/get?user_id=${loginData.profile.account.id}`,
        { withCredentials: true }
    );
    playLogs.value = response.data.data;
  } catch (err) {
    console.error('获取播放记录失败:', err);
  }
};

const showPlayLog = () => {
  showModal.value = true;
  getPlayLogs();
};

// 从记录点击播放
const playFromLog = async (log) => {
  //console.log('播放记录点击播放', log)
  showModal.value = false;
  let song = currentPlaylist.value.find((t) => t.id === log.song_id);
  //console.log('歌曲', song)

  // 2. 如果找不到，则去服务器请求歌曲详情
  // if (!song) {
  //   song = { id: log.song_id };
  // }
  // 2. 如果没找到，就去请求单曲详情接口
  if (!song) {
    try {
      const resp = await axios.get(`/api/playlist/single_detail?song_id=${log.song_id}`);
      if (resp.data.code === 200 && resp.data.data) {
        const data = resp.data.data;
        // 你可以根据后端返回的数据结构，对象属性进行适配
        // 例如：
        song = {
          id: data.id,
          name: data.name,
          artists: data.artists?.map(a => a.name).join('/') || '',
          cover: data.album?.picUrl || '',
          // ...等其它需要的字段
        }
      } else {
        console.error('后台接口返回失败：', resp.data.msg);
        return;
      }
    } catch (e) {
      console.error('获取单曲详情接口出现异常：', e);
      return;
    }
  }
  // 3. 依然没有获取到有效歌曲信息，直接 return
  if (!song) {
    return;
  }

  //console.log("可以播放",song)
  // 根据上次播放进度与总时长判断是否重置为 0
  const shouldReset =
      (log.song_duration - log.adjusted_current_time) / log.song_duration <= 0.1;
  const playTime = shouldReset ? 0 : log.adjusted_current_time;
  await switchSong(song);
  audioElement.value.currentTime = playTime;
  if (!isPlaying.value) togglePlay();
};

// 保存播放记录
const savePlayLog = async () => {
  try {
    if (!audioElement.value || !currentSong.value) return;
    const loginData = JSON.parse(localStorage.getItem('loginData'));
    if (!loginData) return;

    const realDuration = audioElement.value.duration || duration.value;
    if (!realDuration || realDuration <= 0) {
      // 还没有准确的音频时长，就先不保存
      console.warn('音频时长为 0，可能尚未加载 metadata，暂不保存。');
      return;
    }

    await axios.post(
        '/api/play_log/set',
        {
          song_id: currentSong.value.id,
          song_name: currentSong.value.name,
          current_time: currentTime.value,
          duration: realDuration,
          user_id: loginData.profile.account.id,
        },
        { withCredentials: true }
    );
  } catch (err) {
    console.error('保存播放记录失败:', err);
  }
};

const togglePlay = () => {
  if (!audioElement.value || !currentSong.value) return;
  if (isPlaying.value) {
    audioElement.value.pause();
    isPlaying.value = false;
  } else {
    audioElement.value
        .play()
        .then(() => {
          isPlaying.value = true;
        })
        .catch((err) => {
          console.error('播放失败:', err);
          isPlaying.value = false;
          // 如果想弹出自己的 error 提示，可以加上：
          Message.error('播放失败');
        });
  }
};

// 获取歌词并解析
const fetchLyrics = async (songId) => {
  try {
    const response = await axios.get(
        `/163/api/song/lyric?os=pc&id=${songId}&lv=-1&tv=-1`
    );
    if (response.data && response.data.lrc) {
      rawLyric.value = response.data.lrc.lyric;
      //console.log('歌词解析成功', response.data.lrc.lyric)
      parsedLyrics.value = parseLyric(rawLyric.value);
      //console.log('歌词解析成功', parsedLyrics.value)
    } else {
      rawLyric.value = '';
      parsedLyrics.value = [];
    }
  } catch (err) {
    console.error('获取歌词失败:', err);
    rawLyric.value = '';
    parsedLyrics.value = [];
  }
};

// 修正后的歌词解析函数
const parseLyric = (lyricStr) => {
  const lines = lyricStr.split('\n');
  const regex = /\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/; // 修正正则表达式
  const result = [];
  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      result.push({
        time: minutes * 60 + seconds,
        text: match[3].trim()
      });
    }
  }
  return result;
};

// 获取备用地址数组
const getAudioUrls = (song) => {
  const urls = [];
  if (song.directLink) {
    urls.push(song.directLink);
  }
  // 默认的网易外链 + byfuns 示例
  urls.push(`https://music.163.com/song/media/outer/url?id=${song.id}.mp3`);
  urls.push(`/byfuns/api/1/?id=${song.id}`);
  return urls;
};

// 尝试播放备用地址
const tryAudioUrls = async (urls) => {
  for (const url of urls) {
    try {
      if (url.includes('byfuns/api/1')) {
        // 如果是 byfuns 的接口，需要先请求获取真正的直链
        const response = await axios.get(url);
        const realAudioUrl = response.data;
        audioElement.value.src = realAudioUrl;
        await audioElement.value.play();
        // 播放成功后，使用自定义 Message
        Message.success('播放成功');
        return realAudioUrl;
      } else {
        // 普通直链
        audioElement.value.src = url;
        await audioElement.value.play();
        // 播放成功后，使用自定义 Message
        Message.success('播放成功');
        return url;
      }
    } catch (err) {
      console.error('地址播放失败：', url, err);
    }
  }
  // 如果所有都失败，用自己的组件提示
  Message.error('所有地址均无法播放');
  throw new Error('所有备用地址均无法播放');
};

const switchSong = async (song) => {
  if (!song) return;
  currentSong.value = song;

  // 每次切换歌曲时，重新加载歌词
  await fetchLyrics(song.id);

  // 获取备用地址并尝试播放
  const urls = getAudioUrls(song);
  try {
    await tryAudioUrls(urls);
    isPlaying.value = true;
    // 切歌就立刻记录一下，至少存储一下初始 0s
    savePlayLog();
  } catch (err) {
    console.error('自动播放失败:', err);
    isPlaying.value = false;
  }
};

// 切换到指定歌曲
const playTrack = (track, playlist) => {
  currentPlaylist.value = playlist;
  currentIndex.value = playlist.findIndex((t) => t.id === track.id);
  switchSong(track);
};

// 进度条拖动
const startSeek = (e) => {
  isSeeking.value = true;
  const rect = progressBar.value.getBoundingClientRect();
  const percentage = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
  );
  audioElement.value.currentTime = duration.value * percentage;
  currentTime.value = duration.value * percentage;

  window.addEventListener('mousemove', handleSeek);
  window.addEventListener('mouseup', endSeek);
};

const handleSeek = (e) => {
  const rect = progressBar.value.getBoundingClientRect();
  const percentage = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
  );
  currentTime.value = duration.value * percentage;
};

const endSeek = () => {
  isSeeking.value = false;
  window.removeEventListener('mousemove', handleSeek);
  window.removeEventListener('mouseup', endSeek);
  savePlayLog();
};

// 更新播放时间 & 歌词高亮
const updateTime = (e) => {
  if (!isSeeking.value) {
    currentTime.value = e.target.currentTime;
  }
  // 找到当前时间对应歌词索引
  let newIndex = -1;
  for (let i = 0; i < parsedLyrics.value.length; i++) {
    if (currentTime.value >= parsedLyrics.value[i].time) {
      newIndex = i;
    } else {
      break;
    }
  }
  currentLyricIndex.value = newIndex;

  // 每 10 秒存一次日志
  if (Math.floor(currentTime.value) % 10 === 0) {
    savePlayLog();
  }
};

const handleEnded = () => {
  savePlayLog();
  playNext();
};

const updateDuration = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration;
  }
};

const playPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    switchSong(currentPlaylist.value[currentIndex.value]);
  }
};

const playNext = () => {
  if (currentIndex.value < currentPlaylist.value.length - 1) {
    currentIndex.value++;
    switchSong(currentPlaylist.value[currentIndex.value]);
  }
};

// 音量变化
watch(volume, (val) => {
  if (audioElement.value) {
    audioElement.value.volume = val;
    isMuted.value = val === 0;
  }
});

// 静音切换
const toggleMute = () => {
  isMuted.value = !isMuted.value;
  if (audioElement.value) {
    audioElement.value.muted = isMuted.value;
  }
};

// 时间格式化
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  // 告诉 dayjs，这是 UTC 格式
  const d = dayjs.utc(dateStr);
  // 如果要显示成“北京时间”，可以再加一个 .tz('Asia/Shanghai')
  // 最终按需要的格式输出
  return d.format('YYYY-MM-DD HH:mm:ss');
};


onMounted(() => {
  getPlayLogs();
  // 防止用户鼠标直接移出页面，没有触发 mouseup
  document.addEventListener('mouseup', () => {
    if (isSeeking.value) {
      isSeeking.value = false;
      savePlayLog();
    }
  });
});

// 对外暴露 playTrack 方法，方便外部调用
defineExpose({ playTrack });
</script>

<style scoped>
/* 这里保持与之前一致的样式即可 */
.player-bar {
  position: fixed;
  bottom: -100px;
  left: 0;
  right: 0;
  height: 90px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #eee;
  transition: bottom 0.3s ease;
  z-index: 1000;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
}

.player-bar.is-visible {
  bottom: 0;
}

.player-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
  justify-content: space-between;
}

.song-info {
  display: flex;
  align-items: center;
  min-width: 250px;
  flex: 1;
}

.cover {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  margin-right: 15px;
  object-fit: cover;
}

.meta {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 180px;
}

.title,
.artist {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin: 0;
  padding: 0;
}

.title {
  font-weight: 500;
  font-size: 14px;
}

.artist {
  font-size: 12px;
  color: #666;
}

.controls {
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.playback-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.playback-controls button {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 5px;
  color: #333;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.time-current,
.time-total {
  font-size: 12px;
  width: 40px;
  text-align: center;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.progress {
  height: 100%;
  background: #2d8cf0;
  border-radius: 2px;
  transition: width 0.1s linear;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  justify-content: flex-end;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 5px;
}

.volume-slider {
  width: 80px;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.speed-control select {
  padding: 2px 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.log-btn {
  margin-left: 10px;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #2d8cf0;
  background-color: #fff;
  color: #2d8cf0;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.log-btn:hover {
  background-color: #2d8cf0;
  color: #fff;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  position: fixed;
  bottom: 100px;
  left: 30%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;       /* 点击区域更大，体验更好 */
  border-radius: 5px;
  transition: background-color 0.3s, color 0.3s;
  /* color 可以控制 svg 的 stroke */
  color: #666;
}

/* 悬停时，加点效果 */
.close-btn:hover {
  background-color: #f5f5f5;
  color: #000; /* stroke 变黑 */
}



.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.modal-body::-webkit-scrollbar {
  display: none;
}

.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.log-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.log-list-item:last-child {
  border-bottom: none;
}

.log-list-item:hover {
  background-color: #f5f5f5;
}

.log-song-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-song-name {
  font-weight: 600;
}

.log-times {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.log-replay-btn {
  background: none;
  border: 1px solid #2d8cf0;
  color: #2d8cf0;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.3s;
}

.log-replay-btn:hover {
  background-color: #2d8cf0;
  color: #fff;
}

.lyrics-display {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 1000px;
  text-align: center;
  pointer-events: none;
  z-index: 999;
  height: 120px;
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.lyrics-display::-webkit-scrollbar {
  display: none;
}

.lyric-line {
  font-size: 25px;
  color: #999;
  line-height: 1.2;
  transition: all 0.3s ease;
  padding: 4px 0;
}

.lyric-line.active {
  color: #2d8cf0;
  font-weight: bold;
  transform: scale(1.05);
}
</style>
