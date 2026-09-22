import type { WorkspaceFiles } from "@/lib/course";

/*
 * The one safe preview builder.
 *
 * The learner's own code runs inside an iframe that carries sandbox="allow-scripts"
 * and nothing else. Closing tags are neutralised before the files are joined, so a
 * string inside the learner's JavaScript or CSS cannot break out of the document,
 * and the storage bridge keeps each preview's data to itself.
 *
 * Used by the lesson editor, the project page and the portfolio's version view, so
 * there is a single definition of how a preview is built.
 */

export type PreviewStorage = Record<string, string>;

export function buildPreview(source: WorkspaceFiles, storedValues: PreviewStorage = {}): string {
  const css = source.css.replace(/<\/style/gi, "<\\/style");
  const script = source.javascript.replace(/<\/script/gi, "<\\/script");
  const initialStorage = JSON.stringify(storedValues).replace(/</g, "\\u003c");
  const previewBridge = `
    (function () {
      var memory = ${initialStorage};
      var storage = {
        getItem: function (key) { return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null; },
        setItem: function (key, value) {
          memory[String(key)] = String(value);
          report("storage", JSON.stringify({ operation: "set", key: String(key), value: String(value) }));
        },
        removeItem: function (key) {
          delete memory[String(key)];
          report("storage", JSON.stringify({ operation: "remove", key: String(key) }));
        },
        clear: function () {
          memory = {};
          report("storage", JSON.stringify({ operation: "clear" }));
        },
        key: function (index) { return Object.keys(memory)[index] || null; }
      };
      Object.defineProperty(storage, "length", { get: function () { return Object.keys(memory).length; } });
      try { Object.defineProperty(window, "localStorage", { configurable: true, value: storage }); } catch (error) {}
      function report(kind, value) {
        window.parent.postMessage({ source: "kidycode-preview", kind: kind, value: String(value || "Unknown error") }, "*");
      }
      window.addEventListener("error", function (event) { report("error", event.message); });
      window.addEventListener("unhandledrejection", function (event) {
        report("error", event.reason && event.reason.message ? event.reason.message : event.reason);
      });
      var originalError = console.error.bind(console);
      console.error = function () {
        originalError.apply(console, arguments);
        report("error", Array.prototype.map.call(arguments, String).join(" "));
      };
      window.__kidycodeReport = report;
    }());`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;padding:1rem;color:#111936}img{max-width:100%;height:auto}${css}</style></head><body>${source.html}<script>${previewBridge.replace(/<\/script/gi, "<\\/script")}</script><script>try {${script}\n} catch (error) { window.__kidycodeReport("error", error && error.message ? error.message : error); }</script></body></html>`;
}

