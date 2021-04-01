const char = "_";

function encode(str) {
  return str.replace(/@/g, `${char}@`);
}

function decode(str) {
  return str.replace(new RegExp(`${char}@`, "g"), "@");
}

export { decode, encode };
