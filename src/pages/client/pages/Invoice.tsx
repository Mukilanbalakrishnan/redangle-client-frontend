import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Loader2, RefreshCw, FileText } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

interface InvoiceData {
  invoiceId: number;
  billingDate: string;
  status: string;
  token: string;
  totalPrice: number;
  totalAmount: number;
  discount: number;
  paid: number;
  balance: number;
  itemsByCategory?: Record<string, { name: string; quantity: number; price?: number }[]>;
  previewEvents?: { title: string; value: string }[];
  packageInvoices: { unit: number; package: { packageTitle: string } }[];
  lead: {
    leadId?: number;
    firstName: string;
    lastName: string;
    address: string | null;
    email: string | null;
    contactNumber: string | null;
    eventType: string | null;
    eventDate: string | null;
    description: string | null;
    leadSerialNumber?: string;
    leadType?: string;
  };
}

const formatCurrency = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const CATEGORY_ORDER: Record<string, number> = {
  "add on services": 0, "add-on services": 0, "add on service": 0,
  "add-on service": 0, "add-ons": 0, "add-on": 0, addons: 0, addon: 0,
  service: 10, services: 10, packages: 15,
  deliverable: 50, deliverables: 50,
  complementary: 70, complimentary: 70,
};

const MERGE_INTO: Record<string, string> = {
  wedding: "SERVICE", shoot: "SERVICE", ritual: "SERVICE",
  rituals: "SERVICE", engagement: "SERVICE", reception: "SERVICE",
};

function buildSortedCategories(raw: Record<string, any[]>) {
  const merged: Record<string, any[]> = {};
  for (const [cat, items] of Object.entries(raw)) {
    const key = cat.toLowerCase();
    if (key === "package" || key === "packages") continue;
    if (key === "service" || key === "services") continue;
    const parent = MERGE_INTO[key];
    if (parent) {
      if (!merged[parent]) merged[parent] = [];
      merged[parent].push(...items);
    } else {
      const existing = Object.keys(merged).find((k) => k.toLowerCase() === key);
      const dest = existing ?? cat;
      if (!merged[dest]) merged[dest] = [];
      merged[dest].push(...items);
    }
  }
  return Object.entries(merged).sort(([a], [b]) => {
    const aOrd = CATEGORY_ORDER[a.toLowerCase()] ?? 40;
    const bOrd = CATEGORY_ORDER[b.toLowerCase()] ?? 40;
    return aOrd - bOrd;
  });
}

function getHeaderTitle(raw: Record<string, any[]>) {
  for (const [cat, items] of Object.entries(raw)) {
    const key = cat.toLowerCase();
    if (key === "service" || key === "services" || key === "packages" || key === "package") {
      if (items?.length > 0 && items[0].name) {
        const pkgName = items[0].name.toUpperCase();
        return pkgName.includes("PACKAGE") ? `${pkgName} DESCRIPTION` : `${pkgName} PACKAGE DESCRIPTION`;
      }
    }
  }
  return "BASIC QUOTATION - PACKAGE DESCRIPTION";
}

