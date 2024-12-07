<script setup>
// import { clipboard,nativeImage } from 'electron';
import { ref, onMounted, computed, nextTick, watch } from 'vue';

const clipboardHistory = ref([]);
const selectedIndex = ref(0);
const searchText = ref('');


/**
 * 在mounted时请求剪贴板历史数据
 */
onMounted(async () => {
  clipboardHistory.value = await window.clipboard.initClipboardHistory();
  await nextTick();
  focusOnSearch();
});

// 搜索框获取焦点
function focusOnSearch() {
  const searchInput = document.querySelector('.search-input input');
  if (searchInput) {
    searchInput.focus();
  }
}

/**
 * 监听剪贴板历史数据变化
 */
window.clipboard.onAddClipboardItem((item) => {
  clipboardHistory.value.unshift(item);
});

/**
 * 将timestamp为timestamp的item移动到第0个位置
 * @param timestamp 
 */
function moveToTop(timestamp){
  const index = clipboardHistory.value.findIndex(item => item.timestamp === timestamp);
  if (index !== -1) {
    let deletedItem = clipboardHistory.value.splice(index, 1)[0];
    clipboardHistory.value.unshift(deletedItem);
  }
}






// 计算属性:根据搜索框内容剪贴板历史
const filteredHistory = computed(() => {
  if (!searchText.value) return clipboardHistory.value;
  const lowerCaseSearch = searchText.value.toLowerCase();
  return clipboardHistory.value.filter(item => {
    if(item.type === 'text' || item.type === 'rtf' || item.type==='html'){
      return item.text.toLowerCase().includes(lowerCaseSearch)
    }else if(item.type === 'files'){
      return item.file_paths.join('\n').toLowerCase().includes(lowerCaseSearch)
    }
    return false;
  });
});


// 处理点击列表项
async function handleClickItem(index){
  selectedIndex.value = index;
  window.clipboard.write2Clipboard(filteredHistory.value[index].timestamp);
  moveToTop(filteredHistory.value[index].timestamp);
  focusOnSearch();
}

// 处理键盘事件列表项
async function handleKeyDown(event) {
  if (event.key === 'ArrowUp') {
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
  } else if (event.key === 'ArrowDown') {
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredHistory.value.length - 1);
  }else if(event.key === 'Enter'){
    const selectedItemTimestamp = filteredHistory.value[selectedIndex.value].timestamp;
    moveToTop(selectedItemTimestamp);
    window.clipboard.write2Clipboard(selectedItemTimestamp);
  }
}


// 监听selectedIndex变化,让对应的列项动到可视区域
watch(selectedIndex, async () => {
  await nextTick();
  const selectedElement = document.querySelector('.v-list-item--active');
  if (selectedElement) {
    selectedElement.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }
});




</script>


<template>
  <v-container>
    <v-text-field
      v-model="searchText"
      label="Search"
      placeholder="Search clipboard history..."
      prepend-inner-icon="mdi-magnify"
      class="search-input"
      autofocus
      @keydown="handleKeyDown"
    ></v-text-field>

    <v-virtual-scroll
      :height="480"
      :items="filteredHistory"
      :item-height="50"
      key-field="timestamp"
    >
      <template v-slot:default="{ item, index }">
        <!-- @click="selectedIndex = index; focusOnSearch()" -->
        <v-list-item
          :class="{ 'v-list-item--active': selectedIndex === index }"
          @click="handleClickItem(index)"
        >
          <v-list-item-title v-if="item.type === 'text'">
            <v-icon style="margin-right: 10px;">mdi-format-text-variant</v-icon>
            {{ item.text }}
          </v-list-item-title>
          <v-list-item-title v-else-if="item.type === 'rtf'">
            <v-icon style="margin-right: 10px;">mdi-format-text-rotation-none</v-icon>
            {{ item.text }}
          </v-list-item-title>
          <v-list-item-title v-else-if="item.type === 'html'">
            <v-icon style="margin-right: 10px;">mdi-code-block-tags</v-icon>
            {{ item.text }}
          </v-list-item-title>
          <v-list-item-title v-else-if="item.type === 'files'">
            <div style="display: flex; align-items: left;">
              <v-icon style="margin-right: 10px;">mdi-file</v-icon>
              <div style="white-space: pre-wrap;">
                {{ item.file_paths.slice(0, 3).join('\n') }}
                <span v-if="item.file_paths.length > 3">...等{{ item.file_paths.length}}个文件</span>
              </div>
            </div>
          </v-list-item-title>
          <v-list-item-title v-else-if="item.type === 'image'">
            <div style="display: flex; align-items: left;">
              <v-icon style="margin-right: 10px;">mdi-image</v-icon>
              <v-img :src="item.image_url" max-width="100" max-height="100"></v-img>
            </div>
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-virtual-scroll>
  </v-container>
</template>

<style scoped>
.search-input {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* 自定义滚动条样式 */
:deep(.v-virtual-scroll) {
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 147, 153, 0.3) transparent;
}

:deep(.v-virtual-scroll::-webkit-scrollbar) {
  width: 4px;
}

:deep(.v-virtual-scroll::-webkit-scrollbar-track) {
  background: transparent;
  margin: 4px 0;
}

:deep(.v-virtual-scroll::-webkit-scrollbar-thumb) {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 4px;
  border: none;
  min-height: 40px;
}

:deep(.v-virtual-scroll::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(144, 147, 153, 0.5);
}

:deep(.v-virtual-scroll::-webkit-scrollbar-button) {
  display: none !important;
  height: 0 !important;
  width: 0 !important;
}
</style>

