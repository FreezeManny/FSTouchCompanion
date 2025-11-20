<script lang="ts">
  import { onMount } from "svelte";
  import { AppBar, SegmentedControl } from "@skeletonlabs/skeleton-svelte";
    import { House, RadioTower, Tablet, CloudSunRain,FileText, ListTodo} from '@lucide/svelte';
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
        if (v) goto(v); // only navigate when a string is present
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>
    </AppBar.Trail>
   </AppBar.Toolbar> 
  </AppBar>
</header>
