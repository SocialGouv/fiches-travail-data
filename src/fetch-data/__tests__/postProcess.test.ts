import fs from "fs";
import path from "path";
import { htmlParser } from "../postProcess";

const pictureHtml = fs
  .readFileSync(path.join(__dirname, "picture.html"))
  .toString();


describe("postProcess", () => {

  describe("htmlParser", () => {
    it("should replace picture tags with img tags", () => {
      const result = htmlParser(pictureHtml);
      expect(result).toContain("https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454");
    });
  });
})

