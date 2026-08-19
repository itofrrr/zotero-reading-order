# Reading Order — Zotero Plugin

A minimal plugin for Zotero 7/8/9/10 that adds an **Order** column to the items list, letting you assign and display a numeric reading priority for your papers.

## Features

- Adds an **Order** column to the Zotero item list (enable via right-click on column headers)
- Right-click any item → **Set Reading Order…** to assign a value manually
- Right-click a selection → **Auto-Number Reading Order (list order)** to instantly number every selected item `01`, `02`, `03`… in the order they currently appear in the list — no typing numbers by hand
- Supports bulk assignment: select multiple items, right-click, set the same value for all
- Data stored in each item's **Extra** field as `readingOrder: 01`, so it syncs with Zotero and is never lost
- Undo/redo support for reading order edits (Zotero 10+)
- Auto-updates: once installed, new versions are offered automatically via Zotero's built-in update check
- Fully compatible with Zotero 7, 8, 9, and 10

## Installation

1. Download `reading-order.xpi` from the [releases page](https://github.com/itofrrr/zotero-reading-order/releases)
2. In Zotero: **Tools → Add-ons → gear icon → Install Add-on From File…**
3. Select the `.xpi` file and restart Zotero
4. Right-click any column header → enable **Order**

## Usage

### Setting order for one or a few items

Right-click one or more items → **Set Reading Order…** → enter a number (e.g. `01`, `02`, `03`)

### Auto-numbering a whole selection at once

1. Sort your items list however you like (by date, title, custom sort — whatever reflects your intended reading order)
2. Select the range you want numbered (Shift+click for a contiguous range, or Ctrl/Cmd+click to build a custom selection)
3. Right-click → **Auto-Number Reading Order (list order)**
4. Confirm the prompt

The plugin numbers the selected items `01`, `02`, `03`… in the order they're currently displayed in the list, top to bottom — not the order you clicked them, which Zotero doesn't reliably preserve. Sorting the list first is the way to control the resulting order.

### Setting order in bulk via JavaScript

For more complex matching logic (e.g. by author/year/title keyword) than a simple selection allows, open **Tools → Developer → Run JavaScript** and paste:

```js
const orders = [
  ["Author", "Year", "keyword in title", "01"],
  // add more rows...
];

const items = await Zotero.Items.getAll(Zotero.Libraries.userLibraryID);
let matched = 0, skipped = 0;

for (const [author, year, keyword, order] of orders) {
  const hit = items.find(item => {
    if (!item.isRegularItem()) return false;
    const title = (item.getField("title") || "").toLowerCase();
    const itemYear = String(item.getField("year") || "");
    const creators = item.getCreators();
    const firstAuthor = creators.length ? (creators[0].lastName || "") : "";
    return firstAuthor.toLowerCase().includes(author.toLowerCase())
      && itemYear === year
      && title.includes(keyword.toLowerCase());
  });
  if (!hit) { skipped++; continue; }
  const extra = hit.getField("extra") || "";
  const lines = extra.split("\n").filter(l => !l.toLowerCase().startsWith("readingorder:"));
  lines.unshift("readingOrder: " + order);
  hit.setField("extra", lines.join("\n").trim());
  await hit.saveTx();
  matched++;
}

return `Done: ${matched} matched, ${skipped} not found.`;
```

### Tip: use zero-padded numbers

Use `01`, `02`, `03`… instead of `1`, `2`, `3`… so the column sorts correctly when you have 10 or more items. (The Auto-Number feature does this automatically.)

## How data is stored

Values are stored as a line in each item's **Extra** field:

```
readingOrder: 01
```

This means the data is part of your Zotero library, syncs via Zotero Sync, and is preserved if you export/import your library.

## Updates

The plugin checks for updates automatically through Zotero's standard update mechanism (**Tools → Add-ons → gear icon → Check for Updates**). No manual reinstall needed for future releases.

## Compatibility

| Zotero version | Status                             |
| --------------- | ----------------------------------- |
| 7.x             | ✅                                   |
| 8.x             | ✅                                   |
| 9.x             | ✅ (tested on 9.0.2, Linux Flatpak) |
| 10.x            | ✅ (tested on 10.0, Linux Flatpak)  |
