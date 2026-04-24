import fs from "fs";
const spec = fs.readFileSync(process.argv[2], "utf8");
const test = fs.readFileSync(process.argv[3], "utf8");
const acs = [...spec.matchAll(/AC\d+/g)].map((m) => m[0]);
acs.forEach((ac) => {
    if (!test.includes(ac)) {
        throw new Error(`Missing test for ${ac}`);
    }
});
console.log("All AC covered");
