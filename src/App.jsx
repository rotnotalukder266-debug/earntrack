import React, { useState, useEffect } from "react";
import {
  Wallet, ListChecks, User, LayoutGrid, Shield, CheckCircle2,
  Clock, XCircle, Plus, Trash2, Banknote, LogOut, PlayCircle,
  MessageCircle, Send, Youtube, Facebook, Headphones,
} from "lucide-react";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import {
  PLANS, watchSubscription, watchAllSubscriptions, submitSubscriptionPayment,
  approveSubscription, rejectSubscription, watchTasks, addTask, deleteTask,
  watchMySubmissions, watchPendingSubmissions, submitTask, decideSubmission,
  watchMyWithdrawals, watchPendingWithdrawals, requestWithdraw, decideWithdraw,
  watchWallet, watchVideos, addVideo, deleteVideo, submitKyc, isUsernameTaken,
} from "./data.js";

const PAY_NUMBERS = [
  { name: "বিকাশ", number: "01725-837606" },
  { name: "নগদ", number: "01725-837606" },
  { name: "রকেট", number: "01900-xxxxxx" },
];

// নিচের লিংকগুলো আপনার আসল চ্যানেল/গ্রুপের লিংক দিয়ে বদলে দিন
const SUPPORT_LINKS = [
  { name: "হোয়াটসঅ্যাপে সরাসরি সাপোর্ট", url: "https://wa.me/8801700000000", icon: MessageCircle, color: "#25D366" },
  { name: "অফিসিয়াল টেলিগ্রাম গ্রুপ (নতুন কাজের আপডেট)", url: "https://t.me/yourgroup", icon: Send, color: "#229ED9" },
  { name: "ইউটিউব চ্যানেল (কীভাবে কাজ করবেন)", url: "https://youtube.com/@yourchannel", icon: Youtube, color: "#FF0000" },
  { name: "ফেসবুক পেজ (রিভিউ ও আপডেট)", url: "https://facebook.com/yourpage", icon: Facebook, color: "#1877F2" },
];

const money = (n) => `৳${Number(n || 0).toLocaleString("bn-BD")}`;
const display = { fontFamily: "'Baloo Da 2',sans-serif" };
const bengali = { fontFamily: "'Hind Siliguri',sans-serif" };

function getEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video/${u.pathname.split("/").pop()}`;
    }
  } catch {
    return null;
  }
  return null;
}
function isDirectVideoFile(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

const Pill = ({ tone = "slate", children }) => {
  const tones = {
    slate: "bg-gray-100 text-gray-600", green: "bg-emerald-100 text-emerald-700",
    gold: "bg-amber-100 text-amber-800", coral: "bg-rose-100 text-rose-700",
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tones[tone]}`} style={bengali}>{children}</span>;
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>{children}</div>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-[#16233F]">{value}</span>
  </div>
);

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

function App() {
  const { user, profile, isAdmin, loading } = useAuth();
  const [toast, setToast] = useState("");
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const [viewAdmin, setViewAdmin] = useState(false);

  if (loading) return <Center>লোড হচ্ছে…</Center>;

  return (
    <div className="min-h-screen bg-[#F6F4EF]" style={bengali}>
      <div className="bg-[#16233F] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#C9962C] flex items-center justify-center">
            <Banknote size={18} className="text-[#16233F]" />
          </div>
          <span className="text-lg" style={display}>আর্নট্র্যাক</span>
        </div>
        {user && isAdmin && (
          <button onClick={() => setViewAdmin((v) => !v)}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition">
            {viewAdmin ? <User size={14} /> : <Shield size={14} />}
            {viewAdmin ? "ইউজার ভিউ" : "অ্যাডমিন ভিউ"}
          </button>
        )}
      </div>

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#16233F] text-white text-sm px-4 py-2 rounded-full shadow-lg" style={bengali}>
          {toast}
        </div>
      )}

      <div className="max-w-md mx-auto pb-24">
        {!user ? (
          <AuthScreen flash={flash} />
        ) : !profile ? (
          <Center>প্রোফাইল লোড হচ্ছে…</Center>
        ) : viewAdmin && isAdmin ? (
          <AdminPanel flash={flash} />
        ) : (
          <UserFlow uid={user.uid} profile={profile} flash={flash} />
        )}
      </div>
    </div>
  );
}

const Center = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center text-[#16233F]" style={bengali}>{children}</div>
);

