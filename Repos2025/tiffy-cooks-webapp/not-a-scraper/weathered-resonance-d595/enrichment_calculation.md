# Enrichment Rate Calculation

## Current State
- **Total Lawyers:** 16,699
- **With Phone:** 3 (0.02%)
- **With Email:** 2 (0.01%)
- **With Address:** 3 (0.02%)
- **Need Enrichment:** ~16,696 lawyers (99.98%)

## Assumptions
- ~67% are actual law firms (based on sample)
- ~80% success rate for enrichment (some sites won't be scrapable)
- Target: Get 40%+ with phone numbers (industry standard for directories)

## Enrichment Options

### Option 1: Slow & Steady (50/day)
- **Rate:** 50 lawyers/day
- **Time to enrich all:** ~334 days (~11 months)
- **Time to 40% coverage:** ~134 days (~4.5 months) assuming 80% success
- **Pros:** Low resource usage, sustainable
- **Cons:** Takes almost a year to catch up

### Option 2: Moderate (100/day)
- **Rate:** 100 lawyers/day
- **Time to enrich all:** ~167 days (~5.5 months)
- **Time to 40% coverage:** ~67 days (~2 months)
- **Pros:** Good balance, reasonable timeline
- **Cons:** Higher resource usage

### Option 3: Aggressive (200/day)
- **Rate:** 200 lawyers/day
- **Time to enrich all:** ~84 days (~2.8 months)
- **Time to 40% coverage:** ~34 days (~1 month)
- **Pros:** Fast catch-up
- **Cons:** Higher resource usage, more API calls

### Option 4: Focused (75/day, law firms only)
- **Rate:** 75 law firms/day (prioritize actual firms)
- **Time to enrich law firms:** ~150 days (~5 months) for ~11,000 law firms
- **Time to 40% coverage:** ~60 days (~2 months)
- **Pros:** Better ROI (focus on valuable records)
- **Cons:** Court/gov sites stay unenriched (but that's fine)

## Recommendation

**Option 2 (100/day) or Option 4 (75/day law firms only)**

- Reasonable timeline (2-5 months)
- Sustainable resource usage
- Good balance of speed vs. cost