export default function Invoice() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Per-invoice UI state
  const [issueMode, setIssueMode] = useState<Record<number, boolean>>({});
  const [issueTitle, setIssueTitle] = useState<Record<number, string>>({});
  const [issueDesc, setIssueDesc] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [localStatus, setLocalStatus] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<Record<number, string>>({});

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("ra_token");
      const res = await axios.get(`${API_URL}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setInvoices(res.data.data);
        const statuses: Record<number, string> = {};
        res.data.data.forEach((inv: InvoiceData) => {
          statuses[inv.invoiceId] = inv.status;
        });
        setLocalStatus(statuses);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleAccept = async (inv: InvoiceData) => {
    if (!inv.token) return;
    setSubmitting((p) => ({ ...p, [inv.invoiceId]: true }));
    try {
      let salesApiBase = import.meta.env.VITE_SALES_API_URL || "http://localhost:5000/api";
      if (salesApiBase.includes("5001")) salesApiBase = salesApiBase.replace("5001", "5000");
      await axios.put(`${salesApiBase}/invoices/public/${encodeURIComponent(inv.token)}/status`, { status: "approved" });
      setLocalStatus((p) => ({ ...p, [inv.invoiceId]: "approved" }));
      setMessage((p) => ({ ...p, [inv.invoiceId]: "Invoice approved successfully!" }));
    } catch {
      setMessage((p) => ({ ...p, [inv.invoiceId]: "Failed to approve. Please contact support." }));
    } finally {
      setSubmitting((p) => ({ ...p, [inv.invoiceId]: false }));
    }
  };

  const handleSendIssue = async (inv: InvoiceData) => {
    const title = issueTitle[inv.invoiceId] || "";
    const desc = issueDesc[inv.invoiceId] || "";
    if (!title.trim() || !desc.trim()) {
      setMessage((p) => ({ ...p, [inv.invoiceId]: "Please fill both title and description." }));
      return;
    }
    setSubmitting((p) => ({ ...p, [inv.invoiceId]: true }));
    try {
      const token = localStorage.getItem("ra_token");
      await axios.post(`${API_URL}/invoices/${inv.invoiceId}/issue`, {
        issueTitle: title.trim(),
        description: desc.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage((p) => ({ ...p, [inv.invoiceId]: "Issue sent successfully. Our team will contact you soon." }));
      setIssueMode((p) => ({ ...p, [inv.invoiceId]: false }));
      setIssueTitle((p) => ({ ...p, [inv.invoiceId]: "" }));
      setIssueDesc((p) => ({ ...p, [inv.invoiceId]: "" }));
    } catch {
      setMessage((p) => ({ ...p, [inv.invoiceId]: "Failed to send issue. Please try again later." }));
    } finally {
      setSubmitting((p) => ({ ...p, [inv.invoiceId]: false }));
    }
  };

  // ─── Loading / error / empty ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Loading your invoices...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-600 font-medium">{error}</p>
        <button onClick={fetchInvoices}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors">
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }
  if (invoices.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Invoice Details</h1>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-12">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
            <FileText className="text-indigo-400" size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-700">No Invoices Yet</h2>
          <p className="text-slate-500 text-sm text-center max-w-sm">
            Your billing team hasn't generated an invoice yet. Once they do, it will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoice Details</h1>

      {invoices.map((inv) => {
        const clientName = `${inv.lead.firstName} ${inv.lead.lastName}`.trim();
        const contact = inv.lead.email || inv.lead.contactNumber || "-";
        const subtotal = inv.totalAmount ?? inv.totalPrice ?? 0;
        const discount = inv.discount ?? 0;
        const paid = inv.paid ?? 0;
        const overall = subtotal - discount;
        const balance = overall - paid;
        const status = localStatus[inv.invoiceId] ?? inv.status;
        const isSubmitting = submitting[inv.invoiceId] ?? false;
        const isIssueMode = issueMode[inv.invoiceId] ?? false;
        const raw = inv.itemsByCategory ?? {};
        const sortedCategories = buildSortedCategories(raw);
        const headerTitle = getHeaderTitle(raw);

        const getEventValue = (label: string) =>
          inv.previewEvents?.find((e) => e.title.toUpperCase() === label.toUpperCase())?.value || "-";

        return (
          <div key={inv.invoiceId} className="bg-gray-100 rounded-2xl shadow-xl overflow-hidden">
            {/* Invoice document */}
            <div className="flex justify-center bg-white py-4">
              <style>{`
                .inv { background:#fff; width:780px; border:2px solid #000; font-size:11.5px; color:#000; font-family:Arial,Helvetica,sans-serif; }
                .inv-top { border-bottom:1px solid #000; padding:6px 14px 5px; font-weight:700; font-size:11.5px; }
                .inv-top table { width:100%; border-collapse:collapse; }
                .inv-top td { vertical-align:top; line-height:1.65; }
                .inv-top .mid { text-align:center; font-size:13px; font-weight:900; text-decoration:underline; letter-spacing:2px; }
                .inv-top .right { text-align:right; }
                .inv-logo { border-bottom:1px solid #000; padding:10px 16px 8px; text-align:center; }
                .inv-logo-row { display:inline-flex; align-items:center; gap:10px; margin-bottom:5px; }
                .inv-brand { font-size:26px; font-weight:900; color:#c00; letter-spacing:1px; line-height:1; }
                .inv-studio { font-size:11px; font-weight:700; letter-spacing:5px; color:#111; }
                .inv-address { font-size:12.5px; font-weight:700; margin-top:2px; }
                .inv-client-table { width:100%; border-collapse:collapse; border-bottom:1px solid #000; }
                .inv-client-cell { width:170px; border-right:1px solid #000; padding:8px 10px; vertical-align:top; font-weight:700; font-size:11.5px; line-height:1.6; }
                .inv-client-name { font-size:12px; font-weight:900; margin-top:14px; text-transform:uppercase; }
                .inv-event-inner { width:100%; border-collapse:collapse; }
                .inv-event-inner tr { border-bottom:1px solid #000; }
                .inv-event-inner tr:last-child { border-bottom:none; }
                .inv-ev-label { width:140px; padding:5px 8px; font-weight:700; border-right:1px solid #000; white-space:nowrap; vertical-align:middle; font-size:11.5px; }
                .inv-ev-value { padding:5px 8px; vertical-align:middle; font-size:11.5px; font-weight:600; text-transform:uppercase; }
                .inv-items { width:100%; border-collapse:collapse; border-top:1.5px solid #000; border-bottom:1px solid #000; font-size:11.5px; }
                .inv-items thead tr { border-bottom:1.5px solid #000; }
                .inv-items th { padding:7px 8px; font-weight:700; font-size:11.5px; border-right:1px solid #000; text-align:center; background:#fff; }
                .inv-items th:last-child { border-right:none; }
                .inv-items th.th-sl { width:58px; }
                .inv-items th.th-qty { width:88px; }
                .inv-items td { padding:3.5px 8px; border-right:1px solid #000; vertical-align:middle; }
                .inv-items td:last-child { border-right:none; }
                .inv-items .td-sl { text-align:center; width:58px; }
                .inv-items .td-qty { text-align:center; width:88px; }
                .inv-cat-row td { padding:6px 8px 4px; background:#fff; }
                .inv-cat-row .td-sl { border-right:1px solid #000; }
                .inv-cat-label { font-weight:700; font-size:11.5px; text-transform:uppercase; text-decoration:underline; letter-spacing:0.3px; }
                .inv-totals-row td { padding:5px 10px; border-bottom:1px solid #000; }
                .inv-totals-row:last-child td { border-bottom:none; }
                .inv-totals-row .t-label { text-align:right; font-weight:600; text-transform:uppercase; letter-spacing:0.3px; }
                .inv-totals-row .t-amount { text-align:center; font-weight:700; white-space:nowrap; }
                .inv-overall td { font-weight:900; font-size:12.5px; }
                .inv-notes { border-top:1px solid #000; padding:10px 14px 14px; font-size:10.5px; line-height:1.48; }
                .inv-notes-title { font-weight:700; font-size:11px; margin-bottom:5px; text-transform:uppercase; }
                .inv-note-item { display:flex; gap:5px; margin-bottom:3px; align-items:flex-start; text-transform:uppercase; }
                .inv-note-bullet { flex-shrink:0; font-size:13px; line-height:1.25; }
              `}</style>

              <div className="inv">
                {/* TOP BAR */}
                <div className="inv-top">
                  <table><tbody><tr>
                    <td style={{ width: "34%" }}>
                      GSTIN : 33ABIFR7594P1Z8
                      <div style={{ marginTop: 2 }}>DATE : {formatDate(inv.billingDate)}</div>
                    </td>
                    <td className="mid" style={{ width: "32%" }}>PROFORMA INVOICE</td>
                    <td className="right" style={{ width: "34%" }}>
                      BILL NO : {inv.lead.leadSerialNumber || `${inv.lead.leadType ?? "LD"}-${inv.lead.leadId}`}
                    </td>
                  </tr></tbody></table>
                </div>

                {/* LOGO + ADDRESS */}
                <div className="inv-logo">
                  <div className="inv-logo-row">
                    <img src="/red_angle_logo.png" alt="Red Angle Studio"
                      style={{ width: "240px", objectFit: "contain", margin: "5px 0" }} />
                  </div>
                  <div className="inv-address">
                    AP 742, G-Block, 2nd Street, 11th Main Rd, Anna Nagar, Chennai, Tamil Nadu 600040.
                  </div>
                </div>

                {/* CLIENT + EVENT DETAILS */}
                <table className="inv-client-table"><tbody><tr>
                  <td className="inv-client-cell">
                    TO
                    <div className="inv-client-name">{clientName}</div>
                    <div style={{ marginTop: 4, fontWeight: 600 }}>{contact}</div>
                  </td>
                  <td style={{ padding: 0, verticalAlign: "top" }}>
                    <table className="inv-event-inner"><tbody>
                      {[
                        { label: "EVENT NAME", val: getEventValue("EVENT NAME") },
                        { label: "ENGAGEMENT", val: getEventValue("ENGAGEMENT") },
                        { label: "WEDDING", val: getEventValue("WEDDING") },
                        { label: "RECEPTION", val: getEventValue("RECEPTION") },
                        { label: "RITUALS", val: getEventValue("RITUALS") },
                        { label: "LOCATION", val: getEventValue("LOCATION") },
                      ].map((row) => (
                        <tr key={row.label}>
                          <td className="inv-ev-label">{row.label} :</td>
                          <td className="inv-ev-value">{row.val}</td>
                        </tr>
                      ))}
                    </tbody></table>
                  </td>
                </tr></tbody></table>

                {/* ITEMS TABLE */}
                <table className="inv-items">
                  <thead>
                    <tr>
                      <th className="th-sl">SL.NO</th>
                      <th style={{ textAlign: "center" }}>{headerTitle}</th>
                      <th className="th-qty">QTY./UNIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCategories.map(([category, items]: any) => {
                      let slNo = 1;
                      return (
                        <React.Fragment key={category}>
                          <tr className="inv-cat-row">
                            <td className="td-sl"></td>
                            <td style={{ borderRight: "1px solid #000" }}>
                              <span className="inv-cat-label">{category} :</span>
                            </td>
                            <td></td>
                          </tr>
                          {items.map((item: any, idx: number) => (
                            <tr key={`${category}-${idx}`}>
                              <td className="td-sl">{slNo++}.</td>
                              <td style={{ borderRight: "1px solid #000", textTransform: "uppercase" }}>
                                {item.name}
                              </td>
                              <td className="td-qty">
                                {String(item.quantity || 1).padStart(2, "0")}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}

                    {/* TOTALS */}
                    <tr className="inv-totals-row" style={{ borderTop: "1.5px solid #000" }}>
                      <td></td><td className="t-label">TOTAL</td>
                      <td className="t-amount">{formatCurrency(subtotal)}</td>
                    </tr>
                    <tr className="inv-totals-row">
                      <td></td><td className="t-label">DISCOUNT</td>
                      <td className="t-amount">{formatCurrency(discount)}</td>
                    </tr>
                    <tr className="inv-totals-row inv-overall">
                      <td></td><td className="t-label">OVERALL BUDGET</td>
                      <td className="t-amount">{formatCurrency(overall)}</td>
                    </tr>
                    <tr className="inv-totals-row">
                      <td></td><td className="t-label">PAID</td>
                      <td className="t-amount">{formatCurrency(paid)}</td>
                    </tr>
                    <tr className="inv-totals-row">
                      <td></td><td className="t-label">BALANCE</td>
                      <td className="t-amount">{formatCurrency(balance)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* NOTES */}
                <div className="inv-notes">
                  <div className="inv-notes-title">IMPORTANT NOTES :</div>
                  {[
                    "5 HOURS PER SESSION (INCLUDING PRE OR POST WEDDING), IN CASE ADDITIONAL DURATION OF TIME HAPPENS IN THE EVENTS, THEN THE COVERAGE COST MAY DIFFER.",
                    "TOKEN ADVANCE IS NON REFUNDABLE.",
                    "IN DELIVERABLES LIKE ALBUMS & VIDEOS, IF ANY CORRECTIONS ARISES REG ALBUM PDF AND VIDEOS THEN ALL THE CORRECTIONS SHOULD BE CONVEYED ONCE OR TWICE BEYOND THAT THIRD OR FOURTH CORRECTIONS OR MORE THAN THAT, EXTRA PAYMENT WILL BE CHARGED ACCORDING TO THE SERVICES.",
                    "YOU WILL RECEIVE ALL YOUR DELIVERABLES AS PER INVOICE, IF INCASE ANY OTHER SERVICES YOU ARE EXPECTING FROM RED ANGLE WHICH IS NOT MENTIONED IN YOUR INVOICE WILL BE CHARGED AS EXTRA PAYMENT.",
                    "IN INVOICE PRE OR POST WEDDING SHOOT WILL BE PLANNED ACCORDING TO YOU IN SHOOTERS AVAILABLE DATES AND IN MUHURTHAM DATES & IF MUHURTHAM DATES ARE COMING IN WEEKENDS, THEN TEAM WILL NOT BE ABLE TO SHOOT AT THAT TIME.",
                    "IF ADD-ON SESSIONS TAKEN BEFORE YOUR EVENTS, THEN THE PAYMENT OF 80% IN YOUR QUOTATION (EXCLUDING TOKEN ADVANCE) AND ADD ON SESSIONS AMOUNT SHOULD BE PAID AT THE END OF THE SESSION ON THE SAME DAY.",
                    "INCASE YOU ARE OPTING FOR POST WEDDING SHOOT, THEN VALIDITY OF THE COMPLIMENTARY SHOOT WILL BE ONLY FOR 90 DAYS AFTER YOUR WEDDING OR ELSE PAYMENT SHOULD BE MADE FOR POST WEDDING SHOOT.",
                    "FOR YOUR ALBUM, YOU NEED TO SELECT THE PHOTOS FIRST THEN ONLY WE CAN ABLE TO START YOUR FURTHER DELIVERABLE WORKS (NOTE: PRIORITIZE PHOTO SELECTION). WE HAVE PIX OFFICE SUPPORT FOR PHOTO SELECTION WHICH WILL BE EXPIRED WITHIN 150 DAYS.",
                    "IF YOU ARE FINALIZING THE ALBUM PDF LAYOUT, AT THAT TIME THE REMAINING 20% OF PENDING PAYMENT WILL BE PAID ONCE YOU ARE GIVING APPROVAL FOR ALBUM PRINTING.",
                    "MODES OF PAYMENT WILL BE ACCOUNT TRANSFER OR GPAY/PHONEPE OR CASH. CREDIT/DEBIT CARD PAYMENTS WILL NOT BE ACCEPTABLE.",
                    "TRAVEL, FOOD AND ACCOMMODATION SHOULD BE TAKEN CARE BY THE CLIENT (PRE OR POST SHOOT, WEDDING, RECEPTION AND ANY OTHER EVENTS).",
                    "IF INCASE ANY HUMAN ERROR OR TECHNICAL ERROR HAPPENS IN FUTURE WHICH AFFECTS ANY OF THE FOOTAGES, THEN FOR THAT PARTICULAR SERVICE, THE CHARGED AMOUNT WILL BE REFUNDED.",
                    "WE WILL KEEP YOUR CONTENT FOR 6 MONTHS ONLY FROM YOUR EVENT DATE SO BEFORE THAT KINDLY BRING YOUR PENDRIVE OR HARDISK AND COPY ALL YOUR RAW FOOTAGES.",
                    "ONCE THE ENTIRE CONTENT COPIED FROM US THROUGH HARD DISK OR PENDRIVE, WHICH EXCEEDS THE TIME PERIOD OF 6 MONTHS, AFTER THAT YOU HAVE TO BRING THE COPIED CONTENT FOR THE COMPLETION OF DELIVERABLES.",
                  ].map((note, idx) => (
                    <div className="inv-note-item" key={idx}>
                      <span className="inv-note-bullet">&bull;</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── ACTION FOOTER ── */}
            <div className="border-t p-4 bg-gray-50 flex flex-col gap-3">
              {/* Success / error message */}
              {message[inv.invoiceId] && (
                <p className="text-sm text-center font-medium text-indigo-700">{message[inv.invoiceId]}</p>
              )}

              {/* Issue form */}
              {isIssueMode && (
                <div className="bg-white border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Tell us what is wrong with this invoice</h3>
                  <input
                    type="text"
                    className="border rounded-md px-2 py-1.5 text-xs w-full mb-2"
                    placeholder="Issue title"
                    value={issueTitle[inv.invoiceId] || ""}
                    onChange={(e) => setIssueTitle((p) => ({ ...p, [inv.invoiceId]: e.target.value }))}
                  />
                  <textarea
                    className="border rounded-md px-2 py-1.5 text-xs w-full min-h-[90px] mb-2 resize-none"
                    placeholder="Describe the issue in detail"
                    value={issueDesc[inv.invoiceId] || ""}
                    onChange={(e) => setIssueDesc((p) => ({ ...p, [inv.invoiceId]: e.target.value }))}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIssueMode((p) => ({ ...p, [inv.invoiceId]: false }))}
                      className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-700"
                      disabled={isSubmitting}
                    >Cancel</button>
                    <button
                      onClick={() => handleSendIssue(inv)}
                      disabled={isSubmitting}
                      className="px-3 py-1 text-xs rounded-full bg-red-600 text-white flex items-center gap-1 disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Send Issue
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3">
                {status?.toLowerCase() === "approved" ? (
                  <div className="px-4 py-2 text-xs rounded-full bg-green-600 text-white flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> ACCEPTED
                  </div>
                ) : !isIssueMode ? (
                  <>
                    <button
                      onClick={() => setIssueMode((p) => ({ ...p, [inv.invoiceId]: true }))}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1 disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" /> Reject & Raise Issue
                    </button>
                    <button
                      onClick={() => handleAccept(inv)}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs rounded-full bg-green-600 text-white flex items-center gap-1 disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Accept Invoice
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
