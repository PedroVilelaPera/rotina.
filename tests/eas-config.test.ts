import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('eas.json existe e define perfil preview com buildType apk', () => {
  const raw = readFileSync(resolve(root, 'eas.json'), 'utf8');
  const eas = JSON.parse(raw) as {
    build?: {
      preview?: {
        distribution?: string;
        android?: { buildType?: string };
      };
    };
  };

  assert.equal(eas.build?.preview?.distribution, 'internal');
  assert.equal(eas.build?.preview?.android?.buildType, 'apk');
});

test('eas.json não expõe valores de segredos EXPO_PUBLIC_FIREBASE_*', () => {
  const raw = readFileSync(resolve(root, 'eas.json'), 'utf8');
  assert.doesNotMatch(raw, /EXPO_PUBLIC_FIREBASE_/);
});

test('app.json define android.package para compilação do APK via EAS Build', () => {
  const raw = readFileSync(resolve(root, 'app.json'), 'utf8');
  const appConfig = JSON.parse(raw) as {
    expo?: {
      android?: { package?: string };
    };
  };

  const androidPackage = appConfig.expo?.android?.package;
  assert.ok(androidPackage && /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(androidPackage));
});
