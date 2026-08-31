# UML

Diagrams reflect the implemented system (see [`architecture/README.md`](../architecture/README.md)
and [`database/README.md`](../database/README.md) for the prose versions).
Rendered as Mermaid so they stay in the repo as text and render in any
Markdown viewer that supports Mermaid (GitHub, GitLab, VS Code, etc.).

## Use-case diagram

Mermaid has no native UML use-case notation, so this is expressed as an
actor→capability map; it covers the same information a use-case diagram would.

```mermaid
flowchart LR
    Student(("Student"))
    Client(("Client"))
    Staff(("University Staff"))
    Admin(("Admin"))

    Student --> UC1["Build profile & skills"]
    Student --> UC2["Request identity/skill verification"]
    Student --> UC3["Browse/search projects"]
    Student --> UC4["Submit proposals"]
    Student --> UC5["Sign contract"]
    Student --> UC6["Deliver milestone work"]
    Student --> UC7["Message client / join meeting"]
    Student --> UC8["Withdraw earnings"]
    Student --> UC9["Build portfolio"]
    Student --> UC10["View AI recommendations"]

    Client --> UC11["Verify organization"]
    Client --> UC12["Post project"]
    Client --> UC13["Review proposals, view CV"]
    Client --> UC14["Accept proposal / sign contract"]
    Client --> UC15["Fund & approve milestones"]
    Client --> UC16["Leave review"]
    Client --> UC17["Open dispute"]
    Client --> UC7

    Staff --> UC18["Verify student/staff identity"]
    Staff --> UC19["Certify student skills"]
    Staff --> UC20["View university analytics"]

    Admin --> UC21["Manage users (suspend/restore/role)"]
    Admin --> UC22["Resolve disputes"]
    Admin --> UC23["Manage catalog (skills/categories/learning)"]
    Admin --> UC24["Review platform analytics & audit log"]
```

## Activity diagram — milestone lifecycle

```mermaid
flowchart TD
    A["not_funded"] -->|"client: fund"| B["funding_pending"]
    B -->|"payment succeeds"| C["funded"]
    B -->|"payment fails"| A
    C -->|"student: start"| D["in_progress"]
    D -->|"student: submit"| E["submitted"]
    E -->|"client: request revision"| F["revision_requested"]
    F -->|"student: resubmit"| E
    E -->|"client: mark delivered\n(implicit on review)"| G["delivered"]
    G -->|"client: approve"| H["approved"]
    H -->|"release payment initiated"| I["release_pending"]
    I -->|"success"| J["released"]
    I -->|"failure"| K["release_failed"]
    K -->|"client/admin: retry"| I
    C -.->|"either party: open dispute"| L["disputed"]
    D -.->|"open dispute"| L
    E -.->|"open dispute"| L
    G -.->|"open dispute"| L
    L -->|"admin resolves"| M["restored to pre_dispute_status\nor terminal per resolution"]
```

## Sequence diagram — proposal to signed contract

```mermaid
sequenceDiagram
    actor Student
    actor Client
    participant API as Backend API
    participant DB as MongoDB

    Client->>API: POST /v1/projects
    API->>DB: insert Project(status=open)
    Student->>API: POST /v1/proposals
    API->>DB: insert Proposal(status=pending)
    Client->>API: GET /v1/proposals/project/:projectId
    API->>DB: find Proposals
    Client->>API: POST /v1/proposals/:id/cv-viewed
    API->>DB: update Proposal.cv_viewed_at
    Client->>API: POST /v1/proposals/:id/accept
    API->>DB: update Proposal(status=accepted)
    API->>DB: insert Contract(status=pending_review)
    Student->>API: POST /v1/contracts/:id/review
    API->>DB: set student_review
    Client->>API: POST /v1/contracts/:id/review
    API->>DB: set client_review
    Note over API,DB: status -> pending_signature once both reviewed
    Student->>API: POST /v1/contracts/:id/sign
    API->>DB: set student_signature/student_signed_at
    Client->>API: POST /v1/contracts/:id/sign
    API->>DB: set client_signature/client_signed_at, status=active
    API-->>Student: notification: contract_signed
    API-->>Client: notification: contract_signed
```

## Sequence diagram — milestone funding via payment provider

