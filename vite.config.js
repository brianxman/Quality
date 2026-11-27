// Vite is the build tool. It bundles our JSX/React code into plain files in /dist
// that any browser (including iPad Safari or a Capacitor WebView) can run.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // './' makes every asset path relative. This matters twice:
  //  1) Capacitor loads the app from inside the iOS app bundle, not from a domain root.
  //  2) It lets you host the build in a sub-folder of an internal web server.
  base: './',
});
