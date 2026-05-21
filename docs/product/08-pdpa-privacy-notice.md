# PDPA Privacy Notice And Consent Draft

Date: 2026-05-21

Status: counsel-review draft. This is product and engineering guidance, not legal advice. Do not publish this page or collect real swipe data until Thai counsel approves the exact Thai and English copy, operating entity, vendors, retention, cross-border transfer basis, and consent flow.

## Product Position

SorsorRank lets people inspect public figures through a daily research flow and aggregate public-interest signals. If the product collects real swipes about real public figures, those swipes may reveal or infer political opinions. Treat them as sensitive personal data.

The PDPA posture is:

- Consent before any swipe storage.
- Specific, plain-language purpose.
- No bundled "accept all" wall.
- No sale, ad targeting, voter targeting, or lookalike audiences.
- Short raw-event retention.
- Easy withdrawal and deletion request path.
- Public output is aggregate only.

## User-Facing Privacy Notice Draft

### Short Notice

SorsorRank uses your swipes only to create aggregate research-interest signals about public figures. Your Research and Skip choices may reveal political opinions, which can be sensitive personal data.

We do not sell your swipe data, use it for ad targeting, show your individual history publicly, or require you to agree to optional tracking to read our methodology or contact us.

### Who Controls The Data

Data controller: `[Legal entity name]`

Contact: `[privacy email]`

Address: `[registered address, if required]`

Data protection contact or DPO: `[name/contact, if appointed]`

Thailand representative, if required: `[name/contact]`

### What We Collect

Before consent:

- Basic server/security logs generated when the website loads.
- No stored swipes.
- No persistent political-interest profile.
- No Google Search click tracking.

After you agree and start swiping:

- Pseudonymous visitor key.
- Consent version and privacy-notice version.
- Card impressions needed to count your daily 10.
- Research or Skip action.
- Card impression id and idempotency key to prevent duplicate counts.
- Timestamp and date.
- Short-retention rate-limit data.

If you contact us:

- Contact details you provide.
- Request type and message.
- Operational notes needed to answer the request.

We do not collect for swiping:

- Legal name.
- Phone number.
- Email address.
- Precise location.
- National ID.
- Social account id.
- Raw IP address in swipe analytics.
- Raw user-agent in swipe analytics.
- Hosted comments or free-text political opinions.
- Google Search click history in MVP.

### Why We Use The Data

We use consented swipe data for:

- Daily 10-card limit.
- Duplicate-swipe prevention.
- Aggregate Research Interest Rank or other aggregate public-interest displays.
- Abuse prevention and service security.
- Debugging for a short period.
- Responding to privacy, correction, takedown, or legal requests.

We do not use swipe data for:

- Ads.
- Sale to third parties.
- Campaign targeting.
- Voter targeting.
- Lookalike audiences.
- Individual political profiles.
- Candidate, party, campaign, PAC, or proxy coordination.

### Sensitive Data Notice

Your swipes about real public figures may reveal or infer political opinions. By choosing `Agree and start swiping`, you explicitly consent to SorsorRank collecting, using, and disclosing your swipe data only for the purposes described in this notice.

You can decline consent. If you decline, you can still read the methodology, privacy notice, and contact page, but you cannot submit swipes.

### Retention

| Data | Default retention |
|---|---:|
| Raw swipe events | 7 days maximum |
| Card impression ids and idempotency keys | 7 days maximum |
| Rate-limit keys | Short retention with rotated salt |
| Daily aggregate counts | Retained after aggregation and anonymization |
| Consent records | Retained only as needed to prove consent version and honor withdrawal/deletion |
| Contact, takedown, and rights requests | Retained as needed for legal and operational accountability |
| Admin audit logs | Retained as needed for security and accountability |
| Infrastructure/security logs | Separate from swipe analytics; retention set after counsel review |

When the retention period ends, raw personal data must be deleted, destroyed, or anonymized unless a legal hold, legal claim, or law requires longer retention.

### Sharing And Processors

We may use service providers for:

- Static hosting.
- Serverless API hosting.
- Database.
- Security logging.
- Email/contact intake.
- Error monitoring.

Current vendor list: `[fill before launch]`

Each vendor must be reviewed before launch. Vendors may process data outside Thailand. Cross-border transfer basis and processor terms must be approved before public launch.

We do not share swipe-level data with candidates, parties, campaigns, advertisers, data brokers, or social platforms.

### Your Rights

Subject to legal limits, you can request to:

- Access your personal data.
- Receive a copy of your personal data.
- Withdraw consent.
- Delete, destroy, or anonymize your personal data.
- Correct inaccurate data.
- Restrict use.
- Object where applicable.
- Ask how we obtained data.
- File a complaint with the competent authority.

Request channel: `[privacy email or form URL]`

Target response time: without delay and no later than 30 days after receiving a valid request, unless counsel confirms a different legally required timeline.

### Withdrawal

You can withdraw consent at any time. Withdrawal does not affect processing already completed before withdrawal, but we will stop collecting new swipe data from you and process deletion or anonymization where required.

### Children And Minors

SorsorRank must not target underage users or collect swipes from minors until counsel approves the age gate and parental-consent flow.

### Security

We use appropriate technical and organizational measures, including:

