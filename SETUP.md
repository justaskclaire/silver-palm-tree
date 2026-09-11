# Setting up the cruise hub

Two pieces: a **Google Sheet** that stores everyone's answers, and a **GitHub Pages site** that everybody opens. Budget about 15 minutes. No accounts to create beyond the GitHub one.

Do Part 1 first — Part 2 needs the URL it gives you.

---

## Part 1 — The Google Sheet (about 8 minutes)

**1. Make the spreadsheet.**
Go to [sheets.new](https://sheets.new). Name it something you'll recognize later, like `Cruise Hub Data`.

**2. Open the script editor.**
In that spreadsheet: **Extensions → Apps Script**. A new tab opens with a file called `Code.gs` containing a stub `myFunction`.

**3. Paste the code.**
Select everything in that editor and delete it. Open `Code.gs` from the files I sent you, copy the whole thing, and paste it in. Click the save icon (💾).

**4. Create the tabs.**
In the toolbar, the function dropdown probably says `doGet`. Change it to **`setUp`** and click **Run**.

Google will ask for permission the first time:
- Click **Review permissions** → pick your Google account
- You'll see "Google hasn't verified this app." Click **Advanced** → **Go to Untitled project (unsafe)**
- Click **Allow**

That warning is expected — it's your own script, and it only touches the spreadsheet it's attached to. When it finishes you'll get a popup saying four tabs are ready. Flip back to the spreadsheet and you'll see **Picks**, **Bookings**, **Requests**, and **Todos**.

**5. Deploy it as a web app.**
Back in the Apps Script tab: **Deploy → New deployment**.

- Click the gear icon next to "Select type" and choose **Web app**
- **Description:** anything, e.g. `Cruise hub`
- **Execute as:** **Me (your email)** ← must be this
- **Who has access:** **Anyone** ← must be this, and it's the one people get wrong. Not "Anyone with Google account." Just **Anyone**.
- Click **Deploy**, approve if asked

**6. Copy the URL.**
You'll get a **Web app URL** ending in `/exec`. It looks like:

```
https://script.google.com/macros/s/AKfycbzlsvCtDlCipxmui8d941n4O8AHjv7Zx-JVl3vSSpB-usEDisKzFS1p_xIulM0eQrUT/exec
```


Copy it. That's the only thing you need from this part.

> ⚠️ "Anyone" means anyone who has that URL can read and write the sheet. It's a random unguessable string, so in practice it's as private as the link itself — the same bargain as an unlisted Google Doc. Fine for five family members. Don't put anything in the sheet you'd mind a stranger seeing if the link leaked.

---

## Part 2 — The website (about 5 minutes)

**1. Add your URL to the page.**
Open `index.html` in any text editor. Near the top of the `<script>` block, maybe 80% of the way down the file, find:

```js
var API_URL = "";
```

Paste your URL between the quotes:

```js
var API_URL = "https://script.google.com/macros/s/AKfycb.....CDE/exec";
```

Save it.

**2. Make a GitHub repo.**
Go to [github.com/new](https://github.com/new).
- **Name:** whatever you like, e.g. `cruise`
- **Public** (Pages needs this on free accounts)
- Check **Add a README file**
- **Create repository**

**3. Upload the page.**
In the repo: **Add file → Upload files**. Drag in your edited `index.html`. Click **Commit changes**.

**4. Turn on Pages.**
**Settings → Pages** (left sidebar).
- **Source:** Deploy from a branch
- **Branch:** `main`, folder `/ (root)`
- **Save**

Wait 1–2 minutes, then refresh that page. It'll show your live URL:

```
https://<your-username>.github.io/cruise/
```

**5. Test it.**
Open that link on your phone. You should see the page with **no red banner** at the top. Tap your name, pick a pillow, hit save. Then go look at the **Picks** tab in your spreadsheet — your row should be there.

If the red banner is still showing, jump to Troubleshooting.

**6. Send it.**
Text the family the link. Tell them to tap their name once and bookmark it — the page remembers who they are after that.

---

## Making changes later

**To edit page content** (add a date, fix a restaurant, change the dress code): edit `index.html` on GitHub — click the file, click the pencil icon, make the change, commit. The live site updates in about a minute.

Some things are easy to find near the top of the `<script>` block:

| What | Look for |
|---|---|
| Add another important date | `var DEADLINES = [` — copy an existing entry |
| Change a dinner | `var NIGHTS = [` |
| Add a restaurant to the "change it to" dropdown | `var ALTERNATES = [` |
| Change port times | `var DAYS = [` |
| Add or remove a person | `var GUESTS = [` |

**To fix someone's answer**: just edit the cell in the spreadsheet. The page picks it up on the next refresh. Don't rename the header row or the tabs.

**To clear a test entry**: delete that row in the spreadsheet.

---

## Troubleshooting

**Red banner: "Can't reach the spreadsheet."**
Almost always the deployment access setting. Apps Script → **Deploy → Manage deployments** → pencil icon → confirm **Who has access: Anyone** and **Execute as: Me**. If you change it, you must click **Deploy** again to publish a new version.

**Red banner: "Not connected yet."**
`API_URL` is still empty in `index.html`, or the quotes got mangled when you pasted. It must be a plain URL between plain double quotes, ending in `/exec` — not `/dev`.

**Changes save but nobody else sees them.**
They need to pull down to refresh, or tap **Refresh** at the bottom of the page. The page also re-checks whenever you switch back to the tab. It isn't instant-syncing by design — that would have meant a Firebase account.

**GitHub Pages shows a 404.**
Give it another few minutes on first setup. Make sure the file is named exactly `index.html` and sits at the repo root, not in a folder.

**Someone's name doesn't stick.**
They're probably in private browsing. The page stores their name in their browser; private windows throw it away on close. It still works, they just have to tap their name each visit.