/* ---------------- AUTH ---------------- */
function AuthScreen({ flash }) {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!form.name || !form.phone || !form.email || !form.password) throw new Error("সব ঘর পূরণ করুন");
        await signup(form.email, form.password, form.name, form.phone);
      } else {
        await login(form.email, form.password);
      }
    } catch (e) {
      flash(e.message.replace("Firebase: ", ""));
    }
    setBusy(false);
  };

  return (
    <div className="px-5 pt-10">
      <h2 className="text-2xl mb-1" style={display}>{mode === "login" ? "লগইন করুন" : "প্রোফাইল খুলুন"}</h2>
      <p className="text-sm text-gray-500 mb-6">কাজ করে আয় শুরু করতে অ্যাকাউন্ট প্রয়োজন</p>

      {mode === "signup" && (
        <>
          <Field label="আপনার নাম" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="যেমন: রহিম উদ্দিন" />
          <Field label="ফোন নম্বর" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="01XXXXXXXXX" />
        </>
      )}
      <Field label="ইমেইল" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@example.com" />
      <Field label="পাসওয়ার্ড" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="কমপক্ষে ৬ ক্যারেক্টার" />

      <button disabled={busy} onClick={submit} className="w-full bg-[#16233F] text-white rounded-xl py-3 font-medium mt-2 disabled:opacity-60">
        {busy ? "অপেক্ষা করুন…" : mode === "login" ? "লগইন করুন" : "প্রোফাইল তৈরি করুন"}
      </button>
      <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-sm text-gray-500 mt-4">
        {mode === "login" ? "নতুন অ্যাকাউন্ট খুলুন" : "আগে থেকে অ্যাকাউন্ট আছে? লগইন করুন"}
      </button>
    </div>
  );
}

const Field = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="mb-4">
    <label className="text-xs text-gray-500">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-1 outline-none focus:border-[#16233F]" />
  </div>
);

/* ---------------- USER FLOW ---------------- */
function UserFlow({ uid, profile, flash }) {
  const [sub, setSub] = useState(undefined);
  useEffect(() => watchSubscription(uid, setSub), [uid]);
  if (sub === undefined) return <Center>লোড হচ্ছে…</Center>;

  if (!profile.kycCompleted) return <KycScreen uid={uid} flash={flash} />;

  const status = (() => {
    if (!sub) return "none";
    if (sub.status !== "active") return sub.status;
    if (new Date(sub.expiresAt) < new Date()) return "expired";
    return "active";
  })();

  if (status === "none" || status === "rejected") return <PlanScreen uid={uid} flash={flash} rejected={status === "rejected"} />;
  if (status === "pending") return <PendingScreen sub={sub} />;
  if (status === "expired") return <PlanScreen uid={uid} flash={flash} expired />;
  return <Dashboard uid={uid} profile={profile} sub={sub} flash={flash} />;
}

