# Reading Order — Zotero Plugin

A minimal plugin for Zotero 7/8/9 that adds a **Reading Order** column to the items list, letting you assign and display a numeric reading priority for your papers.

## Features

- Adds a **Reading Order** column to the Zotero item list (enable via right-click on column headers)
- Right-click any item → **Set Reading Order…** to assign a value
- Supports bulk assignment: select multiple items, right-click, set the same value for all
- Data stored in each item's **Extra** field as `readingOrder: 01`, so it syncs with Zotero and is never lost
- Fully compatible with Zotero 7, 8, and 9

## Installation

1. Download `reading-order.xpi` from the [releases page](../../releases)
2. In Zotero: **Tools → Add-ons → gear icon → Install Add-on From File…**
3. Select the `.xpi` file and restart Zotero
4. Right-click any column header → enable **Reading Order**

## Usage

### Setting order via right-click menu
Right-click one or more items → **Set Reading Order…** → enter a number (e.g. `01`, `02`, `03`)

### Setting order in bulk via JavaScript
Open **Tools → Developer → Run JavaScript** and paste:

```javascript
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
Use `01`, `02`, `03`… instead of `1`, `2`, `3`… so the column sorts correctly when you have 10 or more items.

## How data is stored

Values are stored as a line in each item's **Extra** field:
```
readingOrder: 01
```
This means the data is part of your Zotero library, syncs via Zotero Sync, and is preserved if you export/import your library.

## Compatibility

| Zotero version | Status |
|---|---|
| 7.x | ✅ |
| 8.x | ✅ |
| 9.x | ✅ (tested on 9.0.2, Linux Flatpak) |

