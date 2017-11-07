const fs = require('fs');
const resolve = require('path').resolve;
const join = require('path').join;
const cp = require('child_process');

// get library path
const platforms = ['facebook', 'reddit', 'telegram', 'twitter', 'vk'];
let mainPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));

platforms.forEach((item) => {
    const path = resolve(__dirname, item + '/');
    console.log(mainPackage);
    fs.readdirSync(path)
        .forEach(function (mod) {
            let modPath = join(path, mod);

            if ('package.json' !== mod || 'package.json' === mod && !fs.existsSync(modPath)) {
                return;
            }

            let json = JSON.parse(fs.readFileSync(modPath, 'utf8'));
            let keys = Object.keys(json.dependencies);
            keys.forEach((key) => {
                mainPackage.dependencies[key] = json.dependencies[key];
            });
        });
});

fs.writeFileSync('package.json', JSON.stringify(mainPackage, null, 2));

// cp.spawnSync('npm', ['i'], {
//     env: process.env,
//     cwd: path,
//     stdio: 'inherit'
// });