```mermaid
sequenceDiagram
    actor Client
    participant API as Backend API
    participant Svc as milestones.service
    participant Provider as Payment Provider\n(Stripe or Chapa)
    participant DB as MongoDB
    participant WH as /webhooks

    Client->>API: POST /v1/milestones/:id/fund
    API->>Svc: fund(milestoneId)
    Svc->>Provider: create payment intent / checkout
    Provider-->>Svc: checkout url / client secret
    Svc->>DB: insert Payment(direction=deposit, status=pending)
    Svc->>DB: update Milestone(status=funding_pending)
    API-->>Client: checkout url / client secret

    Client->>Provider: completes payment (hosted checkout / card)
    Provider->>WH: webhook: payment succeeded
    WH->>WH: verify signature against raw body
    WH->>DB: upsert WebhookEvent (idempotency)
    WH->>DB: update Payment(status=succeeded)
    WH->>DB: insert FinancialJournal entries (balanced)
    WH->>DB: update Milestone(status=funded, funded_at)
    WH-->>API: emit milestone.funded domain event
    API-->>Client: Socket.IO notification: milestone_funded
```

## Class diagram — core marketplace/escrow domain

```mermaid
classDiagram
    class User {
      +ObjectId _id
      +String email
      +String role
      +String status
      +Boolean mfa_enabled
    }
    class StudentProfile {
      +ObjectId user_id
      +String verification_status
      +Skill[] skills
    }
    class ClientProfile {
      +ObjectId user_id
      +String organization_type
      +String verification_status
    }
    class Project {
      +ObjectId client_id
      +String status
      +Number budget
      +Skill[] required_skill_ids
    }
    class Proposal {
      +ObjectId project_id
      +ObjectId student_id
      +String status
      +Number price
    }
    class Contract {
      +ObjectId proposal_id
      +String status
      +Object terms
      +Signature client_signature
      +Signature student_signature
    }
    class Milestone {
      +ObjectId contract_id
      +Number sequence
      +String status
      +String payout_status
    }
    class Submission {
      +ObjectId milestone_id
      +Number version
      +String review_status
    }
    class Payment {
      +ObjectId milestone_id
      +String direction
      +String status
      +String provider
    }
    class Dispute {
      +ObjectId milestone_id
      +String status
      +String outcome
    }
    class Invoice {
      +ObjectId contract_id
      +String status
    }
    class Review {
      +ObjectId contract_id
      +Number rating
    }

    User "1" --> "0..1" StudentProfile
    User "1" --> "0..1" ClientProfile
    User "1" --> "0..*" Project : posts
    Project "1" --> "0..*" Proposal
    User "1" --> "0..*" Proposal : submits (student)
    Proposal "1" --> "0..1" Contract
    Contract "1" --> "1..*" Milestone
    Milestone "1" --> "0..*" Submission
    Milestone "1" --> "0..*" Payment
    Milestone "0..1" --> "0..1" Dispute
    Contract "1" --> "0..*" Invoice
    Contract "1" --> "0..*" Review
```

## Component diagram

See [`architecture/README.md`](../architecture/README.md#component-diagram)
for the Mermaid component/flow diagram covering the SPA, API, WebSocket
layer, background jobs, database, storage, and external providers — kept in
one place to avoid duplication/drift.

## Deployment diagram

```mermaid
flowchart TB
    subgraph "Client device"
        Browser["Browser / SPA"]
    end
    subgraph "Docker host (docker-compose)"
        Nginx["frontend container\nnginx serving Vite build\ninfrastructure/nginx/nginx.conf"]
        Backend["backend container\nNode/Express + Socket.IO\napps/backend"]
        MongoInit["mongo-init container\n(one-shot: indexes + seed)"]
        MongoC["mongo container\nMongoDB + volume mongo_data"]
    end
    subgraph "External services"
        StripeX["Stripe"]
        ChapaX["Chapa"]
        S3X["S3-compatible storage"]
        ResendX["Resend (email)"]
        GoogleX["Google OAuth"]
    end

    Browser -->|HTTPS| Nginx
    Nginx -->|proxy /v1, /webhooks, /socket.io| Backend
    Backend --> MongoC
    MongoInit --> MongoC
    Backend --> StripeX
    Backend --> ChapaX
    Backend --> S3X
    Backend --> ResendX
    Backend --> GoogleX
```

Production compose (`docker-compose.prod.yml`) uses the same two application
images with production-oriented environment variables; see
[`deployment/README.md`](../deployment/README.md).
