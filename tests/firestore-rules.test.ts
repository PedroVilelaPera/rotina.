import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const rulesPath = resolve(process.cwd(), 'firestore.rules');

test('firestore.rules declara rules_version 2 e serviço cloud.firestore', () => {
  const content = readFileSync(rulesPath, 'utf8');
  assert.match(content, /rules_version\s*=\s*'2';/);
  assert.match(content, /service\s+cloud\.firestore\s*\{/);
});

test('firestore.rules isola users/{userId} e subcoleções ao próprio uid autenticado', () => {
  const content = readFileSync(rulesPath, 'utf8');
  assert.match(content, /match\s+\/users\/\{userId\}\s*\{/);
  assert.match(
    content,
    /request\.auth\s*!=\s*null\s*&&\s*request\.auth\.uid\s*==\s*userId/,
  );
  assert.match(content, /match\s+\/\{document=\*\*\}\s*\{/);
});

test('firestore.rules aplica deny-all explícito fora de users/{userId}', () => {
  const content = readFileSync(rulesPath, 'utf8');
  assert.match(content, /allow\s+read,\s*write:\s*if\s+false;/);
});
