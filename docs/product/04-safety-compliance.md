# Safety and Thai-Law Guardrails

This is not legal advice. These controls reduce risk; they do not make the product "legal" by themselves and they cannot guarantee that no law will be violated. Before any public launch in Thailand, Thai counsel must review the exact product flow, copy, data model, vendors, launch timing, roster, share surfaces, and growth plan.

## Current Timing Note

As of 2026-05-21, the Election Commission of Thailand homepage lists Bangkok and Pattaya local elections for Sunday, 2026-06-28, 08:00-17:00. Treat the current period as election-sensitive for Bangkok and Pattaya until counsel says otherwise.

Required conservative stance:

- Do not include Bangkok or Pattaya active candidates in public rankings before counsel review.
- Do not run public ranking, rank snapshot sharing, paid promotion, influencer seeding, or location-targeted growth for a covered race during the election-sensitive period.
- Apply a hard blackout from 18:00 on 2026-06-27 through the end of 2026-06-28 for any content or feature that could be read as causing favorable or adverse effects on a candidate.
- If the Election Commission or a competent authority requests correction, deletion, blocking, data preservation, or information, escalate to counsel immediately and preserve the request in the audit log.

Reference sources:

- Election Commission of Thailand homepage listing Bangkok/Pattaya election date: https://www.ect.go.th/
- ECT unofficial English translation of the Local Councils or Local Executives Election Act B.E. 2562, including non-Thai participation, campaign silence, and electronic campaign correction/deletion powers: https://www.ect.go.th/mini/web-upload/migrate/ect_en/download/article/article_20221202134032.pdf
- ETDA-hosted unofficial English translation of the Personal Data Protection Act B.E. 2562: https://www.etda.or.th/getattachment/e820df2c-848f-4e03-86cb-a9dad38cc713/ENG-Version.aspx
- Unofficial English translation of the Computer-Related Crime Act B.E. 2550: https://www.thailawforum.com/unofficial-translation-of-computer-related-crime-act-b-e-2550-2007/
- Unofficial English translation of Thai Criminal Code royal-family sections: https://library.siam-legal.com/thai-law/criminal-code-royal-family-sections-107-112/

## Hard Launch Gates

Public launch is blocked until all are true:

- Thai counsel has approved exact Thai and English copy, consent flow, privacy notice, methodology, roster policy, ranking display, share cards, data retention, vendor choices, and launch timing.
- Counsel has identified the operating entity, applicable jurisdictions, whether the app is a service provider under computer-crime rules, and whether a Thai representative, DPO, or other local role is required.
- A data map and record of processing exists for consent records, swipe events, share events, contact requests, admin audit logs, security logs, and vendor logs.
- Processor agreements and cross-border transfer basis are in place for hosting, analytics, logging, email, image generation, and support tools.
- Data-subject request handling is implemented for access, deletion, withdrawal, restriction, objection, and contact escalation.
- Breach response is documented, including PDPA notification analysis within 72 hours after awareness.
- Freeze mode is tested end to end.
- Roster audit is complete and signed off by two reviewers.
- Public ranking threshold is configured and tested.
- Takedown/contact page is live and monitored.

## Product Boundaries

SorsorRank must be framed as:

- Research interest.
- Daily curiosity.
- Aggregate participation.
- Not a poll or endorsement.

SorsorRank must not be framed as:

- Voting advice.
- Candidate support or opposition.
- Approval rating.
- Election polling.
- Forecasting.
- Odds.
- Campaigning.
- Momentum, winning, or leading.

The word "vote" is allowed only in negative disclaimers or methodology, such as "not vote intent" or "not a voting guide." It must not appear in CTAs, share cards, button labels, rank labels, or growth copy.

## PDPA Precautions

Swipe behavior can reveal or infer political opinions. Treat all interaction data as sensitive personal data unless counsel says otherwise.

Requirements:

- Explicit consent before storing swipes, persistent visitor identifiers, share events, Google-click events, or any political interaction data.
- Consent must be specific, informed, withdrawable, logged by version, and not bundled with marketing.
- Plain privacy notice before collection, including purpose, retention, recipients, cross-border transfers, rights, and contact path.
- Purpose limitation: aggregate research-interest ranking and abuse prevention only.
- Data minimization: do not collect names, phone numbers, emails, precise location, device fingerprints, or social IDs for swiping.
- No sale, ad targeting, voter targeting, lookalike audiences, or third-party sharing of political interaction data.
- No public user-level political profiles or per-user history exports.
- No Google-click tracking in MVP. If added later, it needs separate consent, separate purpose text, and counsel approval.
- No persistent offline queue of swipes in the browser.

