# Security Specification — Papelaria da Prof

## 1. Data Invariants
1. **Product Catalog Integrity**: Only verified administrators (`isAdmin()`) may create, update, or delete `/products/{productId}`. Public visitors may only `get` or `list` products where `active == true`.
2. **Order PII Isolation**: Customer orders (`/orders/{orderId}`) contain PII (`customerName`, `customerPhone`, `customerEmail`, address). Unauthenticated users and non-admin users CANNOT `get`, `list`, `update`, or `delete` any order. Public checkout may only `create` an order with `status == 'pendente'`, `source == 'loja'`, bounded `items.size() <= 50`, and `createdAt == request.time`.
3. **Coupon Anti-Scraping**: Public customers may `get` a specific coupon by exact uppercase code (`/coupons/{couponId}`) during checkout validation, but CANNOT `list` all coupons or modify `usedCount`/discounts. Only `isAdmin()` can `list`, `create`, `update`, or `delete` coupons.
4. **Store Settings Protection**: Only `/settings/store` is readable publicly for storefront rendering (WhatsApp number, social links, shipping policy). Writes require `isAdmin()`.
5. **Admin Registry**: `/admins/{userId}` can only be read (`get`) by the matching authenticated user (`request.auth.uid == userId`), never listed or modified via client SDKs.
6. **Temporal Integrity & Path Hardening**: All document IDs must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` chars. All timestamps (`createdAt`, `updatedAt`, `grantedAt`) are validated against `request.time`.
7. **Student PII Isolation**: `/students/{studentId}` contains PII (`email`, `phone`, `cpf`). A student can only `get`, `create`, and `update` their own profile (`request.auth.uid == studentId`); only `isAdmin()` can `list` all registered students.
8. **Digital Apostilas & Protected PDF Assets**: Public showcase metadata in `/digitalMaterials/{materialId}` (`active == true`) never stores raw `pdfUrl`. The protected PDF download URL resides in `/materialAssets/{materialId}` (`allow read, write: if isAdmin()`) and is copied exclusively into `/studentGrants/{grantId}` by an admin.
9. **Student Material Grant Isolation**: A student can `get` or `list` `/studentGrants/{grantId}` ONLY where `resource.data.studentId == request.auth.uid`. Students CANNOT create, update, or delete grants; only `isAdmin()` can confirm or revoke PDF access after WhatsApp payment.

## 2. The "Dirty Dozen" Attack Payloads (+ LMS Guards)
1. **ID Poisoning**: Creating `/orders/../../etc/passwd` or a 500-char ID -> Rejected by `isValidId(orderId)`.
2. **Shadow Field Injection on Order**: Submitting an order with `{ ..., isPaid: true, adminOverride: true }` -> Rejected by `hasOnly(...)` key allowlist in `isValidOrder()`.
3. **Order Status Shortcutting**: Creating a public storefront order with `status: 'finalizado'` or `source: 'pdv'` -> Rejected by `incoming().status == 'pendente' && incoming().source == 'loja'`.
4. **Order PII Scraping**: Unauthenticated or non-admin `list` or `get` on `/orders` -> Rejected because `allow read: if isAdmin()`.
5. **Email Spoofing**: Authenticated user with `email == 'jonasjessicalove@gmail.com'` and `email_verified: false` attempting admin write -> Rejected because `isAdmin()` mandates `request.auth.token.email_verified == true`.
6. **Privilege Escalation**: Authenticated customer writing `/admins/{uid}` with `{ role: 'admin' }` -> Rejected (`allow write: if false`).
7. **Unbounded Array / Denial of Wallet**: Submitting an order with `items` containing 500 items or 100KB strings -> Rejected by `items.size() <= 50` and `.size()` bounds on every string.
8. **Timestamp Forgery**: Creating a product, student profile, or grant with backdated timestamps -> Rejected by `== request.time`.
9. **Public Product Tampering**: Non-admin user attempting to lower `price` on `/products/{id}` or `/digitalMaterials/{id}` -> Rejected by `isAdmin()`.
10. **Inactive Product / PDF Asset Leakage**: Unauthenticated user reading `/materialAssets/{id}` to steal raw PDF download links -> Rejected (`allow read, write: if isAdmin()`).
11. **Cross-Student Grant Hijack & Self-Grant**: Student A trying to read `studentGrants` belonging to Student B or creating a `studentGrants` doc for themselves -> Rejected (`resource.data.studentId == request.auth.uid` on read; `isAdmin()` required on create/update/delete).
12. **Student PII Enumeration & Role Escalation**: Student listing `/students` or injecting `role: 'admin'` in `/students/{uid}` -> Rejected (`allow list: if isAdmin()` and `hasOnly(...)`).
