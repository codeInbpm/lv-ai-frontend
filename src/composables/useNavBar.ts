/**
 * useNavBar - 全局导航栏高度计算
 * 提供精确的状态栏高度和导航栏内容高度（单位 px），
 * 供各页面动态设置顶部占位，避免被自定义导航栏遮挡。
 */

interface NavBarInfo {
  /** 状态栏高度（px） */
  statusBarHeight: number
  /** 导航栏内容高度（px） */
  navBarHeight: number
  /** 总高度 = 状态栏 + 导航栏内容（px） */
  totalHeight: number
}

let _cached: NavBarInfo | null = null

export function useNavBar(): NavBarInfo {
  if (_cached) return _cached

  const sysInfo = uni.getSystemInfoSync()
  const statusBarHeight = sysInfo.statusBarHeight || 20
  let navBarHeight = 44

  try {
    // #ifdef MP-WEIXIN
    const menuButton = uni.getMenuButtonBoundingClientRect()
    if (menuButton && menuButton.top) {
      navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height
    }
    // #endif
  } catch (e) {
    console.warn('[useNavBar] getMenuButtonBoundingClientRect failed, using default', e)
  }

  _cached = {
    statusBarHeight,
    navBarHeight,
    totalHeight: statusBarHeight + navBarHeight
  }

  return _cached
}
