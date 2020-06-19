const char = "_";

function decode(str) {
  return str.replace(new RegExp(`${char}@`, "g"), "@");
}

export { decode };
