# FastMenu
Several patches to speed up the loading of the main settings menu:
- Remove the fade-zoom animation when opening it.
- Remove another animation for fading in the menu contents (why do they have two).
- Eagerly load the menu contents; without this the first time has an extra delay.
- Another lazy-loaded part is changed to load when hovering the mouse over the settings cog, rather than when clicking it.
