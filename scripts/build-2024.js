'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const legacy = path.join(root, 'salty-747');
const pkg = path.join(root, 'salty-747-2024');

const legacyInstruments = path.join(legacy, 'html_ui', 'Pages', 'VCockpit', 'Instruments', 'b74s');
const instruments = path.join(pkg, 'html_ui', 'Pages', 'VCockpit', 'Instruments', 'b74s24');

fs.rmSync(instruments, { recursive: true, force: true });
for (const dir of ['cdu', 'Assets']) {
    fs.cpSync(path.join(legacyInstruments, dir), path.join(instruments, dir), { recursive: true });
}
for (const file of fs.readdirSync(path.join(instruments, 'cdu'))) {
    const target = path.join(instruments, 'cdu', file);
    fs.writeFileSync(target, fs.readFileSync(target, 'utf8').split('/Instruments/b74s/').join('/Instruments/b74s24/'));
}

const templates = path.join(pkg, 'SimObjects', 'Airplanes', 'Asobo_B747_8i', 'attachments', 'salty', 'Function_Interior_Salty_Rebuild', 'model', 'Templates');
fs.mkdirSync(templates, { recursive: true });
fs.copyFileSync(
    path.join(legacy, 'SimObjects', 'Airplanes', 'Salty_B747_8i', 'model', 'Templates', '747_8I_ap_templates.xml'),
    path.join(templates, '747_8I_ap_templates.xml'),
);

function* readdir(d) {
    for (const dirent of fs.readdirSync(d, { withFileTypes: true })) {
        if (['layout.json', 'manifest.json'].includes(dirent.name)) {
            continue;
        }
        const resolved = path.join(d, dirent.name);
        if (dirent.isDirectory()) {
            yield* readdir(resolved);
        } else {
            yield resolved;
        }
    }
}

const MS_FILETIME_EPOCH = 116444736000000000n;
const contentEntries = [];
let totalPackageSize = 0;

for (const filename of readdir(pkg)) {
    const stat = fs.statSync(filename, { bigint: true });
    contentEntries.push({
        path: path.relative(pkg, filename).split(path.sep).join('/'),
        size: Number(stat.size),
        date: Number((stat.mtimeNs / 100n) + MS_FILETIME_EPOCH),
    });
    totalPackageSize += Number(stat.size);
}

fs.writeFileSync(path.join(pkg, 'layout.json'), JSON.stringify({ content: contentEntries }, null, 2));

fs.writeFileSync(path.join(pkg, 'manifest.json'), JSON.stringify({
    ...require('../manifest-base-2024.json'),
    package_version: require('../package.json').version,
    total_package_size: totalPackageSize.toString().padStart(20, '0'),
}, null, 2));
