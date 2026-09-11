/**
 * Backend for the Christmas Cruise hub.
 *
 * Stores everything in the spreadsheet this script is attached to.
 * Four tabs get created automatically the first time it runs:
 *   Picks, Bookings, Requests, Todos
 *
 * You can open the spreadsheet and edit any cell by hand. The page sends
 * one small change at a time (not the whole file), so your manual edits
 * to other rows are safe.
 */

var SHEETS = {
  Picks:    ['person', 'pillow', 'drink1', 'drink2', 'namaVote', 'updated'],
  Bookings: ['id', 'person', 'day', 'title', 'time', 'notes', 'created'],
  Requests: ['id', 'person', 'night', 'changeTo', 'note', 'created'],
  Todos:    ['id', 'task', 'assignee', 'due', 'done', 'addedBy', 'created']
};

/* ── Entry points ─────────────────────────────────────────── */

function doGet() {
  return json({ ok: true, data: readAll() });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (err) {
    return json({ ok: false, error: 'busy' });
  }
  try {
    var msg = JSON.parse(e.postData.contents);
    apply(msg);
    return json({ ok: true, data: readAll() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Sheet plumbing ───────────────────────────────────────── */

function sheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(SHEETS[name]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, SHEETS[name].length).setFontWeight('bold');
  }
  return sh;
}

function rows(name) {
  var sh = sheet(name);
  var cols = SHEETS[name];
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, cols.length).getValues();
  return values
    .filter(function (r) { return String(r[0]).trim() !== ''; })
    .map(function (r) {
      var o = {};
      cols.forEach(function (c, i) { o[c] = r[i]; });
      return o;
    });
}

function rowIndexById(name, id) {
  var sh = sheet(name);
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function appendRow(name, obj) {
  var sh = sheet(name);
  sh.appendRow(SHEETS[name].map(function (c) {
    return obj[c] === undefined || obj[c] === null ? '' : obj[c];
  }));
}

function deleteById(name, id) {
  var r = rowIndexById(name, id);
  if (r > 0) sheet(name).deleteRow(r);
}

function now() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
}

/* ── Read ─────────────────────────────────────────────────── */

function readAll() {
  var picks = {};
  rows('Picks').forEach(function (r) {
    var drinks = [];
    if (r.drink1) drinks.push(String(r.drink1));
    if (r.drink2) drinks.push(String(r.drink2));
    picks[String(r.person)] = {
      pillow: r.pillow ? String(r.pillow) : null,
      drinks: drinks,
      nama: r.namaVote ? String(r.namaVote) : null,
      updated: r.updated ? String(r.updated) : null
    };
  });

  return {
    picks: picks,
    bookings: rows('Bookings').map(function (r) {
      return {
        id: String(r.id), person: String(r.person), day: Number(r.day) || 1,
        title: String(r.title), time: String(r.time || ''), notes: String(r.notes || '')
      };
    }),
    requests: rows('Requests').map(function (r) {
      return {
        id: String(r.id), person: String(r.person), night: String(r.night),
        changeTo: String(r.changeTo), note: String(r.note || '')
      };
    }),
    todos: rows('Todos').map(function (r) {
      return {
        id: String(r.id), task: String(r.task), assignee: String(r.assignee || ''),
        due: String(r.due || ''), done: r.done === true || String(r.done).toLowerCase() === 'true',
        addedBy: String(r.addedBy || '')
      };
    })
  };
}

/* ── Write ────────────────────────────────────────────────── */

function apply(msg) {
  var op = msg.op;

  if (op === 'setPicks') {
    var sh = sheet('Picks');
    var d = msg.drinks || [];
    var row = [
      msg.person,
      msg.pillow || '',
      d[0] || '',
      d[1] || '',
      msg.nama || '',
      now()
    ];
    var at = rowIndexById('Picks', msg.person);
    if (at > 0) sh.getRange(at, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

  } else if (op === 'addBooking') {
    appendRow('Bookings', {
      id: msg.id, person: msg.person, day: msg.day, title: msg.title,
      time: msg.time || '', notes: msg.notes || '', created: now()
    });

  } else if (op === 'delBooking') {
    deleteById('Bookings', msg.id);

  } else if (op === 'addRequest') {
    appendRow('Requests', {
      id: msg.id, person: msg.person, night: msg.night,
      changeTo: msg.changeTo, note: msg.note || '', created: now()
    });

  } else if (op === 'delRequest') {
    deleteById('Requests', msg.id);

  } else if (op === 'addTodo') {
    appendRow('Todos', {
      id: msg.id, task: msg.task, assignee: msg.assignee || '',
      due: msg.due || '', done: false, addedBy: msg.addedBy || '', created: now()
    });

  } else if (op === 'toggleTodo') {
    var tr = rowIndexById('Todos', msg.id);
    if (tr > 0) sheet('Todos').getRange(tr, 5).setValue(msg.done === true);

  } else if (op === 'delTodo') {
    deleteById('Todos', msg.id);

  } else {
    throw new Error('Unknown operation: ' + op);
  }
}

/* ── Run this once from the editor to create the tabs ─────── */

function setUp() {
  Object.keys(SHEETS).forEach(function (n) { sheet(n); });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var first = ss.getSheets()[0];
  if (first.getName() === 'Sheet1' && first.getLastRow() === 0) ss.deleteSheet(first);
  SpreadsheetApp.flush();

  // Logged, not popped up: a UI alert opens on the SPREADSHEET tab, which
  // blocks the run for anyone watching the script editor instead.
  Logger.log('Done. Four tabs are ready: Picks, Bookings, Requests, Todos.');
}
