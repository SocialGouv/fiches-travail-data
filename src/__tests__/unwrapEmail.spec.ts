//

import { unwrapEmail } from "../unwrapEmail";

test.each`
  actual                                                          | expected
  ${""}                                                           | ${""}
  ${"foo"}                                                        | ${""}
  ${"26454948524745520b4756664755560b5653444a4f45084054"}         | ${"contact-ap@asp-public.fr"}
  ${"6a0905041e0b091e470b1a2a0b191a471a1f08060309440c18"}         | ${"contact-ap@asp-public.fr"}
  ${"46252928322725326b2736062735366b3633242a2f25682034"}         | ${"contact-ap@asp-public.fr"}
  ${"7b1814150f1a180f561a0b3b1a080b560b0e19171218551d09"}         | ${"contact-ap@asp-public.fr"}
  ${"4d29283d2239632c2e2e223f290d393f2c3b2c2421632a22383b632b3f"} | ${"depot.accord@travail.gouv.fr"}
  ${"6d3e0e02012d00040c031908"}                                   | ${"Scol@miante"}
  ${"adfecec2c1edc0c4ccc3d9c8"}                                   | ${"Scol@miante"}
  ${"3566565a5975585c545b4150"}                                   | ${"Scol@miante"}
`("$actual should unwrap as $expected", ({ actual, expected }) => {
  expect(unwrapEmail(actual)).toBe(expected);
});
