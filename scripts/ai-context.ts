const feature = process.argv[2];

if (!feature) {
  throw new Error("Use: npm run ai:context auth");
}

const response = await fetch("http://localhost:3100", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "retrieve_relevant_specs",
      arguments: { feature },
    },
  }),
});

const json = await response.json();
const text = json.result.content[0].text;

console.log(`
You are implementing a Spec Driven Development task.

Use ONLY the following specs as source of truth.
If something is missing, stop and ask for spec clarification.
Do not invent routes, fields, validations, or UI behavior.

${text}
`);
