<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Symptom Log</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
<script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "primary": "#84C7C3",
              "background-light": "#F9F9F9",
              "background-dark": "#111813",
              "text-light-primary": "#333333",
              "text-dark-primary": "#E0E0E0",
              "text-light-secondary": "#666666",
              "text-dark-secondary": "#A0A0A0",
              "card-light": "#FFFFFF",
              "card-dark": "#1C2D23",
              "border-light": "#E0E0E0",
              "border-dark": "#2A3C31",
              "accent-light": "#F5B9A2",
              "accent-dark": "#F5B9A2",
            },
            fontFamily: {
              "display": ["Lexend", "sans-serif"]
            },
            borderRadius: {"DEFAULT": "0.5rem", "lg": "0.75rem", "xl": "1rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
        body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .pain-point {
            position: absolute;
            width: 20px;
            height: 20px;
            background-color: rgba(245, 185, 162, 0.7);
            border: 2px solid #F5B9A2;
            border-radius: 9999px;
            pointer-events: none;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark font-display">
<div class="relative flex min-h-screen w-full flex-col">
<!-- Top App Bar -->
<header class="sticky top-0 z-10 flex items-center justify-between border-b border-border-light dark:border-border-dark bg-background-light/80 dark:bg-background-dark/80 p-4 backdrop-blur-sm">
<div class="flex size-10 items-center justify-center">
<span class="material-symbols-outlined text-text-light-primary dark:text-text-dark-primary text-2xl">close</span>
</div>
<h1 class="text-lg font-bold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary">Symptom Log</h1>
<div class="flex w-10 items-center justify-end">
<p class="text-primary text-base font-bold leading-normal">History</p>
</div>
</header>
<main class="flex-1 px-4 py-6 space-y-6 pb-24">
<!-- Date & Time Section -->
<section class="flex flex-col gap-3 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<div class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
<span class="material-symbols-outlined text-2xl">calendar_month</span>
</div>
<p class="text-base font-medium text-text-light-primary dark:text-text-dark-primary">Today, 10:30 AM</p>
</div>
<span class="material-symbols-outlined text-2xl text-text-light-secondary dark:text-text-dark-secondary">expand_more</span>
</div>
</section>
<!-- Pain Location & Level Section -->
<section class="flex flex-col gap-4">
<h2 class="text-lg font-bold leading-tight text-text-light-primary dark:text-text-dark-primary">Pain Location &amp; Level</h2>
<div class="rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<div class="flex h-10 w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800 p-1 mb-4">
<label class="flex h-full flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary has-[:checked]:bg-background-light has-[:checked]:dark:bg-background-dark has-[:checked]:text-text-light-primary has-[:checked]:dark:text-text-dark-primary has-[:checked]:shadow-sm">
<span>Front</span>
<input checked="" class="invisible w-0" name="body-view" type="radio" value="Front"/>
</label>
<label class="flex h-full flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary has-[:checked]:bg-background-light has-[:checked]:dark:bg-background-dark has-[:checked]:text-text-light-primary has-[:checked]:dark:text-text-dark-primary has-[:checked]:shadow-sm">
<span>Back</span>
<input class="invisible w-0" name="body-view" type="radio" value="Back"/>
</label>
</div>
<div class="relative w-full aspect-[2/3] max-w-sm mx-auto flex items-center justify-center">
<img class="h-full w-auto object-contain" data-alt="A simple black line drawing of the front of a human body on a white background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGyul64F3__w2Xz0kOwPX6g8zw4WBW-kci7Pevs5jSL0jcUPfQYHLa-vClg-O21foETFIsi19y922FxyJf-m95cW0Zqlh-CaBWU5OtIMbhD929chpt6N6YXiCwHXHIcuYy8Nf-wXsqdLJFz1jSdZpX24Gnuo5D8MDIgtqzRoEcngfZb0oOfLz7bfvJw6sBl9yPgPLskOvISS3cq7XZkw6qtsaN63-T6jCpBdCo7T4I4Tay1MA59gXfWPgyGs0lcpZuEjBjWLBqHlqw"/>
<!-- Example pain point on abdomen -->
<div class="pain-point" style="top: 40%; left: 52%;"></div>
<!-- Example pain point on lower right pelvis -->
<div class="pain-point" style="top: 55%; left: 60%;"></div>
</div>
</div>
</section>
<!-- Expandable Pain Details Section -->
<section class="flex flex-col gap-3 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<details class="group">
<summary class="flex cursor-pointer list-none items-center justify-between">
<div class="flex items-center gap-3">
<div class="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
<span class="material-symbols-outlined text-2xl">local_fire_department</span>
</div>
<div class="flex flex-col">
<h3 class="text-base font-medium text-text-light-primary dark:text-text-dark-primary">Pain Details</h3>
<p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">Level 7, Sharp, Cramping</p>
</div>
</div>
<span class="material-symbols-outlined text-2xl text-text-light-secondary dark:text-text-dark-secondary transition-transform duration-300 group-open:rotate-180">expand_more</span>
</summary>
<div class="mt-6 space-y-6">
<div>
<label class="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2" for="pain-level">Pain Level: <span class="font-bold text-primary">7</span></label>
<input class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary" id="pain-level" max="10" min="0" type="range" value="7"/>
</div>
<div>
<label class="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2" for="pain-type">Pain Type</label>
<select class="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-primary" id="pain-type">
<option>Sharp</option>
<option>Dull</option>
<option>Cramping</option>
<option>Throbbing</option>
</select>
</div>
<div>
<label class="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2" for="pain-desc">Pain Description</label>
<textarea class="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-primary" id="pain-desc" placeholder="e.g., comes in waves, worse after eating..." rows="3"></textarea>
</div>
</div>
</details>
</section>
<!-- Other Sections as Expandable Cards -->
<section class="flex flex-col gap-3 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<details class="group">
<summary class="flex cursor-pointer list-none items-center justify-between">
<div class="flex items-center gap-3">
<div class="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
<span class="material-symbols-outlined text-2xl">self_improvement</span>
</div>
<h3 class="text-base font-medium text-text-light-primary dark:text-text-dark-primary">Bowel Movements</h3>
</div>
<span class="material-symbols-outlined text-2xl text-text-light-secondary dark:text-text-dark-secondary transition-transform duration-300 group-open:rotate-180">expand_more</span>
</summary>
<div class="mt-6 space-y-4">
<!-- Content for Bowel Movements would go here -->
<p class="text-sm text-center text-text-light-secondary dark:text-text-dark-secondary">Input fields for bowel movements will be here.</p>
</div>
</details>
</section>
<section class="flex flex-col gap-3 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<details class="group">
<summary class="flex cursor-pointer list-none items-center justify-between">
<div class="flex items-center gap-3">
<div class="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
<span class="material-symbols-outlined text-2xl">restaurant</span>
</div>
<h3 class="text-base font-medium text-text-light-primary dark:text-text-dark-primary">Eating &amp; Drinking</h3>
</div>
<span class="material-symbols-outlined text-2xl text-text-light-secondary dark:text-text-dark-secondary transition-transform duration-300 group-open:rotate-180">expand_more</span>
</summary>
<div class="mt-6 space-y-4">
<!-- Content for Eating & Drinking would go here -->
<p class="text-sm text-center text-text-light-secondary dark:text-text-dark-secondary">Input fields for eating and drinking will be here.</p>
</div>
</details>
</section>
<section class="flex flex-col gap-3 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<details class="group">
<summary class="flex cursor-pointer list-none items-center justify-between">
<div class="flex items-center gap-3">
<div class="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
<span class="material-symbols-outlined text-2xl">sentiment_stressed</span>
</div>
<h3 class="text-base font-medium text-text-light-primary dark:text-text-dark-primary">Other Symptoms</h3>
</div>
<span class="material-symbols-outlined text-2xl text-text-light-secondary dark:text-text-dark-secondary transition-transform duration-300 group-open:rotate-180">expand_more</span>
</summary>
<div class="mt-6 space-y-4">
<!-- Content for Other Symptoms would go here -->
<p class="text-sm text-center text-text-light-secondary dark:text-text-dark-secondary">Checkboxes for other symptoms will be here.</p>
</div>
</details>
</section>
<section class="flex flex-col gap-3 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<details class="group">
<summary class="flex cursor-pointer list-none items-center justify-between">
<div class="flex items-center gap-3">
<div class="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
<span class="material-symbols-outlined text-2xl">medication</span>
</div>
<h3 class="text-base font-medium text-text-light-primary dark:text-text-dark-primary">Medications &amp; Remedies</h3>
</div>
<span class="material-symbols-outlined text-2xl text-text-light-secondary dark:text-text-dark-secondary transition-transform duration-300 group-open:rotate-180">expand_more</span>
</summary>
<div class="mt-6 space-y-4">
<!-- Content for Medications & Remedies would go here -->
<p class="text-sm text-center text-text-light-secondary dark:text-text-dark-secondary">Input fields for medications will be here.</p>
</div>
</details>
</section>
<section class="flex flex-col gap-3 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm">
<details class="group">
<summary class="flex cursor-pointer list-none items-center justify-between">
<div class="flex items-center gap-3">
<div class="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
<span class="material-symbols-outlined text-2xl">edit_note</span>
</div>
<h3 class="text-base font-medium text-text-light-primary dark:text-text-dark-primary">General Notes</h3>
</div>
<span class="material-symbols-outlined text-2xl text-text-light-secondary dark:text-text-dark-secondary transition-transform duration-300 group-open:rotate-180">expand_more</span>
</summary>
<div class="mt-6 space-y-4">
<textarea class="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-primary" placeholder="Add any other relevant information..." rows="4"></textarea>
</div>
</details>
</section>
</main>
<!-- Fixed Bottom CTA Button -->
<footer class="fixed bottom-0 left-0 right-0 z-10 bg-background-light/80 dark:bg-background-dark/80 p-4 backdrop-blur-sm border-t border-border-light dark:border-border-dark">
<button class="w-full h-12 rounded-lg bg-primary text-background-dark font-bold text-base shadow-lg">Save Log</button>
</footer>
</div>
</body></html>