const char = "_";

function encode(str: string) {
  return str.replace(/@/g, `${char}@`);
}

function decode(str: string) {
  return str.replace(new RegExp(`${char}@`, "g"), "@");
}

export { decode, encode };
