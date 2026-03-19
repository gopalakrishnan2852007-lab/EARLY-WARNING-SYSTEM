const { spawnSync } = require('child_process');
const res = spawnSync('npm', ['run', 'build'], { shell: true });
require('fs').writeFileSync('build_err.log', res.stdout.toString() + '\n' + res.stderr.toString());