- Server-side swipe recording.
- No direct public writes to sensitive tables.
- Row Level Security or equivalent database controls.
- Pseudonymous visitor keys.
- Secret-key hashing for visitor identifiers.
- Admin authentication and least-privilege access.
- Audit logs for roster, freeze, compliance, and admin changes.
- Retention cleanup jobs.
- Separation between security logs and swipe analytics.

### Breach Response

Potential personal data breaches must be escalated immediately to the privacy owner and counsel. The team must assess whether notification to the PDPC is required, and where feasible prepare notification within 72 hours after becoming aware of the breach if required.

## Consent Screen Copy

### Screen Title

Before you swipe

### Body Copy

Your Research and Skip choices about real public figures may reveal political opinions. If you agree, SorsorRank will store your choices with a pseudonymous visitor key and use them only for aggregate research-interest results, daily limits, duplicate prevention, abuse prevention, and short-term debugging.

Raw swipe events are deleted within 7 days. Aggregate counts may remain after they no longer identify you.

SorsorRank is not a poll, endorsement, election forecast, or voting guide.

### Required Checkbox

I understand that my swipes may be sensitive political-opinion data, and I explicitly consent to SorsorRank collecting and using them for the purposes described above.

### Required Checkbox

I understand that public results are aggregate research-interest signals, not individual profiles, not voting advice, and not a scientific poll.

### Buttons

- `Agree and start swiping`
- `Decline and read methodology`
- `Read full privacy notice`

Rules:

- No pre-checked boxes.
- Do not require optional analytics, marketing, email, share tracking, or Google-click tracking.
- Do not create stored swipe data, persistent visitor keys, share events, or Google-click events before consent.
- Re-consent when the privacy notice or processing purpose materially changes.

## Implementation Requirements

### Data Model Requirements

Consent records must include:

- `visitor_key`
- `consent_version`
- `privacy_notice_version`
- `accepted_at`
- `declined_at`
- `withdrawn_at`
- `deletion_requested_at`

Swipe events must include:

- `visitor_key_hash`
- `politician_id`
- `action`
- `card_impression_id`
- `idempotency_key`
- `occurred_on`
- `created_at`
- `expires_at`

Swipe analytics must not include:

- Raw IP address.
- Raw user-agent.
- Contact details.
- Free-text opinions.
- Google Search click history.

### Feature Flags

Safe defaults:

- `rankings_public=false`
- `google_click_tracking_enabled=false`
- `paid_growth_enabled=false`
- `public_rank_active_candidates_enabled=false`
- `compliance_review_required=true`

### Access Control

- Public client cannot write directly to swipe, aggregate, consent, roster, or audit tables.
- Swipe recording must happen through a server-side function.
- Admin routes require authentication and authorization.
- Admin access must be logged.
- Vendor/admin access must use least privilege.

### Data Subject Request Workflow

1. User submits request through privacy form or email.
2. Request is stored as `data_subject_request`.
3. Team verifies request enough to avoid disclosing data to the wrong person.
4. Privacy owner reviews affected data categories.
5. Counsel reviews edge cases, legal holds, or authority requests.
6. Team completes access, deletion, anonymization, correction, restriction, or rejection.
7. Outcome and reason are logged.

### Retention Workflow

- Daily job deletes expired raw swipe events.
- Daily job deletes expired card impression and idempotency keys.
- Rate-limit salts rotate on a documented schedule.
- Aggregates are retained only after they are not linkable to a user.
- Security logs are stored separately and not joined to swipe behavior for analytics.

### Testing Requirements

Required tests:

- Cannot swipe without consent.
- Declined consent creates no persistent political-interest profile.
- Consent version is recorded.
- Re-consent is required after notice version change.
- Withdrawal prevents future swipe storage.
- Deletion request creates a reviewable ticket.
- Raw swipe event expires after 7 days.
- No raw IP or raw user-agent is stored in swipe analytics.
- Google-click tracking is disabled by default.
- Public rankings cannot publish without compliance approval.
- Active-candidate public ranking is blocked by default.
- Security logs are not joined to swipe analytics.

## Open Items Before Launch

- Fill legal entity and contact details.
- Decide whether a DPO is required or appoint a DPO-equivalent owner.
- Confirm Thai representative obligations if operating outside Thailand.
- Complete vendor and cross-border transfer review.
- Translate and counsel-review Thai privacy notice.
- Counsel-review consent screen.
- Counsel-review data subject request workflow.
- Counsel-review retention for infrastructure/security logs.
- Decide whether underage users are blocked or age-gated.

## Source Anchors

- ETDA-hosted unofficial English translation of the Personal Data Protection Act B.E. 2562: https://www.etda.or.th/getattachment/e820df2c-848f-4e03-86cb-a9dad38cc713/ENG-Version.aspx
- PDPA Section 19 consent text, unofficial English rendering: https://pdpathailand.com/pdpa/content_eng/article19_eng.php
- PDPA Section 23 privacy-notice text, unofficial English rendering: https://pdpathailand.com/pdpa/content_eng/article23_eng.php
- PDPA Section 26 sensitive personal data text, unofficial English rendering: https://pdpathailand.com/pdpa/content_eng/article26_eng.php
- Government Platform for PDPA Compliance: https://gppc.pdpc.or.th/
