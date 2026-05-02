import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwMZPxZcbTzxeLU1wX0Ip6Z52Aroq1YiY",
  authDomain: "helpdesk-system-ab660.firebaseapp.com",
  projectId: "helpdesk-system-ab660",
  messagingSenderId: "979214919217",
  appId: "1:979214919217:web:ee69150c7da450365c9710"
};

const VAPID_KEY = "BFwfitA7XT-7OvQMJ_HIb6kT3PlxuMD2FNqhWOO6YZ-N34ZoC5yR4ALFcvrF7ENjqswhUeeaoL43Qc88PUWHB5A";
const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);
const db = getFirestore(firebaseApp);

const EMAILJS_SERVICE_ID = "service_k02pnr9";
const EMAILJS_TEMPLATE_ID = "template_9r0zksf";
const EMAILJS_PUBLIC_KEY = "FS-sTo9L8_-wp_3KN";

const sendEmailNotification = async (ticket) => {
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          ticket_title: ticket.title,
          ticket_category: ticket.category,
          ticket_priority: ticket.priority,
          ticket_desc: ticket.desc,
          ticket_date: ticket.date,
          whatsapp: "+971508677268",
          to_email: "noman96ab@gmail.com",
        }
      })
    });
  } catch (e) { console.log("Email error:", e); }
};

const translations = {
  ar: {
    title: "نظام إدارة الأعطال التقنية", login: "تسجيل الدخول", username: "اسم المستخدم",
    password: "كلمة المرور", enter: "دخول", dashboard: "لوحة التحكم", newTicket: "بلاغ جديد",
    tickets: "البلاغات", reports: "التقارير", logout: "خروج", total: "إجمالي البلاغات",
    open: "مفتوحة", inProgress: "قيد المعالجة", resolved: "محلولة", submitTicket: "رفع بلاغ جديد",
    ticketTitle: "عنوان المشكلة", ticketDesc: "وصف المشكلة", priority: "الأولوية",
    high: "عالية 🔴", medium: "متوسطة 🟡", low: "منخفضة 🟢", submit: "إرسال البلاغ",
    status: "الحالة", date: "التاريخ", action: "إجراء", solve: "حل", close: "إغلاق",
    new: "جديد", role: "الدور", welcome: "مرحباً", ticketSent: "✅ تم إرسال البلاغ بنجاح!",
    category: "الفئة", network: "شبكة", hardware: "أجهزة", software: "برامج", other: "أخرى",
    assignedTo: "مسند إلى", lang: "English", aiAssistant: "مساعد الذكاء الاصطناعي",
    aiPlaceholder: "اكتب مشكلتك التقنية...", aiSend: "إرسال", aiTitle: "🤖 مساعد AI",
    notifications: "الإشعارات", noNotif: "لا توجد إشعارات", emailSent: "📧 تم إرسال إيميل إشعار",
    markRead: "تحديد كمقروء", clearAll: "مسح الكل",
  },
  en: {
    title: "IT Helpdesk System", login: "Login", username: "Username", password: "Password",
    enter: "Sign In", dashboard: "Dashboard", newTicket: "New Ticket", tickets: "Tickets",
    reports: "Reports", logout: "Logout", total: "Total Tickets", open: "Open",
    inProgress: "In Progress", resolved: "Resolved", submitTicket: "Submit New Ticket",
    ticketTitle: "Issue Title", ticketDesc: "Issue Description", priority: "Priority",
    high: "High 🔴", medium: "Medium 🟡", low: "Low 🟢", submit: "Submit Ticket",
    status: "Status", date: "Date", action: "Action", solve: "Solve", close: "Close",
    new: "New", role: "Role", welcome: "Welcome", ticketSent: "✅ Ticket submitted successfully!",
    category: "Category", network: "Network", hardware: "Hardware", software: "Software",
    other: "Other", assignedTo: "Assigned To", lang: "عربي", aiAssistant: "AI Assistant",
    aiPlaceholder: "Describe your technical issue...", aiSend: "Send", aiTitle: "🤖 AI Assistant",
    notifications: "Notifications", noNotif: "No notifications", emailSent: "📧 Email notification sent",
    markRead: "Mark as read", clearAll: "Clear all",
  }
};

