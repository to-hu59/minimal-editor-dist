# Reading Reader (working title)

A browser-based reading app made for personal use. It is a work in progress.

All text in this README and the manuals was written by AI.

**[Open the app](https://to-hu59.github.io/minimal-editor-dist/)**

## Which way suits you? (by use case)

Pick the one closest to what you want. Only the third needs setup.

| I want to... | Do this |
| --- | --- |
| Try the app first | Open the app address and use it right away. No setup. Only a sample work is in it at first (you can delete it if you don't need it). Add the novels you want to read yourself (import files or paste text). |
| Manage and edit novels on one device | Open the app address and use it as is. Your novel data is saved inside your browser, in a storage area called IndexedDB (also called the DB). It stays on that device only. The amount you can store **depends on the device and browser.** Export a backup from time to time. Clearing the browser's site data, or not opening the app for a long time, can erase the saved data. |
| Sync novels across several devices | Use Google Drive. You need to set up the Google Drive API and OAuth (see the "Google Drive setup" guide). Because no server is involved, you must **reconnect about once an hour.** A small window appears briefly and closes. Setting up a server to automate the reconnecting is for advanced users (not covered here). |
| Manage the app on my own PC | Download the app's files from the GitHub page and run them only on your own PC. You need a "local server", which makes the files appear like a website inside your PC. This is difficult, so it is for advanced users. |

The first two work without any setup.

## What you can do

- Add books to your bookshelf, then search and organize them.
- Adjust the reading display and continue where you left off.
- Edit text and use OCR and ruby annotations.
- Listen with text-to-speech. On PC, use voices such as Zundamon by installing and running [VOICEVOX](https://voicevox.hiroshiba.jp/) separately and allowing this app’s site in its settings. Available browser voices vary by device and browser.
- Keep comments, notes, and wiki entries.
- Back up your data as JSON. Google Drive sync is optional.

## Learn more

**No extra setup is needed to start reading.** Follow the Google Drive guide only if you want to use Drive sync.

The manuals below are in Japanese. Open a PDF to read it, or download a Word file.

Tip: In Word for Windows, turn on View → Navigation Pane to browse the manuals more easily using the heading list.

- Quick start (with screenshots): [Read PDF](docs/start.pdf) / [Download Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/start.docx)
- Screens guide, advanced (editing, special text and effects, reading aloud, wiki and more): [Read PDF](docs/app.pdf) / [Download Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/app.docx)
- Saving, sync and notes (README): [Read PDF](README.pdf) / [Download Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/README.docx)
- Google Drive setup: [Quick guide PDF](docs/drive-setup-easy.pdf) / [Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/drive-setup-easy.docx)
- Google Drive setup in detail: [Illustrated PDF](docs/drive-setup-detail.pdf) / [Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/drive-setup-detail.docx)
- Special text effects: [Read PDF](docs/effects.pdf) / [Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/effects.docx)

If browser translation makes the instructions hard to read, open the PDF or Word manual instead. 