function KycScreen({ uid, flash }) {
  const [captchaCode] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [form, setForm] = useState({
    fullName: "", username: "", age: "", gender: "পুরুষ", dob: "",
    education: "", occupation: "", address: "", nid: "",
    emergencyContact: "", facebookLink: "", captcha: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.fullName.trim() || !form.username.trim() || !form.age.trim() ||
        !form.education.trim() || !form.address.trim() || !form.emergencyContact.trim()) {
      return flash("তারকা চিহ্নিত সব ঘর পূরণ করুন");
    }
    if (form.captcha.trim().toUpperCase() !== captchaCode) {
      return flash("কোডটি ঠিকভাবে মেলেনি, আবার চেষ্টা করুন");
    }
    const username = form.username.trim().toLowerCase().replace(/\s+/g, "");
    setBusy(true);
    try {
      if (await isUsernameTaken(username)) {
        flash("এই ইউজারনেমে আগে থেকে অ্যাকাউন্ট আছে, অন্য একটি দিন");
        setBusy(false);
        return;
      }
      await submitKyc(uid, {
        fullName: form.fullName.trim(), age: form.age.trim(), gender: form.gender,
        dob: form.dob, education: form.education.trim(), occupation: form.occupation.trim(),
        address: form.address.trim(), nid: form.nid.trim(),
        emergencyContact: form.emergencyContact.trim(), facebookLink: form.facebookLink.trim(),
      }, username);
    } catch (e) {
      if (e.message === "USERNAME_TAKEN") flash("এই ইউজারনেমে আগে থেকে অ্যাকাউন্ট আছে, অন্য একটি দিন");
      else flash("সমস্যা হয়েছে, আবার চেষ্টা করুন");
    }
    setBusy(false);
  };

  return (
    <div className="px-5 pt-8 pb-10">
      <h2 className="text-2xl mb-1" style={display}>পরিচয় যাচাই</h2>
      <p className="text-sm text-gray-500 mb-5">সাবস্ক্রিপশন নেওয়ার আগে এই তথ্যগুলো দিন — এটা আপনার নিরাপত্তার জন্যই দরকার</p>

      <Field label="পুরো নাম *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} placeholder="জাতীয় পরিচয়পত্র অনুযায়ী নাম" />
      <Field label="ইউজারনেম *" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="যেমন: rahim123 (স্পেস ছাড়া)" />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500">বয়স *</label>
          <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="২২"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-1 outline-none focus:border-[#16233F]" />
        </div>
        <div>
          <label className="text-xs text-gray-500">লিঙ্গ</label>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-1 outline-none focus:border-[#16233F]">
            <option>পুরুষ</option>
            <option>মহিলা</option>
            <option>অন্যান্য</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">জন্ম তারিখ (ঐচ্ছিক)</label>
        <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-1 outline-none focus:border-[#16233F]" />
      </div>

      <Field label="শিক্ষাগত যোগ্যতা *" value={form.education} onChange={(v) => setForm({ ...form, education: v })} placeholder="যেমন: এইচএসসি, স্নাতক" />
      <Field label="পেশা/বর্তমান কাজ" value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })} placeholder="যেমন: শিক্ষার্থী, চাকরিজীবী" />
      <Field label="ঠিকানা *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="জেলা, উপজেলা, গ্রাম/এলাকা" />
      <Field label="জাতীয় পরিচয়পত্র নম্বর (ঐচ্ছিক)" value={form.nid} onChange={(v) => setForm({ ...form, nid: v })} placeholder="থাকলে দিন, না থাকলে খালি রাখুন" />
      <Field label="জরুরি যোগাযোগ নাম্বার *" value={form.emergencyContact} onChange={(v) => setForm({ ...form, emergencyContact: v })} placeholder="পরিবারের কারো নাম্বার" />
      <Field label="ফেসবুক প্রোফাইল লিংক (ঐচ্ছিক)" value={form.facebookLink} onChange={(v) => setForm({ ...form, facebookLink: v })} placeholder="facebook.com/আপনার-প্রোফাইল" />

      <Card className="p-4 mb-4">
        <div className="text-xs text-gray-500 mb-2">আপনি রোবট নন তা যাচাই করতে নিচের কোডটি লিখুন</div>
        <div className="text-2xl font-bold tracking-[0.4em] text-center text-[#16233F] bg-gray-100 rounded-lg py-3 mb-3 select-none" style={{ fontStyle: "italic" }}>
          {captchaCode}
        </div>
        <input value={form.captcha} onChange={(e) => setForm({ ...form, captcha: e.target.value })}
          placeholder="কোডটি এখানে লিখুন" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-[#16233F] uppercase" />
      </Card>

      <button disabled={busy} onClick={submit} className="w-full bg-[#16233F] text-white rounded-xl py-3 font-medium disabled:opacity-60">
        {busy ? "অপেক্ষা করুন…" : "যাচাই সম্পন্ন করুন"}
      </button>
    </div>
  );
}

function PlanScreen({ uid, flash, rejected, expired }) {
  const [plan, setPlan] = useState(null);
  const [txId, setTxId] = useState("");

  const confirm = async () => {
    if (!plan) return flash("প্ল্যান বাছাই করুন");
    if (!txId.trim()) return flash("ট্রানজেকশন আইডি দিন");
    await submitSubscriptionPayment(uid, plan.id, txId.trim());
    flash("পেমেন্ট জমা হয়েছে, অ্যাডমিন কনফার্ম করবেন");
  };

  return (
    <div className="px-5 pt-8">
      <h2 className="text-2xl mb-1" style={display}>সাবস্ক্রিপশন বাছাই করুন</h2>
      {rejected && <p className="text-sm text-rose-600 mb-3">আগের পেমেন্ট বাতিল হয়েছে, আবার চেষ্টা করুন</p>}
      {expired && <p className="text-sm text-amber-700 mb-3">সাবস্ক্রিপশনের মেয়াদ শেষ, নবায়ন করুন</p>}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {PLANS.map((p) => (
          <button key={p.id} onClick={() => setPlan(p)}
            className={`rounded-xl border-2 py-4 px-1 text-center ${plan?.id === p.id ? "border-[#C9962C] bg-amber-50" : "border-gray-200 bg-white"}`}>
            <div className="text-sm font-semibold text-[#16233F]">{p.label}</div>
            <div className="text-xs text-gray-500 mt-1">{money(p.price)}</div>
          </button>
        ))}
      </div>
      {plan && (
        <Card className="p-4">
          <div className="text-sm font-medium text-[#16233F] mb-2">পেমেন্ট পাঠান — {money(plan.price)}</div>
          <div className="space-y-2 mb-3">
            {PAY_NUMBERS.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-600">{p.name} (Send Money)</span>
                <span className="font-medium text-[#16233F]">{p.number}</span>
              </div>
            ))}
          </div>
          <Field label="ট্রানজেকশন আইডি" value={txId} onChange={setTxId} placeholder="যেমন: 8N7C2K9XYZ" />
          <button onClick={confirm} className="w-full bg-[#C9962C] text-[#16233F] rounded-xl py-3 font-semibold">পেমেন্ট কনফার্ম করুন</button>
        </Card>
      )}
    </div>
  );
}

const PendingScreen = ({ sub }) => {
  const plan = PLANS.find((p) => p.id === sub.planId);
  return (
    <div className="px-5 pt-16 flex flex-col items-center text-center">
      <Clock size={40} className="text-amber-500 mb-3" />
      <h2 className="text-xl mb-1" style={display}>যাচাই চলছে</h2>
      <p className="text-sm text-gray-500 max-w-xs">
        {plan?.label} প্ল্যানের পেমেন্ট (ট্রানজেকশন আইডি: {sub.txId}) অ্যাডমিন যাচাই করছেন।
      </p>
    </div>
  );
};

