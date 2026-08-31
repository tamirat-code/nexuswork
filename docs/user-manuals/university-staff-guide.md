# University staff guide

## 1. Get your own account approved

A university staff account is itself gated: after registering with the
`university_staff` role, you submit your full name, job title, department,
and a supporting document (staff ID, HR/offer letter, or department
directory page) at **Profile → Verification**. A **platform administrator**
reviews and approves this — staff status is never self-declared or
auto-granted just because your email matches a university domain.

## 2. Review student verification requests

At `/verifications` (your university-scoped queue):

- See pending student identity-verification requests: submitted name,
  student ID number, program, whether their email domain matched your
  university's registered domain, and the uploaded proof document.
- **Approve** or **reject** — a rejection requires a reason, which the
  student sees along with the option to resubmit.
- Every decision is logged (reviewer identity, timestamp, reason) in the
  platform's audit trail for accountability.

## 3. Review skill certification requests

A separate queue (also reachable from `/verifications`) lists students
requesting certification of a specific skill: skill name, linked course (if
any), assessment method (practical assessment, portfolio review, or
coursework linkage), and their notes. Approve with an optional score
(0–100) and review notes, or reject. Approved requests upgrade that skill
line-item to `university_certified` on the student's profile, which is
weighted more heavily in AI matching and client search than self-declared
skills.

## 4. University analytics

At `/analytics`:

- **Employment/skill outcomes** for your verified student body — aggregated
  and anonymized (individual student earnings or identities aren't exposed
  in this view).
- **Skill-demand analytics**: what skills clients are hiring for on the
  platform vs. what skills your verified students actually hold — useful as
  curriculum/training feedback.

## 5. What you can't do

University staff cannot post projects, submit proposals, manage platform-wide
users or disputes, or manage the skill/category catalog — those are client,
student, and administrator actions respectively.
