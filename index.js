const { decode } = require("./src/email");

const getData = () => require("./data/fiches-travail.json");

module.exports = {
  getData,
  decode,
};
