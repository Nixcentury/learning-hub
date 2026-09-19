// Shared notation palette. Keys insert notation; they do not grade it.
export function mathLayouts(language = "th", formula = false) {
  const t = (th, en) => language === "en" ? en : th;
  const nav = ["[left]", "[right]", "[backspace]", "[hide-keyboard]"];
  const numeric = { label: t("ตัวเลข", "Numbers"), rows: [
    ["[7]", "[8]", "[9]", "+", "-", "\\frac{#0}{#?}"],
    ["[4]", "[5]", "[6]", "\\times", "\\div", "#@^{#?}"],
    ["[1]", "[2]", "[3]", "(", ")", "\\sqrt{#0}"],
    ["[0]", "[.]", "\\pi", ...nav],
  ] };
  if (!formula) return [numeric];
  return [numeric,
    { label: t("คณิต", "Math"), rows: [
      ["\\log(#0)", "\\ln(#0)", "\\log_{#?}(#0)", "e^{#0}", "10^{#0}", "#@^{#?}"],
      ["\\sin(#0)", "\\cos(#0)", "\\tan(#0)", "#@^{\\circ}", "\\pi", "\\sqrt[#?]{#0}"],
      ["\\frac{\\mathrm{d}}{\\mathrm{d}x}#0", "\\frac{\\partial #0}{\\partial x}", "\\int #0\\,\\mathrm{d}x", "\\int_{#?}^{#?}#0\\,\\mathrm{d}x", "\\sum_{i=#?}^{#?}#0", "\\lim_{x\\to #?}#0"],
      ["=", "\\infty", ...nav],
    ] },
    { label: t("ฟิสิกส์", "Physics"), rows: [
      ["v", "u", "a", "t", "s", "F", "m", "g"],
      ["E", "W", "P", "p", "V", "I", "R", "Q"],
      ["\\Delta", "\\theta", "\\lambda", "\\omega", "\\mu", "\\rho", "\\sigma", "\\vec{#0}"],
      ["#@_{#?}", "#@^{#?}", "=", ...nav],
    ] },
    { label: t("เคมี", "Chemistry"), rows: [
      ["\\mathrm{H}", "\\mathrm{C}", "\\mathrm{N}", "\\mathrm{O}", "\\mathrm{S}", "\\mathrm{P}", "\\mathrm{Na}", "\\mathrm{Cl}"],
      ["\\mathrm{Ca}", "\\mathrm{Fe}", "#@_{#?}", "#@^{#?}", "\\rightarrow", "\\rightleftharpoons", "+", "\\Delta"],
      ["\\mathrm{(s)}", "\\mathrm{(l)}", "\\mathrm{(g)}", "\\mathrm{(aq)}", "\\mathrm{pH}", "K_{c}", "K_{p}", "\\mathrm{mol}"],
      ["(", ")", "=", ...nav],
    ] }, "alphabetic", "greek",
  ];
}
