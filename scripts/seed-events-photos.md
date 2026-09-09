# Seeding the existing 16 event photos into Firestore

Once the live Firebase project exists and `assets/js/firebase-config.js` has real
values, the Events page will render an empty gallery until photos exist in the
`photos` collection. Two ways to seed the original 16 photos so launch doesn't
show an empty page:

**Option A — fastest:** open `admin.html`, sign in, and re-upload the 16 source
images from `assets/img/pilotos/`, `assets/img/afterhours/interior/`, and
`assets/img/afterhours/food/` (the ones that used to be hardcoded in
`portfolio.html`) through the normal upload form, picking the matching category
for each. The tool handles resizing/compression the same way it will for any
future upload.

**Option B — scripted:** write a one-off Node script using the `firebase-admin`
SDK and a service account key to bulk-upload the same 16 files (full-size +
thumbnail already exist as pre-resized files in this repo's
`assets/img/*/thumbs/` folders, so this script could reuse the thumbs directly
instead of re-compressing) and write matching Firestore docs. Not written yet —
do this only if Option A proves too slow for 16 images.
