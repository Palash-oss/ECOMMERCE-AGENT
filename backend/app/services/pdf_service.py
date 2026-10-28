import io
import time
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas
from backend.app.services.kpi_service import get_kpi_metrics
from backend.app.services.analytics_service import get_categories_breakdown, get_geographic_distribution
from backend.app.services.product_service import list_products
from backend.app.agent.engine import generate_executive_summary

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        # Top banner
        self.setStrokeColor(colors.HexColor("#4F46E5"))
        self.setLineWidth(1.5)
        self.line(40, 755, 572, 755)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(40, 762, "NEXUSCOMMERCE AI | ENTERPRISE ANALYTICS & AI DOSSIER")
        self.setFont("Helvetica", 8)
        self.drawRightString(572, 762, "CONFIDENTIAL")

        # Bottom banner
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(40, 42, 572, 42)

        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#94A3B8"))
        self.drawString(40, 30, f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())} | CockroachDB CCL v26.2.9")
        self.drawRightString(572, 30, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_server_side_pdf_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_role: str = "viewer"
) -> io.BytesIO:
    """Generates an executive, publication-grade PDF report directly in memory."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=55,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        "SecHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1E1B4B"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155")
    )

    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1E293B")
    )

    cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0F172A")
    )

    elements = []

    # Title & Metadata
    elements.append(Paragraph("E-Commerce Intelligence & AI Performance Dossier", title_style))
    date_str = f"{start_date} to {end_date}" if start_date and end_date else "Full Enterprise Audit (2016-09-15 – 2018-08-29)"
    elements.append(Paragraph(f"<b>Reporting Scope</b>: {date_str} &nbsp;|&nbsp; <b>User Access Role</b>: {user_role.upper()}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceBefore=0, spaceAfter=10))

    # Executive AI Summary
    summary = generate_executive_summary(start_date=start_date, end_date=end_date)
    elements.append(Paragraph("1. Executive Summary & Strategic Synthesis", section_heading))
    elements.append(Paragraph(f"<b>Core Finding</b>: {summary['headline']}", body_style))
    elements.append(Spacer(1, 4))

    insights_html = "<br/>".join([f"• {item}" for item in summary["insights"]])
    risks_html = "<br/>".join([f"• <b>[Risk Factor]</b> {item}" for item in summary["risks"]])
    actions_html = "<br/>".join([f"• <b>[Recommended Action]</b> {item}" for item in summary["actions"]])

    exec_table = Table([
        [Paragraph(f"<b>Key Insights</b><br/>{insights_html}", cell_style)],
        [Paragraph(f"<b>Operational Risks</b><br/>{risks_html}", cell_style)],
        [Paragraph(f"<b>Strategic Next Steps</b><br/>{actions_html}", cell_style)]
    ], colWidths=[532])
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(exec_table)
    elements.append(Spacer(1, 10))

    # KPI Table with Deltas
    kpis = get_kpi_metrics(start_date, end_date)
    elements.append(Paragraph("2. Macro Performance Scorecard", section_heading))

    def format_prior_and_delta(card_data: dict, is_currency: bool = False) -> tuple:
        prev = card_data.get("previous_value")
        delta = card_data.get("delta")
        if prev is None or not delta or not delta.get("has_data", True):
            return "—", "N/A"
        prev_str = f"R$ {prev:,.2f}" if is_currency else f"{prev:,}"
        pct = delta.get("percentage", 0.0)
        sign = "+" if pct >= 0 else ""
        return prev_str, f"{sign}{pct}%"

    gmv_prev, gmv_delta = format_prior_and_delta(kpis["gmv"], is_currency=True)
    ord_prev, ord_delta = format_prior_and_delta(kpis["orders"])
    cust_prev, cust_delta = format_prior_and_delta(kpis["customers"])
    items_prev, items_delta = format_prior_and_delta(kpis["products_sold"])

    kpi_rows = [
        [
            Paragraph("<b>Metric</b>", cell_bold),
            Paragraph("<b>Delivered Value</b>", cell_bold),
            Paragraph("<b>Prior Period Benchmark</b>", cell_bold),
            Paragraph("<b>Growth Delta</b>", cell_bold)
        ],
        [
            Paragraph("Total GMV (incl. freight)", cell_style),
            Paragraph(kpis["gmv"]["formatted"], cell_bold),
            Paragraph(gmv_prev, cell_style),
            Paragraph(gmv_delta, cell_style)
        ],
        [
            Paragraph("Delivered Orders", cell_style),
            Paragraph(kpis["orders"]["formatted"], cell_bold),
            Paragraph(ord_prev, cell_style),
            Paragraph(ord_delta, cell_style)
        ],
        [
            Paragraph(f"Active Customers (Repeat: {kpis['customers'].get('repeat_buyer_rate', 0)}%)", cell_style),
            Paragraph(kpis["customers"]["formatted"], cell_bold),
            Paragraph(cust_prev, cell_style),
            Paragraph(cust_delta, cell_style)
        ],
        [
            Paragraph("Products Sold (Units)", cell_style),
            Paragraph(kpis["products_sold"]["formatted"], cell_bold),
            Paragraph(items_prev, cell_style),
            Paragraph(items_delta, cell_style)
        ]
    ]
    kpi_table = Table(kpi_rows, colWidths=[160, 130, 140, 102])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EEF2F6")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 10))

    # Top Categories
    categories = get_categories_breakdown(limit=6, start_date=start_date, end_date=end_date)
    elements.append(Paragraph("3. Category Revenue Distribution", section_heading))
    cat_rows = [
        [
            Paragraph("<b>Category Name</b>", cell_bold),
            Paragraph("<b>Units Sold</b>", cell_bold),
            Paragraph("<b>Total Revenue (BRL)</b>", cell_bold),
            Paragraph("<b>Market Share</b>", cell_bold)
        ]
    ]
    for c in categories:
        cat_rows.append([
            Paragraph(c["category"].replace("_", " ").title(), cell_bold),
            Paragraph(f"{c['units_sold']:,}", cell_style),
            Paragraph(f"R$ {c['revenue']:,.2f}", cell_style),
            Paragraph(f"{c['share_pct']}%", cell_style)
        ])
    cat_table = Table(cat_rows, colWidths=[180, 110, 130, 112])
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EEF2F6")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(cat_table)

    elements.append(PageBreak())

    # Page 2: Top Products & Geographic Breakdown
    elements.append(Paragraph("4. Top Revenue Products (SKU Velocity)", section_heading))
    prod_catalog = list_products(page=1, page_size=8)
    prod_rows = [
        [
            Paragraph("<b>SKU Identifier</b>", cell_bold),
            Paragraph("<b>Category</b>", cell_bold),
            Paragraph("<b>Avg Price</b>", cell_bold),
            Paragraph("<b>Units Sold</b>", cell_bold),
            Paragraph("<b>Demand Tier</b>", cell_bold)
        ]
    ]
    for p in prod_catalog["items"]:
        prod_rows.append([
            Paragraph(f"<code>{p['product_id'][:12]}...</code>", cell_style),
            Paragraph(p["category"], cell_style),
            Paragraph(f"R$ {p['price']:,.2f}", cell_style),
            Paragraph(f"{p['units_sold']:,}", cell_style),
            Paragraph(p["velocity_tier"], cell_style)
        ])
    prod_table = Table(prod_rows, colWidths=[130, 140, 95, 85, 82])
    prod_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EEF2F6")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(prod_table)
    elements.append(Spacer(1, 14))

    # Geographic Regional Sales
    geo_data = get_geographic_distribution(limit=6, start_date=start_date, end_date=end_date)
    elements.append(Paragraph("5. Geographic Concentration (Top Brazilian Hubs)", section_heading))
    geo_rows = [
        [
            Paragraph("<b>State</b>", cell_bold),
            Paragraph("<b>State Name</b>", cell_bold),
            Paragraph("<b>Active Customers</b>", cell_bold),
            Paragraph("<b>Total Orders</b>", cell_bold),
            Paragraph("<b>Avg Freight</b>", cell_bold)
        ]
    ]
    for g in geo_data:
        geo_rows.append([
            Paragraph(g["state_code"], cell_bold),
            Paragraph(g["state_name"], cell_style),
            Paragraph(f"{g['customers']:,}", cell_style),
            Paragraph(f"{g['orders']:,}", cell_style),
            Paragraph(f"R$ {g['avg_freight']:.2f}", cell_style)
        ])
    geo_table = Table(geo_rows, colWidths=[65, 160, 110, 100, 97])
    geo_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EEF2F6")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(geo_table)

    doc.build(elements, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
