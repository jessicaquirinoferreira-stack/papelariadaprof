import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesText = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('firestore.rules includes global default-deny catch-all and rules_version 2', () => {
  assert.match(rulesText, /rules_version = '2';/);
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
});

test('firestore.rules enforces email_verified on admin email checks and strict IDs', () => {
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /function isValidId\(id\)/);
  assert.match(rulesText, /id\.matches\('\^\[a-zA-Z0-9_\\\\-\]\+\$'\)/);
});

test('firestore.rules protects orders PII, prevents shadow fields, and enforces list constraints', () => {
  assert.match(rulesText, /match \/orders\/\{orderId\}[\s\S]*allow get: if isValidId\(orderId\) && isAdmin\(\);/);
  assert.match(rulesText, /match \/orders\/\{orderId\}[\s\S]*allow list: if isAdmin\(\);/);
  assert.match(rulesText, /incoming\(\)\.source == 'loja' && incoming\(\)\.status == 'pendente'/);
  assert.match(rulesText, /hasOnly\(/);
  assert.match(rulesText, /match \/coupons\/\{couponId\}[\s\S]*allow list: if isAdmin\(\);/);
  assert.match(rulesText, /match \/products\/\{productId\}[\s\S]*allow list: if existing\(\)\.active == true \|\| isAdmin\(\);/);
});

test('firestore.rules isolates student PII, hides raw pdfUrl in materialAssets, and restricts studentGrants', () => {
  assert.match(rulesText, /match \/students\/\{studentId\}[\s\S]*allow list: if isAdmin\(\);/);
  assert.match(rulesText, /match \/materialAssets\/\{materialId\}[\s\S]*allow get: if isValidId\(materialId\) && isAdmin\(\);/);
  assert.match(rulesText, /match \/studentGrants\/\{grantId\}[\s\S]*existing\(\)\.studentId == request\.auth\.uid/);
  assert.match(rulesText, /match \/studentGrants\/\{grantId\}[\s\S]*allow create: if isValidId\(grantId\) && isAdmin\(\)/);
});