Recommended retention:

- Raw swipe events: 7 days maximum.
- Consent records: retain only what is needed to prove consent version and honor withdrawal/deletion.
- Aggregates: retained by day/public figure after anonymization.
- Rate-limit keys: short retention and rotated salt.
- Contact/takedown and admin audit logs: retained as needed for legal and operational accountability.
- Infrastructure traffic logs: keep separate from political analytics. If counsel determines computer-traffic retention duties apply, satisfy them in a segregated security-log store with strict access controls, not in swipe analytics tables.

Additional PDPA controls:

- Appoint a DPO or DPO-equivalent owner before public launch, because the core activity may involve Section 26 sensitive data.
- If targeting minors or "young users," do not launch to underage users until counsel approves an age gate and parental-consent handling.
- If the controller or processor is outside Thailand but offers the service to users in Thailand or monitors behavior in Thailand, counsel must review representative and cross-border obligations.

## Defamation And Computer-Crime Risk

Do not host:

- Allegations.
- Accusations.
- User comments.
- AI summaries.
- Negative labels.
- "Corrupt," "criminal," "dangerous," or similar tags.
- Scraped search snippets.
- Edited or humiliating images.
- User-submitted political text.

Allowed:

- Name.
- Optional role/party for disambiguation.
- Neutral Google Search link.
- Aggregate research-interest rank if not frozen and above threshold.
- Methodology.

Operational controls:

- Search queries must be neutral: name plus optional role/party only.
- Any complaint about false, defamatory, unlawful, or election-sensitive content triggers immediate hide-or-freeze pending counsel review.
- Legal orders, ECT requests, and takedown requests must be logged with timestamp, requester, affected content, action taken, and reviewer.

## Election Risk

Default rule: active-candidate coverage is off for public rankings and share previews during election windows.

Required controls:

- Freeze mode.
- Public rank threshold.
- Methodology page.
- Neutral share copy.
- No paid boosting.
- No campaign accounts.
- No candidate, party, campaign staff, PAC, or proxy coordination.
- No influencer compensation or unpaid seeding tied to a candidate or covered election.
- No vote-intention language.
- No race-specific, district-specific, or demographic ranking views.
- No targeting or retargeting based on location, inferred politics, search interest, or public-figure interest.

Freeze mode must be available before launch. It can:

- Pause swiping.
- Hide rankings.
- Freeze ranking updates.
- Disable rank snapshot sharing.
- Show a neutral banner explaining the pause.

Foreign involvement risk:

- If any operator, investor, contractor, admin, or growth helper is not Thai, do not let that person work on active-election candidate coverage, promotion, or ranking decisions until counsel reviews Section 68 risk.

## Roster Rules

Exclude:

- Monarchy, royal family, and royal-institution topics.
- Private citizens.
- Minors.
- People included only because of scandal/accusation.
- Active candidates in a current election window unless counsel explicitly approves.

Prefer:

- Public officeholders.
- Public political figures.
- People whose identity is already public in a civic context.
- Non-active-candidate roster entries for MVP.

Every roster entry needs:

- Source URL proving public civic role.
- Category: officeholder, former officeholder, party official, active candidate, other public figure.
- Election jurisdiction if any.
- Active-candidate flag.
- Royal-institution exclusion check.
- Two-reviewer approval.
- Admin audit log for creation, edit, activation, archive, and deletion.

Photos are excluded from MVP unless rights, privacy, and defamation review are complete.

## Copy Red Lines

Banned in public UI/share/growth copy except negative disclaimers or methodology:

- vote
- support
- endorse
- best
- winner
- leading
- approval
- odds
- prediction
- hot
- match
- crush

Required disclaimer near rankings:

> Research Interest Rank is an aggregate curiosity signal. It is not a poll, endorsement, prediction, approval rating, or voting guide.

## Launch Checklist

- Counsel reviewed exact copy and flow.
- Consent screen approved.
- Privacy notice live.
- Data-subject request path live.
- Methodology page live.
- Contact/takedown page live.
- DPO or DPO-equivalent owner assigned.
- Vendor and cross-border review complete.
- Freeze mode tested.
- Raw retention cleanup tested.
- Security-log retention separated from swipe analytics.
- Share cards reviewed.
- Roster reviewed by two reviewers.
- Minimum sample threshold configured.
- Election calendar reviewed for all roster jurisdictions.
- Active-candidate and election-window flags tested.
- Public copy checked for banned terms.
