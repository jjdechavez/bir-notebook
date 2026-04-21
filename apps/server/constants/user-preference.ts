export const navigationLayouts = {
	sidebar: "sidebar",
	navbar: "navbar",
} as const

export type NavigationLayout =
	(typeof navigationLayouts)[keyof typeof navigationLayouts]

export const themes = {
	light: "light",
	dark: "dark",
	system: "system",
} as const

export type Theme = (typeof themes)[keyof typeof themes]
