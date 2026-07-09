import {
  doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection,
  query, where, onSnapshot, increment, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";

export const PLANS = [
  { id: "p7", days: 7, price: 100, label: "৭ দিন" },
  { id: "p30", days: 30, price: 300, label: "৩০ দিন" },
  { id: "p365", days: 365, price: 2000, label: "৩৬৫ দিন" },
];

const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/* ---------- telegram alerts ---------- */
const TELEGRAM_BOT_TOKEN = "8862281439:AAGpboKpD5DJ2WnhBgEyWiE3WZ2L43qQApU";
const TELEGRAM_CHAT_ID = "6376696495";

async function sendTelegramAlert(text, replyMarkup) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
  } catch (e) {
    console.error("Telegram alert failed:", e);
  }
}

/* ---------- subscriptions ---------- */
export const watchSubscription = (uid, cb) =>
  onSnapshot(doc(db, "subscriptions", uid), (snap) => cb(snap.exists() ? snap.data() : null));

export const watchAllSubscriptions = (cb) =>
  onSnapshot(collection(db, "subscriptions"), (snap) =>
    cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))));

export const submitSubscriptionPayment = async (uid, planId, txId) => {
  await setDoc(doc(db, "subscriptions", uid), {
    planId, txId, status: "pending", requestedAt: new Date().toISOString(),
  });
  const plan = PLANS.find((p) => p.id === planId);
  sendTelegramAlert(
    `💰 <b>নতুন সাবস্ক্রিপশন পেমেন্ট</b>\nপ্ল্যান: ${plan?.label || planId}\nদাম: ৳${plan?.price || "?"}\nট্রানজেকশন আইডি: ${txId}\nইউজার UID: ${uid}\n\nঅ্যাপের অ্যাডমিন প্যানেলে গিয়ে যাচাই করুন।`
  );
};

export const approveSubscription = async (uid, planId) => {
  const plan = PLANS.find((p) => p.id === planId);
  const start = new Date().toISOString();
  await updateDoc(doc(db, "subscriptions", uid), {
    status: "active", startedAt: start, expiresAt: addDays(start, plan.days),
  });
};

export const rejectSubscription = (uid) =>
  updateDoc(doc(db, "subscriptions", uid), { status: "rejected" });

/* ---------- tasks ---------- */
export const watchTasks = (cb) =>
  onSnapshot(collection(db, "tasks"), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

export const addTask = (task) =>
  addDoc(collection(db, "tasks"), { ...task, createdAt: serverTimestamp() });

export const deleteTask = (taskId) =>
  updateDoc(doc(db, "tasks", taskId), { deleted: true }); // soft delete keeps history intact

/* ---------- submissions ---------- */
export const watchMySubmissions = (uid, cb) =>
  onSnapshot(query(collection(db, "submissions"), where("uid", "==", uid)), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

export const watchPendingSubmissions = (cb) =>
  onSnapshot(query(collection(db, "submissions"), where("status", "==", "pending")), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

export const submitTask = (uid, taskId, note) =>
  addDoc(collection(db, "submissions"), { uid, taskId, note: note || "", status: "pending", ts: new Date().toISOString() });

export const decideSubmission = async (submissionId, decision, reward, uid, rejectionReason) => {
  await updateDoc(doc(db, "submissions", submissionId), {
    status: decision,
    ...(rejectionReason ? { rejectionReason } : {}),
  });
  if (decision === "approved") {
    await setDoc(doc(db, "wallets", uid), { balance: increment(reward) }, { merge: true });
  }
};

/* ---------- withdrawals ---------- */
export const watchMyWithdrawals = (uid, cb) =>
  onSnapshot(query(collection(db, "withdrawals"), where("uid", "==", uid)), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

export const watchPendingWithdrawals = (cb) =>
  onSnapshot(query(collection(db, "withdrawals"), where("status", "==", "pending")), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

export const requestWithdraw = async (uid, amount, payoutNumber, payoutMethod) => {
  const ref = doc(collection(db, "withdrawals"));
  await setDoc(ref, { uid, amount, payoutNumber, payoutMethod, status: "pending", ts: new Date().toISOString() });
  sendTelegramAlert(
    `🏧 <b>নতুন উত্তোলনের অনুরোধ</b>\nপরিমাণ: ৳${amount}\nমাধ্যম: ${payoutMethod}\nনাম্বার: ${payoutNumber}\nইউজার UID: ${uid}\n\nঅ্যাপের অ্যাডমিন প্যানেলে গিয়ে যাচাই করুন।`
  );
};

export const decideWithdraw = async (withdrawalId, decision, amount, uid) => {
  await updateDoc(doc(db, "withdrawals", withdrawalId), { status: decision });
  if (decision === "approved") {
    await setDoc(doc(db, "wallets", uid), { balance: increment(-amount) }, { merge: true });
  }
};

/* ---------- wallet ---------- */
export const watchWallet = (uid, cb) =>
  onSnapshot(doc(db, "wallets", uid), (snap) => cb(snap.exists() ? snap.data().balance || 0 : 0));

/* ---------- videos ---------- */
export const watchVideos = (cb) =>
  onSnapshot(collection(db, "videos"), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

export const addVideo = (video) =>
  addDoc(collection(db, "videos"), { ...video, createdAt: serverTimestamp() });

export const deleteVideo = (videoId) =>
  updateDoc(doc(db, "videos", videoId), { deleted: true });

/* ---------- kyc ---------- */
export const isUsernameTaken = async (username) => {
  const snap = await getDoc(doc(db, "usernames", username));
  return snap.exists();
};

export const submitKyc = async (uid, kycData, username) => {
  if (username) {
    try {
      await setDoc(doc(db, "usernames", username), { uid });
    } catch {
      throw new Error("USERNAME_TAKEN");
    }
  }
  await setDoc(doc(db, "users", uid), { ...kycData, username, kycCompleted: true }, { merge: true });
};
