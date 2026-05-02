// Reading Order Plugin — single file, no external script loading
var ReadingOrderPlugin;

const FIELD_PREFIX = "readingOrder: ";
const PLUGIN_ID    = "reading-order@ifp.dev";
const MENUITEM_ID  = "reading-order-menuitem";
const SEP_ID       = "reading-order-sep";

function startup({ id, version, rootURI }, reason) {
  Zotero.debug("[ReadingOrder] startup called");
  ReadingOrderPlugin = {
    initialized: false,

    init() {
      if (this.initialized) return;
      this.initialized = true;
      Zotero.debug("[ReadingOrder] init running");
      this._registerColumn();
    },

    async _registerColumn() {
      try {
        await Zotero.ItemTreeManager.registerColumn({
          dataKey:      "readingOrder",
          label:        "Reading Order",
          pluginID:     PLUGIN_ID,
          dataProvider: (item) => {
            const extra = item.getField("extra") || "";
            for (const line of extra.split("\n")) {
              if (line.toLowerCase().startsWith("readingorder: ")) {
                return line.split(": ")[1].trim();
              }
            }
            return "";
          },
          width:    "70",
          minWidth: "40",
        });
        Zotero.debug("[ReadingOrder] column registered OK");
      } catch(e) {
        Zotero.debug("[ReadingOrder] registerColumn error: " + e);
      }
    },

    addToAllWindows() {
      for (const win of Zotero.getMainWindows()) {
        if (!win.ZoteroPane) continue;
        this.addToWindow(win);
      }
    },

    addToWindow(win) {
      const doc = win.document;
      if (!doc || doc.getElementById(MENUITEM_ID)) return;
      const menu = doc.getElementById("zotero-itemmenu");
      if (!menu) return;
      const sep = doc.createXULElement("menuseparator");
      sep.id = SEP_ID;
      menu.appendChild(sep);
      const item = doc.createXULElement("menuitem");
      item.id = MENUITEM_ID;
      item.setAttribute("label", "Set Reading Order…");
      item.addEventListener("command", () => this._promptSetOrder(win));
      menu.appendChild(item);
    },

    removeFromAllWindows() {
      for (const win of Zotero.getMainWindows()) {
        if (!win.ZoteroPane) continue;
        this.removeFromWindow(win);
      }
    },

    removeFromWindow(win) {
      const doc = win.document;
      if (!doc) return;
      doc.getElementById(MENUITEM_ID)?.remove();
      doc.getElementById(SEP_ID)?.remove();
    },

    _getOrder(item) {
      const extra = item.getField("extra") || "";
      for (const line of extra.split("\n")) {
        if (line.toLowerCase().startsWith(FIELD_PREFIX.toLowerCase())) {
          return line.slice(FIELD_PREFIX.length).trim();
        }
      }
      return null;
    },

    async _setOrder(item, value) {
      const lines = (item.getField("extra") || "").split("\n");
      const filtered = lines.filter(
        l => !l.toLowerCase().startsWith(FIELD_PREFIX.toLowerCase())
      );
      if (value !== "") filtered.unshift(FIELD_PREFIX + value);
      item.setField("extra", filtered.join("\n").trim());
      await item.saveTx();
    },

    async _promptSetOrder(win) {
      const items = Zotero.getActiveZoteroPane().getSelectedItems();
      if (!items.length) return;
      const current = items.length === 1 ? (this._getOrder(items[0]) ?? "") : "";
      const result  = { value: current };
      const label   = items.length === 1
        ? `Enter reading order for:\n"${items[0].getField("title") || "selected item"}"`
        : `Enter reading order for ${items.length} selected items:`;
      const ok = Services.prompt.prompt(win, "Set Reading Order", label, result, null, {});
      if (!ok) return;
      for (const item of items) {
        await this._setOrder(item, result.value.trim());
      }
      Zotero.getActiveZoteroPane().itemsView.refreshAndMaintainSelection();
    },
  };

  ReadingOrderPlugin.init();
  ReadingOrderPlugin.addToAllWindows();
  Zotero.debug("[ReadingOrder] startup complete, initialized=" + ReadingOrderPlugin.initialized);
}

function shutdown({ id, version, rootURI }, reason) {
  if (ReadingOrderPlugin) {
    ReadingOrderPlugin.removeFromAllWindows();
    ReadingOrderPlugin = undefined;
  }
}

function install(data, reason) {}
function uninstall(data, reason) {}

function onMainWindowLoad({ window }, reason) {
  if (ReadingOrderPlugin) ReadingOrderPlugin.addToWindow(window);
}

function onMainWindowUnload({ window }, reason) {
  if (ReadingOrderPlugin) ReadingOrderPlugin.removeFromWindow(window);
}
