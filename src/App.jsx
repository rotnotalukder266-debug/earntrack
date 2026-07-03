import React, { useState, useEffect } from "react";
import {
  Wallet, ListChecks, User, LayoutGrid, Shield, CheckCircle2,
  Clock, XCircle, Plus, Trash2, Banknote, LogOut,
} from "lucide-react";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import {
  PLANS, watchSubscription, watchAllSubscriptions, submitSubscriptionPayment,
  approveSubscription, rejectSubscription, watchTasks, addTask, deleteTask,
  watchMySubmissions, watchPendingSubmissions, submitTask, decideSubmission,
  watchMyWithdrawals, watchPendingWithdrawals, requestWithdraw, decideWithdraw,
  watchWallet,
} from "./data.js";

const PAY_NUMBERS = [
  { name: "বিকাশ", number: "01725-837606" },
  { name: "নগদ", number: "01725-837606" },
  { name: "রকেট", number: "01900-xxxxxx" },
];

const money = (n) => `৳${Number(n || 0).toLocaleString("bn-BD")}`;
const display = { fontFamily: "'Baloo Da 2',sans-serif" };
const bengali = { fontFamily: "'Hind Siliguri',sans-serif" };

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

  useEffect(() => watchTasks((t) => setTasks(t.filter((x) => !x.deleted))), []);
  useEffect(() => watchMySubmissions(uid, setSubmissions), [uid]);
  useEffect(() => watchMyWithdrawals(uid, setWithdrawals), [uid]);
  useEffect(() => watchWallet(uid, setBalance), [uid]);

  const props = { uid, profile, sub, tasks, submissions, withdrawals, balance, flash };
  return (
    <>
      {tab === "home" && <HomeTab {...props} setTab={setTab} />}
      {tab === "tasks" && <TasksTab {...props} />}
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
  const typeLabel = { "data-entry": "ডেটা এন্ট্রি", "content-review": "কন্টেন্ট রিভিউ" };
  const statusOf = (taskId) => {
    const s = [...submissions].reverse().find((x) => x.taskId === taskId);
    return s ? s.status : null;
  };
  const doTask = async (taskId) => {
    if (statusOf(taskId) === "pending" || statusOf(taskId) === "approved") return flash("এই টাস্ক ইতিমধ্যে জমা দেওয়া হয়েছে");
    await submitTask(uid, taskId);
    flash("টাস্ক জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়");
  };
  return (
    <div className="px-5 pt-6">
      <h2 className="text-xl mb-4" style={display}>টাস্ক তালিকা</h2>
      <div className="space-y-3">
        {tasks.map((t) => {
          const st = statusOf(t.id);
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
                  <button onClick={() => doTask(t.id)} className="text-xs bg-[#16233F] text-white px-3 py-1.5 rounded-full">সম্পন্ন করেছি</button>
                )}
              </div>
            </Card>
          );
        })}
        {tasks.length === 0 && <p className="text-sm text-gray-400 text-center pt-8">এখনো কোনো টাস্ক যোগ হয়নি</p>}
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
      <button onClick={logout} className="w-full text-sm text-rose-500 mt-6 py-2 flex items-center justify-center gap-1">
        <LogOut size={14} /> লগআউট
      </button>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", label: "হোম", icon: LayoutGrid },
    { id: "tasks", label: "টাস্ক", icon: ListChecks },
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

  useEffect(() => watchAllSubscriptions(setSubs), []);
  useEffect(() => watchTasks((t) => setTasks(t.filter((x) => !x.deleted))), []);
  useEffect(() => watchPendingSubmissions(setPendingSubs), []);
  useEffect(() => watchPendingWithdrawals(setPendingWds), []);

  const tabs = [
    { id: "subs", label: "সাবস্ক্রিপশন" },
    { id: "review", label: "টাস্ক রিভিউ" },
    { id: "tasks", label: "টাস্ক ম্যানেজ" },
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
          {pendingSubs.map((s) => {
            const task = tasks.find((t) => t.id === s.taskId);
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#16233F]">{task?.title || "টাস্ক মুছে ফেলা হয়েছে"}</span>
                  <Pill tone="gold">{money(task?.reward || 0)}</Pill>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decideSubmission(s.id, "approved", task?.reward || 0, s.uid).then(() => flash("অনুমোদিত"))} className="flex-1 bg-emerald-600 text-white text-xs rounded-lg py-1.5">অনুমোদন</button>
                  <button onClick={() => decideSubmission(s.id, "rejected", 0, s.uid).then(() => flash("বাতিল"))} className="flex-1 bg-rose-500 text-white text-xs rounded-lg py-1.5">বাতিল</button>
                </div>
              </div>
            );
          })}
          {pendingSubs.length === 0 && <p className="text-sm text-gray-400 text-center pt-8">অপেক্ষমাণ টাস্ক নেই</p>}
        </div>
      )}

      {tab === "tasks" && <AdminTasks tasks={tasks} flash={flash} />}

      {tab === "withdraw" && (
        <div className="space-y-2">
          {pendingWds.map((w) => (
            <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-3">
              <Row label="পরিমাণ" value={money(w.amount)} />
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
