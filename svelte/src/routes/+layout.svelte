<script lang="js">
  import "../app.postcss";

  // Highlight JS
  import hljs from "highlight.js/lib/core";
  import "highlight.js/styles/github-dark.css";
  import { storeHighlightJs } from "@skeletonlabs/skeleton";
  import xml from "highlight.js/lib/languages/xml"; // for HTML
  import css from "highlight.js/lib/languages/css";
  import javascript from "highlight.js/lib/languages/javascript";
  import typescript from "highlight.js/lib/languages/typescript";
  import { AppShell } from "@skeletonlabs/skeleton";

  hljs.registerLanguage("xml", xml); // for HTML
  hljs.registerLanguage("css", css);
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("typescript", typescript);
  storeHighlightJs.set(hljs);

  // Floating UI for Popups
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from "@floating-ui/dom";
  import { storePopup } from "@skeletonlabs/skeleton";
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  import Header from "./Header.svelte";

  //Modal Component
  import { Modal } from "@skeletonlabs/skeleton";

  import { initializeStores } from "@skeletonlabs/skeleton";
  import { Toast, getToastStore } from "@skeletonlabs/skeleton";

  initializeStores();

  import settingsModal from "$lib/modals/settings.svelte";
  import radioModal from "$lib/modals/radioKeypad.svelte";
  const modalRegistry = {
    settingsModal: { ref: settingsModal },
    radioModal: { ref: radioModal },
  };
</script>

<Modal components={modalRegistry} />
<Toast />

<AppShell>
  <svelte:fragment slot="header"><Header /></svelte:fragment>
  <!-- (sidebarLeft) -->
  <!-- (sidebarRight) -->
  <!-- (pageHeader) -->
  <!-- Router Slot -->
  <slot />
  <!-- ---- / ---- -->
  <!-- (pageFooter) -->
  <!-- (footer) -->
</AppShell>
