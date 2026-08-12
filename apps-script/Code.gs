const APP = Object.freeze({
  spreadsheetProperty: "MARVELMARKA_SPREADSHEET_ID",
  photoFolderProperty: "MARVELMARKA_PHOTO_FOLDER_ID",
  ownerProperty: "MARVELMARKA_OWNER_EMAIL",
  accessSheet: "Доступ",
  boardSheet: "Карта",
  logSheet: "История",
  boardId: "shared",
  maxPhotoBytes: 2500000,
});

function doGet(event) {
  if (event && event.parameter && event.parameter.asset === "client") {
    return ContentService.createTextOutput(getClientSource_())
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("Marvel Timeline Board")
    .addMetaTag("viewport", "width=device-width, initial-scale=1, viewport-fit=cover");
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getClientSource_() {
  return HtmlService.createHtmlOutputFromFile("Client").getContent()
    .replace(/^\s*<script(?:\s[^>]*)?>\s*/i, "")
    .replace(/\s*<\/script>\s*$/i, "");
}

function clientScriptUrl() {
  return ScriptApp.getService().getUrl() + "?asset=client&v=9";
}

/**
 * Запустите эту функцию один раз из редактора Apps Script под аккаунтом владельца.
 * Она создаст таблицу, папку с фотографиями и запишет их ID в свойства проекта.
 */
function setupProject() {
  const properties = PropertiesService.getScriptProperties();
  const existingSpreadsheetId = properties.getProperty(APP.spreadsheetProperty);
  if (existingSpreadsheetId) {
    const existing = SpreadsheetApp.openById(existingSpreadsheetId);
    return {
      ready: true,
      spreadsheetUrl: existing.getUrl(),
      folderUrl: DriveApp.getFolderById(properties.getProperty(APP.photoFolderProperty)).getUrl(),
      ownerEmail: properties.getProperty(APP.ownerProperty),
    };
  }

  const ownerEmail = normalizeEmail_(Session.getEffectiveUser().getEmail());
  if (!ownerEmail) throw new Error("Google не вернул email владельца. Запустите setupProject из редактора Apps Script.");

  const spreadsheet = SpreadsheetApp.create("MarvelMarka — общая карта");
  const accessSheet = spreadsheet.getSheets()[0];
  accessSheet.setName(APP.accessSheet);
  const boardSheet = spreadsheet.insertSheet(APP.boardSheet);
  const logSheet = spreadsheet.insertSheet(APP.logSheet);
  const folder = DriveApp.createFolder("MarvelMarka — фотографии карты");

  properties.setProperties({
    [APP.spreadsheetProperty]: spreadsheet.getId(),
    [APP.photoFolderProperty]: folder.getId(),
    [APP.ownerProperty]: ownerEmail,
  });

  accessSheet.getRange("A1:E1").setValues([["Email", "Имя", "Активен", "Роль", "Добавлен"]]);
  accessSheet.getRange("A2:E2").setValues([[ownerEmail, "Владелец", true, "owner", new Date()]]);
  accessSheet.getRange("C2:C100").insertCheckboxes();
  accessSheet.setFrozenRows(1);
  accessSheet.setColumnWidths(1, 1, 260);
  accessSheet.setColumnWidths(2, 1, 180);
  accessSheet.setColumnWidth(3, 90);
  accessSheet.setColumnWidth(4, 100);
  accessSheet.setColumnWidth(5, 170);
  accessSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#16a765").setFontColor("#ffffff");

  boardSheet.getRange("A1:F1").setValues([["ID", "Версия", "Просмотрено JSON", "Объекты JSON", "Обновлено", "Кем"]]);
  boardSheet.getRange("A2:F2").setValues([[APP.boardId, 1, "[]", "[]", new Date(), ownerEmail]]);
  boardSheet.setFrozenRows(1);
  boardSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#ee2737").setFontColor("#ffffff");
  boardSheet.hideSheet();

  logSheet.getRange("A1:E1").setValues([["Дата", "Email", "Действие", "Объект", "Версия"]]);
  logSheet.setFrozenRows(1);
  logSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#171c26").setFontColor("#ffffff");
  logSheet.hideSheet();

  ScriptApp.newTrigger("syncAccessOnEdit")
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();

  return {
    ready: true,
    spreadsheetUrl: spreadsheet.getUrl(),
    folderUrl: folder.getUrl(),
    ownerEmail,
  };
}

/**
 * Установленный setupProject триггер синхронизирует флажки листа «Доступ»
 * с правами Google Таблицы и папки Drive.
 */
function syncAccessOnEdit(event) {
  if (!event || event.range.getSheet().getName() !== APP.accessSheet || event.range.getRow() < 2) return;
  const ownerEmail = normalizeEmail_(PropertiesService.getScriptProperties().getProperty(APP.ownerProperty));
  const rows = accessSheet_().getDataRange().getValues().slice(1);
  const spreadsheet = spreadsheet_();
  const folder = photoFolder_();

  rows.filter((row) => row[0]).forEach((row) => {
    const email = normalizeEmail_(row[0]);
    if (!email) return;
    const active = row[2] === true;
    if (active) {
      try { spreadsheet.addEditor(email); } catch (error) { /* Некорректный или уже добавленный адрес. */ }
      try { folder.addEditor(email); } catch (error) { /* Некорректный или уже добавленный адрес. */ }
    } else if (email !== ownerEmail) {
      try { spreadsheet.removeEditor(email); } catch (error) { /* Доступ уже отозван. */ }
      try { folder.removeEditor(email); } catch (error) { /* Доступ уже отозван. */ }
    }
  });
}

function getBootstrap() {
  const email = activeEmail_();
  if (!email) return denied_("Не удалось определить Google-аккаунт. Приложение должно быть опубликовано с запуском от имени пользователя.");

  try {
    const access = assertAuthorized_(email);
    const board = readBoard_();
    return {
      authorized: true,
      user: { email, name: access.name || email.split("@")[0], role: access.role },
      board,
      access: access.role === "owner" ? readAccessList_() : [],
    };
  } catch (error) {
    return denied_(safeError_(error), email);
  }
}

function loadBoardSnapshot(knownRevision) {
  const email = activeEmail_();
  assertAuthorized_(email);
  const board = readBoard_();
  if (Number(knownRevision) === board.revision) return { unchanged: true, revision: board.revision };
  return { unchanged: false, board };
}

function mutateBoard(request) {
  const email = activeEmail_();
  assertAuthorized_(email);
  if (!request || typeof request !== "object") throw new Error("Пустое изменение карты");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const board = readBoard_();
    const action = String(request.action || "");
    let objectId = "";

    if (action === "toggleWatched") {
      const movieId = cleanId_(request.movieId);
      const watched = new Set(board.watched);
      request.watched ? watched.add(movieId) : watched.delete(movieId);
      board.watched = Array.from(watched);
      objectId = movieId;
    } else if (action === "upsertItem") {
      const item = sanitizeItem_(request.item);
      const index = board.items.findIndex((entry) => entry.id === item.id);
      if (index >= 0) board.items[index] = { ...board.items[index], ...item };
      else board.items.push(item);
      objectId = item.id;
    } else if (action === "deleteItem") {
      const itemId = cleanId_(request.itemId);
      const existing = board.items.find((entry) => entry.id === itemId);
      board.items = board.items.filter((entry) => entry.id !== itemId);
      objectId = itemId;
      if (existing && existing.type === "image" && existing.fileId) trashPhotoQuietly_(existing.fileId);
    } else if (action === "reset") {
      board.items.filter((item) => item.type === "image" && item.fileId).forEach((item) => trashPhotoQuietly_(item.fileId));
      board.items = [];
      board.watched = [];
      objectId = APP.boardId;
    } else {
      throw new Error("Неизвестное действие карты");
    }

    board.revision += 1;
    board.updatedAt = new Date().toISOString();
    board.updatedBy = email;
    writeBoard_(board);
    appendLog_(email, action, objectId, board.revision);
    return { revision: board.revision, updatedAt: board.updatedAt, updatedBy: email };
  } finally {
    lock.releaseLock();
  }
}

function uploadPhoto(request) {
  const email = activeEmail_();
  assertAuthorized_(email);
  if (!request || typeof request !== "object" || !request.item) throw new Error("Фотография не передана");

  const mimeType = String(request.mimeType || "").toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    throw new Error("Поддерживаются JPG, PNG и WEBP");
  }

  const bytes = Utilities.base64Decode(String(request.base64 || ""));
  if (!bytes.length || bytes.length > APP.maxPhotoBytes) throw new Error("Фотография должна быть меньше 2,5 МБ после обработки");

  const filename = safeFilename_(request.name || "photo", mimeType);
  const blob = Utilities.newBlob(bytes, mimeType, filename);
  const folder = photoFolder_();
  const file = folder.createFile(blob);
  file.setDescription(`MarvelMarka · ${email} · ${new Date().toISOString()}`);

  const item = sanitizeItem_({ ...request.item, type: "image", fileId: file.getId(), mimeType });
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const board = readBoard_();
    board.items = board.items.filter((entry) => entry.id !== item.id);
    board.items.push(item);
    board.revision += 1;
    board.updatedAt = new Date().toISOString();
    board.updatedBy = email;
    writeBoard_(board);
    appendLog_(email, "uploadPhoto", item.id, board.revision);
    return { item, revision: board.revision, updatedAt: board.updatedAt, updatedBy: email };
  } catch (error) {
    trashPhotoQuietly_(file.getId());
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function loadPhotos(fileIds) {
  const email = activeEmail_();
  assertAuthorized_(email);
  const ids = Array.isArray(fileIds) ? fileIds.slice(0, 30).map(cleanId_) : [];
  const folderId = photoFolder_().getId();
  return ids.map((fileId) => {
    try {
      const file = DriveApp.getFileById(fileId);
      if (!fileBelongsToFolder_(file, folderId)) return { fileId, error: true };
      const blob = file.getBlob();
      return {
        fileId,
        dataUrl: `data:${blob.getContentType()};base64,${Utilities.base64Encode(blob.getBytes())}`,
      };
    } catch (error) {
      return { fileId, error: true };
    }
  });
}

function addAuthorizedUser(request) {
  const ownerEmail = requireOwner_();
  const email = normalizeEmail_(request && request.email);
  const name = cleanText_(request && request.name, 80) || email.split("@")[0];
  if (!email || !email.includes("@")) throw new Error("Укажите корректный email Google-аккаунта");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = accessSheet_();
    const rows = sheet.getDataRange().getValues();
    const existingIndex = rows.findIndex((row, index) => index > 0 && normalizeEmail_(row[0]) === email);
    if (existingIndex >= 1) {
      sheet.getRange(existingIndex + 1, 2, 1, 4).setValues([[name, true, email === ownerEmail ? "owner" : "member", new Date()]]);
    } else {
      sheet.appendRow([email, name, true, email === ownerEmail ? "owner" : "member", new Date()]);
    }
    spreadsheet_().addEditor(email);
    photoFolder_().addEditor(email);
    appendLog_(ownerEmail, "addAccess", email, readBoard_().revision);
    return readAccessList_();
  } finally {
    lock.releaseLock();
  }
}

