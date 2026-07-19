// ─── P1 · SKU Alert engine (July 2026 spec) ───────────────────────────────────
// Rules engine over per-parent-SKU metrics. CM = Settlement − COGS(settled units)
// (Bug #1), CM% = CM ÷ Settlement (Improvement A), return rate = returned units ÷
// units sold. Thresholds are the documented defaults (hardcoded for now).

export const ALERT_THRESHOLDS = {
    lowMarginPct:   0.10,  // CM% below this → LOW_MARGIN
    highReturnRate: 0.05,  // return rate above this → HIGH_RETURN
    heavyPct:       0.20,  // promo / affiliate / ads above this share of Net GMV → *_HEAVY
}

// Lower rank = more severe (drives sort order).
export const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

// Static metadata per rule (severity + colour bucket). `label`/copy is resolved via i18n at render.
export const ALERT_RULES = {
    LOSS:            { severity: 'critical' },
    NO_COGS:         { severity: 'high' },
    LOW_MARGIN:      { severity: 'high' },
    HIGH_RETURN:     { severity: 'medium' },
    PROMO_HEAVY:     { severity: 'medium' },
    AFFILIATE_HEAVY: { severity: 'medium' },
    ADS_HEAVY:       { severity: 'medium' },
}

// Evaluate one parent-SKU's metrics against every rule. Returns the flags it trips
// (empty array = healthy → not shown in the alert panel).
// metrics: { settlement, cm, cmPct, returnRate, promoSeller, affiliate, ads, netGmv, missingCogs }
export function evaluateSkuAlerts(m, th = ALERT_THRESHOLDS) {
    const flags = []

    // Data quality first — a variant with no parent COGS is surfaced, never silently skipped.
    if (m.missingCogs) flags.push('NO_COGS')

    // Margin rules only meaningful when there is settlement to divide by.
    if ((m.settlement ?? 0) > 0) {
        if (m.cm < 0) flags.push('LOSS')
        else if (m.cmPct != null && m.cmPct < th.lowMarginPct) flags.push('LOW_MARGIN')
    }

    if ((m.returnRate ?? 0) > th.highReturnRate) flags.push('HIGH_RETURN')

    // *_HEAVY are based on per-parent Net GMV. In July these inputs are 0 → dormant;
    // they light up from Aug once promo/affiliate/ads carry values.
    const netGmv = m.netGmv ?? 0
    if (netGmv > 0) {
        if ((m.promoSeller ?? 0) > th.heavyPct * netGmv) flags.push('PROMO_HEAVY')
        if ((m.affiliate ?? 0)  > th.heavyPct * netGmv) flags.push('AFFILIATE_HEAVY')
        if ((m.ads ?? 0)        > th.heavyPct * netGmv) flags.push('ADS_HEAVY')
    }

    return flags.map(rule => ({ rule, severity: ALERT_RULES[rule].severity }))
}

// Most severe flag on a row (for badge colour + sort). Returns null when none.
export function topSeverity(flags) {
    if (!flags?.length) return null
    return flags.reduce((best, f) =>
        SEVERITY_RANK[f.severity] < SEVERITY_RANK[best] ? f.severity : best, flags[0].severity)
}

// Sort alert rows: severity (critical→high→medium), then absolute CM impact.
export function sortAlertRows(rows) {
    return [...rows].sort((a, b) => {
        const s = SEVERITY_RANK[a.topSeverity] - SEVERITY_RANK[b.topSeverity]
        return s !== 0 ? s : Math.abs(b.cm ?? 0) - Math.abs(a.cm ?? 0)
    })
}
