import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getWorkOrder, WorkOrderDetail } from "../../api/WorkOrder/workOrderApi";
import { getOrganization } from "../../api/OrganizationSettings/organizationSettingsApi";
import { getApiBaseUrl } from "../../config/backendConfig";
import { formatWoDate } from "../../utils/workOrderDateFormat";
import { formatWoAmount, formatWoQuantity } from "../../utils/workOrderNumberFormat";

/* ------------------------------------------------------------------ *
 * Shared helpers — kept in sync with the three Add*JobSheet screens.  *
 * ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, string> = {
  sublimation_tshirt: "Sublimation T-Shirt",
  polo_tshirt: "Polo T-Shirt",
  printing_job: "Printing Job",
  embroidery_job: "Embroidery Job",
};

/** Same resolution rule as the entry screens — private-bucket uploads are
 * streamed through our own /api proxy, older ones live under /storage. */
const storageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = getApiBaseUrl().replace(/\/+$/, "");
  const backendBase = apiBase.replace(/\/index\.php\/api$/i, "").replace(/\/api$/i, "");
  if (path.startsWith("/api/")) return `${backendBase}${path}`;
  return `${backendBase}/storage/${path.replace(/^\/+/, "")}`;
};

/** Which department's job sheet this order belongs to. */
const departmentOf = (order: WorkOrderDetail): "Factory" | "Printing" | "Embroidery" => {
  if (order.department === "Printing" || order.category === "printing_job") return "Printing";
  if (order.department === "Embroidery" || order.category === "embroidery_job") return "Embroidery";
  return "Factory";
};

// --- Factory ------------------------------------------------------------------
const FACTORY_SIZE_GROUPS: { title: string; category: string; sizes: string[] }[] = [
  { title: "GENTS SIZE", category: "GENTS", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] },
  { title: "LADIES SIZE", category: "LADIES", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] },
  { title: "BOYS SIZE", category: "BOYS", sizes: ["4", "5", "6", "7"] },
  { title: "PRESCHOOL SIZE", category: "PRESCHOOL", sizes: ["S", "M", "L", "XL"] },
];
const FACTORY_PRICE_ITEMS = ["ELDERS", "PRESCHOOL", "BOYS", "SHORTS", "BOTTOM", "SKINEE", "JACKET"];

// --- Printing ---------------------------------------------------------------
const PRINT_SIZE_COLUMNS = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL"];
const PRINT_SIZE_ROWS = ["GENTS", "LADIES", "BOYS"] as const;

/** Inverse of the printing screen's remark packing. */
const parsePrintingRemark = (remarkText?: string | null) => {
  const lines = (remarkText || "").split("\n");
  let operator = "";
  let dataEntry = "";
  let boysPrice = "";
  const remainder: string[] = [];
  lines.forEach((line) => {
    const op = line.match(/^Operator: (.*)$/);
    const de = line.match(/^Data Entry: (.*)$/);
    const bp = line.match(/^Boys Price: (.*)$/);
    if (op) operator = op[1];
    else if (de) dataEntry = de[1];
    else if (bp) boysPrice = bp[1];
    else if (line) remainder.push(line);
  });
  return { remark: remainder.join("\n"), operator, dataEntry, boysPrice };
};

// --- Embroidery -----------------------------------------------------------
const EMB_AREAS = ["Front", "Back", "Sleeves", "Others"] as const;
// Mirrors AddEmbroideryJobSheet: 14-row grid, column-major, grows extra
// columns as it fills (index = col * GRID_ROWS + row).
const EMB_GRID_ROWS = 14;
const EMB_DEFAULT_COLS = 2;

/** Inverse of the embroidery screen's item_name packing. */
const parseEmbAreaLine = (itemName: string) => ({
  stitches: itemName.match(/Stitches ([\d.]+)/)?.[1] || "",
  stitchesPrice: itemName.match(/Stitches Price ([\d.]+)/)?.[1] || "",
});

/* ------------------------------------------------------------------ *
 * Presentational bits                                                 *
 * ------------------------------------------------------------------ */

const td: React.CSSProperties = { border: "1px solid #999", padding: "4px 8px", fontSize: 12 };
const th: React.CSSProperties = { ...td, fontWeight: 700, background: "#f0f0f0", textAlign: "center" };

const Section = ({ children }: { children: React.ReactNode }) => (
  <h3
    style={{
      margin: "20px 0 8px",
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      borderBottom: "2px solid #333",
      paddingBottom: 4,
    }}
  >
    {children}
  </h3>
);

