<script setup>
// import { clipboard,nativeImage } from 'electron';
import { ref, shallowRef, onMounted, onUnmounted, computed, nextTick, watch, triggerRef } from 'vue';

// 使用 shallowRef 避免深度响应，提升大数组性能
const clipboardHistory = shallowRef([]);
const selectedIndex = ref(0);
const searchText = ref('');
let removeClipboardListener = null


/**
 * 在mounted时请求剪贴板历史数据
 */
onMounted(async () => {
  clipboardHistory.value = await window.clipboard.initClipboardHistory();
  await nextTick();
  focusOnSearch();

  // 监听剪贴板历史数据变化，并保存移除函数
  removeClipboardListener = window.clipboard.onAddClipboardItem((item) => {
    clipboardHistory.value.unshift(item);
    triggerRef(clipboardHistory); // 手动触发更新
  });
});

// 组件卸载时移除监听器
onUnmounted(() => {
  if (removeClipboardListener) {
    removeClipboardListener()
    removeClipboardListener = null
  }
})

// 搜索框获取焦点
function focusOnSearch() {
  const searchInput = document.querySelector('.search-input input');
  if (searchInput) {
    searchInput.focus();
  }
}

/**
 * 将timestamp为timestamp的item移动到第0个位置
 * @param timestamp
 */
function moveToTop(timestamp){
  const index = clipboardHistory.value.findIndex(item => item.timestamp === timestamp);
  if (index !== -1) {
    let deletedItem = clipboardHistory.value.splice(index, 1)[0];
    clipboardHistory.value.unshift(deletedItem);
    triggerRef(clipboardHistory); // 手动触发更新
  }
}


// 判断一个项目是否有有效内容
function hasValidContent(item) {
  if (item.type === 'image' && item.image_url) return true
  if (item.type === 'files' && item.file_paths && item.file_paths.length > 0) return true
  if (item.text) return true
  return false
}

// 计算属性:根据搜索框内容剪贴板历史
const filteredHistory = computed(() => {
  // 先过滤掉空记录
  const validHistory = clipboardHistory.value.filter(hasValidContent)

  if (!searchText.value) return validHistory;
  const lowerCaseSearch = searchText.value.toLowerCase();
  return validHistory.filter(item => {
    if(item.type === 'text'){
      // 防止 item.text 为 null/undefined
      return (item.text || '').toLowerCase().includes(lowerCaseSearch)
    }else if(item.type === 'files'){
      // 防止 item.file_paths 为 null/undefined
      return (item.file_paths || []).join('\n').toLowerCase().includes(lowerCaseSearch)
    }
    return false;
  });
});

function resetSelectedIndex(){
  selectedIndex.value = 0;
}

// 处理点击列表项 - 使用 timestamp 而非 index 来定位
async function handleClickItem(timestamp){
  // 找到项目在 filteredHistory 中的实际索引
  const index = filteredHistory.value.findIndex(item => item.timestamp === timestamp)
  if (index === -1) return
  selectedIndex.value = index
  window.clipboard.write2Clipboard(timestamp)
  moveToTop(timestamp)
  focusOnSearch()
  resetSelectedIndex()
}

// 处理键盘事件列表项
async function handleKeyDown(event) {
  if (event.key === 'ArrowUp') {
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
  } else if (event.key === 'ArrowDown') {
    // 防止越界：当列表为空时不处理
    if (filteredHistory.value.length === 0) return
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredHistory.value.length - 1);
  } else if (event.key === 'Enter') {
    // 防止空数组访问
    if (filteredHistory.value.length === 0) return
    const selectedItem = filteredHistory.value[selectedIndex.value]
    if (!selectedItem) return
    const selectedItemTimestamp = selectedItem.timestamp
    moveToTop(selectedItemTimestamp);
    window.clipboard.write2Clipboard(selectedItemTimestamp);
    resetSelectedIndex();
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

// 监听搜索内容变化，重置选中索引
watch(searchText, () => {
  selectedIndex.value = 0;
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
          @click="handleClickItem(item.timestamp)"
        >
          <v-list-item-title v-if="item.type === 'text'">
            <v-icon style="margin-right: 10px;">mdi-format-text-variant</v-icon>
            {{ item.text }}
          </v-list-item-title>
          <v-list-item-title v-else-if="item.type === 'files'">
            <div style="display: flex; align-items: left;">
              <v-icon style="margin-right: 10px;">mdi-file</v-icon>
              <div style="white-space: pre-wrap;">
                {{ (item.file_paths || []).slice(0, 3).join('\n') }}
                <span v-if="item.file_paths && item.file_paths.length > 3">...等{{ item.file_paths.length}}个文件</span>
              </div>
            </div>
          </v-list-item-title>
          <v-list-item-title v-else-if="item.type === 'image'">
            <div style="display: flex; align-items: left;">
              <v-icon style="margin-right: 10px;">mdi-image</v-icon>
              <v-img :src="item.image_url" max-width="100" max-height="100"></v-img>
            </div>
          </v-list-item-title>
          <!-- 兜底：处理旧数据中的 rtf/html 或未知类型 -->
          <v-list-item-title v-else>
            <v-icon style="margin-right: 10px;">mdi-format-text-variant</v-icon>
            {{ item.text }}
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