function Dashboard({ uid, profile, sub, flash }) {
  const [tab, setTab] = useState("home");
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [balance, setBalance] = useState(0);
  const [videos, setVideos] = useState([]);

  useEffect(() => watchTasks((t) => setTasks(t.filter((x) => !x.deleted))), []);
  useEffect(() => watchMySubmissions(uid, setSubmissions), [uid]);
  useEffect(() => watchMyWithdrawals(uid, setWithdrawals), [uid]);
  useEffect(() => watchWallet(uid, setBalance), [uid]);
  useEffect(() => watchVideos((v) => setVideos(v.filter((x) => !x.deleted))), []);

  const props = { uid, profile, sub, tasks, submissions, withdrawals, balance, videos, flash };
  return (
    <>
      {tab === "home" && <HomeTab {...props} setTab={setTab} />}
      {tab === "tasks" && <TasksTab {...props} />}
      {tab === "videos" && <VideosTab {...props} />}
      {tab === "wallet" && <WalletTab {...props} />}
      {tab === "profile" && <ProfileTab {...props} />}
      <BottomNav tab={tab} setTab={setTab} />
    </>
  );
}

function EarningRing({ pct, centerLabel, subLabel }) {
  const r = 54, c = 2 * Math.PI * r;
  const dash = Math.min(100, Math.max(0, pct)) / 100 * c;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#EDE7DA" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="#C9962C" strokeWidth="12"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round" transform="rotate(-90 70 70)" />
      <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="700" fill="#16233F" fontFamily="'Baloo Da 2',sans-serif">{centerLabel}</text>
      <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#8A94A6" fontFamily="'Hind Siliguri',sans-serif">{subLabel}</text>
    </svg>
  );
}