function removeAuthorizedUser(emailValue) {
  const ownerEmail = requireOwner_();
  const email = normalizeEmail_(emailValue);
  if (!email || email === ownerEmail) throw new Error("Доступ владельца удалить нельзя");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = accessSheet_();
    const rows = sheet.getDataRange().getValues();
    const index = rows.findIndex((row, rowIndex) => rowIndex > 0 && normalizeEmail_(row[0]) === email);
    if (index >= 1) sheet.getRange(index + 1, 3).setValue(false);
    try { spreadsheet_().removeEditor(email); } catch (error) { /* Доступ уже мог быть отозван вручную. */ }
    try { photoFolder_().removeEditor(email); } catch (error) { /* Доступ уже мог быть отозван вручную. */ }
    appendLog_(ownerEmail, "removeAccess", email, readBoard_().revision);
    return readAccessList_();
  } finally {
    lock.releaseLock();
  }
}

function getProjectLinks() {
  requireOwner_();
  return { spreadsheetUrl: spreadsheet_().getUrl(), folderUrl: photoFolder_().getUrl() };
}

function assertAuthorized_(emailValue) {
  const email = normalizeEmail_(emailValue);
  if (!email) throw new Error("Войдите в разрешённый Google-аккаунт");
  const rows = accessSheet_().getDataRange().getValues();
  const row = rows.find((entry, index) => index > 0 && normalizeEmail_(entry[0]) === email && entry[2] === true);
  if (!row) throw new Error(`У аккаунта ${email} нет доступа к этой карте`);
  return { email, name: cleanText_(row[1], 80), role: String(row[3] || "member") };
}

