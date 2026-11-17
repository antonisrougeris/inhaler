"use client";
import { useState, useEffect, type FormEvent } from "react";
import { Plus, Save, RefreshCw, Download, ArrowUpRight } from "lucide-react";
import { api } from "./forms";
type Row = Record<string, unknown>;
const templates: Record<string, Row> = {
  products: {
    slug: "new-product",
    nameEl: "Νέο προϊόν",
    nameEn: "New product",
    descriptionEl: "",
    descriptionEn: "",
    categoryId: "",
    kind: "DEVICE",
    published: false,
    demo: true,
    featured: false,
    manufacturer: "",
    manufacturerContact: "",
    responsibleOperator: "",
    supplier: "",
    modelNumber: "",
    intendedUse: "",
    instructionsEl: "",
    instructionsEn: "",
    warningsEl: "",
    warningsEn: "",
    modelUrl: null,
  },
  variants: {
    productId: "",
    sku: "",
    name: "",
    color: "#694a36",
    material: "",
    price: 0,
    vatBps: 2400,
    packSize: 1,
    adjustableAirflow: false,
    confirmedSpecifications: false,
    active: true,
    flavorId: null,
  },
  flavors: {
    slug: "",
    nameEl: "",
    nameEn: "",
    descriptionEl: "",
    descriptionEn: "",
    color: "#b3b8a0",
    image: "/art/core.svg",
    featured: false,
  },
  categories: { slug: "", nameEl: "", nameEn: "" },
  images: {
    productId: "",
    url: "/art/device.svg",
    altEl: "",
    altEn: "",
    position: 0,
  },
  bundles: { bundleId: "", componentId: "", quantity: 1 },
  coupons: {
    code: "WELCOME",
    type: "PERCENT",
    amount: 1000,
    minSpend: 0,
    maxUses: 100,
    active: false,
    expiresAt: null,
  },
  content: {
    key: "",
    titleEl: "",
    titleEn: "",
    bodyEl: "",
    bodyEn: "",
    position: 0,
    published: true,
  },
  compliance: {
    productId: "",
    flavorId: null,
    type: "GPSR",
    documentKey: "",
    status: "PENDING",
    notes: "",
    reviewAt: new Date(Date.now() + 365 * 86400000).toISOString(),
  },
  batches: { variantId: "", lot: "", quantity: 0, expiresAt: null },
  settings: {
    brandName: "",
    logoUrl: "",
    accent: "#b66b4b",
    font: "sans",
    contactEmail: "",
    domain: "http://localhost:3000",
    businessInfo: "",
    socialInstagram: "",
    launchDate: null,
    showCountdown: false,
    doubleOptIn: true,
    shippingPrice: 300,
    vatBps: 2400,
  },
};
const enums: Record<string, string[]> = {
  kind: ["DEVICE", "REFILL", "BUNDLE", "DISPOSABLE"],
  font: ["sans", "serif"],
  status: ["PENDING", "APPROVED", "REJECTED"],
};
function cell(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
export function ResourceManager({ resource }: { resource: string }) {
  const [rows, setRows] = useState<Row[]>([]),
    [editor, setEditor] = useState<Row | null>(null),
    [selected, setSelected] = useState<Row | null>(null),
    [search, setSearch] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function reload() {
    try {
      const result = await fetch(`/api/admin/${resource}`);
      const data = await result.json();
      if (!result.ok) throw new Error(data.error);
      setRows(data);
    } catch (e) {
      setMessage(String(e));
    }
  }
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/${resource}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setRows(data);
      });
    return () => {
      cancelled = true;
    };
  }, [resource]);
  const template = templates[resource];
  const visible = rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );
  const columns = rows[0]
    ? Object.keys(rows[0])
        .filter(
          (k) =>
            ![
              "tokenHash",
              "accessHash",
              "configuration",
              "html",
              "items",
              "history",
              "address",
              "payment",
              "shipments",
              "reservations",
              "createdAt",
              "updatedAt",
            ].includes(k),
        )
        .slice(0, 6)
    : [];
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(
        `/api/admin/${resource}${selected ? "?id=" + selected.id : ""}`,
        editor,
      );
      setMessage("Saved.");
      setEditor(null);
      setSelected(null);
      await reload();
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function action(data: Row) {
    setBusy(true);
    try {
      const result = await api("/api/admin/actions", data);
      setMessage(JSON.stringify(result));
      await reload();
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-toolbar">
        <input
          aria-label="Search records"
          placeholder="Search records…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="text-link" onClick={reload}>
          <RefreshCw size={14} />
          Refresh
        </button>
        {template && resource !== "settings" && (
          <button
            className="button"
            onClick={() => {
              setEditor({ ...template });
              setSelected(null);
            }}
          >
            <Plus size={15} />
            New record
          </button>
        )}
        {resource === "subscribers" && (
          <a className="button" href="/api/admin/export" download>
            <Download size={15} />
            Export CSV
          </a>
        )}
        {resource === "emails" && (
          <button
            className="button"
            onClick={() => action({ action: "send-emails" })}
          >
            Process email queue
          </button>
        )}
      </div>
      <p className="caption">
        Prices are integer euro cents. Percentages use basis points (1000 =
        10%). Relations use record IDs shown in the tables. Product edits reset
        compliance approval.
      </p>
      <p role="status" className="admin-status">
        {message}
      </p>
      {editor && (
        <form className="editor" onSubmit={save}>
          <h3>{selected ? "Edit record" : "New record"}</h3>
          <div className="stack-form">
            {Object.entries(editor).map(([key, value]) => (
              <label key={key}>
                {key}
                {typeof value === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setEditor({ ...editor, [key]: e.target.checked })
                    }
                  />
                ) : enums[key] || key === "type" ? (
                  <select
                    value={String(value)}
                    onChange={(e) =>
                      setEditor({ ...editor, [key]: e.target.value })
                    }
                  >
                    {(key === "type"
                      ? resource === "coupons"
                        ? ["PERCENT", "FIXED"]
                        : [
                            "INHALATION_ASSESSMENT",
                            "SDS",
                            "REACH",
                            "GPSR",
                            "LAB_REPORT",
                            "INSTRUCTIONS",
                          ]
                      : enums[key]
                    ).map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : typeof value === "number" ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) =>
                      setEditor({ ...editor, [key]: Number(e.target.value) })
                    }
                  />
                ) : /(body|description|warnings|instructions|notes|businessInfo)/i.test(
                    key,
                  ) ? (
                  <textarea
                    value={String(value ?? "")}
                    onChange={(e) =>
                      setEditor({ ...editor, [key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    type="text"
                    value={String(value ?? "")}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        [key]:
                          e.target.value ||
                          (template[key] === null ? null : ""),
                      })
                    }
                  />
                )}
              </label>
            ))}
          </div>
          <div className="button-row">
            <button className="button" disabled={busy}>
              <Save size={15} />
              Save
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => setEditor(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={String(row.id ?? row.variantId ?? i)}>
                {columns.map((c) => (
                  <td key={c} title={cell(row[c])}>
                    {cell(row[c])}
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => {
                      setSelected(row);
                      if (template)
                        setEditor(
                          Object.fromEntries(
                            Object.keys(template).map((key) => [
                              key,
                              row[key] ?? template[key],
                            ]),
                          ),
                        );
                    }}
                  >
                    {" "}
                    {template ? "Edit" : "Details"} ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p style={{ padding: 25 }}>No records yet.</p>}
      </div>
      {selected && !editor && (
        <div className="editor">
          <h3>Record details</h3>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
          <button className="text-link" onClick={() => setSelected(null)}>
            Close
          </button>
          {resource === "orders" && (
            <div className="button-row">
              <button
                className="button"
                disabled={busy || selected.status !== "PAID"}
                onClick={() => action({ action: "shipment", id: selected.id })}
              >
                Create shipment
              </button>
              <button
                className="button"
                disabled={
                  busy ||
                  !["PAID", "SHIPPED", "PAYMENT_REVIEW"].includes(
                    String(selected.status),
                  )
                }
                onClick={() => {
                  if (
                    confirm(
                      "Issue a full refund? This contacts the configured payment provider.",
                    )
                  )
                    action({ action: "refund", id: selected.id });
                }}
              >
                Full refund
              </button>
              {Array.isArray(selected.shipments) &&
                selected.shipments.map((s: Row) => (
                  <span key={String(s.id)}>
                    <a className="text-link" href={`/api/admin/label/${s.id}`}>
                      Download label
                    </a>{" "}
                    <button
                      className="text-link"
                      onClick={() => action({ action: "tracking", id: s.id })}
                    >
                      Refresh tracking
                    </button>
                  </span>
                ))}
            </div>
          )}
          {resource === "inventory" && (
            <form
              className="stack-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                action({
                  action: "stock",
                  id: selected.variantId,
                  delta: Number(f.get("delta")),
                  reason: f.get("reason"),
                });
              }}
            >
              <label>
                Adjustment (+ / −)
                <input name="delta" type="number" required />
              </label>
              <label>
                Reason
                <input name="reason" minLength={5} required />
              </label>
              <button className="button">Apply adjustment</button>
            </form>
          )}
          {resource === "reviews" && (
            <button
              className="button"
              onClick={() =>
                action({
                  action: "review",
                  id: selected.id,
                  approved: !selected.approved,
                })
              }
            >
              {selected.approved ? "Hide" : "Approve"} review
            </button>
          )}
        </div>
      )}
      {resource === "products" && (
        <form
          className="admin-action stack-form"
          onSubmit={(e) => {
            e.preventDefault();
            action({
              action: "approve-product",
              id: new FormData(e.currentTarget).get("id"),
            });
          }}
        >
          <h3>Compliance review · Owner only</h3>
          <label>
            Product ID
            <input name="id" required />
          </label>
          <p className="caption">
            Requires non-demo product, manufacturer/operator details, Greek
            warnings/instructions, confirmed specifications and a current
            approved inhalation assessment.
          </p>
          <button className="button">Approve product</button>
        </form>
      )}
      {resource === "settings" && <StoreControls action={action} busy={busy} />}
      {resource === "compliance" && <MediaUpload />}
    </>
  );
}
function StoreControls({
  action,
  busy,
}: {
  action: (data: Row) => Promise<void>;
  busy: boolean;
}) {
  return (
    <div className="admin-action">
      <h3>Store activation · Owner only</h3>
      <p className="caption">
        LIVE also requires server environment approval and configured real
        providers. TEST requires ALLOW_TEST_COMMERCE and a non-production
        APP_ENV.
      </p>
      <form
        className="stack-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          action({
            action: "approvals",
            complianceApproved: f.get("compliance") === "on",
            merchantApproved: f.get("merchant") === "on",
          });
        }}
      >
        <label className="checkbox">
          <input type="checkbox" name="compliance" />
          External compliance review completed
        </label>
        <label className="checkbox">
          <input type="checkbox" name="merchant" />
          Merchant approved the product category
        </label>
        <button className="button" disabled={busy}>
          Save approval declarations
        </button>
      </form>
      <div className="button-row">
        {["PRELAUNCH", "TEST", "LIVE"].map((mode) => (
          <button
            className="button"
            key={mode}
            disabled={busy}
            onClick={() => action({ action: "mode", mode })}
          >
            {mode}
            <ArrowUpRight size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}
function MediaUpload() {
  const [message, setMessage] = useState("");
  return (
    <form
      className="admin-action stack-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        try {
          const r = await fetch("/api/admin/media", {
            method: "POST",
            body: data,
          });
          const body = await r.json();
          setMessage(
            r.ok ? `Stored privately. Document key: ${body.key}` : body.error,
          );
        } catch {
          setMessage("Upload failed.");
        }
      }}
    >
      <h3>Private compliance document</h3>
      <input
        name="file"
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        required
      />
      <p className="caption">
        PDF, PNG, JPEG or WebP · 10 MB maximum · S3 configuration required
      </p>
      <button className="button">Upload</button>
      <p role="status">{message}</p>
    </form>
  );
}
