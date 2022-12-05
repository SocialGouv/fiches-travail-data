/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.jsx?$": ["babel-jest"],
    "^.+\\.tsx?$": ["@swc/jest"],
  },
};