function requireOwner_() {
  const email = activeEmail_();
  const access = assertAuthorized_(email);
  const ownerEmail = normalizeEmail_(PropertiesService.getScriptProperties().getProperty(APP.ownerProperty));
  if (access.role !== "owner" || email !== ownerEmail) throw new Error("Управлять доступом может только владелец карты");
  return email;
}

function readAccessList_() {
  return accessSheet_().getDataRange().getValues().slice(1)
    .filter((row) => row[0])
    .map((row) => ({
      email: normalizeEmail_(row[0]),
      name: cleanText_(row[1], 80),
      active: row[2] === true,
      role: String(row[3] || "member"),
    }));
}

function readBoard_() {
  const row = boardSheet_().getRange("A2:F2").getValues()[0];
  return {
    revision: Math.max(1, Number(row[1]) || 1),
    watched: parseArray_(row[2]),
    items: parseArray_(row[3]),
    updatedAt: row[4] instanceof Date ? row[4].toISOString() : String(row[4] || ""),
    updatedBy: String(row[5] || ""),
  };
}

function writeBoard_(board) {
  boardSheet_().getRange("A2:F2").setValues([[
    APP.boardId,
    board.revision,
    JSON.stringify(board.watched || []),
    JSON.stringify(board.items || []),
    new Date(board.updatedAt || Date.now()),
    board.updatedBy || "",
  ]]);
}

