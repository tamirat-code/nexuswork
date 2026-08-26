# Phase 0 Authorization Matrix

This is the endpoint-level security test plan for protected NexusWork resources. `401` means anonymous access must be rejected; `403` means an authenticated user with the wrong role or relationship must be rejected.

| Resource | Anonymous | Student | Client | University staff | Admin | Ownership boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Projects | 401 for create; public list/read | Read public projects | Create own; read public | Read public | Read public | Project client owns create/update domain |
| Proposals | 401 | Create for self; own proposal access | Own project proposals; accept/reject | 403 | Explicit admin paths only | Proposal student and project client |
| Contracts | 401 | Assigned student only | Contract client/org member | 403 | Admin review/access where implemented | Client/student relationship |
| Milestones | 401 | Assigned student actions only | Contract client/org member actions | 403 | Explicit admin paths only | Contract relationship plus role |
| Submissions | 401 | Assigned student submits; contract parties read | Contract client reviews | 403 | Explicit admin paths only | Milestone/contract relationship |
| Disputes | 401 | Contract party opens/reads own | Contract party opens/reads own | 403 | List/resolve | Milestone/contract relationship |
| Invoices | 401 | Own contract invoices | Own contract invoices/create | 403 | No general admin route | Invoice parties and contract consistency |
| Wallets | 401 | Own wallet, transactions, withdrawals | 403 for student-only operations | 403 | No general wallet route | Wallet and withdrawal user_id |
| Files | 401 | Owner/related contract party | Owner/related contract party | Verification scope only | Authorized admin access | File owner plus related resource |
| Messages | 401 | Contract party only | Contract party only | 403 | 403 | Contract membership |
| Assessments / credentials | 401 where protected | Own records | 403 unless explicit endpoint | University-scoped records | Admin review paths | Student identity/university scope |
| University resources | 401 for `/mine`/writes | 403 | 403 | Own university scope | Create/manage | University staff membership |
| Admin resources | 401 | 403 | 403 | 403 | Admin only; moderator exceptions are controller-defined | Server-derived role |

Existing route/service tests cover many of these boundaries, especially resource authorization, contracts/milestones, files, payments, wallets, disputes, invoices, messaging, and admin routes. Full endpoint-by-role execution remains blocked until test MongoDB and the sandbox networking restriction are available. No authorization test is weakened or skipped to compensate.

