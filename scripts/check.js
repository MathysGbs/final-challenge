// "Build" gate for the CI pipeline.
//
// A plain Node.js service has no compile step, so the closest equivalent of a
// build check is: every module loads, the app boots, and /health answers 200.
// Any missing dependency, syntax error or broken import fails here before the
// image is built.
const { once } = require('node:events');
const { app } = require('../src/app');

async function main() {
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);

    if (!response.ok) {
      throw new Error(`/health answered ${response.status}`);
    }

    console.log('check: application boots and /health answers 200');
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(`check failed: ${error.message}`);
  process.exitCode = 1;
});
