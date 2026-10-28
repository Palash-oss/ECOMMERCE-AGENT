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
        # Top banner with neon orange accent
        self.setStrokeColor(colors.HexColor("#FF5A1F"))
        self.setLineWidth(2.0)
        self.line(40, 755, 572, 755)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0A0A0A"))
        self.drawString(40, 762, "NEXUSCOMMERCE AI | ENTERPRISE ANALYTICS & EXECUTIVE DOSSIER")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#71717A"))
        self.drawRightString(572, 762, "CONFIDENTIAL & AUDITED")

        # Bottom banner
        self.setStrokeColor(colors.HexColor("#E4E4E7"))
        self.setLineWidth(0.75)
        self.line(40, 42, 572, 42)

        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#71717A"))
        self.drawString(40, 30, f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())} | CockroachDB Cloud Read-Only")
        self.drawRightString(572, 30, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_server_side_pdf_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_role: str = "viewer"
) -> io.BytesIO:
    """Generates an executive, publication-grade PDF report directly in memory styled in black + neon orange."""
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
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0A0A0A"),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#52525B"),
        spaceAfter=10
    )

    section_heading = ParagraphStyle(
        "SecHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor("#0A0A0A"),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#27272A")
    )

    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#27272A")
    )

    cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0A0A0A")
    )

    cell_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    elements = []

    # Title & Scope
    elements.append(Paragraph("E-Commerce Intelligence & AI Performance Dossier", title_style))
    date_str = f"{start_date} to {end_date}" if start_date and end_date else "Last 6 Complete Months Benchmark (2018-03-01 to 2018-08-31)"
    elements.append(Paragraph(f"<b>Reporting Scope</b>: {date_str} &nbsp;|&nbsp; <b>User Access Role</b>: {user_role.upper()} &nbsp;|&nbsp; <b>CockroachDB Status</b>: READ-ONLY AUDIT", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#FF5A1F"), spaceBefore=0, spaceAfter=8))

    # Executive AI Summary
    summary = generate_executive_summary(start_date=start_date, end_date=end_date)
    elements.append(Paragraph("1. Executive Summary & Strategic Synthesis", section_heading))
    elements.append(Paragraph(f"<b>Core Finding</b>: {summary['headline']}", body_style))
    elements.append(Spacer(1, 4))

    insights_html = "<br/>".join([f"• {item}" for item in summary["insights"]])
    risks_html = "<br/>".join([f"• <b>[Risk Factor]</b> {item}" for item in summary["risks"]])
    actions_html = "<br/>".join([f"• <b>[Recommended Action]</b> {item}" for item in summary["actions"]])

    exec_table = Table([
        [Paragraph(f"<b>Key Operational Insights</b><br/>{insights_html}", cell_style)],
        [Paragraph(f"<b>Supply Chain & Growth Risks</b><br/>{risks_html}", cell_style)],
        [Paragraph(f"<b>Strategic Commercial Steps</b><br/>{actions_html}", cell_style)]
    ], colWidths=[532])
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FAFAF9")),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#E4E4E7")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    elements.append(exec_table)
    elements.append(Spacer(1, 8))

    # Macro Performance Scorecard
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
            Paragraph("<b>Metric</b>", cell_header),
            Paragraph("<b>Audited Value</b>", cell_header),
            Paragraph("<b>Prior Benchmark</b>", cell_header),
            Paragraph("<b>Growth Delta</b>", cell_header)
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
            Paragraph(f"Unique Customers (Repeat: {kpis['customers'].get('repeat_buyer_rate', 0)}%)", cell_style),
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
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0A0A0B")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAFAF9")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 8))

    # Top Categories
    categories = get_categories_breakdown(limit=6, start_date=start_date, end_date=end_date)
    elements.append(Paragraph("3. Category Revenue Distribution (Top Sectors)", section_heading))
    cat_rows = [
        [
            Paragraph("<b>Category Name</b>", cell_header),
            Paragraph("<b>Units Sold</b>", cell_header),
            Paragraph("<b>Total Revenue (BRL)</b>", cell_header),
            Paragraph("<b>Catalog Share</b>", cell_header)
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
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0A0A0B")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAFAF9")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(cat_table)

    elements.append(PageBreak())

    # Page 2: Honest Product Catalog & Geographic Breakdown
    elements.append(Paragraph("4. Top Revenue Products (Honest SKU Identifiers)", section_heading))
    elements.append(Paragraph("<i>Note: Source dataset contains no merchant product names; items are identified by category and unique short code.</i>", subtitle_style))
    prod_catalog = list_products(page=1, page_size=8)
    prod_rows = [
        [
            Paragraph("<b>Item & Short Code</b>", cell_header),
            Paragraph("<b>Category</b>", cell_header),
            Paragraph("<b>Avg Unit Price</b>", cell_header),
            Paragraph("<b>Units Sold</b>", cell_header),
            Paragraph("<b>Revenue Tier</b>", cell_header)
        ]
    ]
    for p in prod_catalog["items"]:
        short_code = p["product_id"][:6].upper()
        prod_rows.append([
            Paragraph(f"<b>[{short_code}]</b> {p['title']}", cell_style),
            Paragraph(p["category"], cell_style),
            Paragraph(f"R$ {p['price']:,.2f}", cell_style),
            Paragraph(f"{p['units_sold']:,}", cell_style),
            Paragraph(p["velocity_tier"], cell_style)
        ])
    prod_table = Table(prod_rows, colWidths=[160, 120, 90, 80, 82])
    prod_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0A0A0B")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAFAF9")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(prod_table)
    elements.append(Spacer(1, 12))

    # Geographic Regional Sales
    geo_data = get_geographic_distribution(limit=6, start_date=start_date, end_date=end_date)
    elements.append(Paragraph("5. Geographic Concentration (Top Consumer Hubs)", section_heading))
    geo_rows = [
        [
            Paragraph("<b>State</b>", cell_header),
            Paragraph("<b>Region Name</b>", cell_header),
            Paragraph("<b>Active Buyers</b>", cell_header),
            Paragraph("<b>Total Orders</b>", cell_header),
            Paragraph("<b>Avg Freight (BRL)</b>", cell_header)
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
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0A0A0B")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAFAF9")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(geo_table)

    doc.build(elements, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
