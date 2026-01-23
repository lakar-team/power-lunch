# Translation Keys to Add

## Add to English section (after hostIncoming)

```javascript
// Session Complete
"sessionComplete.title": "Session Complete!",
"sessionComplete.subtitle": "30 minutes well spent",
"sessionComplete.rateHost": "RATE YOUR HOST",
"sessionComplete.viewPlans": "View My Plans",

// No Show Host
"noShowHost.title": "Host Didn't Show?",
"noShowHost.subtitle": "We're sorry this happened. Let us make it right.",
"noShowHost.sessionDetails": "Session Details",
"noShowHost.whatHappened": "What happened?",
"noShowHost.didntArrive": "Host never arrived",
"noShowHost.wrongLocation": "Host was at wrong location",
"noShowHost.noContact": "Couldn't contact host",
"noShowHost.refundGuaranteed": "Full Refund Guaranteed",
"noShowHost.refundMessage": "You'll receive a full refund of",
"noShowHost.within24Hours": "within 24 hours",
"noShowHost.reportButton": "Report No-Show",
"noShowHost.goBack": "Go Back",
"noShowHost.pleaseWait": "Please wait at least 10 minutes",
"noShowHost.waitMessage": "You can report a no-show after waiting 10 minutes past the scheduled time. This protects both guests and hosts.",

// Create Listing
"createListing.title": "New Lunch Listing",
"createListing.save": "Save",
"createListing.theHook": "1. THE HOOK",
"createListing.addPhoto": "Add Cover Photo",
"createListing.title": "Title",
"createListing.category": "Category",
"createListing.price": "Price (¥)",
"createListing.duration": "Session Duration",
"createListing.min": "min",
"createListing.venues": "3. Meeting Options",
"createListing.weeklyPattern": "4. Weekly Pattern",
"createListing.availableSlots": "Available Time Slots",
"createListing.addSlot": "Add Slot",
"createListing.multipleSlots": "Add multiple time windows per day",
"createListing.launchButton": "Launch Listing",
"createListing.payoutMessage": "Payouts sent to your Connected Account"
```

## Add to Japanese section (after hostIncoming)

```javascript
// Session Complete
"sessionComplete.title": "セッション完了！",
"sessionComplete.subtitle": "30分の有意義な時間でした",
"sessionComplete.rateHost": "ホストを評価",
"sessionComplete.viewPlans": "予定を見る",

// No Show Host
"noShowHost.title": "ホストが来ませんでしたか？",
"noShowHost.subtitle": "申し訳ございません。対応いたします。",
"noShowHost.sessionDetails": "セッション詳細",
"noShowHost.whatHappened": "何が起こりましたか？",
"noShowHost.didntArrive": "ホストが来なかった",
"noShowHost.wrongLocation": "ホストが間違った場所にいた",
"noShowHost.noContact": "ホストと連絡が取れなかった",
"noShowHost.refundGuaranteed": "全額返金保証",
"noShowHost.refundMessage": "24時間以内に全額返金されます",
"noShowHost.within24Hours": "",
"noShowHost.reportButton": "ノーショーを報告",
"noShowHost.goBack": "戻る",
"noShowHost.pleaseWait": "少なくとも10分お待ちください",
"noShowHost.waitMessage": "予定時刻から10分経過後にノーショーを報告できます。これはゲストとホストの両方を保護するためです。",

// Create Listing
"createListing.title": "新しいランチリスティング",
"createListing.save": "保存",
"createListing.theHook": "1. 概要",
"createListing.addPhoto": "カバー写真を追加",
"createListing.title": "タイトル",
"createListing.category": "カテゴリー",
"createListing.price": "価格 (¥)",
"createListing.duration": "セッション時間",
"createListing.min": "分",
"createListing.venues": "3. ミーティングオプション",
"createListing.weeklyPattern": "4. 週間パターン",
"createListing.availableSlots": "利用可能な時間枠",
"createListing.addSlot": "時間枠を追加",
"createListing.multipleSlots": "1日に複数の時間枠を追加",
"createListing.launchButton": "リスティングを公開",
"createListing.payoutMessage": "接続されたアカウントへの支払い"
```

## HTML Files Needing data-i18n Tags

### session_complete.html
Add to these elements:
- Line ~18: `<h1>Session Complete!</h1>` → `<h1 data-i18n="sessionComplete.title">Session Complete!</h1>`
- Line ~19: `<p>30 minutes well spent</p>` → `<p data-i18n="sessionComplete.subtitle">30 minutes well spent</p>`
- Line ~23: `<p>RATE YOUR HOST</p>` → `<p data-i18n="sessionComplete.rateHost">RATE YOUR HOST</p>`
- Button: `View My Plans` → `<span data-i18n="sessionComplete.viewPlans">View My Plans</span>`

### no_show_host.html
Add to these elements:
- Title: `Host Didn't Show?` → `data-i18n="noShowHost.title"`
- All form labels and buttons

### listing.html
Add to form labels, section headers, buttons

---

## Quick Manual Addition Steps:

1. Open `translations.js`
2. Find line ~126 (after `"hostIncoming.decline"`)
3. Add comma, paste English keys
4. Find line ~249 (after Japanese `"hostIncoming.decline"`)
5. Add comma, paste Japanese keys
6. Save file
7. Refresh page and test

The translation keys are ready above! Copy-paste them into translations.js at the indicated locations.
