/*
	This was previously exported from +layout.svelte's <script>, where SvelteKit
	never looked for it -- page options are only read from a +layout/+page
	module -- so it had no effect at all. Svelte 5 turns that into a hard error
	rather than a silent no-op, since `export` in a component script now declares
	a prop.

	The companion is a Wails webview with no server behind it, and the page
	reaches straight for `window.go`, so rendering without the Wails runtime is
	never useful: this is a pure client-side app.

	`prerender` was exported alongside it and is deliberately not carried over.
	With ssr off, prerendering `/` yields the same empty shell that
	adapter-static's `fallback: 'index.html'` already writes -- and the fallback
	is generated second, so it overwrote the prerendered file and the build
	warned about it. The fallback alone produces the build/index.html that
	main.go embeds via `//go:embed all:frontend/build`.
*/
export const ssr = false;
