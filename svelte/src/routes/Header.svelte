<script lang="ts">
  import { onMount } from "svelte";
  import { AppBar, SegmentedControl } from "@skeletonlabs/skeleton-svelte";
    import { House, RadioTower, Tablet, CloudSunRain,FileText, ListTodo, Settings} from '@lucide/svelte';
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { settings } from "$lib/stores";

  // Use the page store correctly and track active path.
  let activePath = "";
  let valueSingle: string = "";

  $: activePath = $page.url.pathname;
  $: valueSingle = activePath;

  onMount(() => {
    // Update the value of valueSingle on mount
    valueSingle = activePath;

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
  $: if (typeof document !== "undefined") {
    if ($settings.appearance === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
</script>

<header>
  <AppBar>
    <!-- AppBar lead content -->
      <AppBar.Toolbar class="grid-cols-[1fr_2fr_1fr]">
      <!-- Migrate to new SegmentedControl structure -->
      <AppBar.Lead>
      <SegmentedControl value={valueSingle} onValueChange={(details: { value: string | null }) => {
        const v = details.value ?? "";
        valueSingle = v;
        if (v) goto(v); 
      }}>
        <SegmentedControl.Control>
          <SegmentedControl.Indicator />

          <SegmentedControl.Item value="/" title="Home" aria-label="Home">
            <SegmentedControl.ItemText>
              <!-- Home icon -->
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
              <!-- Flightplan icon -->
              <FileText />
            </SegmentedControl.ItemText>
            <SegmentedControl.ItemHiddenInput />
          </SegmentedControl.Item>

          <SegmentedControl.Item value="/checklist" title="Checklist" aria-label="Checklist">
            <SegmentedControl.ItemText>
              <!-- Checklist icon -->
              <ListTodo />
            </SegmentedControl.ItemText>
            <SegmentedControl.ItemHiddenInput />
          </SegmentedControl.Item>

        </SegmentedControl.Control>
      </SegmentedControl>

    </AppBar.Lead>

    <!-- AppBar trail content -->
      <AppBar.Trail class="justify-end">
      <!-- Open native dialog by ID -->
      <button type="button" class="btn-icon preset-filled" onclick={() => (document.getElementById('settingsModal') as HTMLDialogElement | null)?.showModal()} aria-label="Open Settings">
        <Settings />
      </button>
    </AppBar.Trail>
   </AppBar.Toolbar> 
  </AppBar>
</header>
