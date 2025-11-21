<script lang="ts">
  import { onMount } from "svelte";
  import { AppBar, SegmentedControl } from "@skeletonlabs/skeleton-svelte";
  import { House, RadioTower, Tablet, CloudSunRain, FileText, ListTodo, Settings } from '@lucide/svelte';

  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { settings } from "$lib/stores";
  import SettingsModal from "$lib/modals/settings.svelte";

  let valueSingle: string = $state(page.url.pathname);
  let settingsOpen = $state(false);

  // Update valueSingle when page path changes
  $effect(() => {
    valueSingle = page.url.pathname;
  });

  onMount(() => {
    // Set document class based on settings appearance (guard for SSR)
    if (typeof document !== "undefined") {
      if ($settings.appearance === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  });

  // Reactively keep document class in sync when the setting changes
  $effect(() => {
    if (typeof document !== "undefined") {
      if ($settings.appearance === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  });

  function handleValueChange(details: { value: string | null }) {
    const v = details.value;
    if (v) {
      valueSingle = v;
      goto(v);
    }
  }

  function handleSave(e: CustomEvent) {
    settings.update(s => ({ ...s, ...e.detail }));
    settingsOpen = false;
  }

  function handleCancel() {
    settingsOpen = false;
  }
</script>

<header>
  <AppBar>
    <AppBar.Toolbar class="grid-cols-[1fr_2fr_1fr]">
      <AppBar.Lead>
        <SegmentedControl value={valueSingle} onValueChange={handleValueChange}>
          <SegmentedControl.Control>
            <SegmentedControl.Indicator />

            <SegmentedControl.Item value="/" title="Home" aria-label="Home">
              <SegmentedControl.ItemText>
                <House />
              </SegmentedControl.ItemText>
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>

            <SegmentedControl.Item value="/radio" title="Radio" aria-label="Radio">
              <SegmentedControl.ItemText>
                <RadioTower />
              </SegmentedControl.ItemText>
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>

            <SegmentedControl.Item value="/mcdu" title="MCDU" aria-label="MCDU">
              <SegmentedControl.ItemText>
                <Tablet />
              </SegmentedControl.ItemText>
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>

            <SegmentedControl.Item value="/weather" title="Weather" aria-label="Weather">
              <SegmentedControl.ItemText>
                <CloudSunRain />
              </SegmentedControl.ItemText>
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>

            <SegmentedControl.Item value="/flightplan" title="Flightplan" aria-label="Flightplan">
              <SegmentedControl.ItemText>
                <FileText />
              </SegmentedControl.ItemText>
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>

            <SegmentedControl.Item value="/checklist" title="Checklist" aria-label="Checklist">
              <SegmentedControl.ItemText>
                <ListTodo />
              </SegmentedControl.ItemText>
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>
          </SegmentedControl.Control>
        </SegmentedControl>
      </AppBar.Lead>

      <AppBar.Headline class="flex justify-center">
      </AppBar.Headline>

      <AppBar.Trail class="justify-end">
        <button
          type="button"
          class="btn btn-sm variant-ghost-surface"
          onclick={() => settingsOpen = true}
          title="Settings"
          aria-label="Open settings"
        >
          <Settings size={20} />
        </button>
      </AppBar.Trail>
    </AppBar.Toolbar>
  </AppBar>
</header>

<SettingsModal
  bind:open={settingsOpen}
  on:save={handleSave}
  on:cancel={handleCancel}
/>