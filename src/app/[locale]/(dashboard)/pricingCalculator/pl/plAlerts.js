// ─── P1 · SKU Alert engine (July 2026 spec) ───────────────────────────────────
// Rules engine over per-parent-SKU metrics. CM = Settlement - COGS(settled units)
// (Bug #1), CM% = CM ÷ Settlement (Improvement A), return rate = returned units ÷
// units sold. Thresholds are the documented defaults (hardcoded for now).

export const ALERT_THRESHOLDS = {
    lowMarginPct:   0.10,  // CM% below this → LOW_MARGIN
    highReturnRate: 0.05,  // return rate above this → HIGH_RETURN
}

// Map the persisted per-account config (snake_case fractions) onto the engine's
// threshold shape, falling back to the documented defaults for any missing field.
export function thresholdsFromConfig(cfg) {
    if (!cfg) return ALERT_THRESHOLDS
    const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d)
    return {
        lowMarginPct:   num(cfg.low_margin_pct,   ALERT_THRESHOLDS.lowMarginPct),
        highReturnRate: num(cfg.high_return_rate, ALERT_THRESHOLDS.highReturnRate),
    }
}

// Lower rank = more severe (drives sort order).
export const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

// Static metadata per rule (severity + colour bucket). `label`/copy is resolved via i18n at render.
export const ALERT_RULES = {
    LOSS:            { severity: 'critical' },
    NO_COGS:         { severity: 'high' },
    LOW_MARGIN:      { severity: 'high' },
    HIGH_RETURN:     { severity: 'medium' },
}

// Evaluate one SKU's metrics against every rule. Returns the flags it trips
// (empty array = healthy → not shown in the alert panel).
// metrics: { settlement, cm, cmPct, returnRate, missingCogs }
export function evaluateSkuAlerts(m, th = ALERT_THRESHOLDS) {
    const flags = []

    // Data quality first - a variant with no parent COGS is surfaced, never silently skipped.
    if (m.missingCogs) flags.push('NO_COGS')

    // Margin rules only meaningful when there is settlement to divide by.
    if ((m.settlement ?? 0) > 0) {
        if (m.cm < 0) flags.push('LOSS')
        else if (m.cmPct != null && m.cmPct < th.lowMarginPct) flags.push('LOW_MARGIN')
    }

    if ((m.returnRate ?? 0) > th.highReturnRate) flags.push('HIGH_RETURN')

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
