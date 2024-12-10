const path = require("path");
const obfuscator = require("javascript-obfuscator");
var obfuscated_code = {};

if (config["obfuscate"] && false) {
    app.get(/^\/src\/(.*)\.js$/, (req, res)  => {
        let file = path.join(__dirname, "../", "client/", req.path.substring(11));
        if (!fs.existsSync(file)) {
            console.log(`Failed to load "${file}"`);
            res.sendStatus(404);
            return;
        }
        if (!obfuscated_code[file]) {
              console.log(`Obfuscating Path "${file}"`);
              obfuscated_code[file] = obfuscator.obfuscate(
                String(fs.readFileSync(file)),
                config.ObfuscationOptions || {
                    compact: true,
                    controlFlowFlattening: true,
                    controlFlowFlatteningThreshold: 1,
                    numbersToExpressions: true,
                    simplify: true,
                    stringArrayShuffle: true,
                    splitStrings: true,
                    stringArrayThreshold: 1
                }
            ).getObfuscatedCode();
        }
      
        res.send(obfuscated_code[file]);
    })
}
