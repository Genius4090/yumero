/**
 * Real categories come from `GET /api/categories`. The menu keeps one virtual tab,
 * "Popular", which lists products flagged `isPopular` across every category.
 */
export const POPULAR_TAB_ID = 0
export const POPULAR_TAB_COLOR = "#ff0099"
/** Second virtual tab: every dish, grouped under its category heading. */
export const ALL_TAB_ID = -1

/**
 * The menu's selected category, also handed over by the home page grid. Kept in sessionStorage: it survives page
 * switches and reloads inside the tab, but a new visit (or a logout) starts on "Popular" again.
 */
const MENU_TAB_KEY = "menuId"

export const readMenuTab = (): number => {
  try {
    const stored = sessionStorage.getItem(MENU_TAB_KEY)
    const id = stored === null ? NaN : Number(stored)
    return Number.isFinite(id) ? id : POPULAR_TAB_ID
  } catch {
    return POPULAR_TAB_ID
  }
}

export const saveMenuTab = (id: number) => {
  try {
    sessionStorage.setItem(MENU_TAB_KEY, String(id))
  } catch {
    // storage unavailable: the tab is just not remembered
  }
}

export const clearMenuTab = () => {
  try {
    sessionStorage.removeItem(MENU_TAB_KEY)
    // older versions kept it in localStorage
    localStorage.removeItem(MENU_TAB_KEY)
  } catch {
    // ignore
  }
}
