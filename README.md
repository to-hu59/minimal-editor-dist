# 読書リーダー(仮)

個人用に作った ブラウザで動く読書アプリです。作りかけです。

この説明書とマニュアルの文章は すべてAIが書きました。

**[アプリを開く](https://to-hu59.github.io/minimal-editor-dist/)**

英語の説明は このページの下にあります（English is below）。

## あなたに合う使い方（利用シーン別）

使い方によって 必要な設定が変わります。自分に近いものを選んでください。

| やりたいこと | 方法 |
| --- | --- |
| まず アプリを触ってみたい | アプリのアドレスを開くと すぐ使えます。設定は要りません。はじめはサンプルの作品だけが入っています（要らなければ削除できます）。読みたい小説は自分で登録します（ファイルの取り込みや貼り付けができます）。 |
| 1台の端末で 小説を管理・編集したい | アプリのアドレスを開いて そのまま使います。小説のデータは お使いの端末のブラウザの中にある保存場所（IndexedDB。DBとも呼びます）に入ります。その端末の中だけに残ります。保存できる量は **端末とブラウザによって違います。** ときどきバックアップ（書き出し）を取ってください。ブラウザの「サイトのデータを消す」操作や 長く開かないままの期間があると 保存が消えることがあります。 |
| 複数の端末で 小説を同期したい | Googleドライブを使います。Google DriveのAPIとOAuthの設定が必要です。「Google Drive の設定」の手順書を見てください。サーバーを通していないので **約1時間ごとにつなぎ直し**が必要です。小さい窓が一瞬出て すぐ終わります。つなぎ直しを自動にするサーバーの設定は 上級者向けです（ここでは書きません）。 |
| 自分のパソコンで アプリを管理したい | アプリのファイル一式を GitHubのページからダウンロードして 自分のパソコンの中だけで動かします。「ローカルサーバー」という パソコンの中でホームページのように見せる仕組みが要ります。むずかしいので 上級者向けです。 |

最初の2つは 設定なしで使えます。

## マニュアル（日本語）

PDFはそのまま読めます。Wordはダウンロードして開きます。

- クイックスタート（画像つき）：[PDFを読む](docs/%E3%82%AF%E3%82%A4%E3%83%83%E3%82%AF%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88.pdf) / [Wordをダウンロード](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/%E3%82%AF%E3%82%A4%E3%83%83%E3%82%AF%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88.docx)
- 画面ガイド・上級編（編集・特殊な文字と演出・音読・Wiki・あらすじなど）：[PDFを読む](docs/app.pdf) / [Wordをダウンロード](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/app.docx)
- 保存・同期と注意事項（READMEの日本語版）：[PDFを読む](README.pdf) / [Wordをダウンロード](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/README.docx)
- Googleドライブの設定（かんたん版）：[PDF](docs/drive-setup-easy.pdf) / [Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/drive-setup-easy.docx)
- Googleドライブの設定（くわしい版・画像つき）：[PDF](docs/drive-setup-detail.pdf) / [Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/drive-setup-detail.docx)
- 特殊演出の書き方：[PDF](docs/effects.pdf) / [Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/effects.docx)

ヒント：Windows版のWordは 「表示」→「ナビゲーションウィンドウ」をオンにすると 見出しの一覧から読みたい所へ移れます。

Wordで2ページが横に並んで表示されるときは 「表示」→「1ページ」→「100%」の順に押してください。倍率だけ変えるのではなく **先に「1ページ」を押す**のがポイントです。縦1列で表示できます。

ブラウザの自動翻訳で この説明が読みにくいときは 上の日本語の説明か PDF・Wordのマニュアルを開いてください。

---

# Reading Reader (working title)

A browser-based reading app made for personal use. It is a work in progress.

All text in this README and the manuals was written by AI.

**[Open the app](https://to-hu59.github.io/minimal-editor-dist/)**

## Choosing how to use it

Setup depends on how you use the app. Find the row that is closest to your goal.

| Goal | How |
| --- | --- |
| Trying the app | The app opens right away. No setup is needed. At first it contains only a sample work, which can be deleted if it is not needed. Novels to read are added by the user, by importing files or pasting text. |
| Managing and editing novels on one device | The app is used as it is, from its address. Novel data is saved inside the browser, in a storage area called IndexedDB. It stays on that device only. The storage size **depends on the device and the browser.** A backup should be exported from time to time. Clearing the browser's site data, or leaving the app unopened for a long time, can erase the saved data. |
| Syncing novels across devices | Google Drive is used. This needs the Google Drive API and OAuth settings (see the Google Drive setup guide). The connection must be renewed **about once an hour**, because no server is involved. A small window appears briefly and closes. A server that renews the connection automatically is for advanced users and is not covered here. |
| Managing the app on your own PC | The app files are downloaded from the GitHub page and run only on the PC. This needs a "local server", which shows the files like a website inside the PC. It is difficult and meant for advanced users. |

The first two options need no setup.

## Features

- A bookshelf with search and organization.
- Reading display settings, and resuming where you left off.
- Text editing, OCR and ruby annotations.
- Text-to-speech. On a PC, voices such as Zundamon are available when [VOICEVOX](https://voicevox.hiroshiba.jp/) is installed and running separately, and this app's site is allowed in its settings. The browser voices that are available vary by device and browser.
- Comments, notes and wiki entries.
- Synopses for each part, volume and episode. You can paste many at once.
- A typing sound effect: marked text appears one letter at a time.
- Data backup as JSON. Google Drive sync is optional.

## Manuals

No extra setup is needed to start reading. The Google Drive guide is needed only for Drive sync.

The manuals are written in Japanese. A PDF can be read directly, and a Word file can be downloaded.

Tip: In Word for Windows, turning on View → Navigation Pane shows a heading list for browsing the manuals.

If Word shows two pages side by side, click View → One Page → 100% in that order. The key is to press One Page first, not to change only the zoom. This shows the pages in a single column.

- Quick start (with screenshots): [Read PDF](docs/%E3%82%AF%E3%82%A4%E3%83%83%E3%82%AF%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88.pdf) / [Download Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/%E3%82%AF%E3%82%A4%E3%83%83%E3%82%AF%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88.docx)
- Screens guide, advanced (editing, special text and effects, reading aloud, wiki, synopses and more): [Read PDF](docs/app.pdf) / [Download Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/app.docx)
- Saving, sync and notes (README): [Read PDF](README.pdf) / [Download Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/README.docx)
- Google Drive setup: [Quick guide PDF](docs/drive-setup-easy.pdf) / [Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/drive-setup-easy.docx)
- Google Drive setup in detail: [Illustrated PDF](docs/drive-setup-detail.pdf) / [Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/drive-setup-detail.docx)
- Special text effects: [Read PDF](docs/effects.pdf) / [Word](https://raw.githubusercontent.com/to-hu59/minimal-editor-dist/main/docs/effects.docx)

If browser translation makes this page hard to read, use the Japanese section above or open a PDF or Word manual.
