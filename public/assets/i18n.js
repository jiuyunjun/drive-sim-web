const SUPPORTED_LOCALES = ['zh', 'en', 'ja'];

const TRANSLATIONS = {
  zh: {
    meta: {
      title: '驾驶考试中心 3D 模拟驾驶',
      appleTitle: '驾驶考试中心',
    },
    ui: {
      hideMenu: '隐藏菜单',
      showMenu: '显示菜单',
    },
    quick: {
      menuAria: '快捷视角菜单',
      follow: '跟车',
      cockpit: '车内',
      orbit: '自由',
    },
    hero: {
      title: '驾驶考试中心 3D 模拟驾驶',
      description: '选择一张地图，或者上传一张平面地图图片，把它作为地面贴图，然后直接在网页里开车。',
    },
    controls: {
      vehicleType: '车型',
      sedan: '卡罗拉轿车',
      motorcycle: '摩托车',
      map: '地图选择',
      uploadMap: '上传地图',
      resetVehicle: '重置车辆',
      setSpawn: '设为起点',
      changeView: '切换视角',
      mapWidth: '地图宽度（米）',
      resizeMap: '拖拽地图比例',
      maxSpeed: '车辆最大速度',
      steeringSensitivity: '转向灵敏度',
      autoCenterSteering: '方向盘自动回正',
    },
    curve: {
      cardLabel: '加速曲线图',
      title: '加速曲线',
      description: '横轴是油门输入，纵轴是驱动输出',
      soft: '柔和',
      direct: '直接',
      chartTitle: '加速曲线图',
      chartDesc: '展示当前油门输入与驱动输出的响应关系。',
      currentInput: '当前输入',
      currentOutput: '当前输出',
    },
    tips: {
      title: '操作指南：',
      drive: 'W / A / S / D 或 ↑ / ← / ↓ / → 驾驶',
      signal: 'Q / E 转向灯',
      brake: '空格 刹车',
      reset: 'O 重置',
      cycleViews: 'V 切换三种视角',
    },
    hud: {
      speed: '速度：',
      gear: '档位：',
      view: '视角：',
      position: '坐标：',
      heading: '航向：',
      steering: '方向盘：',
      signal: '转向灯：',
      audio: '音效：',
    },
    views: {
      follow: '跟车视角',
      cockpit: '第一人称',
      orbit: '自由观察',
    },
    signal: {
      off: '关闭',
      left: '左转',
      right: '右转',
    },
    audio: {
      pending: '待启用',
      unavailable: '不可用',
      enabled: '已开启',
      startFailed: '启动失败',
    },
    mirrors: {
      left: '左后视镜',
      center: '中后视镜',
      right: '右后视镜',
    },
    cockpitSignal: {
      left: '← 左灯',
      right: '右灯 →',
    },
    minimap: {
      label: '小地图',
      close: '收起小地图',
    },
    mobile: {
      controls: '移动端驾驶控制',
      steer: '左右滑动转向',
      steerHint: '← 滑动转向 →',
      view: '视角',
      reset: '重置',
      signalLever: '转向灯拨杆：上拨左灯，下拨右灯',
      signalLeft: '↑ 左灯',
      signalRight: '右灯 ↓',
      brake: '刹车',
      reverse: '后退',
      throttle: '油门',
    },
    rotate: {
      title: '请横屏使用',
      description: '手机端默认按横屏布局设计，旋转设备后继续。',
    },
    loading: {
      label: '地图加载中',
      text: '地图加载中…',
    },
    option: {
      custom: '自定义',
    },
  },
  en: {
    meta: {
      title: 'Driving Test Center 3D Driving Simulator',
      appleTitle: 'Drive Sim Web',
    },
    ui: {
      hideMenu: 'Hide Menu',
      showMenu: 'Show Menu',
    },
    quick: {
      menuAria: 'Quick view menu',
      follow: 'Chase',
      cockpit: 'Cockpit',
      orbit: 'Free',
    },
    hero: {
      title: 'Driving Test Center 3D Driving Simulator',
      description: 'Choose a map, or upload a top-down map image, use it as the ground texture, and drive directly in the browser.',
    },
    controls: {
      vehicleType: 'Vehicle',
      sedan: 'Corolla Sedan',
      motorcycle: 'Motorcycle',
      map: 'Map',
      uploadMap: 'Upload Map',
      resetVehicle: 'Reset Vehicle',
      setSpawn: 'Set Spawn',
      changeView: 'Change View',
      mapWidth: 'Map Width (m)',
      resizeMap: 'Map Scale',
      maxSpeed: 'Max Speed',
      steeringSensitivity: 'Steering Sensitivity',
      autoCenterSteering: 'Auto-center Steering',
    },
    curve: {
      cardLabel: 'Acceleration curve chart',
      title: 'Acceleration Curve',
      description: 'X axis is throttle input, Y axis is drive output',
      soft: 'Soft',
      direct: 'Direct',
      chartTitle: 'Acceleration curve chart',
      chartDesc: 'Shows how throttle input maps to drive output.',
      currentInput: 'Current Input',
      currentOutput: 'Current Output',
    },
    tips: {
      title: 'Control Guide:',
      drive: 'W / A / S / D or Arrow Keys Drive',
      signal: 'Q / E Signals',
      brake: 'Space Brake',
      reset: 'O Reset',
      cycleViews: 'V Cycle Views',
    },
    hud: {
      speed: 'Speed:',
      gear: 'Gear:',
      view: 'View:',
      position: 'Position:',
      heading: 'Heading:',
      steering: 'Steering:',
      signal: 'Signal:',
      audio: 'Audio:',
    },
    views: {
      follow: 'Chase View',
      cockpit: 'First Person',
      orbit: 'Free Camera',
    },
    signal: {
      off: 'Off',
      left: 'Left',
      right: 'Right',
    },
    audio: {
      pending: 'Waiting',
      unavailable: 'Unavailable',
      enabled: 'Enabled',
      startFailed: 'Start Failed',
    },
    mirrors: {
      left: 'Left Mirror',
      center: 'Center Mirror',
      right: 'Right Mirror',
    },
    cockpitSignal: {
      left: '← Left',
      right: 'Right →',
    },
    minimap: {
      label: 'Mini Map',
      close: 'Close mini map',
    },
    mobile: {
      controls: 'Mobile driving controls',
      steer: 'Swipe left and right to steer',
      steerHint: '← Swipe to steer →',
      view: 'View',
      reset: 'Reset',
      signalLever: 'Turn signal lever: up for left, down for right',
      signalLeft: '↑ Left',
      signalRight: 'Right ↓',
      brake: 'Brake',
      reverse: 'Reverse',
      throttle: 'Throttle',
    },
    rotate: {
      title: 'Use Landscape Mode',
      description: 'The mobile layout is designed for landscape play. Rotate your device to continue.',
    },
    loading: {
      label: 'Loading map',
      text: 'Loading map…',
    },
    option: {
      custom: 'Custom',
    },
  },
  ja: {
    meta: {
      title: '運転試験センター 3D シミュレーター',
      appleTitle: '運転試験センター',
    },
    ui: {
      hideMenu: 'メニューを隠す',
      showMenu: 'メニューを表示',
    },
    quick: {
      menuAria: 'クイック視点メニュー',
      follow: '追従',
      cockpit: '車内',
      orbit: '自由',
    },
    hero: {
      title: '運転試験センター 3D シミュレーター',
      description: 'マップを選ぶか、上から見た地図画像をアップロードして地面テクスチャにし、そのままブラウザで運転できます。',
    },
    controls: {
      vehicleType: '車種',
      sedan: 'カローラセダン',
      motorcycle: 'バイク',
      map: 'マップ',
      uploadMap: 'マップをアップロード',
      resetVehicle: '車両をリセット',
      setSpawn: '現在位置を開始地点にする',
      changeView: '視点切替',
      mapWidth: 'マップ幅（m）',
      resizeMap: 'マップ倍率',
      maxSpeed: '最高速度',
      steeringSensitivity: '操舵感度',
      autoCenterSteering: '自動でハンドルを戻す',
    },
    curve: {
      cardLabel: '加速カーブ図',
      title: '加速カーブ',
      description: '横軸はアクセル入力、縦軸は駆動出力です',
      soft: '穏やか',
      direct: 'ダイレクト',
      chartTitle: '加速カーブ図',
      chartDesc: 'アクセル入力と駆動出力の関係を表示します。',
      currentInput: '現在の入力',
      currentOutput: '現在の出力',
    },
    tips: {
      title: '操作ガイド:',
      drive: 'W / A / S / D または矢印キーで運転',
      signal: 'Q / E ウインカー',
      brake: 'Space ブレーキ',
      reset: 'O リセット',
      cycleViews: 'V で視点切替',
    },
    hud: {
      speed: '速度:',
      gear: 'ギア:',
      view: '視点:',
      position: '座標:',
      heading: '方位:',
      steering: 'ハンドル:',
      signal: 'ウインカー:',
      audio: '音:',
    },
    views: {
      follow: '追従視点',
      cockpit: '一人称',
      orbit: '自由視点',
    },
    signal: {
      off: 'オフ',
      left: '左',
      right: '右',
    },
    audio: {
      pending: '待機中',
      unavailable: '利用不可',
      enabled: '有効',
      startFailed: '起動失敗',
    },
    mirrors: {
      left: '左ミラー',
      center: '中央ミラー',
      right: '右ミラー',
    },
    cockpitSignal: {
      left: '← 左',
      right: '右 →',
    },
    minimap: {
      label: 'ミニマップ',
      close: 'ミニマップを閉じる',
    },
    mobile: {
      controls: 'モバイル運転コントロール',
      steer: '左右にスワイプして操舵',
      steerHint: '← スワイプで操舵 →',
      view: '視点',
      reset: 'リセット',
      signalLever: 'ウインカーレバー：上で左、下で右',
      signalLeft: '↑ 左',
      signalRight: '右 ↓',
      brake: 'ブレーキ',
      reverse: '後退',
      throttle: 'アクセル',
    },
    rotate: {
      title: '横向きでご利用ください',
      description: 'モバイル表示は横画面前提です。端末を回転して続行してください。',
    },
    loading: {
      label: 'マップを読み込み中',
      text: 'マップを読み込み中…',
    },
    option: {
      custom: 'カスタム',
    },
  },
};