function HomeTab({ profile, sub, tasks, submissions, balance, setTab }) {
  const approved = submissions.filter((s) => s.status === "approved").length;
  const total = tasks.length;
  const pct = total ? (approved / total) * 100 : 0;
  const plan = PLANS.find((p) => p.id === sub.planId);
  const daysLeft = Math.max(0, Math.ceil((new Date(sub.expiresAt) - new Date()) / 86400000));

  return (
    <div className="px-5 pt-6">
      <h2 className="text-xl mb-4" style={display}>স্বাগতম, {profile.name}</h2>
      <Card className="p-5 flex items-center gap-4 mb-4">
        <EarningRing pct={pct} centerLabel={`${approved}/${total}`} subLabel="টাস্ক সম্পন্ন" />
        <div>
          <div className="text-xs text-gray-500">মোট আয়</div>
          <div className="text-2xl font-bold text-[#16233F]" style={display}>{money(balance)}</div>
          <Pill tone="green">প্ল্যান: {plan?.label}</Pill>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4"><div className="text-xs text-gray-500 mb-1">মেয়াদ বাকি</div><div className="text-lg font-semibold text-[#16233F]">{daysLeft} দিন</div></Card>
        <Card className="p-4"><div className="text-xs text-gray-500 mb-1">অপেক্ষমাণ টাস্ক</div><div className="text-lg font-semibold text-[#16233F]">{submissions.filter(s => s.status === "pending").length}</div></Card>
      </div>
      <button onClick={() => setTab("tasks")} className="w-full bg-[#16233F] text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2">
        <ListChecks size={18} /> টাস্ক দেখুন ও শুরু করুন
      </button>
    </div>
  );
}

function TasksTab({ uid, tasks, submissions, flash }) {
  const typeLabel = {
    "data-entry": "ডেটা এন্ট্রি",
    "content-review": "কন্টেন্ট রিভিউ",
    "survey": "সার্ভে পূরণ",
    "translation": "অনুবাদ",
    "proofreading": "প্রুফরিডিং",
    "tagging": "ছবি/ভিডিও ট্যাগিং",
    "transcription": "ট্রান্সক্রিপশন",
  };
  const [activeTask, setActiveTask] = useState(null);
  const latestSubmission = (taskId) => [...submissions].reverse().find((x) => x.taskId === taskId);
  const statusOf = (taskId) => latestSubmission(taskId)?.status || null;

  return (
    <div className="px-5 pt-6">
      <h2 className="text-xl mb-4" style={display}>টাস্ক তালিকা</h2>
      <div className="space-y-3">
        {tasks.map((t) => {
          const st = statusOf(t.id);
          const sub = latestSubmission(t.id);
          return (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-[#16233F]">{t.title}</div>
                <Pill tone="gold">{money(t.reward)}</Pill>
              </div>
              <p className="text-xs text-gray-500 mb-2">{t.desc}</p>
              <div className="flex items-center justify-between">
                <Pill>{typeLabel[t.type] || t.type}</Pill>
                {st === "approved" && <Pill tone="green">অনুমোদিত ✓</Pill>}
                {st === "pending" && <Pill tone="gold">যাচাই চলছে</Pill>}
                {(!st || st === "rejected") && (
                  <button onClick={() => setActiveTask(t)} className="text-xs bg-[#16233F] text-white px-3 py-1.5 rounded-full">কাজ জমা দিন</button>
                )}
              </div>
              {st === "rejected" && sub?.rejectionReason && (
                <div className="mt-2 text-xs bg-rose-50 text-rose-700 rounded-lg p-2">
                  <span className="font-medium">বাতিলের কারণ: </span>{sub.rejectionReason}
                </div>
              )}
            </Card>
          );
        })}
        {tasks.length === 0 && <p className="text-sm text-gray-400 text-center pt-8">এখনো কোনো টাস্ক যোগ হয়নি</p>}
      </div>
      {activeTask && (
        <TaskSubmitModal
          task={activeTask}
          onClose={() => setActiveTask(null)}
          onSubmit={async (note) => {
            await submitTask(uid, activeTask.id, note);
            setActiveTask(null);
            flash("টাস্ক জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়");
          }}
        />
      )}
    </div>
  );
}

function TaskSubmitModal({ task, onClose, onSubmit }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!note.trim()) return;
    setBusy(true);
    await onSubmit(note.trim());
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md p-5">
        <h3 className="text-lg mb-1" style={display}>{task.title}</h3>
        <p className="text-xs text-gray-500 mb-3">কাজটি সম্পন্ন করার পর, কী করেছেন সংক্ষেপে লিখুন — এটা অ্যাডমিন যাচাই করবেন</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
          placeholder="যেমন: ৫০টি প্রোডাক্টের নাম ও দাম স্প্রেডশিটে তুলেছি, লিংক: ..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 outline-none focus:border-[#16233F] resize-none" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium">বাতিল</button>
          <button disabled={busy || !note.trim()} onClick={submit} className="flex-1 bg-[#16233F] text-white rounded-xl py-3 font-medium disabled:opacity-50">
            {busy ? "জমা হচ্ছে…" : "জমা দিন"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VideosTab({ videos }) {
  return (
    <div className="px-5 pt-6">
      <h2 className="text-xl mb-4" style={display}>ভিডিও</h2>
      <div className="space-y-4">
        {videos.map((v) => {
          const embed = getEmbedUrl(v.url);
          return (
            <Card key={v.id} className="overflow-hidden">
              <div className="aspect-video bg-black">
                {embed ? (
                  <iframe src={embed} title={v.title} className="w-full h-full" allowFullScreen frameBorder="0" />
                ) : isDirectVideoFile(v.url) ? (
                  <video src={v.url} controls className="w-full h-full" />
                ) : (
                  <a href={v.url} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center text-white text-sm gap-2">
                    <PlayCircle size={20} /> ভিডিও দেখুন (নতুন ট্যাবে)
                  </a>
                )}
              </div>
              <div className="p-3">
                <div className="font-medium text-[#16233F] text-sm">{v.title}</div>
                {v.desc && <p className="text-xs text-gray-500 mt-1">{v.desc}</p>}
              </div>
            </Card>
          );
        })}
        {videos.length === 0 && <p className="text-sm text-gray-400 text-center pt-8">এখনো কোনো ভিডিও যোগ হয়নি</p>}
      </div>
    </div>
  );
}

function WalletTab({ uid, balance, withdrawals, flash }) {
  const [amt, setAmt] = useState("");
  const [payoutNumber, setPayoutNumber] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("বিকাশ");
  const submit = async () => {
    const n = Number(amt);
    if (!n || n <= 0) return flash("সঠিক পরিমাণ দিন");
    if (n > balance) return flash("ব্যালেন্সে যথেষ্ট টাকা নেই");
    if (!payoutNumber.trim()) return flash("যে নাম্বারে টাকা পাবেন সেটা দিন");
    await requestWithdraw(uid, n, payoutNumber.trim(), payoutMethod);
    setAmt(""); setPayoutNumber("");
    flash("উত্তোলনের অনুরোধ পাঠানো হয়েছে");
  };
  return (
    <div className="px-5 pt-6">
      <h2 className="text-xl mb-4" style={display}>ওয়ালেট</h2>
      <Card className="p-5 mb-5">
        <div className="text-xs text-gray-500">বর্তমান ব্যালেন্স</div>
        <div className="text-3xl font-bold text-[#16233F] mb-4" style={display}>{money(balance)}</div>
        <Field label="উত্তোলনের পরিমাণ" value={amt} onChange={setAmt} placeholder="টাকার পরিমাণ লিখুন" />
        <div className="mb-4">
          <label className="text-xs text-gray-500">মাধ্যম</label>
          <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-1 outline-none focus:border-[#16233F]">
            <option>বিকাশ</option>
            <option>নগদ</option>
            <option>রকেট</option>
          </select>
        </div>
        <Field label="আপনার নাম্বার (যেখানে টাকা পাবেন)" value={payoutNumber} onChange={setPayoutNumber} placeholder="01XXXXXXXXX" />
        <button onClick={submit} className="w-full bg-[#C9962C] text-[#16233F] rounded-xl py-3 font-semibold">উত্তোলনের অনুরোধ পাঠান</button>
      </Card>
      <h3 className="text-sm font-medium text-gray-500 mb-2">উত্তোলনের ইতিহাস</h3>
      <div className="space-y-2">
        {[...withdrawals].reverse().map((w) => (
          <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#16233F]">{money(w.amount)}</span>
              <Pill tone={w.status === "pending" ? "gold" : w.status === "approved" ? "green" : "coral"}>{w.status}</Pill>
            </div>
            {w.payoutNumber && <div className="text-xs text-gray-400 mt-1">{w.payoutMethod} — {w.payoutNumber}</div>}
          </div>
        ))}
        {withdrawals.length === 0 && <p className="text-sm text-gray-400 text-center pt-4">কোনো ইতিহাস নেই</p>}
      </div>
    </div>
  );
}

function ProfileTab({ profile, sub, submissions }) {
  const { logout } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const plan = PLANS.find((p) => p.id === sub.planId);
  return (
    <div className="px-5 pt-6">
      <h2 className="text-xl mb-4" style={display}>প্রোফাইল</h2>
      <Card className="p-5 space-y-3">
        <Row label="নাম" value={profile.name} />
        <Row label="ফোন" value={profile.phone} />
        <Row label="ইমেইল" value={profile.email} />
        <Row label="সাবস্ক্রিপশন" value={plan?.label} />
        <Row label="মেয়াদ শেষ" value={new Date(sub.expiresAt).toLocaleDateString("bn-BD")} />
        <Row label="মোট টাস্ক সম্পন্ন" value={submissions.filter(s => s.status === "approved").length} />
      </Card>
      <button onClick={() => setShowSupport(true)} className="w-full text-sm text-[#16233F] mt-4 py-2 border border-gray-300 rounded-xl flex items-center justify-center gap-1.5">
        <Headphones size={16} /> সাপোর্ট ও যোগাযোগ
      </button>
      <button onClick={() => setShowTerms(true)} className="w-full text-sm text-[#16233F] mt-3 py-2 border border-gray-300 rounded-xl">
        শর্তাবলী ও স্বচ্ছতা
      </button>
      <button onClick={logout} className="w-full text-sm text-rose-500 mt-3 py-2 flex items-center justify-center gap-1">
        <LogOut size={14} /> লগআউট
      </button>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
    </div>
  );
}

function SupportModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-5">
        <h3 className="text-lg mb-1" style={display}>সাপোর্ট ও যোগাযোগ</h3>
        <p className="text-xs text-gray-500 mb-4">কোনো সমস্যা হলে বা কাজ সম্পর্কে জানতে নিচের চ্যানেলে যোগাযোগ করুন</p>
        <div className="space-y-3">
          {SUPPORT_LINKS.map((s) => {
            const Icon = s.icon;
            return (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: s.color + "20" }}>
                  <Icon size={20} color={s.color} />
                </div>
                <span className="text-sm text-[#16233F]">{s.name}</span>
              </a>
            );
          })}
        </div>
        <button onClick={onClose} className="w-full bg-[#16233F] text-white rounded-xl py-3 font-medium mt-5">বন্ধ করুন</button>
      </div>
    </div>
  );
}