const users = [
  { username: "admin", password: "1234", role: "manager", nameAr: "المدير أحمد", nameEn: "Manager Ahmed" },
  { username: "tech", password: "1234", role: "technician", nameAr: "الفني محمد", nameEn: "Tech Mohammed" },
  { username: "user", password: "1234", role: "employee", nameAr: "الموظف سالم", nameEn: "Employee Salem" },
];

const initTickets = [
  { id: 1, title: "انقطاع الإنترنت", titleEn: "Internet Outage", desc: "لا يوجد اتصال بالإنترنت في الطابق الثاني", priority: "high", status: "new", category: "network", date: "2025-04-28", assignedTo: "tech" },
  { id: 2, title: "طابعة لا تعمل", titleEn: "Printer Not Working", desc: "الطابعة في مكتب المحاسبة لا تستجيب", priority: "medium", status: "inProgress", category: "hardware", date: "2025-04-27", assignedTo: "tech" },
  { id: 3, title: "مشكلة في البريد", titleEn: "Email Issue", desc: "لا أستطيع إرسال بريد إلكتروني", priority: "low", status: "resolved", category: "software", date: "2025-04-26", assignedTo: "tech" },
];

export default function App() {
  const [lang, setLang] = useState("ar");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [tickets, setTickets] = useState(initTickets);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [newTicket, setNewTicket] = useState({ title: "", desc: "", priority: "medium", category: "network" });
  const [ticketSent, setTicketSent] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [aiMessages, setAiMessages] = useState([{ role: "ai", text: { ar: "مرحباً! أنا مساعدك التقني الذكي. صف لي المشكلة وسأقترح الحل المناسب 🤖", en: "Hello! I'm your AI assistant. Describe your issue and I'll suggest the best solution 🤖" } }]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [emailLog, setEmailLog] = useState([]);
  const [showEmail, setShowEmail] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginHover, setLoginHover] = useState(false);
  const chatRef = useRef(null);
  const t = translations[lang];
  const isRTL = lang === "ar";

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [aiMessages]);

  useEffect(() => {
    const loadEmailLogs = async () => {
      try {
        const q = query(collection(db, "emailLogs"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setEmailLog(snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().time || "" })));
      } catch (e) { console.log(e); }
    };
    loadEmailLogs();
  }, []);

  const addNotification = (msg) => {
    const n = { id: Date.now(), msg, time: new Date().toLocaleTimeString(), read: false };
    setNotifications(prev => [n, ...prev]);
  };

  const sendEmailLog = async (ticket, newStatus) => {
    const entry = { ticket: lang === "ar" ? ticket.title : ticket.titleEn, status: newStatus, time: new Date().toLocaleTimeString(), to: "noman96ab@gmail.com" };
    setEmailLog(prev => [{ id: Date.now(), ...entry }, ...prev]);
    try { await addDoc(collection(db, "emailLogs"), { ...entry, createdAt: new Date() }); } catch (e) { console.log(e); }
  };

  const handleClearAll = () => {
    if (window.confirm(lang === "ar" ? "هل أنت متأكد من مسح جميع البلاغات؟" : "Are you sure you want to clear all tickets?")) {
      setTickets([]);
      setFilter("all");
    }
  };

  const handleLogin = () => {
    const uname = loginData.username.trim().toLowerCase();
    const pass = loginData.password.trim();
    const found = users.find(u => u.username.toLowerCase() === uname && u.password === pass);
    if (found) { setUser(found); setPage("dashboard"); setLoginError(""); addNotification(lang === "ar" ? "مرحباً بك في النظام! 👋" : "Welcome to the system! 👋"); }
    else setLoginError(lang === "ar" ? "❌ بيانات خاطئة! تأكد من: admin أو tech أو user / 1234" : "❌ Invalid! Try: admin or tech or user / 1234");
  };

  const handleSubmitTicket = () => {
    if (!newTicket.title || !newTicket.desc) return;
    const tk = { id: tickets.length + 1, title: newTicket.title, titleEn: newTicket.title, desc: newTicket.desc, priority: newTicket.priority, status: "new", category: newTicket.category, date: new Date().toISOString().split("T")[0], assignedTo: "tech" };
    setTickets([...tickets, tk]);
    setNewTicket({ title: "", desc: "", priority: "medium", category: "network" });
    setTicketSent(true);
    setTimeout(() => setTicketSent(false), 3000);
    addNotification(lang === "ar" ? `📋 تم رفع بلاغ جديد: ${tk.title}` : `📋 New ticket submitted: ${tk.title}`);
    sendEmailLog(tk, "new");
    sendEmailNotification(tk);
  };

  const updateStatus = (id, status) => {
    const tk = tickets.find(t => t.id === id);
    setTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
    addNotification(lang === "ar" ? `🔄 تم تحديث البلاغ "${tk.title}"` : `🔄 Ticket "${tk.titleEn}" updated`);
    sendEmailLog(tk, status);
  };

  const unread = notifications.filter(n => !n.read).length;
  const stats = { total: tickets.length, open: tickets.filter(t => t.status === "new").length, inProgress: tickets.filter(t => t.status === "inProgress").length, resolved: tickets.filter(t => t.status === "resolved").length };
  const priorityColor = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
  const statusColor = { new: "#3b82f6", inProgress: "#f59e0b", resolved: "#22c55e", closed: "#6b7280" };
  const statusLabel = { new: t.new, inProgress: t.inProgress, resolved: t.resolved, closed: t.close };
  const filteredTickets = filter === "all" ? tickets : tickets.filter(tk => tk.status === filter);

  const navItems = [
    { key: "dashboard", icon: "📊", label: t.dashboard },
    ...(user?.role !== "manager" ? [{ key: "newTicket", icon: "➕", label: t.newTicket }] : []),
    { key: "tickets", icon: "🎫", label: t.tickets },
    { key: "ai", icon: "🤖", label: t.aiAssistant },
    ...(user?.role === "manager" ? [{ key: "reports", icon: "📈", label: t.reports }] : []),
  ];

  const renderText = (text) => text.split("\n").map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<b>${m}</b>`);
    return <div key={i} dangerouslySetInnerHTML={{ __html: bold }} style={{ marginBottom: 2 }} />;
  });

  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput;
    setAiInput("");
    setAiMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: lang === "ar" ? "أنت مساعد تقني ذكي متخصص في IT Support. أجب بالعربية بشكل مختصر وعملي." : "You are an expert IT Support assistant. Reply in English concisely.",
          messages: [{ role: "user", content: userMsg }]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || (lang === "ar" ? "عذراً، حدث خطأ." : "Sorry, an error occurred.");
      setAiMessages(prev => [...prev, { role: "ai", text: reply }]);
    } catch {
      setAiMessages(prev => [...prev, { role: "ai", text: lang === "ar" ? "عذراً، حدث خطأ. حاول مرة أخرى." : "Sorry, an error occurred." }]);
    }
    setAiLoading(false);
  };

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg,#0f172a 0%,#1e3a8a 60%,#1e40af 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 24, padding: 40, width: 360, maxWidth: "90vw", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", direction: isRTL ? "rtl" : "ltr" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🛠️</div>
          <h2 style={{ color: "#fff", margin: 0, fontSize: 20, fontWeight: "bold" }}>{t.title}</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 6 }}>{lang === "ar" ? "مرحباً بك — سجل دخولك للمتابعة" : "Welcome back — sign in to continue"}</p>
        </div>
        <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{ width: "100%", marginBottom: 18, padding: 9, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, cursor: "pointer", fontWeight: "bold", color: "#fff", fontSize: 13 }}>{t.lang}</button>
        <div style={{ marginBottom: 14 }}>
          <input placeholder={lang === "ar" ? "البريد الإلكتروني أو اسم المستخدم" : "Email or username"} value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${loginError ? "#ef4444" : "rgba(255,255,255,0.2)"}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: "rgba(255,255,255,0.08)", color: "#fff", outline: "none" }} />
        </div>
        <div style={{ marginBottom: 6, position: "relative" }}>
          <input type={showPass ? "text" : "password"} placeholder={lang === "ar" ? "كلمة المرور" : "Password"} value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ width: "100%", padding: "11px 40px 11px 14px", border: `1.5px solid ${loginError ? "#ef4444" : "rgba(255,255,255,0.2)"}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: "rgba(255,255,255,0.08)", color: "#fff", outline: "none" }} />
          <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", top: "50%", [isRTL ? "left" : "right"]: 12, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "rgba(255,255,255,0.6)" }}>{showPass ? "🙈" : "👁️"}</button>
        </div>
        {loginError && <p style={{ color: "#fca5a5", fontSize: 12, marginBottom: 10, marginTop: 4 }}>⚠️ {loginError}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, marginTop: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ width: 14, height: 14 }} />
            {lang === "ar" ? "تذكرني" : "Remember me"}
          </label>
          <span style={{ color: "#93c5fd", fontSize: 13, cursor: "pointer" }}>{lang === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}</span>
        </div>
        <button onClick={handleLogin} onMouseEnter={() => setLoginHover(true)} onMouseLeave={() => setLoginHover(false)} style={{ width: "100%", padding: 13, background: loginHover ? "#2563eb" : "#1d4ed8", color: "#fff", border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer", fontSize: 15, transform: loginHover ? "scale(1.02)" : "scale(1)", transition: "all 0.2s", boxShadow: "0 4px 15px rgba(29,78,216,0.4)" }}>{t.enter} →</button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{lang === "ar" ? "لا تستطيع الدخول؟ " : "Can't login? "}<span style={{ color: "#93c5fd", cursor: "pointer" }}>{lang === "ar" ? "أبلغ عن مشكلة تقنية" : "Report a technical issue"}</span></span>
        </div>
        <div style={{ marginTop: 20, padding: 12, background: "rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: isRTL ? "right" : "left" }}>
          <b style={{ color: "rgba(255,255,255,0.7)" }}>{lang === "ar" ? "بيانات تجريبية:" : "Demo accounts:"}</b><br />
          admin / 1234 — {lang === "ar" ? "مدير" : "Manager"}<br />
          tech / 1234 — {lang === "ar" ? "فني" : "Technician"}<br />
          user / 1234 — {lang === "ar" ? "موظف" : "Employee"}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "sans-serif", direction: isRTL ? "rtl" : "ltr" }}>
      <div style={{ position: "fixed", top: 0, [isRTL ? "right" : "left"]: 0, width: 220, height: "100vh", background: "#1e3a8a", color: "#fff", display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "24px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🛠️</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{t.welcome}, {lang === "ar" ? user.nameAr : user.nameEn}</div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{user.role}</div>
        </div>
        <nav style={{ flex: 1, padding: 12 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{ width: "100%", padding: "10px 14px", marginBottom: 4, background: page === item.key ? "rgba(255,255,255,0.2)" : "transparent", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", textAlign: isRTL ? "right" : "left", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{ width: "100%", padding: 8, marginBottom: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>{t.lang}</button>
          <button onClick={() => { setUser(null); setPage("login"); setNotifications([]); }} style={{ width: "100%", padding: 8, background: "rgba(239,68,68,0.3)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>🚪 {t.logout}</button>
        </div>
      </div>

      <div style={{ position: "fixed", top: 0, [isRTL ? "left" : "right"]: 0, width: `calc(100% - 220px)`, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "12px 24px", display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end", alignItems: "center", gap: 12, zIndex: 99 }}>
        <button onClick={() => setShowEmail(!showEmail)} style={{ position: "relative", background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 18 }}>
          📧{emailLog.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#3b82f6", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{emailLog.length}</span>}
        </button>
        <button onClick={() => setShowNotif(!showNotif)} style={{ position: "relative", background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 18 }}>
          🔔{unread > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
        </button>
        {showNotif && (
          <div style={{ position: "absolute", top: 52, [isRTL ? "left" : "right"]: 60, width: 320, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 200, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#1e3a8a", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold" }}>🔔 {t.notifications}</span>
              <button onClick={() => { setNotifications([]); setShowNotif(false); }} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 12 }}>{t.clearAll}</button>
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {notifications.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>{t.noNotif}</div> :
                notifications.map(n => (
                  <div key={n.id} onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: n.read ? "#fff" : "#eff6ff" }}>
                    <div style={{ fontSize: 13 }}>{n.msg}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{n.time}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
        {showEmail && (
          <div style={{ position: "absolute", top: 52, [isRTL ? "left" : "right"]: 110, width: 360, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 200, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#0f172a", color: "#fff", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: "bold" }}>📧 {lang === "ar" ? "سجل الإيميلات" : "Email Log"}</span>
              <button onClick={() => setShowEmail(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {emailLog.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>{lang === "ar" ? "لا توجد إيميلات" : "No emails yet"}</div> :
                emailLog.map(e => (
                  <div key={e.id} style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 12, fontWeight: "bold" }}>📧 {lang === "ar" ? "إلى:" : "To:"} {e.to}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{lang === "ar" ? `البلاغ "${e.ticket}"` : `Ticket "${e.ticket}"`} — {e.status}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.time}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginRight: isRTL ? 220 : 0, marginLeft: isRTL ? 0 : 220, padding: "80px 24px 24px" }}>

        {page === "dashboard" && (
          <div>
            <h2 style={{ color: "#1e3a8a", marginBottom: 24 }}>📊 {t.dashboard}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: t.total, value: stats.total, color: "#1e3a8a", icon: "🎫", key: "all" },
                { label: t.open, value: stats.open, color: "#3b82f6", icon: "🔵", key: "new" },
                { label: t.inProgress, value: stats.inProgress, color: "#f59e0b", icon: "🟡", key: "inProgress" },
                { label: t.resolved, value: stats.resolved, color: "#22c55e", icon: "✅", key: "resolved" }
              ].map(card => (
                <div key={card.label} onClick={() => setFilter(card.key)} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: filter === card.key ? `0 4px 20px ${card.color}40` : "0 2px 8px rgba(0,0,0,0.06)", borderTop: `4px solid ${card.color}`, cursor: "pointer", transform: filter === card.key ? "scale(1.03)" : "scale(1)", transition: "all 0.2s", outline: filter === card.key ? `2px solid ${card.color}` : "none" }}>
                  <div style={{ fontSize: 28 }}>{card.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: "bold", color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{card.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: "#1e3a8a" }}>🎫 {lang === "ar" ? "البلاغات" : "Tickets"}</h3>
                <button onClick={handleClearAll} style={{ padding: "6px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>🗑️ {lang === "ar" ? "مسح الكل" : "Clear All"}</button>
              </div>
              {filteredTickets.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>{lang === "ar" ? "لا توجد بلاغات" : "No tickets found"}</div>
              ) : filteredTickets.slice(-5).reverse().map(tk => (
                <div key={tk.id} onClick={() => setPage("tickets")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 14 }}>{lang === "ar" ? tk.title : tk.titleEn}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{tk.date}</div>
                  </div>
                  <span style={{ background: statusColor[tk.status], color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12 }}>{statusLabel[tk.status]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === "newTicket" && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ color: "#1e3a8a", marginBottom: 24 }}>➕ {t.submitTicket}</h2>
            {ticketSent && <div style={{ background: "#dcfce7", color: "#166534", padding: 12, borderRadius: 8, marginBottom: 16, fontWeight: "bold" }}>{t.ticketSent}</div>}
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              {[{ label: t.ticketTitle, key: "title", type: "input" }, { label: t.ticketDesc, key: "desc", type: "textarea" }].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>{f.label}</label>
                  {f.type === "input" ? <input value={newTicket[f.key]} onChange={e => setNewTicket({ ...newTicket, [f.key]: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 16, boxSizing: "border-box", fontSize: 14 }} />
                    : <textarea value={newTicket[f.key]} onChange={e => setNewTicket({ ...newTicket, [f.key]: e.target.value })} rows={4} style={{ width: "100%", padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 16, boxSizing: "border-box", fontSize: 14, resize: "vertical" }} />}
                </div>
              ))}
              {[{ label: t.category, key: "category", opts: [["network", t.network], ["hardware", t.hardware], ["software", t.software], ["other", t.other]] }, { label: t.priority, key: "priority", opts: [["high", t.high], ["medium", t.medium], ["low", t.low]] }].map(s => (
                <div key={s.key}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: "bold", fontSize: 14 }}>{s.label}</label>
                  <select value={newTicket[s.key]} onChange={e => setNewTicket({ ...newTicket, [s.key]: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                    {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <button onClick={handleSubmitTicket} style={{ width: "100%", padding: 12, background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15 }}>{t.submit}</button>
            </div>
          </div>
        )}

        {page === "tickets" && (
          <div>
            <h2 style={{ color: "#1e3a8a", marginBottom: 24 }}>🎫 {t.tickets}</h2>
            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#1e3a8a", color: "#fff" }}>
                    {["#", lang === "ar" ? "العنوان" : "Title", t.priority, t.status, t.date, ...(user.role === "technician" ? [t.action] : [])].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: isRTL ? "right" : "left", fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((tk, i) => (
                    <tr key={tk.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{tk.id}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: "bold" }}>{lang === "ar" ? tk.title : tk.titleEn}</td>
                      <td style={{ padding: "12px 16px" }}><span style={{ background: priorityColor[tk.priority], color: "#fff", padding: "3px 8px", borderRadius: 12, fontSize: 12 }}>{t[tk.priority]}</span></td>
                      <td style={{ padding: "12px 16px" }}><span style={{ background: statusColor[tk.status], color: "#fff", padding: "3px 8px", borderRadius: 12, fontSize: 12 }}>{statusLabel[tk.status]}</span></td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{tk.date}</td>
                      {user.role === "technician" && (
                        <td style={{ padding: "12px 16px" }}>
                          {tk.status === "new" && <button onClick={() => updateStatus(tk.id, "inProgress")} style={{ padding: "4px 10px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>{t.inProgress}</button>}
                          {tk.status === "inProgress" && <button onClick={() => updateStatus(tk.id, "resolved")} style={{ padding: "4px 10px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>{t.solve}</button>}
                          {tk.status === "resolved" && <button onClick={() => updateStatus(tk.id, "closed")} style={{ padding: "4px 10px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>{t.close}</button>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {page === "ai" && (
          <div style={{ maxWidth: 680 }}>
            <h2 style={{ color: "#1e3a8a", marginBottom: 8 }}>{t.aiTitle} {t.aiAssistant}</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>{lang === "ar" ? "اسألني عن أي مشكلة تقنية وسأساعدك بحل فوري" : "Ask me about any technical issue and I'll help you instantly"}</p>
            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div ref={chatRef} style={{ height: 420, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {aiMessages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? (isRTL ? "flex-start" : "flex-end") : (isRTL ? "flex-end" : "flex-start"), gap: 8, alignItems: "flex-start" }}>
                    {msg.role === "ai" && <div style={{ fontSize: 24, flexShrink: 0 }}>🤖</div>}
                    <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 12, background: msg.role === "user" ? "#1e3a8a" : "#f1f5f9", color: msg.role === "user" ? "#fff" : "#1e293b", fontSize: 13, lineHeight: 1.6 }}>
                      {msg.role === "ai" ? renderText(typeof msg.text === "object" ? msg.text[lang] : msg.text) : msg.text}
                    </div>
                    {msg.role === "user" && <div style={{ fontSize: 24, flexShrink: 0 }}>👤</div>}
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ fontSize: 24 }}>🤖</div>
                    <div style={{ padding: "10px 14px", background: "#f1f5f9", borderRadius: 12, fontSize: 13, color: "#64748b" }}>{lang === "ar" ? "جارٍ التحليل..." : "Analyzing..."}</div>
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAiSend()} placeholder={t.aiPlaceholder} style={{ flex: 1, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14 }} />
                <button onClick={handleAiSend} disabled={aiLoading} style={{ padding: "10px 16px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>{t.aiSend} ↵</button>
              </div>
            </div>
          </div>
        )}

        {page === "reports" && (
          <div>
            <h2 style={{ color: "#1e3a8a", marginBottom: 24 }}>📈 {t.reports}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[{ title: lang === "ar" ? "حسب الحالة" : "By Status", items: [{ label: t.open, val: stats.open, color: "#3b82f6" }, { label: t.inProgress, val: stats.inProgress, color: "#f59e0b" }, { label: t.resolved, val: stats.resolved, color: "#22c55e" }] },
                { title: lang === "ar" ? "حسب الفئة" : "By Category", items: ["network", "hardware", "software", "other"].map(cat => ({ label: t[cat], val: tickets.filter(tk => tk.category === cat).length, color: "#1e3a8a" })) }
              ].map(section => (
                <div key={section.title} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>{section.title}</h3>
                  {section.items.map(item => (
                    <div key={item.label} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}><span>{item.label}</span><span>{item.val}</span></div>
                      <div style={{ background: "#f1f5f9", borderRadius: 8, height: 10 }}>
                        <div style={{ width: `${stats.total ? (item.val / stats.total) * 100 : 0}%`, background: item.color, height: 10, borderRadius: 8, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}