<template>
  <GlobalProvider>
    <n-scrollbar
      :content-style="{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }"
      style="height: 100vh"
      @scroll="siteScroll"
    >
      <SiteNav />
      <Transition name="fade">
        <SiteHeader v-if="statusStore.loginStatus" />
      </Transition>
      <!-- 主内容 -->
      <main v-if="siteLoaded" id="main">
        <Transition name="fade" mode="out-in">
          <!-- 密码验证 -->
          <SiteLogin v-if="!statusStore.loginStatus" />
          <!-- 站点卡片 -->
          <SiteCards v-else />
        </Transition>
      </main>
      <SiteFooter />
      <!-- 回到顶部 -->
      <n-back-top :visibility-height="10" />
    </n-scrollbar>
  </GlobalProvider>
</template>

<script setup lang="ts">
import {
  useOsTheme,
  type GlobalThemeOverrides,
} from "naive-ui";

const config = useRuntimeConfig();
const statusStore = useStatusStore();

const osTheme = useOsTheme();
const colorMode = useColorMode();

const { setLocale } = useI18n();

// 加载状态
const siteLoaded = ref<boolean>(false);

// 验证状态
const checkSite = async () => {
  try {
    const result = await $fetch("/api/check", { method: "POST" });
    // 更改登录状态
    statusStore.loginStatus = result.code === 200;
  } catch (error) {
    console.error("error in checkSite", error);
  } finally {
    siteLoaded.value = true;
  }
};

// 页面滚动
const siteScroll = (e: Event) => {
  // 滚动高度
  const scrollTop = (e.target as HTMLElement).scrollTop;
  statusStore.scrollTop = scrollTop;
};

// 更改站点语言
const setSiteLang = (lang: string) => {
  setLocale(lang);
  useHead({ htmlAttrs: { lang } });
};

// 定义状态颜色映射
const statusColors: Record<string, { light: string; dark: string }> = {
  normal: {
    light: '#3bd672',
    dark: '#2abf5b',
  },
  warn: {
    light: '#f39c12',
    dark: '#d68a0e',
  },
  error: {
    light: '#de484a',
    dark: '#b83a3e',
  },
  loading: {
    light: '#58d0ff',
    dark: '#46b3e0',
  },
  unknown: {
    light: '#7f8c8d',
    dark: '#636c6f',
  },
};

// 设置状态栏颜色
const getStatusBarColor = (siteStatus: string, preference: string, osTheme: string | null, scrollTop: number) => {
  let finalMode = preference;
  if (preference === 'system') {
    finalMode = osTheme || 'light';
  }

  if (scrollTop > 0) {
    return finalMode === 'light' ? '#ffffff' : '#424242';
  }
  // 获取对应的颜色
  const color = statusColors[siteStatus]?.[finalMode as 'light' | 'dark'];
  return color || '#ffffff';
};

// 监听站点状态 / 明暗模式 / 滚动变化
let previousStatus = statusStore.siteStatus || 'unknown';
watch(
  () => [statusStore.siteStatus, colorMode.preference, osTheme.value, statusStore.scrollTop],
  (newValues) => {
    const [status, preference, osThemeValue, scrollTop] = newValues;
    const color = getStatusBarColor(status, preference, osThemeValue, scrollTop);
    const isDarkMode = colorMode.preference === 'dark' || (colorMode.preference === 'system' && osTheme.value === 'dark');
    
    // 设置 data-theme 属性
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

    // 设置 <meta name="theme-color">
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    } else {
      // 若无 meta 标签，则创建一个
      const newMeta = document.createElement('meta');
      newMeta.name = 'theme-color';
      newMeta.content = color;
      document.head.appendChild(newMeta);
    }

    if (previousStatus !== status) {
      const { siteTitle } = config.public;
      // 错误数据
      const isError = status === "error" || status === "warn";
      const error = statusStore.siteData?.status?.error || 0;
      const unknown = statusStore.siteData?.status?.unknown || 0;
      // 更改信息
      useHead({
        // 更改标题
        title: isError ? `( ${error + unknown} ) ` + siteTitle : siteTitle,
      });
      // 更改图标
      useFavicon(isError ? "/favicon-error.ico" : "/favicon.ico");
      previousStatus = status;
    }
  },
);

// 语言更改
watch(() => statusStore.siteLang, setSiteLang);

onBeforeMount(checkSite);

onMounted(() => {
  setSiteLang(statusStore.siteLang);
  const initialIsDarkMode = colorMode.preference === 'dark' || (colorMode.preference === 'system' && osTheme.value === 'dark');
  document.documentElement.setAttribute('data-theme', initialIsDarkMode ? 'dark' : 'light');
});
</script>

<style lang="scss" scoped>
main {
  width: 100%;
  height: 100%;
  flex: 1;
}
</style>