function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-5">
        <h3 className="text-lg mb-3" style={display}>শর্তাবলী ও স্বচ্ছতা</h3>
        <div className="text-sm text-gray-700 space-y-3">
          <p>এই অ্যাপে আয় নির্ভর করে সত্যিকার কাজের পরিমাণ ও সেই কাজের বাস্তব চাহিদার উপর। আমরা কোনো নির্দিষ্ট মাসিক আয়ের নিশ্চয়তা দিচ্ছি না — আয় বাড়বে-কমবে কাজের উপলব্ধতা অনুযায়ী।</p>
          <p>সাবস্ক্রিপশন ফি অ্যাপের পরিচালনা খরচ ও টাস্ক ব্যবস্থাপনায় ব্যবহৃত হয়। এটা কোনো বিনিয়োগ না, এবং সাবস্ক্রিপশন ফি ফেরত দেওয়া হয় না।</p>
          <p>উত্তোলনের অনুরোধ অ্যাডমিন যাচাই করার পর নির্দিষ্ট সময়ের মধ্যে (সাধারণত ২৪-৭২ ঘণ্টা) প্রসেস করা হয়।</p>
          <p>কোনো সমস্যা বা অভিযোগ থাকলে সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
        </div>
        <button onClick={onClose} className="w-full bg-[#16233F] text-white rounded-xl py-3 font-medium mt-5">বন্ধ করুন</button>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", label: "হোম", icon: LayoutGrid },
    { id: "tasks", label: "টাস্ক", icon: ListChecks },
    { id: "videos", label: "ভিডিও", icon: PlayCircle },
    { id: "wallet", label: "ওয়ালেট", icon: Wallet },
    { id: "profile", label: "প্রোফাইল", icon: User },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
      <div className="flex">
        {items.map((it) => {
          const Icon = it.icon; const active = tab === it.id;
          return (
            <button key={it.id} onClick={() => setTab(it.id)} className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${active ? "text-[#16233F]" : "text-gray-400"}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px]" style={bengali}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- ADMIN ---------------- */
function AdminPanel({ flash }) {
  const [tab, setTab] = useState("subs");
  const [subs, setSubs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [pendingWds, setPendingWds] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => watchAllSubscriptions(setSubs), []);
  useEffect(() => watchTasks((t) => setTasks(t.filter((x) => !x.deleted))), []);
  useEffect(() => watchPendingSubmissions(setPendingSubs), []);
  useEffect(() => watchPendingWithdrawals(setPendingWds), []);
  useEffect(() => watchVideos((v) => setVideos(v.filter((x) => !x.deleted))), []);

  const tabs = [
    { id: "subs", label: "সাবস্ক্রিপশন" },
    { id: "review", label: "টাস্ক রিভিউ" },
    { id: "tasks", label: "টাস্ক ম্যানেজ" },
    { id: "videos", label: "ভিডিও ম্যানেজ" },
    { id: "withdraw", label: "উত্তোলন" },
  ];

  return (
    <div className="px-5 pt-5">
      <h2 className="text-xl mb-4" style={display}>অ্যাডমিন প্যানেল</h2>
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${tab === t.id ? "bg-[#16233F] text-white" : "bg-gray-100 text-gray-600"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "subs" && (
        <div className="space-y-2">
          {subs.filter((s) => s.status === "pending").map((s) => (
            <Card key={s.uid} className="p-4">
              <Row label="ইউজার আইডি" value={s.uid.slice(0, 8) + "…"} />
              <Row label="প্ল্যান" value={PLANS.find((p) => p.id === s.planId)?.label} />
              <Row label="ট্রানজেকশন আইডি" value={s.txId} />
              <div className="flex gap-2 mt-3">
                <button onClick={() => approveSubscription(s.uid, s.planId).then(() => flash("অনুমোদিত"))} className="flex-1 bg-emerald-600 text-white text-sm rounded-lg py-2 flex items-center justify-center gap-1"><CheckCircle2 size={16} /> অনুমোদন</button>
                <button onClick={() => rejectSubscription(s.uid).then(() => flash("বাতিল"))} className="flex-1 bg-rose-500 text-white text-sm rounded-lg py-2 flex items-center justify-center gap-1"><XCircle size={16} /> বাতিল</button>
              </div>
            </Card>
          ))}
          {subs.filter((s) => s.status === "pending").length === 0 && <p className="text-sm text-gray-400 text-center pt-8">অপেক্ষমাণ পেমেন্ট নেই</p>}
        </div>
      )}

      {tab === "review" && (
        <div className="space-y-2">
          {pendingSubs.map((s) => (
            <AdminReviewCard key={s.id} submission={s} task={tasks.find((t) => t.id === s.taskId)} flash={flash} />
          ))}
          {pendingSubs.length === 0 && <p className="text-sm text-gray-400 text-center pt-8">অপেক্ষমাণ টাস্ক নেই</p>}
        </div>
      )}

      {tab === "tasks" && <AdminTasks tasks={tasks} flash={flash} />}

      {tab === "videos" && <AdminVideos videos={videos} flash={flash} />}

      {tab === "withdraw" && (
        <div className="space-y-2">
          {pendingWds.map((w) => (
            <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-3">
              <Row label="পরিমাণ" value={money(w.amount)} />
              {w.payoutNumber && <Row label="পাঠাতে হবে" value={`${w.payoutMethod} — ${w.payoutNumber}`} />}
              <div className="flex gap-2 mt-2">
                <button onClick={() => decideWithdraw(w.id, "approved", w.amount, w.uid).then(() => flash("প্রদান হয়েছে"))} className="flex-1 bg-emerald-600 text-white text-xs rounded-lg py-1.5">প্রদান করা হয়েছে</button>
                <button onClick={() => decideWithdraw(w.id, "rejected", w.amount, w.uid).then(() => flash("বাতিল"))} className="flex-1 bg-rose-500 text-white text-xs rounded-lg py-1.5">বাতিল</button>
              </div>
            </div>
          ))}
          {pendingWds.length === 0 && <p className="text-sm text-gray-400 text-center pt-8">অপেক্ষমাণ অনুরোধ নেই</p>}
        </div>
      )}
    </div>
  );
}

function AdminReviewCard({ submission, task, flash }) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const approve = () => decideSubmission(submission.id, "approved", task?.reward || 0, submission.uid).then(() => flash("অনুমোদিত"));
  const reject = () => {
    if (!rejectReason.trim()) return flash("কোথায় সমস্যা হয়েছে লিখুন");
    decideSubmission(submission.id, "rejected", 0, submission.uid, rejectReason.trim()).then(() => flash("বাতিল করা হয়েছে"));
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#16233F]">{task?.title || "টাস্ক মুছে ফেলা হয়েছে"}</span>
        <Pill tone="gold">{money(task?.reward || 0)}</Pill>
      </div>
      {submission.note && (
        <div className="text-xs bg-gray-50 rounded-lg p-2 mb-2 text-gray-700">
          <span className="font-medium">ইউজারের রিভিউ: </span>{submission.note}
        </div>
      )}
      {!showReject ? (
        <div className="flex gap-2">
          <button onClick={approve} className="flex-1 bg-emerald-600 text-white text-xs rounded-lg py-1.5">অনুমোদন</button>
          <button onClick={() => setShowReject(true)} className="flex-1 bg-rose-500 text-white text-xs rounded-lg py-1.5">বাতিল</button>
        </div>
      ) : (
        <div>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2}
            placeholder="কোথায় সমস্যা হয়েছে লিখুন (ইউজার এটা দেখবে)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs mb-2 outline-none focus:border-[#16233F] resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setShowReject(false)} className="flex-1 border border-gray-300 text-gray-600 text-xs rounded-lg py-1.5">ফিরে যান</button>
            <button onClick={reject} className="flex-1 bg-rose-500 text-white text-xs rounded-lg py-1.5">বাতিল নিশ্চিত করুন</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminTasks({ tasks, flash }) {
  const [form, setForm] = useState({ title: "", desc: "", reward: "", type: "data-entry" });
  const submit = async () => {
    if (!form.title.trim() || !form.reward) return flash("টাস্কের নাম ও রিওয়ার্ড দিন");
    await addTask({ title: form.title, desc: form.desc, reward: Number(form.reward), type: form.type });
    setForm({ title: "", desc: "", reward: "", type: "data-entry" });
    flash("টাস্ক যোগ হয়েছে");
  };
  return (
    <div>
      <Card className="p-4 mb-5">
        <Field label="টাস্কের নাম" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="যেমন: প্রোডাক্ট এন্ট্রি" />
        <Field label="বিবরণ" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} placeholder="সংক্ষিপ্ত বিবরণ" />
        <div className="flex gap-2 mb-2">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="data-entry">ডেটা এন্ট্রি</option>
            <option value="content-review">কন্টেন্ট রিভিউ</option>
            <option value="survey">সার্ভে পূরণ</option>
            <option value="translation">অনুবাদ</option>
            <option value="proofreading">প্রুফরিডিং</option>
            <option value="tagging">ছবি/ভিডিও ট্যাগিং</option>
            <option value="transcription">ট্রান্সক্রিপশন</option>
          </select>
          <input value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} type="number" placeholder="রিওয়ার্ড ৳" className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={submit} className="w-full bg-[#16233F] text-white rounded-lg py-2 text-sm flex items-center justify-center gap-1"><Plus size={16} /> টাস্ক যোগ করুন</button>
      </Card>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
            <div><div className="text-sm text-[#16233F]">{t.title}</div><div className="text-xs text-gray-400">{money(t.reward)}</div></div>
            <button onClick={() => deleteTask(t.id)} className="text-rose-500 p-1.5"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminVideos({ videos, flash }) {
  const [form, setForm] = useState({ title: "", url: "", desc: "" });
  const submit = async () => {
    if (!form.title.trim() || !form.url.trim()) return flash("ভিডিওর নাম ও লিংক দিন");
    try { new URL(form.url); } catch { return flash("সঠিক লিংক দিন"); }
    await addVideo({ title: form.title.trim(), url: form.url.trim(), desc: form.desc.trim() });
    setForm({ title: "", url: "", desc: "" });
    flash("ভিডিও যোগ হয়েছে");
  };
  return (
    <div>
      <Card className="p-4 mb-5">
        <Field label="ভিডিওর নাম" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="যেমন: প্রশিক্ষণ ভিডিও ১" />
        <Field label="ভিডিও লিংক (যেকোনো ব্রাউজার থেকে কপি করা)" value={form.url} onChange={(v) => setForm({ ...form, url: v })} placeholder="https://youtube.com/watch?v=..." />
        <Field label="বিবরণ (ঐচ্ছিক)" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} placeholder="সংক্ষিপ্ত বিবরণ" />
        <button onClick={submit} className="w-full bg-[#16233F] text-white rounded-lg py-2 text-sm flex items-center justify-center gap-1">
          <Plus size={16} /> ভিডিও যোগ করুন
        </button>
      </Card>
      <h3 className="text-sm font-medium text-gray-500 mb-2">সব ভিডিও</h3>
      <div className="space-y-2">
        {videos.map((v) => (
          <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm text-[#16233F] truncate">{v.title}</div>
              <div className="text-xs text-gray-400 truncate">{v.url}</div>
            </div>
            <button onClick={() => deleteVideo(v.id)} className="text-rose-500 p-1.5 shrink-0"><Trash2 size={16} /></button>
          </div>
        ))}
        {videos.length === 0 && <p className="text-sm text-gray-400 text-center pt-4">এখনো কোনো ভিডিও যোগ হয়নি</p>}
      </div>
    </div>
  );
}
