import { printReceived, printExpected } from "jest-matcher-utils";

expect.extend({
  toBeDefinedReferences({ id, ...ref }) {
    const pass = id !== "UNDEFINED";
    const subject = ref || { articles: [] };
    const fmt = subject.articles.map((ref) => ref.text);
    const message = () =>
      "expect no UNDEFINED reférences" +
      "\n\n" +
      "Received:\n" +
      `  id: ${printReceived(id)}\n` +
      `  ref: ${printExpected((ref))}\n` +
      "\n\n" +
      "";
    `> ${Array.from(new Set(fmt)).join(" / ")}`;

    return { message, pass };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeDefinedReferences(): CustomMatcherResult;
    }
  }
}