function getNestedValue(object, key) {
  return key.split('.').reduce((current, part) => (current && part in current ? current[part] : undefined), object);
}

export function normalizeLocale(locale) {
  if (!locale) return 'en';
  const normalized = String(locale).toLowerCase();
  for (const supportedLocale of SUPPORTED_LOCALES) {
    if (normalized === supportedLocale || normalized.startsWith(`${supportedLocale}-`)) {
      return supportedLocale;
    }
  }
  return 'en';
}

export function resolveLocaleFromPath(pathname = window.location.pathname) {
  const match = pathname.match(/^\/(zh|en|ja)(?:\/|$)/i);
  return match ? match[1].toLowerCase() : null;
}

export function detectPreferredLocale(languages = navigator.languages?.length ? navigator.languages : [navigator.language || 'en']) {
  for (const language of languages) {
    const normalized = normalizeLocale(language);
    if (SUPPORTED_LOCALES.includes(normalized)) {
      return normalized;
    }
  }
  return 'en';
}

export function getCurrentLocale() {
  return resolveLocaleFromPath() || normalizeLocale(document.documentElement.lang) || detectPreferredLocale();
}

export function t(key, locale = getCurrentLocale()) {
  const normalizedLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';
  return getNestedValue(TRANSLATIONS[normalizedLocale], key)
    ?? getNestedValue(TRANSLATIONS.en, key)
    ?? key;
}

export function applyPageTranslations(root = document, locale = getCurrentLocale()) {
  const normalizedLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';
  const htmlLang = normalizedLocale === 'zh' ? 'zh-CN' : normalizedLocale;

  if (root.documentElement) {
    root.documentElement.lang = htmlLang;
  }

  if ('title' in root) {
    root.title = t('meta.title', normalizedLocale);
  }

  const appleTitleMeta = root.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) {
    appleTitleMeta.setAttribute('content', t('meta.appleTitle', normalizedLocale));
  }

  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n, normalizedLocale);
  });

  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel, normalizedLocale));
  });

  root.querySelectorAll('[data-i18n-content]').forEach((element) => {
    element.setAttribute('content', t(element.dataset.i18nContent, normalizedLocale));
  });
}
