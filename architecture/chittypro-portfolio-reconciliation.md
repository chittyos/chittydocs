# ChittyPro™ portfolio reconciliation

Status: **Provisional / registry verification pending**  
Canonical work: [chittyapps/chittypro-ecosystem#2](https://github.com/chittyapps/chittypro-ecosystem/issues/2)  
Scope: ChittyPro product family, services, clients and ChittyOS dependencies.

## Architecture rule

ChittyPro™ is the professional application and experience family. ChittyOS provides shared identity, authorization, evidence provenance, ledger/fact governance, registry, policy and orchestration. Repository naming does not prove product identity, deployment or canonical ownership. One canonical capability may have several controlled projections. No new databases, schemas or duplicate sources of truth.

## Source-backed inventory and provisional dispositions

| Repository | Observed purpose | Disposition |
| --- | --- | --- |
| [chicagoapps/chittypro-contradictionengine](https://github.com/chicagoapps/chittypro-contradictionengine) | Existing legal-centric contradiction and evidence bundle application | hold pending canonical owner; refactor toward domain-agnostic core and legal adapter |
| [chittyapps/chittypro-contradictionengine](https://github.com/chittyapps/chittypro-contradictionengine) | Empty duplicate-named repository | merge candidate; no deletion |
| [chicagoapps/chittypro-legalink](https://github.com/chicagoapps/chittypro-legalink) | Legal case management, timeline, document and financial analytics | legal-only |
| [chicagoapps/chittypro-crtlo](https://github.com/chicagoapps/chittypro-crtlo) | Chicago Residential Landlord and Tenant Ordinance compliance app | legal-only |
| [furnished-condos/ChittyPro-FinePrint](https://github.com/furnished-condos/ChittyPro-FinePrint) | Furnished-Condos leasing, tenant/landlord identity and e-signature portal | hold: vertical vs product brand |
| [furnished-condos/ChittyPro-Compile](https://github.com/furnished-condos/ChittyPro-Compile) | Application source exists, scope unverified | hold |
| [chicagoapps/chittypro-credit](https://github.com/chicagoapps/chittypro-credit) | Source exists; README identifies credit-rep | hold |
| [furnished-condos/chittypro-valuation](https://github.com/furnished-condos/chittypro-valuation) | Minimal furnished-condo valuation console reference | hold |
| [chitcommit/chittypro-streamlink](https://github.com/chitcommit/chittypro-streamlink) | WebSocket / RTSP streaming relay application | hold: internal integration or product |
| [chittyos/chittypro-resolvIT](https://github.com/chittyos/chittypro-resolvIT) | GitHub stale/bot issue cleanup, not dispute resolution | skill candidate |
| [chittyapps/chittypro-integrateit](https://github.com/chittyapps/chittypro-integrateit) | Empty placeholder | hold |
| [chittyapps/chittypro-ecosystem](https://github.com/chittyapps/chittypro-ecosystem) | Portfolio coordination repository | project |
| [chittyos/chittypro-mobile](https://github.com/chittyos/chittypro-mobile) | Minimal mobile distribution scaffold | project |
| [chittyos/chittypro-desktop](https://github.com/chittyos/chittypro-desktop) | Minimal desktop distribution scaffold | project |

**Outside ChittyPro:** [ChittyProof](https://github.com/chittyapps/chittyproof) is a ChittyOS Tier 0 cryptographic trust anchor, according to its charter.

## Confirmed discrepancies

- ChittyPro Mobile and Desktop charters both claim `chittycanon://core/services/canon`; their actual canonical identities must be verified before correction.
- ContradictionEngine's charter and package naming require compliance reconciliation; its current legal-specific implementation must not be mistaken for a matter-agnostic core.
- FinePrint's actual leasing-portal function is narrower than its name suggests.
- ResolvIT is developer issue cleanup, not business dispute resolution.
- No authoritative registry or live deployment inventory has been verified. Product availability is **not established**.

## Execution sequence

1. **P0:** Query ChittyRegistry for canonical service URI, owner, tier, status, routes and deployed health. Mark unknowns HOLD.
2. **P0:** Reconcile ContradictionEngine's two repositories non-destructively; inspect current API, auth, evidence boundaries and CI; open minimal architecture/implementation PR linked to issue #2.
3. **P1:** Audit LegalInk, CRTLO and FinePrint against ChittyOS legal-only data and identity boundaries. Do not move case evidence into product repositories.
4. **P1:** Correct Mobile/Desktop compliance documentation only after registry identity verification.
5. **P2:** Classify StreamLink, IntegrateIT, ResolvIT, Credit, Compile and Valuation; document canonical vs projection.
6. **P3:** Publish only verified product availability and deployment claims.

## Acceptance and change control

Every item must have a first-party source, canonical capability owner, one disposition, data boundary, and a linked PR or explicit HOLD reason. No production deploy, credential change, repository deletion, evidence transfer, or new schema without explicit authorization. Source of truth for execution: [issue #2](https://github.com/chittyapps/chittypro-ecosystem/issues/2).
