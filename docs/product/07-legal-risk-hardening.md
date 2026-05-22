# Legal Risk Hardening Review

Date: 2026-05-21

## Bottom Line

The previous plan had the right product instinct, but it was not launch-safe enough. The app touches inferred political opinion data, public figures, election timing, viral sharing, and Thai law. No product document can guarantee legal compliance.

Default decision: public launch is blocked until Thai counsel approves the exact implementation. Before that, only a private alpha is acceptable, with public rankings off, active candidates excluded, no paid or targeted growth, no Google-click tracking, and a tested freeze mode.

## Critical Findings

### 1. Sensitive Political Data Risk

Swipes can reveal or infer political opinions. Under the Thai PDPA translation, political opinions are sensitive personal data. The plan must treat `Crush`, `Pass`, card impressions, persistent visitor IDs, share events, and future Google-click tracking as sensitive or potentially sensitive. "Crush" as a product word does not reduce the legal sensitivity of the underlying swipe data.

Hardening:

- Explicit consent before storing any political interaction data (Crush/Pass swipe events).
- Withdrawal and deletion path before public launch.
- No Google-click tracking in MVP.
- No sale, ads, retargeting, lookalike audiences, or third-party sharing.
- Raw swipe events expire within 7 days.
- Infrastructure logs stay separate from swipe analytics.

### 2. Election Influence Risk

Even neutral ranking can be interpreted as candidate momentum or opposition, especially during a local campaign. The June 28, 2026 Bangkok/Pattaya elections make the timing sensitive now.

Hardening:

- Active candidates are excluded from public rankings during election windows by default.
- Public rank snapshots are disabled during freeze mode.
- Paid boosts, influencer seeding, candidate coordination, and location-targeted growth are banned.
- Election blackout applies from 18:00 the day before election day through the end of election day for any covered-race content.
- Any authority request is escalated to counsel and logged.

### 3. Foreign Participation Risk

If non-Thai people operate, fund, promote, or administer active-election features, local election-law risk increases.

Hardening:

- Non-Thai operators, contractors, investors, or growth helpers must not touch active-election candidate coverage, promotion, or ranking decisions until counsel reviews the role.
- The safest MVP avoids active candidates entirely.

### 4. Defamation And Computer-Crime Risk

Hosted political claims, summaries, snippets, comments, or accusations would materially increase risk.

Hardening:

- Cards stay sparse: name, optional role/party, neutral Google link, Crush, Pass.
- No bios, allegations, search snippets, AI summaries, comments, labels, edited images, romantic/sexual descriptors, or user-submitted political text.
- Search query is neutral: name plus optional role/party only.
- Complaint about illegality, defamation, election influence, or monarchy/royal-institution content hides/freezes affected content pending counsel review.

### 5. Royal-Institution Risk

Any monarchy, royal family, or royal-institution content is outside scope.

Hardening:

- Roster review includes a royal-institution exclusion check.
- Such content cannot be added, searched, ranked, shared, or used in copy.

### 6. Public Ranking Interpretation Risk

"Crush Rank" is playful but the underlying data is still political opinion inference. A threshold reduces manipulation and confusion but does not eliminate legal risk. Counsel must be briefed on the Tinder framing before public launch.

Hardening:

- Ranking label is "Crush Rank" with required subtitle: "Collective research interest — not a poll or endorsement."
- Required disclaimer appears near rankings verbatim: "Crush Rank measures research interest, not romantic, sexual, electoral, or moral preference."
- Minimum default public threshold is 100 eligible consented impressions per figure per ranking period.
- No demographic, district-level, or micro-geographic ranks.
- No public Crush Rank in private alpha.
- No active-candidate rows during election windows unless counsel approves exact release.
- Battle Mode (head-to-head pairs) follows same rules; fully disabled during any election window.

### 7. Growth Risk

The viral loop can become campaign amplification if Match Cards reveal names, rankings, or timing around candidates. "Tinder for politicians" framing requires active monitoring that users do not interpret Crush Rank as romantic preference, election support, or opposition momentum.

Hardening:

- Match Cards show participation only, never names or Crush/Pass history.
- Crush Rank snapshots disabled during election freeze and active-candidate rosters.
- No paid traffic, boosted posts, compensated creators, candidate-specific promotion, or targeted ads during election-sensitive periods.
- Monitor social screenshots: stop public Crush Rank if users frame the product as support, opposition, voting advice, campaign momentum, or romantic preference for a public figure.

### 8. Minors Risk

The target audience includes "young" users. Sensitive political data plus minors is a legal-review blocker.

Hardening:

- Do not target underage users until counsel approves age gating and consent handling.
- Product copy should avoid school/minor targeting.

### 9. Vendor And Cross-Border Risk

Static hosting plus Supabase or another BaaS may involve cross-border processing and processors.

Hardening:

- Counsel reviews controller/processor roles, cross-border transfers, data processing agreements, logging, and support-tool access before public launch.
- Admin/support tools use least privilege and audit logs.

## Go / No-Go Rules

No-go if any are true:

- Counsel has not approved the exact launch.
- Active candidates are included during an election window.
- Freeze mode is missing or untested.
- Consent, withdrawal, privacy notice, methodology, or takedown page is missing.
- Raw swipe retention exceeds 7 days without counsel approval.
- Google-click tracking is enabled.
- Paid or targeted growth is planned.
- Roster review lacks source URLs, active-candidate flags, election jurisdiction, and two-reviewer approval.
- Public copy uses banned terms (vote, endorse, support, approval, prediction, winner, momentum) outside negative disclaimers.
- UI copy applies romantic or sexual descriptors to any individual figure.
- Any monarchy, royal-family, or royal-institution content is present.

Go only if all are true:

- Private alpha: public ranks off, active candidates excluded, consent live, takedown/contact live, retention cleanup tested.
- Public soft launch: counsel approved, methodology and privacy pages live, public thresholds enforced, roster audited, freeze mode tested, election calendar checked.
- Viral push: no active election freeze, no paid/targeted promotion, safety metrics show users are not interpreting the rank as support, opposition, or vote intent.

## Source Anchors

- Election Commission of Thailand homepage: https://www.ect.go.th/
- ECT unofficial English translation of the Local Councils or Local Executives Election Act B.E. 2562: https://www.ect.go.th/mini/web-upload/migrate/ect_en/download/article/article_20221202134032.pdf
- ETDA-hosted unofficial English translation of the Personal Data Protection Act B.E. 2562: https://www.etda.or.th/getattachment/e820df2c-848f-4e03-86cb-a9dad38cc713/ENG-Version.aspx
- Unofficial English translation of the Computer-Related Crime Act B.E. 2550: https://www.thailawforum.com/unofficial-translation-of-computer-related-crime-act-b-e-2550-2007/
- Unofficial English translation of Thai Criminal Code royal-family sections: https://library.siam-legal.com/thai-law/criminal-code-royal-family-sections-107-112/