function sanitizeItem_(value) {
  if (!value || typeof value !== "object") throw new Error("Некорректный объект карты");
  const type = value.type === "image" ? "image" : "text";
  const item = {
    id: cleanId_(value.id),
    type,
    x: clampNumber_(value.x, -500, 12000, 0),
    y: clampNumber_(value.y, -500, 3500, 0),
    width: clampNumber_(value.width, 80, 1400, type === "image" ? 340 : 260),
    height: clampNumber_(value.height, 60, 1800, type === "image" ? 240 : 130),
    color: cleanColor_(value.color),
  };
  if (type === "text") item.content = cleanText_(value.content, 3000) || "Новая заметка";
  if (type === "image") {
    item.fileId = cleanId_(value.fileId);
    item.mimeType = String(value.mimeType || "image/jpeg").slice(0, 40);
    item.aspectRatio = clampNumber_(value.aspectRatio, 0.05, 20, 1);
  }
  return item;
}

function appendLog_(email, action, objectId, revision) {
  try {
    logSheet_().appendRow([new Date(), email, action, objectId, revision]);
  } catch (error) {
    // История не должна мешать сохранению самой карты.
  }
}

function trashPhotoQuietly_(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    if (fileBelongsToFolder_(file, photoFolder_().getId())) file.setTrashed(true);
  } catch (error) {
    // Пользователь мог не быть владельцем файла. Объект карты всё равно удаляется.
  }
}

function fileBelongsToFolder_(file, folderId) {
  const parents = file.getParents();
  while (parents.hasNext()) if (parents.next().getId() === folderId) return true;
  return false;
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(APP.spreadsheetProperty);
  if (!id) throw new Error("Карта ещё не настроена. Владелец должен запустить setupProject().");
  return SpreadsheetApp.openById(id);
}

function photoFolder_() {
  const id = PropertiesService.getScriptProperties().getProperty(APP.photoFolderProperty);
  if (!id) throw new Error("Папка фотографий ещё не настроена");
  return DriveApp.getFolderById(id);
}

function accessSheet_() { return spreadsheet_().getSheetByName(APP.accessSheet); }
function boardSheet_() { return spreadsheet_().getSheetByName(APP.boardSheet); }
function logSheet_() { return spreadsheet_().getSheetByName(APP.logSheet); }

function activeEmail_() {
  return normalizeEmail_(Session.getActiveUser().getEmail());
}

function denied_(reason, email) {
  return { authorized: false, email: email || "", reason: reason || "Доступ запрещён" };
}

function parseArray_(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function normalizeEmail_(value) { return String(value || "").trim().toLowerCase(); }
function cleanText_(value, limit) { return String(value || "").replace(/[<>]/g, "").trim().slice(0, limit); }
function cleanId_(value) {
  const id = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 160);
  if (!id) throw new Error("Некорректный идентификатор");
  return id;
}
function cleanColor_(value) { return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value) : "#ffe66d"; }
function clampNumber_(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
function safeFilename_(name, mimeType) {
  const base = String(name || "photo").replace(/[^a-zA-Zа-яА-ЯёЁ0-9._ -]/g, "_").slice(0, 90) || "photo";
  const extension = mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
  return base.toLowerCase().endsWith(extension) ? base : `${base}${extension}`;
}
function safeError_(error) {
  const message = error && error.message ? error.message : String(error || "Доступ запрещён");
  if (/permission|access|доступ|разреш/i.test(message)) return "У этого Google-аккаунта нет доступа к общей карте";
  return message.slice(0, 300);
}
