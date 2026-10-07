import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function waitForServer(url, timeoutMs = 25000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function killProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGTERM');
    }
  } catch {
    // Already terminated
  }
}

async function main() {
  console.log('🚀 Starting Lighthouse Performance Audit for Day 14...\n');

  // 1. Clean previous run reports
  const filesToRemove = [
    'lighthouse-report.json',
    'lighthouse-report.html',
    'lighthouse-report.report.json',
    'lighthouse-report.report.html',
  ];
  for (const f of filesToRemove) {
    const full = path.join(rootDir, f);
    if (fs.existsSync(full)) {
      try { fs.unlinkSync(full); } catch {}
    }
  }

  // 2. Verify build dist exists
  const distPath = path.join(rootDir, 'dist', 'index.html');
  if (!fs.existsSync(distPath)) {
    console.log('📦 Dist folder not found. Building project with `npm run build`...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  }

  // 3. Start Vite Preview server on 127.0.0.1
  const port = 4173;
  const targetUrl = `http://127.0.0.1:${port}/`;
  console.log(`🌐 Launching Vite Preview server on ${targetUrl}...`);

  const previewProcess = spawn('npx', ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: rootDir,
    shell: true,
    stdio: 'pipe',
  });

  const isReady = await waitForServer(targetUrl, 25000);
  if (!isReady) {
    killProcess(previewProcess);
    console.error(`❌ Failed to start preview server on ${targetUrl} within timeout.`);
    process.exit(1);
  }

  console.log(`✅ Preview server is ready and responding at ${targetUrl}!\n`);

  // 4. Run Lighthouse
  console.log('🔍 Executing Lighthouse audit in headless Chrome...');
  try {
    const lhciCmd = `npx lighthouse ${targetUrl} --output=json,html --output-path=./lighthouse-report --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet`;
    execSync(lhciCmd, {
      cwd: rootDir,
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('⚠️ Lighthouse process finished with exit notice:', err.message);
  } finally {
    // Ensure preview server is shut down cleanly
    console.log('🧹 Stopping preview server...');
    killProcess(previewProcess);
  }

  // 5. Locate and normalize report paths
  const reportReportJson = path.join(rootDir, 'lighthouse-report.report.json');
  const reportJson = path.join(rootDir, 'lighthouse-report.json');
  const reportReportHtml = path.join(rootDir, 'lighthouse-report.report.html');
  const reportHtml = path.join(rootDir, 'lighthouse-report.html');

  if (fs.existsSync(reportReportJson) && !fs.existsSync(reportJson)) {
    fs.copyFileSync(reportReportJson, reportJson);
  }
  if (fs.existsSync(reportReportHtml) && !fs.existsSync(reportHtml)) {
    fs.copyFileSync(reportReportHtml, reportHtml);
  }

  const activeJson = fs.existsSync(reportJson) ? reportJson : (fs.existsSync(reportReportJson) ? reportReportJson : null);

  if (activeJson) {
    try {
      const report = JSON.parse(fs.readFileSync(activeJson, 'utf8'));
      const categories = report.categories || {};
      const audits = report.audits || {};

      console.log('\n=============================================');
      console.log('📊 LIGHTHOUSE AUDIT RESULTS (DAY 14)');
      console.log('=============================================');
      if (categories.performance) {
        const perf = Math.round(categories.performance.score * 100);
        console.log(`⚡ Performance:    ${perf} / 100  ${perf >= 90 ? '🟢 EXCELLENT' : '🟡 GOOD'}`);
      }
      if (categories.accessibility) {
        const a11y = Math.round(categories.accessibility.score * 100);
        console.log(`♿ Accessibility:  ${a11y} / 100  ${a11y >= 90 ? '🟢 EXCELLENT' : '🟡 GOOD'}`);
      }
      if (categories['best-practices']) {
        const bp = Math.round(categories['best-practices'].score * 100);
        console.log(`🛡️  Best Practices: ${bp} / 100  ${bp >= 90 ? '🟢 EXCELLENT' : '🟡 GOOD'}`);
      }
      if (categories.seo) {
        const seo = Math.round(categories.seo.score * 100);
        console.log(`🔍 SEO:             ${seo} / 100  ${seo >= 80 ? '🟢 GOOD' : '🟡 PASS'}`);
      }
      console.log('---------------------------------------------');
      if (audits['first-contentful-paint']) {
        console.log(`⏱️  First Contentful Paint (FCP):   ${audits['first-contentful-paint'].displayValue}`);
      }
      if (audits['largest-contentful-paint']) {
        console.log(`🖼️  Largest Contentful Paint (LCP): ${audits['largest-contentful-paint'].displayValue}`);
      }
      if (audits['total-blocking-time']) {
        console.log(`🛑 Total Blocking Time (TBT):      ${audits['total-blocking-time'].displayValue}`);
      }
      if (audits['cumulative-layout-shift']) {
        console.log(`📐 Cumulative Layout Shift (CLS):   ${audits['cumulative-layout-shift'].displayValue}`);
      }
      console.log('=============================================');
      console.log(`📄 Generated Reports:`);
      console.log(`  - JSON: ${path.relative(rootDir, activeJson)}`);
      if (fs.existsSync(reportHtml)) {
        console.log(`  - HTML: ${path.relative(rootDir, reportHtml)}`);
      }
      console.log('=============================================\n');
    } catch (e) {
      console.log('⚠️ Could not parse JSON report summary:', e.message);
    }
  }
}

main().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
