/* Google stub shared by the browser suites: the site is gated behind Google
 * Sign-In, so every suite has to get through the door before it can test
 * anything. `sessionStorage.gisFail` makes the next token request fail, the
 * way a lapsed session or a blocked popup does. */
const FAKE_GIS = `
  window.__gisCalls = JSON.parse(sessionStorage.getItem('gisCalls') || '[]');
  window.google = { accounts: { oauth2: {
    initTokenClient: (cfg) => ({ requestAccessToken: (o) => {
      window.__gisCalls.push(o.prompt); sessionStorage.setItem('gisCalls', JSON.stringify(window.__gisCalls));
      if (sessionStorage.getItem('gisFail')) return setTimeout(() => cfg.error_callback({ type: 'popup_failed_to_open' }), 30);
      setTimeout(() => cfg.callback({ access_token: 'tok-' + Date.now(), expires_in: 3600, scope: 'https://www.googleapis.com/auth/drive.file openid email profile' }), 50);
    } }),
    hasGrantedAllScopes: (resp, s) => String(resp.scope || '').includes(s),
    revoke: () => {},
  } } };`;

/** Routes googleapis.com to an in-memory Drive. Returns its state. */
async function stubGoogle(ctx) {
  // `hold` lets a test keep an upload in the air: set it to a promise and the
  // next PATCH waits on it, counting itself in `held` first. Without that there
  // is no way to express "she edited while the last save was still going", which
  // is the only window in which a save can be lost.
  // `folders` is name -> id and `parent` is where progress.json currently lives,
  // because the settings page can rename the folder and MOVE the file into it.
  // Modelled rather than waved through: a stub that answers every folder lookup
  // with the same id cannot tell a move that happened from one that did not.
  const drive = { folder: null, file: null, body: null, calls: [], hold: null, held: 0, folders: {}, parent: null, moves: [] };
  await ctx.route(/fonts\.g|accounts\.google\.com\/gsi/, (r) => r.abort());
  await ctx.route(/googleapis\.com/, async (r) => {
    const u = r.request().url(), m = r.request().method();
    drive.calls.push(m + ' ' + u.replace(/\?.*/, ''));
    const json = (o) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (/userinfo/.test(u)) return json({ email: 'qi@example.com', name: 'Qi Zhang' });
    if (/drive\/v3\/files\?/.test(u) && m === 'GET') {
      const q = decodeURIComponent(u);
      if (/google-apps\.folder/.test(q)) {
        const want = (q.match(/name='([^']*)'/) || [])[1];
        const id = drive.folders[want];
        return json({ files: id ? [{ id, name: want }] : [] });
      }
      // The real query is scoped to the folder, so a file that was never moved
      // is simply not there — which is the whole point of asking.
      const inParent = (q.match(/'([^']*)' in parents/) || [])[1];
      const found = drive.file && (!inParent || inParent === drive.parent);
      return json({ files: found ? [{ id: drive.file, name: 'progress.json' }] : [] });
    }
    if (/drive\/v3\/files$/.test(u) && m === 'POST') {
      const name = (JSON.parse(r.request().postData() || '{}').name) || 'Sheila ISEE Practice';
      const id = drive.folders[name] || ('folder' + (Object.keys(drive.folders).length + 1));
      drive.folders[name] = id; drive.folder = id; return json({ id });
    }
    // A resumable upload (Store.uploadLarge, for a PDF over 5 MB): the session is
    // opened with the metadata alone, Drive answers with an address in Location, and
    // the bytes go there in a PUT. Before the multipart branch, which would read
    // the metadata-only POST as a progress.json upload and clobber the record.
    if (/upload\/drive\/v3\/files\?.*uploadType=resumable/.test(u) && m === 'POST') {
      const meta = JSON.parse(r.request().postData() || '{}');
      drive.sessions = drive.sessions || {};
      const sid = 'sess' + (Object.keys(drive.sessions).length + 1);
      drive.sessions[sid] = meta;
      return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'Location', location: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=' + sid }, contentType: 'application/json', body: '{}' });
    }
    if (/upload_id=sess\d+/.test(u) && m === 'PUT') {
      const sid = (u.match(/upload_id=(sess\d+)/) || [])[1], meta = (drive.sessions || {})[sid] || {};
      drive.media = drive.media || {};
      const id = 'media' + (Object.keys(drive.media).length + 1);
      drive.media[id] = { name: meta.name, mime: meta.mimeType, size: (r.request().postDataBuffer() || Buffer.alloc(0)).length, parent: (meta.parents || [])[0] || drive.folder, resumable: true };
      return json({ id });
    }
    if (/upload\/drive\/v3\/files\?/.test(u) && m === 'POST') {
      const body = r.request().postData() || '';
      // A recording is its own file beside progress.json (lib/reading.js), sent
      // as a binary multipart whose boundary says so — postData() cannot be
      // parsed for it. Kept apart here so a test that records does not overwrite
      // the record the other checks read back, and so a reading can be fetched.
      const ct = (r.request().headers()['content-type'] || '');
      // The metadata part of a binary multipart is plain JSON, so it can be read off
      // the raw bytes: a PDF is then recorded as a PDF, not as a recording.
      let meta = { name: 'recording', mimeType: 'audio/mp4' };
      if (/boundary=learningmedia/.test(ct)) {
        try { const txt = (r.request().postDataBuffer() || Buffer.alloc(0)).toString('latin1'); meta = { ...meta, ...JSON.parse(txt.split('\r\n\r\n')[1].split('\r\n--')[0]) }; } catch { /* keep the recording default */ }
      } else meta = JSON.parse((body.split('\r\n\r\n')[1] || '{}').split('\r\n--')[0] || '{}');
      if (meta.name && meta.name !== 'progress.json') {
        drive.media = drive.media || {};
        const id = 'media' + (Object.keys(drive.media).length + 1);
        drive.media[id] = { name: meta.name, mime: meta.mimeType, size: (r.request().postDataBuffer() || Buffer.alloc(0)).length || body.length, parent: (meta.parents || [])[0] || drive.folder };
        return json({ id });
      }
      drive.file = 'file1'; drive.body = body;
      drive.parent = (meta.parents || [])[0] || drive.folder;
      return json({ id: 'file1' });
    }
    if (/drive\/v3\/files\/media\d+\?alt=media/.test(u)) {
      const id = (u.match(/files\/(media\d+)/) || [])[1], rec = (drive.media || {})[id];
      return rec ? r.fulfill({ status: 200, contentType: rec.mime || 'audio/mp4', body: 'not-really-audio' }) : r.fulfill({ status: 404, body: '{}' });
    }
    if (/upload\/drive\/v3\/files\/file1/.test(u) && m === 'PATCH') {
      if (drive.hold) { drive.held++; await drive.hold; }
      drive.body = r.request().postData(); return json({ id: 'file1' });
    }
    if (/drive\/v3\/files\/file1\?alt=media/.test(u)) return json(JSON.parse(drive.body.split('\r\n\r\n').pop().split('\r\n--')[0]));
    // Changing a file's parents: one call, no re-upload. This is how the record
    // follows a renamed folder instead of being left behind in the old one.
    if (/drive\/v3\/files\/file1\?/.test(u) && m === 'PATCH') {
      const q = new URL(u).searchParams;
      const add = q.get('addParents');
      if (add) { drive.moves.push((q.get('removeParents') || '-') + '>' + add); drive.parent = add; }
      return json({ id: 'file1', parents: [drive.parent] });
    }
    return r.fulfill({ status: 404, body: '{}' });
  });
  await ctx.addInitScript(FAKE_GIS);
  return drive;
}

/** Get through the gate: click the Google button and wait for the app shell. */
async function signIn(pg) {
  await pg.waitForSelector('[data-testid=signin-page]', { timeout: 15000 });
  await pg.click('[data-testid=signin-google]');
  await pg.waitForSelector('[data-testid=today]', { timeout: 15000 });
}

module.exports = { FAKE_GIS, stubGoogle, signIn };
