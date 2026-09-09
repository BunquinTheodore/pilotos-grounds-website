import { db, auth } from "./firebase-config.js";
import {
  collection, query, orderBy, getDocs, addDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Images are hosted on Cloudinary's free tier (no Firebase Storage — that
// now requires the paid Blaze plan to provision a bucket at all). Uploads go
// through an "unsigned" preset since there's no backend to sign requests;
// the preset itself is locked down (folder-scoped, image-only, size-capped)
// on the Cloudinary side to limit what it can be used for.
const CLOUDINARY_CLOUD_NAME = "dtzxxwzpj";
const CLOUDINARY_UPLOAD_PRESET = "pilotos_events_unsigned";
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/image/upload";

const FULL_MAX = 2000, FULL_QUALITY = 0.82;
const THUMB_MAX = 700, THUMB_QUALITY = 0.75;

const loginCard = document.getElementById("login-card");
const adminPanel = document.getElementById("admin-panel");
const loginStatus = document.getElementById("login-status");
const adminStatus = document.getElementById("admin-status");
const photoList = document.getElementById("photo-list");

function setStatus(el, text, state) {
  el.textContent = text;
  if (state) el.setAttribute("data-state", state); else el.removeAttribute("data-state");
}

// -- Auth --------------------------------------------------------------
document.getElementById("login-btn").addEventListener("click", function () {
  var email = document.getElementById("admin-email").value.trim();
  var password = document.getElementById("admin-password").value;
  setStatus(loginStatus, "Signing in...", null);
  signInWithEmailAndPassword(auth, email, password).catch(function (err) {
    setStatus(loginStatus, "Sign-in failed: " + err.message, "err");
  });
});

document.getElementById("logout-btn").addEventListener("click", function () {
  signOut(auth);
});

onAuthStateChanged(auth, function (user) {
  if (user) {
    loginCard.hidden = true;
    adminPanel.hidden = false;
    loadPhotoList();
  } else {
    loginCard.hidden = false;
    adminPanel.hidden = true;
  }
});

// -- Client-side resize/compress ---------------------------------------
function loadImage(file) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("could not read image")); };
    img.src = url;
  });
}

function drawToBlob(img, maxDim, quality) {
  return new Promise(function (resolve, reject) {
    var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    var w = Math.round(img.width * scale);
    var h = Math.round(img.height * scale);
    var canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    canvas.toBlob(function (blob) {
      if (blob) resolve(blob); else reject(new Error("compression failed"));
    }, "image/jpeg", quality);
  });
}

function uploadToCloudinary(blob) {
  var form = new FormData();
  form.append("file", blob);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  return fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: form })
    .then(function (res) {
      if (!res.ok) return res.json().then(function (j) { throw new Error(j.error && j.error.message || "upload failed"); });
      return res.json();
    })
    .then(function (json) { return json.secure_url; });
}

// -- Upload --------------------------------------------------------------
document.getElementById("upload-btn").addEventListener("click", async function () {
  var files = document.getElementById("upload-files").files;
  var category = document.getElementById("upload-category").value;
  var caption = document.getElementById("upload-caption").value.trim();
  if (!files.length) { setStatus(adminStatus, "Choose at least one photo first.", "err"); return; }

  setStatus(adminStatus, "Uploading " + files.length + " photo(s)...", null);
  try {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var img = await loadImage(file);
      var fullBlob = await drawToBlob(img, FULL_MAX, FULL_QUALITY);
      var thumbBlob = await drawToBlob(img, THUMB_MAX, THUMB_QUALITY);

      var imageUrl = await uploadToCloudinary(fullBlob);
      var thumbUrl = await uploadToCloudinary(thumbBlob);

      await addDoc(collection(db, "photos"), {
        imageUrl: imageUrl,
        thumbUrl: thumbUrl,
        category: category,
        caption: caption,
        order: Date.now(),
        createdAt: Date.now()
      });
    }
    setStatus(adminStatus, "Uploaded successfully.", "ok");
    document.getElementById("upload-files").value = "";
    document.getElementById("upload-caption").value = "";
    loadPhotoList();
  } catch (err) {
    setStatus(adminStatus, "Upload failed: " + err.message, "err");
  }
});

// -- List / delete ---------------------------------------------------------
async function loadPhotoList() {
  photoList.innerHTML = "Loading...";
  var q = query(collection(db, "photos"), orderBy("order", "desc"));
  var snap = await getDocs(q);
  if (snap.empty) { photoList.innerHTML = '<p class="admin-note">No photos uploaded yet.</p>'; return; }

  photoList.innerHTML = "";
  snap.forEach(function (docSnap) {
    var photo = docSnap.data();
    var row = document.createElement("div");
    row.className = "admin-photo-row";

    var img = document.createElement("img");
    img.src = photo.thumbUrl;
    img.alt = "";

    var meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = photo.caption || photo.category;
    var sub = document.createElement("span");
    sub.className = "admin-note";
    sub.textContent = photo.category;
    meta.appendChild(document.createElement("br"));
    meta.appendChild(sub);

    var delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Remove from site";

    row.appendChild(img);
    row.appendChild(meta);
    row.appendChild(delBtn);

    delBtn.addEventListener("click", async function () {
      // Unsigned Cloudinary uploads can't be deleted from the browser (that
      // needs the API secret, which must never reach client code) — this
      // only takes the photo off the site by removing its Firestore record.
      // The file itself stays on Cloudinary, which is fine at this scale
      // (free tier is 25GB, and event photos won't come close).
      if (!confirm("Remove this photo from the site? It will stop showing on the Events page.")) return;
      await deleteDoc(doc(db, "photos", docSnap.id));
      loadPhotoList();
    });
    photoList.appendChild(row);
  });
}
