export default {
  input: "src/index.js",
  output: [
    {
      file: "index.js",
      format: "cjs",
    },
    {
      file: "index.esm.js",
      format: "es",
    },
  ],
};
