import fs from 'node:fs';

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const app = readJson('app.json').expo;
const eas = readJson('eas.json');
const production = eas?.build?.production;

const errors = [];
if (!app?.slug) errors.push('app.json: expo.slug is required');
if (!app?.android?.package) errors.push('app.json: expo.android.package is required');
if (!app?.ios?.bundleIdentifier) errors.push('app.json: expo.ios.bundleIdentifier is required');
if (!eas?.build?.apk?.android?.buildType) errors.push('eas.json: build.apk.android.buildType is required for device APK builds');
if (production?.android?.buildType !== 'apk') errors.push('eas.json: build.production.android.buildType must be apk for the requested installable Android artifact');

const projectId = process.env.EAS_PROJECT_ID;
if (!projectId) {
  console.warn('EAS_PROJECT_ID is not set in this validation environment; EAS init/project linking must happen in the EAS account context.');
} else if (!/^[0-9a-f-]{36}$/i.test(projectId)) {
  errors.push('EAS_PROJECT_ID must be a UUID when supplied.');
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log(`Expo config OK: ${app.slug} / Android ${app.android.package} / iOS ${app.ios.bundleIdentifier}`);
console.log('EAS config OK: installable Android APK profiles are present.');
