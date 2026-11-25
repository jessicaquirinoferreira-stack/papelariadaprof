# Security Specification — Papelaria da Prof

## 1. Data Invariants
1. **Admin Authority Isolation**: Only users present in `/admins/{uid}`, the verified bootstrap administrator email (`jonasweb2rj@gmail.com` with `email_verified == true`), or the provisioned primary admin UID (`1rIIihBz4yZhUbbAEDFJXqqQ7x43`) can create, update, or delete store catalog items (`products`, `materials`, `materials/*/private/*`, `coupons`, `settings`) or grant digital materials (`student_materials`).
2. **Student PII Isolation**: Documents in `/users/{userId}` contain PII (`email`, `phone`, `cep`, `address`). Only the matching authenticated owner (`request.auth.uid == userId`) or a verified admin may read or write `/users/{userId}`. No blanket `isSignedIn()` reads or lists are allowed.
3. **Role Self-Escalation Prevention**: On `/users/{userId}` creation, `role` MUST equal `'student'`, `uid` MUST equal `request.auth.uid`, and updates MUST NOT modify `uid`, `role`, or `createdAt`.
4. **Paid Digital PDF Isolation**: Public `/materials/{materialId}` documents expose only catalog metadata (`title`, `description`, `price`, `coverUrl`, `pagesCount`). The actual `pdfUrl` lives in `/materials/{materialId}/private/{docId}` (readable only by admin) and is copied into `/student_materials/{grantId}` solely when an admin releases the material to a specific `studentId`.
5. **Strict Student Material Access**: A student may only `get` or `list` `/student_materials` documents where `resource.data.studentId == request.auth.uid`. Students can never create, update, or delete `/student_materials`.
6. **Order Integrity**: Guests and signed-in customers may submit valid `pending` `online` orders with bounded item arrays (`items.size() >= 1 && items.size() <= 50`) and numeric totals `>= 0`. Only admins can list all orders, change order `status` (with terminal locking for non-admins), or create `pdv` orders. Signed-in customers may only list/get orders matching `resource.data.customerId == request.auth.uid`.
7. **Temporal & Path Hardening**: Every single-document operation validates `isValidId()` (`^[a-zA-Z0-9_-]+$`, max length 128/256) and enforces server timestamps (`request.time`) on `createdAt` and `updatedAt`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Self-Admin Escalation**: `POST /users/{uid}` with `{ "uid": uid, "role": "admin", ... }` -> **DENIED** (`role == 'student'` enforced).
2. **Shadow Ghost Field Injection**: `POST /users/{uid}` with `{ ..., "isVerified": true, "freeAccess": true }` -> **DENIED** (`keys().hasOnly(...)` rejects extra fields).
3. **Unverified Admin Email Spoof**: Request with token `{ "email": "jonasweb2rj@gmail.com", "email_verified": false }` -> **DENIED** (`email_verified == true` mandated).
4. **Cross-Student PII Read**: Authenticated Student B attempts `get /users/{studentA_uid}` -> **DENIED** (`request.auth.uid == userId` fails).
5. **Cross-Student Material Theft**: Authenticated Student B attempts `list /student_materials` without `where('studentId', '==', studentB_uid)` or `get /student_materials/{studentA_grant}` -> **DENIED** (`resource.data.studentId == request.auth.uid`).
6. **Self-Grant Material Hack**: Student attempts `create /student_materials/{id}` with `studentId == request.auth.uid` -> **DENIED** (`isAdmin()` required).
7. **Public PDF URL Scraping**: Unauthenticated visitor attempts `get /materials/{id}/private/file` -> **DENIED** (`isAdmin()` required).
8. **ID Poisoning**: `create /products/{1500_char_junk_id}` -> **DENIED** (`isValidId(productId)` enforces `<= 128` and `^[a-zA-Z0-9_-]+$`).
9. **Unbounded Order Array DoS**: `create /orders/{id}` with 100 items in `items` -> **DENIED** (`items.size() <= 50`).
10. **Fraudulent Pre-Paid Online Order**: Non-admin attempts `create /orders/{id}` with `status: "paid"` or `source: "pdv"` -> **DENIED** (non-admin orders locked to `status == "pending"` and `source == "online"`).
11. **Immutable Timestamp Tampering**: `update /users/{uid}` changing `createdAt` or setting `updatedAt` to a fake past timestamp -> **DENIED** (`incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`).
12. **Blanket Order List Scraping**: Authenticated student attempts `list /orders` without `customerId == request.auth.uid` -> **DENIED** (rule enforces `resource.data.customerId == request.auth.uid`).
