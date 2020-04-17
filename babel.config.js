module.exports = {
  presets: [
    [
      "@babel/preset-typescript",
      {
        onlyRemoveTypeImports: true
      }
    ],
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
  ],
};
