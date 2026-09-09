const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "config.json");

function ensure() {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({
      brandName: "Duck ORG",
      color: "#5865F2",
      adminRoleId: "",
      mediatorRoleId: "",
      categories: {},
      channels: {},
      queues: []
    }, null, 2));
  }
}

function load() {
  ensure();
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function save(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = { load, save };