const FieldTable = ({ rows }: { rows: [string, React.ReactNode][] }) => (
  <table style={{ borderCollapse: "collapse" }}>
    <tbody>
      {rows.map(([label, value]) => (
        <tr key={label}>
          <td style={{ fontWeight: 700, padding: "3px 12px 3px 0", verticalAlign: "top", whiteSpace: "nowrap" }}>
            {label}
          </td>
          <td style={{ padding: "3px 0" }}>{value ?? "-"}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const DesignImages = ({
  front,
  back,
  size = 180,
}: {
  front: string | null;
  back: string | null;
  size?: number;
}) => {
  if (!front && !back) return null;
  const imgStyle: React.CSSProperties = {
    width: size,
    height: size,
    objectFit: "contain",
    border: "1px solid #ccc",
  };
  return (
    <>
      <Section>Design</Section>
      <div className="wo-design wo-block" style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {front && (
          <figure style={{ margin: 0, textAlign: "center" }}>
            <img src={front} alt="Front design" style={imgStyle} />
            <figcaption style={{ fontSize: 11, color: "#666" }}>Front</figcaption>
          </figure>
        )}
        {back && (
          <figure style={{ margin: 0, textAlign: "center" }}>
            <img src={back} alt="Back design" style={imgStyle} />
            <figcaption style={{ fontSize: 11, color: "#666" }}>Back</figcaption>
          </figure>
        )}
      </div>
    </>
  );
};

/* ================================================================== *
 * FACTORY                                                             *
 * ================================================================== */

function FactorySheet({ order }: { order: WorkOrderDetail }) {
  const sizeQty: Record<string, number> = {};
  order.sizes.forEach((s) => {
    sizeQty[`${s.category}-${s.size_label}`] = Number(s.quantity || 0);
  });
  const groupTotal = (category: string, sizes: string[]) =>
    sizes.reduce((sum, size) => sum + (sizeQty[`${category}-${size}`] || 0), 0);

  const priceByItem: Record<string, string> = {};
  order.price_items.forEach((p) => {
    priceByItem[p.item_name] = p.price;
  });

  const sideLabel = (v: string | null) => (v && v.trim() ? v : "-");

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 26, letterSpacing: 2 }}>ORDER SHEET</h1>
        <div style={{ color: "#555" }}>{order.department || "Factory"} Work Order</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 14 }}>
        <span>WO No: {order.work_order_no}</span>
        <span>Status: {order.current_status?.name || "-"}</span>
      </div>

      <Section>Header</Section>
      <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
        <FieldTable
          rows={[
            ["Category", CATEGORY_LABELS[order.category] || order.category],
            ["Delivery Date", formatWoDate(order.delivery_date)],
            ["Customer", order.customer],
            ["Kind of Fabric", order.kind_of_fabric],
          ]}
        />
        <FieldTable
          rows={[
            ["Start Date", formatWoDate(order.order_date)],
            ["Contact No", order.contact_no],
            ["Reference Number", order.invoice_reference],
            ["Branch", order.branch],
          ]}
        />
      </div>

      <DesignImages
        front={storageUrl(order.front_image_path)}
        back={storageUrl(order.back_image_path)}
        size={160}
      />

      <Section>Size Breakdown</Section>
      {/* Every size group is printed (blank where empty) so the sheet keeps the
          same fixed structure as the entry screen — two grids per row so it
          still fits one page. */}
      <div className="wo-block" style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {FACTORY_SIZE_GROUPS.map((group) => {
          const total = groupTotal(group.category, group.sizes);
          return (
            <div key={group.category} style={{ flex: "1 1 320px", minWidth: 280 }}>
              <div style={{ fontWeight: 700, textAlign: "center", marginBottom: 2 }}>{group.title}</div>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    {group.sizes.map((s) => (
                      <th key={s} style={th}>{s}</th>
                    ))}
                    <th style={th}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {group.sizes.map((s) => (
                      <td key={s} style={{ ...td, textAlign: "center" }}>
                        {sizeQty[`${group.category}-${s}`] || ""}
                      </td>
                    ))}
                    <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>{formatWoQuantity(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <Section>Remark &amp; Pricing</Section>
      <div className="wo-block" style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 240px", minWidth: 200 }}>
          <div style={{ fontWeight: 700 }}>REMARK</div>
          <div className="wo-remark" style={{ whiteSpace: "pre-wrap", border: "1px solid #ccc", minHeight: 80, padding: 6 }}>
            {order.remark || ""}
          </div>
        </div>

        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>ITEMS</th>
              <th style={th}>PRICES</th>
            </tr>
          </thead>
          <tbody>
            {FACTORY_PRICE_ITEMS.map((item) => (
              <tr key={item}>
                <td style={td}>{item}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  {priceByItem[item] ? formatWoAmount(priceByItem[item]) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div>
          <table style={{ borderCollapse: "collapse", marginBottom: 8 }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left" }} colSpan={3}>EMBROIDER DETAILS</th>
              </tr>
              <tr>
                <th style={th} />
                <th style={th}>Left</th>
                <th style={th}>Right</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["FRONT", order.embroider_front],
                ["BACK", order.embroider_back],
                ["SLEEVES", order.embroider_sleeves],
              ].map(([label, value]) => (
                <tr key={label as string}>
                  <td style={td}>{label}</td>
                  <td style={{ ...td, textAlign: "center" }}>{(value || "").includes("Left") ? "✓" : ""}</td>
                  <td style={{ ...td, textAlign: "center" }}>{(value || "").includes("Right") ? "✓" : ""}</td>
                </tr>
              ))}
              <tr>
                <td style={td}>OTHERS</td>
                <td style={td} colSpan={2}>{sideLabel(order.embroider_others)}</td>
              </tr>
            </tbody>
          </table>

          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ ...td, fontWeight: 700 }}>TOTAL PRICE</td>
                <td style={{ ...td, textAlign: "right" }}>{formatWoAmount(order.total_price)}</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 700 }}>ADVANCE</td>
                <td style={{ ...td, textAlign: "right" }}>{formatWoAmount(order.advance)}</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 700 }}>BALANCE</td>
                <td style={{ ...td, textAlign: "right" }}>{formatWoAmount(order.balance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ================================================================== *
 * PRINTING                                                            *
 * ================================================================== */

function PrintingSheet({ order }: { order: WorkOrderDetail }) {
  const { remark, operator, dataEntry, boysPrice } = parsePrintingRemark(order.remark);
  const sides = order.sub_category || "";
  const has = (name: string) => sides.includes(name);

  const sizeQty: Record<string, number> = {};
  order.sizes.forEach((s) => {
    sizeQty[`${s.category}-${s.size_label}`] = Number(s.quantity || 0);
  });
  const rowTotal = (row: string) =>
    PRINT_SIZE_COLUMNS.reduce((sum, size) => sum + (sizeQty[`${row}-${size}`] || 0), 0);

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 24, letterSpacing: 2 }}>SUBLIMATION PRINTING</h1>
        <div style={{ fontWeight: 700 }}>JOB SHEET</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 14 }}>
        <span>WO No: {order.work_order_no}</span>
        <span>Status: {order.current_status?.name || "-"}</span>
      </div>

      <Section>Details</Section>
      <div className="wo-block" style={{ display: "flex", gap: 48, flexWrap: "wrap", alignItems: "flex-start" }}>
        <FieldTable
          rows={[
            ["Date", formatWoDate(order.order_date)],
            ["Customer", order.customer],
            ["Job Name", order.description],
          ]}
        />
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px", marginBottom: 8 }}>
            <span>{has("Front") ? "☑" : "☐"} Front</span>
            <span>{has("Back") ? "☑" : "☐"} Back</span>
            <span>{has("Long Sleeve") ? "☑" : "☐"} Long Sleeve</span>
            <span>{has("Short Sleeve") ? "☑" : "☐"} Short Sleeve</span>
          </div>
          <FieldTable rows={[["Price", formatWoAmount(order.total_price)]]} />
        </div>
      </div>

      <Section>Size Breakdown</Section>
      <div className="wo-block">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th} />
              {PRINT_SIZE_COLUMNS.map((s) => (
                <th key={s} style={th}>{s}</th>
              ))}
              <th style={th}>Total</th>
              <th style={th}>Price</th>
            </tr>
          </thead>
          <tbody>
            {PRINT_SIZE_ROWS.map((row) => (
              <tr key={row}>
                <td style={{ ...td, fontWeight: 700 }}>{row.charAt(0) + row.slice(1).toLowerCase()}</td>
                {PRINT_SIZE_COLUMNS.map((size) => (
                  <td key={size} style={{ ...td, textAlign: "center" }}>
                    {sizeQty[`${row}-${size}`] || ""}
                  </td>
                ))}
                <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>{formatWoQuantity(rowTotal(row))}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  {row === "BOYS" && boysPrice ? formatWoAmount(boysPrice) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Section>Remark</Section>
      <div className="wo-block">
        <div
          className="wo-remark"
          style={{ whiteSpace: "pre-wrap", border: "1px solid #ccc", minHeight: 60, padding: 6, maxWidth: 620 }}
        >
          {remark || ""}
        </div>
        <div style={{ marginTop: 8 }}>
          <FieldTable
            rows={[
              ["Operator", operator || "-"],
              ["Data Entry", dataEntry || "-"],
            ]}
          />
        </div>
      </div>

      <DesignImages front={storageUrl(order.front_image_path)} back={null} />
    </>
  );
}

/* ================================================================== *
 * EMBROIDERY                                                          *
 * ================================================================== */

function EmbroiderySheet({ order, orgName }: { order: WorkOrderDetail; orgName: string }) {
  // Qty per area = sum of that area's "Cell-N" size rows.
  const areaQty = (area: string) =>
    order.sizes
      .filter((s) => s.category === area && /^Cell-\d+$/.test(s.size_label))
      .reduce((sum, s) => sum + Number(s.quantity || 0), 0);

  const areaLine = (area: string) => {
    const item = order.price_items.find((p) => p.item_name === area || p.item_name.startsWith(`${area} (`));
    return {
      ...parseEmbAreaLine(item?.item_name || ""),
      totalPrice: item ? Number(item.price || 0) : 0,
    };
  };

  // Rebuild an area's entry grid from its saved "Cell-N" rows — same
  // column-major layout the embroidery job-sheet screen uses.
  const gridForArea = (area: string): { grid: string[]; cols: number } => {
    const cells = order.sizes.filter(
      (s) => s.category === area && /^Cell-\d+$/.test(s.size_label)
    );
    if (cells.length === 0) return { grid: [], cols: EMB_DEFAULT_COLS };
    const maxIdx = Math.max(
      ...cells.map((s) => parseInt(s.size_label.replace("Cell-", ""), 10) - 1)
    );
    const cols = Math.max(EMB_DEFAULT_COLS, Math.ceil((maxIdx + 1) / EMB_GRID_ROWS));
    const grid = Array(EMB_GRID_ROWS * cols).fill("");
    cells.forEach((s) => {
      const idx = parseInt(s.size_label.replace("Cell-", ""), 10) - 1;
      if (idx >= 0 && idx < grid.length) grid[idx] = String(Number(s.quantity || 0));
    });
    return { grid, cols };
  };

  const grandTotal = EMB_AREAS.reduce((sum, a) => sum + areaLine(a).totalPrice, 0);

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 1 }}>{orgName.toUpperCase()} EMBROIDERY DESIGN</h1>
        <div style={{ fontWeight: 700 }}>JOB SHEET</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 14 }}>
        <span>WO No: {order.work_order_no}</span>
        <span>Status: {order.current_status?.name || "-"}</span>
      </div>

      <Section>Details</Section>
      <div className="wo-block" style={{ display: "flex", gap: 48, flexWrap: "wrap", alignItems: "flex-start" }}>
        <FieldTable
          rows={[
            ["Date", formatWoDate(order.order_date)],
            ["Customer", order.customer],
            ["Job Name", order.description],
          ]}
        />
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th} />
              <th style={th}>Qty</th>
              <th style={th}>Stitches</th>
              <th style={th}>Stitches Price</th>
              <th style={th}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {EMB_AREAS.map((area) => {
              const line = areaLine(area);
              return (
                <tr key={area}>
                  <td style={{ ...td, fontWeight: 700 }}>{area}</td>
                  <td style={{ ...td, textAlign: "center" }}>{formatWoQuantity(areaQty(area))}</td>
                  <td style={{ ...td, textAlign: "center" }}>{line.stitches || ""}</td>
                  <td style={{ ...td, textAlign: "center" }}>{line.stitchesPrice || ""}</td>
                  <td style={{ ...td, textAlign: "right" }}>{formatWoAmount(line.totalPrice)}</td>
                </tr>
              );
            })}
            <tr>
              <td style={{ ...td, fontWeight: 700 }}>Total</td>
              <td style={td} colSpan={3} />
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{formatWoAmount(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Section>Size Breakdown by Area</Section>
      <div className="wo-block" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {EMB_AREAS.map((area) => {
          const { grid, cols } = gridForArea(area);
          return (
            <div key={area} style={{ flex: "1 1 22%", minWidth: 150 }}>
              <div style={{ fontWeight: 700, textAlign: "center", marginBottom: 2 }}>
                {area} — Total: {formatWoQuantity(areaQty(area))}
              </div>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <tbody>
                  {Array.from({ length: EMB_GRID_ROWS }).map((_, row) => (
                    <tr key={row}>
                      {Array.from({ length: cols }).map((_, col) => {
                        const idx = col * EMB_GRID_ROWS + row;
                        return (
                          <td key={col} style={{ ...td, textAlign: "center", height: 14, minWidth: 26 }}>
                            {grid[idx] || ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <DesignImages front={storageUrl(order.front_image_path)} back={null} />
    </>
  );
}

/* ================================================================== *
 * PAGE SHELL                                                          *
 * ================================================================== */

export default function WorkOrderPrintSheet() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["wo-sheet-order-print", id],
    queryFn: () => getWorkOrder(id as string),
    enabled: !!id,
  });

  const { data: organization } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
  });
  const orgName = organization?.organizationName?.trim() || "Company";

  const dept = useMemo(() => (order ? departmentOf(order) : null), [order]);

  const sheetRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  // Auto-open the browser print dialog once the sheet (and its images) are in.
  useEffect(() => {
    if (!order) return;
    const t = window.setTimeout(() => window.print(), 700);
    return () => window.clearTimeout(t);
  }, [order]);

  const handleDownloadPdf = async () => {
    const el = sheetRef.current;
    if (!el || !order) return;
    setPdfBusy(true);
    try {
      // Snapshot the sheet, then drop it into the PDF scaled so its FULL width
      // fits the page (never clipped on the right), paging down if it's tall.
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: el.scrollWidth,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const margin = 20;
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      const usableH = pageH - margin * 2;
      let heightLeft = imgH;
      let position = margin;
      pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH);
      heightLeft -= usableH;
      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgH - heightLeft);
        pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH);
        heightLeft -= usableH;
      }

      pdf.save(`${order.work_order_no || "work-order"}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      window.alert("Could not generate the PDF. Use Print → Save as PDF instead.");
    } finally {
      setPdfBusy(false);
    }
  };

  if (isLoading) return <p style={{ padding: 24, fontFamily: "system-ui" }}>Loading work order…</p>;
  if (isError || !order)
    return <p style={{ padding: 24, fontFamily: "system-ui" }}>Could not load this work order.</p>;

  return (
    <div
      style={{
        fontFamily: "system-ui, Arial, sans-serif",
        color: "#111",
        background: "#fff",
        maxWidth: 850,
        margin: "0 auto",
        padding: 24,
        fontSize: 12,
      }}
    >
      <style>{`
        @media print {
          .wo-print-toolbar { display: none !important; }
          @page { margin: 10mm; size: A4; }
          /* Readable, but the whole sheet must stay on ONE page. */
          html, body { font-size: 12.5px; }
          h1 { font-size: 23px !important; margin: 0 !important; }
          h3 { margin: 13px 0 6px !important; font-size: 13px !important; }
          table { font-size: 11.5px !important; }
          td, th { padding: 5px 7px !important; }
          .wo-design img { width: 215px !important; height: 215px !important; }
          .wo-remark { min-height: 75px !important; }
          /* Never split a section, table or figure across pages. */
          .wo-block, table, figure, tr { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
      `}</style>

      <div
        className="wo-print-toolbar"
        style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 12 }}
      >
        <button onClick={() => window.print()} style={{ padding: "6px 16px", cursor: "pointer" }}>
          Print
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={pdfBusy}
          style={{ padding: "6px 16px", cursor: pdfBusy ? "wait" : "pointer" }}
        >
          {pdfBusy ? "Preparing…" : "Download as PDF"}
        </button>
        <button onClick={() => window.close()} style={{ padding: "6px 16px", cursor: "pointer" }}>
          Close
        </button>
      </div>

      <div ref={sheetRef} style={{ width: 800, maxWidth: "100%", background: "#fff" }}>
        {dept === "Printing" ? (
          <PrintingSheet order={order} />
        ) : dept === "Embroidery" ? (
          <EmbroiderySheet order={order} orgName={orgName} />
        ) : (
          <FactorySheet order={order} />
        )}

        {order.remark && dept === "Embroidery" && (
          <>
            <Section>Remark</Section>
            <div style={{ whiteSpace: "pre-wrap" }}>{order.remark}</div>
          </>
        )}

        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", color: "#555" }}>
          <span>Order Qty: {formatWoQuantity(order.order_quantity)}</span>
          <span>_______________________</span>
        </div>
      </div>
    </div>
  );
}
