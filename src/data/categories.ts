/**
 * Real categories come from `GET /api/categories`. The menu keeps one virtual tab,
 * "Popular", which lists products flagged `isPopular` across every category.
 */
export const POPULAR_TAB_ID = 0
export const POPULAR_TAB_COLOR = "#ff0099"

/** Home page grid: the selected category id is handed to the menu page via localStorage. */
export const MENU_TAB_KEY = "menuId"
