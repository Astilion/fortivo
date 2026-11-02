// EAS Build npm lifecycle hook (package.json "eas-build-post-install").
//
// expo-dev-client is marked debugOnly for iOS only. On Android, autolinking adds
// expo-dev-launcher and expo-dev-menu to release builds too: their own code is
// swapped for empty release stubs, but their dependencies (Jetpack Compose, the
// ML Kit barcode scanner, Apollo, Koin, kotlin-reflect) still end up in the AAB.
// Excluding the whole dev-client tree from autolinking keeps production builds
// free of it. Every other profile keeps the dev client.
const fs = require('fs');
const path = require('path');

const DEV_CLIENT_PACKAGES = [
  'expo-dev-client',
  'expo-dev-launcher',
  'expo-dev-menu',
  'expo-dev-menu-interface',
  'expo-manifests',
  'expo-json-utils',
  'expo-updates-interface',
];

const profile = process.env.EAS_BUILD_PROFILE;

if (profile !== 'production') {
  process.stdout.write(
    `[exclude-dev-client] profile "${profile}": dev client kept\n`,
  );
  process.exit(0);
}

// npm runs lifecycle scripts from the package root.
const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.expo ??= {};
pkg.expo.autolinking ??= {};
pkg.expo.autolinking.android ??= {};
const current = pkg.expo.autolinking.android.exclude ?? [];
pkg.expo.autolinking.android.exclude = [
  ...new Set([...current, ...DEV_CLIENT_PACKAGES]),
];

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
process.stdout.write(
  `[exclude-dev-client] excluded from Android autolinking: ${pkg.expo.autolinking.android.exclude.join(', ')}\n`,
);
