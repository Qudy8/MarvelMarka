import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "apps-script");
const port = Number(process.argv[2] || 4174);

const mock = `
const previewBoard = { revision: 4, watched: ["iron-man", "avengers"], items: [
  { id: "preview-note", type: "text", x: 900, y: 270, width: 260, height: 130, content: "Общая заметка", color: "#ffe66d" }
], updatedAt: new Date().toISOString(), updatedBy: "owner@gmail.com" };
const previewAccess = [
  { email: "owner@gmail.com", name: "Владелец", active: true, role: "owner" },
  { email: "friend@gmail.com", name: "Друг", active: true, role: "member" }
];
window.google = { script: { run: new Proxy({}, {
  get(target, key) {
    if (key === "withSuccessHandler") return (handler) => { target.success = handler; return window.google.script.run; };
    if (key === "withFailureHandler") return (handler) => { target.failure = handler; return window.google.script.run; };
    return (...args) => {
      if (key === "mutateBoard" && args[0]) {
        const request = args[0];
        if (request.action === "upsertItem") {
          const index = previewBoard.items.findIndex((item) => item.id === request.item.id);
          if (index >= 0) previewBoard.items[index] = { ...previewBoard.items[index], ...request.item };
          else previewBoard.items.push(request.item);
        }
      }
      const uploadedItem = key === "uploadPhoto" && args[0] ? { ...args[0].item, fileId: "preview-photo", mimeType: args[0].mimeType } : null;
      const responses = {
        getBootstrap: { authorized: true, user: { email: "owner@gmail.com", name: "Владелец", role: "owner" }, board: previewBoard, access: previewAccess },
        loadBoardSnapshot: { unchanged: true, revision: previewBoard.revision },
        mutateBoard: { revision: previewBoard.revision + 1, updatedAt: new Date().toISOString(), updatedBy: "owner@gmail.com" },
        uploadPhoto: { item: uploadedItem, revision: previewBoard.revision + 1, updatedAt: new Date().toISOString(), updatedBy: "owner@gmail.com" },
        addAuthorizedUser: previewAccess,
        removeAuthorizedUser: previewAccess,
        getProjectLinks: { spreadsheetUrl: "https://docs.google.com/spreadsheets/" },
        loadPhotos: []
      };
      if (key === "mutateBoard" || key === "uploadPhoto") previewBoard.revision += 1;
      setTimeout(() => target.success && target.success(responses[key]), 80);
    };
  }
}) } };
`;

async function render() {
  let html = await readFile(path.join(root, "Index.html"), "utf8");
  const styles = await readFile(path.join(root, "Styles.html"), "utf8");
  const client = await readFile(path.resolve(root, "..", "public", "apps-script-client.js"), "utf8");
  html = html.replace("<?!= include('Styles'); ?>", styles);
  html = html.replace(
    '<script src="https://cdn.jsdelivr.net/gh/Qudy8/MarvelMarka@dba5cfcf2ffbb333cfe851b2e991cc3d9d94d8c3/public/apps-script-client.js"></script>',
    `<script>${mock}${client}</script>`
  );
  return html;
}

http.createServer(async (request, response) => {
  if (request.url !== "/") {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(await render());
}).listen(port, "127.0.0.1", () => console.log(`Apps Script preview: http://127.0.0.1:${port}`));
