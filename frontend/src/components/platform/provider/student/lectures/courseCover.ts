/**
 * Deterministic cover styling for lecture/course cards.
 * CourseSummary has no image field — palette / glow placement derive from course_id.
 */

/** Clinical product photo — light-gray studio background. */
export const VIAL_PHOTO_LIGHT = "/assets/lectures/vial-hols-light.png";

/** Clinical product photo — deep Prussian studio background. */
export const VIAL_PHOTO_DARK = "/assets/lectures/vial-hols-dark.png";

/** @deprecated Use VIAL_PHOTO_LIGHT or VIAL_PHOTO_DARK */
export const VIAL_PHOTO_SRC = VIAL_PHOTO_LIGHT;

export type CourseCoverPhotos = {
  light: string;
  dark: string;
};

export type CourseCoverLayout = "product" | "book";

export type ResolvedCourseCover = {
  photos: CourseCoverPhotos;
  isCustom: boolean;
  coverId?: string;
  /** CSS object-position for full-bleed Magnific art. */
  objectPosition?: string;
  layout?: CourseCoverLayout;
};

/** Strip Peptide University prefix for display + matching. */
export function tidyCoverTitle(title: string): string {
  return title.replace(/^Peptide University:\s*/i, "").trim() || title;
}

/** Peptide name for vial label overlay — no dose / measurement suffix. */
export function coverPeptideName(title: string): string {
  return tidyCoverTitle(title)
    .replace(/\s*[-–—]\s*\d+(?:\.\d+)?\s*(?:mg|mcg|µg|ug|iu|ml|g)\b/gi, "")
    .replace(/\s+\d+(?:\.\d+)?\s*(?:mg|mcg|µg|ug|iu|ml|g)\b/gi, "")
    .trim();
}

type CourseCoverEntry = {
  id: string;
  photos: CourseCoverPhotos;
  /** Exact slug aliases (after slugifyCoverTitle). */
  slugs?: string[];
  /** Loose title/slug keyword groups — all tokens in a group must appear. */
  keywords?: string[][];
  /** Direct course_id lookup — most reliable when title variants differ. */
  courseIds?: string[];
  objectPosition?: string;
  layout?: CourseCoverLayout;
};

/** Per-lecture cover art registry. */
const COURSE_COVER_ENTRIES: CourseCoverEntry[] = [
  {
    id: "peptide-dosing-guide",
    slugs: ["peptide-dosing-guide", "dosing-guide"],
    keywords: [["peptide", "dosing", "guide"]],
    photos: {
      light: "/assets/lectures/peptide-dosing-guide-light.png?v=2",
      dark: "/assets/lectures/peptide-dosing-guide-dark.png?v=2",
    },
    objectPosition: "82% 46%",
    layout: "book",
  },
  {
    id: "pinealon",
    slugs: ["pinealon"],
    keywords: [["pinealon"]],
    photos: {
      light: "/assets/lectures/pinealon-light.png?v=6",
      dark: "/assets/lectures/pinealon-dark.png?v=6",
    },
  },
  {
    id: "alpha-biomed-sales-training",
    courseIds: ["18e729a6-7061-48cf-9d51-a04ffa77124a"],
    slugs: ["alpha-biomed-sales-training"],
    keywords: [["alpha", "biomed", "sales", "training"]],
    photos: {
      light: "/assets/lectures/alpha-biomed-sales-training-light.png",
      dark: "/assets/lectures/alpha-biomed-sales-training-dark.png",
    },
    objectPosition: "82% 46%",
    layout: "book",
  },
  {
    id: "alpha-biomed-sales-dos-and-donts",
    courseIds: ["0eed2662-8a08-443b-8146-357b3f51232e"],
    slugs: ["alpha-biomed-sales-dos-and-donts"],
    keywords: [
      ["biomed", "sales", "dos"],
      ["biomed", "sales", "dont"],
    ],
    photos: {
      light: "/assets/lectures/alpha-biomed-sales-dos-and-donts-light.png",
      dark: "/assets/lectures/alpha-biomed-sales-dos-and-donts-dark.png",
    },
    objectPosition: "78% 46%",
    layout: "book",
  },
  {
    id: "alpha-biomed-sales-faq",
    slugs: ["alpha-biomed-sales-faq"],
    keywords: [["alpha", "biomed", "sales", "faq"], ["biomed", "sales", "faq"]],
    photos: {
      light: "/assets/lectures/alpha-biomed-sales-faq-light.png",
      dark: "/assets/lectures/alpha-biomed-sales-faq-dark.png",
    },
    objectPosition: "82% 46%",
    layout: "book",
  },
  {
    id: "hgh-fragment-176-191",
    slugs: ["hgh-fragment-176-191", "hgh-fragment"],
    keywords: [["hgh", "fragment", "176"]],
    photos: {
      light: "/assets/lectures/hgh-fragment-176-191-light.png?v=2",
      dark: "/assets/lectures/hgh-fragment-176-191-dark.png?v=2",
    },
  },
  {
    id: "colostrum",
    slugs: ["colostrum"],
    keywords: [["colostrum"]],
    photos: {
      light: "/assets/lectures/colostrum-light.png?v=3",
      dark: "/assets/lectures/colostrum-dark.png?v=3",
    },
  },
  {
    id: "tb-500",
    slugs: ["tb-500", "tb500"],
    keywords: [["tb", "500"], ["tb-500"]],
    photos: {
      light: "/assets/lectures/tb-500-light.png?v=2",
      dark: "/assets/lectures/tb-500-dark.png?v=2",
    },
  },
  {
    id: "ghrp-2",
    slugs: ["ghrp-2", "ghrp2"],
    keywords: [["ghrp", "2"], ["ghrp-2"]],
    photos: {
      light: "/assets/lectures/ghrp-2-light.png?v=3",
      dark: "/assets/lectures/ghrp-2-dark.png?v=3",
    },
  },
  {
    id: "peg-mgf",
    slugs: ["peg-mgf", "pegmgf"],
    keywords: [["peg", "mgf"], ["peg-mgf"]],
    photos: {
      light: "/assets/lectures/peg-mgf-light.png?v=2",
      dark: "/assets/lectures/peg-mgf-dark.png?v=2",
    },
  },
  {
    id: "ghk-cu",
    slugs: ["ghk-cu", "ghkcu"],
    keywords: [["ghk", "cu"], ["ghk-cu"]],
    photos: {
      light: "/assets/lectures/ghk-cu-light.png?v=2",
      dark: "/assets/lectures/ghk-cu-dark.png?v=2",
    },
  },
  {
    id: "kpv",
    slugs: ["kpv"],
    keywords: [["kpv"]],
    photos: {
      light: "/assets/lectures/kpv-light.png?v=2",
      dark: "/assets/lectures/kpv-dark.png?v=2",
    },
  },
  {
    id: "slu-pp-332",
    slugs: ["slu-pp-332", "slupp332"],
    keywords: [["slu", "pp", "332"], ["slu-pp-332"]],
    photos: {
      light: "/assets/lectures/slu-pp-332-light.png?v=3",
      dark: "/assets/lectures/slu-pp-332-dark.png?v=3",
    },
  },
  {
    id: "survodutide",
    slugs: ["survodutide"],
    keywords: [["survodutide"]],
    photos: {
      light: "/assets/lectures/survodutide-light.png?v=3",
      dark: "/assets/lectures/survodutide-dark.png?v=3",
    },
  },
  {
    id: "gonadorelin",
    slugs: ["gonadorelin"],
    keywords: [["gonadorelin"]],
    photos: {
      light: "/assets/lectures/gonadorelin-light.png?v=2",
      dark: "/assets/lectures/gonadorelin-dark.png?v=2",
    },
  },
  {
    id: "pnc-28",
    slugs: ["pnc-28", "pnc28"],
    keywords: [["pnc", "28"], ["pnc-28"]],
    photos: {
      light: "/assets/lectures/pnc-28-light.png?v=2",
      dark: "/assets/lectures/pnc-28-dark.png?v=2",
    },
  },
  {
    id: "humanin",
    slugs: ["humanin"],
    keywords: [["humanin"]],
    photos: {
      light: "/assets/lectures/humanin-light.png?v=2",
      dark: "/assets/lectures/humanin-dark.png?v=2",
    },
  },
  {
    id: "pe-22-28",
    slugs: ["pe-22-28", "pe2228"],
    keywords: [["pe", "22", "28"], ["pe-22-28"]],
    photos: {
      light: "/assets/lectures/pe-22-28-light.png?v=2",
      dark: "/assets/lectures/pe-22-28-dark.png?v=2",
    },
  },
  {
    id: "ll-37",
    slugs: ["ll-37", "ll37"],
    keywords: [["ll", "37"], ["ll-37"]],
    photos: {
      light: "/assets/lectures/ll-37-light.png?v=2",
      dark: "/assets/lectures/ll-37-dark.png?v=2",
    },
  },
  {
    id: "selank",
    slugs: ["selank"],
    keywords: [["selank"]],
    photos: {
      light: "/assets/lectures/selank-light.png?v=2",
      dark: "/assets/lectures/selank-dark.png?v=2",
    },
  },
  {
    id: "pancragen",
    slugs: ["pancragen"],
    keywords: [["pancragen"]],
    photos: {
      light: "/assets/lectures/pancragen-light.png?v=2",
      dark: "/assets/lectures/pancragen-dark.png?v=2",
    },
  },
  {
    id: "oxytocin",
    slugs: ["oxytocin"],
    keywords: [["oxytocin"]],
    photos: {
      light: "/assets/lectures/oxytocin-light.png?v=2",
      dark: "/assets/lectures/oxytocin-dark.png?v=2",
    },
  },
  {
    id: "prostamax",
    slugs: ["prostamax", "prostomax"],
    keywords: [["prostamax"], ["prostomax"]],
    photos: {
      light: "/assets/lectures/prostamax-light.png?v=2",
      dark: "/assets/lectures/prostamax-dark.png?v=2",
    },
  },
  {
    id: "bronchogen",
    slugs: ["bronchogen"],
    keywords: [["bronchogen"]],
    photos: {
      light: "/assets/lectures/bronchogen-light.png?v=2",
      dark: "/assets/lectures/bronchogen-dark.png?v=2",
    },
  },
  {
    id: "mots-c",
    slugs: ["mots-c", "motsc"],
    keywords: [["mots", "c"], ["mots-c"]],
    photos: {
      light: "/assets/lectures/mots-c-light.png?v=2",
      dark: "/assets/lectures/mots-c-dark.png?v=2",
    },
  },
  {
    id: "cjc-1295-no-dac",
    slugs: ["cjc-1295-n0-dac", "cjc-1295-no-dac", "cjc-1295"],
    keywords: [["cjc", "1295"], ["cjc-1295"]],
    photos: {
      light: "/assets/lectures/cjc-1295-no-dac-light.png?v=3",
      dark: "/assets/lectures/cjc-1295-no-dac-dark.png?v=3",
    },
  },
  {
    id: "5-amino-1mq",
    slugs: ["5-amino-1mq", "5-amino-1mq"],
    keywords: [["amino", "1mq"], ["5", "amino", "1mq"]],
    photos: {
      light: "/assets/lectures/5-amino-1mq-light.png?v=2",
      dark: "/assets/lectures/5-amino-1mq-dark.png?v=2",
    },
  },
  {
    id: "thymagen",
    slugs: ["thymagen"],
    keywords: [["thymagen"]],
    photos: {
      light: "/assets/lectures/thymagen-light.png?v=2",
      dark: "/assets/lectures/thymagen-dark.png?v=2",
    },
  },
  {
    id: "trh-thyrotropin",
    slugs: ["trh-thyrotropin", "trh-thyrotropin"],
    keywords: [["trh", "thyrotropin"], ["thyrotropin"]],
    photos: {
      light: "/assets/lectures/trh-thyrotropin-light.png?v=2",
      dark: "/assets/lectures/trh-thyrotropin-dark.png?v=2",
    },
  },
  {
    id: "nad-plus",
    slugs: ["nad", "nad-plus"],
    keywords: [["nad"]],
    photos: {
      light: "/assets/lectures/nad-plus-light.png?v=2",
      dark: "/assets/lectures/nad-plus-dark.png?v=2",
    },
  },
  {
    id: "cortagen",
    slugs: ["cortagen"],
    keywords: [["cortagen"]],
    photos: {
      light: "/assets/lectures/cortagen-light.png?v=2",
      dark: "/assets/lectures/cortagen-dark.png?v=2",
    },
  },
  {
    id: "cagrilintide",
    slugs: ["cagrilintide"],
    keywords: [["cagrilintide"]],
    photos: {
      light: "/assets/lectures/cagrilintide-light.png?v=2",
      dark: "/assets/lectures/cagrilintide-dark.png?v=2",
    },
  },
  {
    id: "bdnf",
    slugs: ["bdnf"],
    keywords: [["bdnf"]],
    photos: {
      light: "/assets/lectures/bdnf-light.png?v=2",
      dark: "/assets/lectures/bdnf-dark.png?v=2",
    },
  },
  {
    id: "thymosin-alpha-1",
    slugs: ["thymosin-alpha-1", "thymosin-alpha-1"],
    keywords: [["thymosin", "alpha"], ["thymosin", "alpha-1"]],
    photos: {
      light: "/assets/lectures/thymosin-alpha-1-light.png?v=2",
      dark: "/assets/lectures/thymosin-alpha-1-dark.png?v=2",
    },
  },
  {
    id: "pnc-27",
    slugs: ["pnc-27", "pnc27"],
    keywords: [["pnc", "27"], ["pnc-27"]],
    photos: {
      light: "/assets/lectures/pnc-27-light.png?v=2",
      dark: "/assets/lectures/pnc-27-dark.png?v=2",
    },
  },
  {
    id: "follistatin-344",
    slugs: ["follistatin-344", "follistatin-344"],
    keywords: [["follistatin", "344"], ["follistatin"]],
    photos: {
      light: "/assets/lectures/follistatin-344-light.png?v=2",
      dark: "/assets/lectures/follistatin-344-dark.png?v=2",
    },
  },
  {
    id: "cardiogen",
    slugs: ["cardiogen"],
    keywords: [["cardiogen"]],
    photos: {
      light: "/assets/lectures/cardiogen-light.png?v=2",
      dark: "/assets/lectures/cardiogen-dark.png?v=2",
    },
  },
  {
    id: "semaglutide",
    slugs: ["semaglutide"],
    keywords: [["semaglutide"]],
    photos: {
      light: "/assets/lectures/semaglutide-light.png?v=2",
      dark: "/assets/lectures/semaglutide-dark.png?v=2",
    },
  },
  {
    id: "curcumin",
    slugs: ["curcumin"],
    keywords: [["curcumin"]],
    photos: {
      light: "/assets/lectures/curcumin-light.png?v=2",
      dark: "/assets/lectures/curcumin-dark.png?v=2",
    },
  },
  {
    id: "retatrutide",
    slugs: ["retatrutide"],
    keywords: [["retatrutide"]],
    photos: {
      light: "/assets/lectures/retatrutide-light.png?v=2",
      dark: "/assets/lectures/retatrutide-dark.png?v=2",
    },
  },
  {
    id: "tirzepatide",
    slugs: ["tirzepatide", "tirzepeptide"],
    keywords: [["tirzepatide"], ["tirzepeptide"]],
    photos: {
      light: "/assets/lectures/tirzepatide-light.png?v=2",
      dark: "/assets/lectures/tirzepatide-dark.png?v=2",
    },
  },
  {
    id: "mazdutide",
    slugs: ["mazdutide"],
    keywords: [["mazdutide"]],
    photos: {
      light: "/assets/lectures/mazdutide-light.png?v=2",
      dark: "/assets/lectures/mazdutide-dark.png?v=2",
    },
  },
  {
    id: "glp-1",
    slugs: ["glp-1", "glp1"],
    keywords: [["glp-1"], ["glp", "1"]],
    photos: {
      light: "/assets/lectures/glp-1-light.png?v=2",
      dark: "/assets/lectures/glp-1-dark.png?v=2",
    },
  },
  {
    id: "aod-9604",
    slugs: ["aod-9604", "aod9604"],
    keywords: [["aod", "9604"], ["aod-9604"]],
    photos: {
      light: "/assets/lectures/aod-9604-light.png?v=2",
      dark: "/assets/lectures/aod-9604-dark.png?v=2",
    },
  },
  {
    id: "vesugen",
    slugs: ["vesugen"],
    keywords: [["vesugen"]],
    photos: {
      light: "/assets/lectures/vesugen-light.png?v=2",
      dark: "/assets/lectures/vesugen-dark.png?v=2",
    },
  },
  {
    id: "kisspeptin-10",
    slugs: ["kisspeptin-10", "kisspeptin10"],
    keywords: [["kisspeptin", "10"], ["kisspeptin-10"]],
    photos: {
      light: "/assets/lectures/kisspeptin-10-light.png?v=2",
      dark: "/assets/lectures/kisspeptin-10-dark.png?v=2",
    },
  },
  {
    id: "hexarelin",
    slugs: ["hexarelin"],
    keywords: [["hexarelin"]],
    photos: {
      light: "/assets/lectures/hexarelin-light.png?v=2",
      dark: "/assets/lectures/hexarelin-dark.png?v=2",
    },
  },
  {
    id: "vilon",
    slugs: ["vilon"],
    keywords: [["vilon"]],
    photos: {
      light: "/assets/lectures/vilon-light.png?v=2",
      dark: "/assets/lectures/vilon-dark.png?v=2",
    },
  },
  {
    id: "melanotan-ii",
    slugs: ["melanotan-ii", "melanotan-2"],
    keywords: [["melanotan ii"], ["melanotan", "ii"], ["melanotan 2"]],
    photos: {
      light: "/assets/lectures/melanotan-ii-light.png?v=2",
      dark: "/assets/lectures/melanotan-ii-dark.png?v=2",
    },
  },
  {
    id: "melanotan-i",
    slugs: ["melanotan-i", "melanotan-1"],
    keywords: [["melanotan i"]],
    photos: {
      light: "/assets/lectures/melanotan-i-light.png?v=2",
      dark: "/assets/lectures/melanotan-i-dark.png?v=2",
    },
  },
  {
    id: "ipamorelin",
    slugs: ["ipamorelin"],
    keywords: [["ipamorelin"]],
    photos: {
      light: "/assets/lectures/ipamorelin-light.png?v=2",
      dark: "/assets/lectures/ipamorelin-dark.png?v=2",
    },
  },
  {
    id: "ghrp-6",
    slugs: ["ghrp-6", "ghrp6"],
    keywords: [["ghrp", "6"], ["ghrp-6"]],
    photos: {
      light: "/assets/lectures/ghrp-6-light.png?v=2",
      dark: "/assets/lectures/ghrp-6-dark.png?v=2",
    },
  },
  {
    id: "tesofensine",
    slugs: ["tesofensine"],
    keywords: [["tesofensine"]],
    photos: {
      light: "/assets/lectures/tesofensine-light.png?v=2",
      dark: "/assets/lectures/tesofensine-dark.png?v=2",
    },
  },
  {
    id: "vip",
    slugs: ["vip"],
    keywords: [["vip"]],
    photos: {
      light: "/assets/lectures/vip-light.png?v=2",
      dark: "/assets/lectures/vip-dark.png?v=2",
    },
  },
  {
    id: "cartalax",
    slugs: ["cartalax"],
    keywords: [["cartalax"]],
    photos: {
      light: "/assets/lectures/cartalax-light.png?v=2",
      dark: "/assets/lectures/cartalax-dark.png?v=2",
    },
  },
  {
    id: "sermorelin",
    slugs: ["sermorelin"],
    keywords: [["sermorelin"]],
    photos: {
      light: "/assets/lectures/sermorelin-light.png?v=2",
      dark: "/assets/lectures/sermorelin-dark.png?v=2",
    },
  },
  {
    id: "tesamorelin",
    slugs: ["tesamorelin"],
    keywords: [["tesamorelin"]],
    photos: {
      light: "/assets/lectures/tesamorelin-light.png?v=2",
      dark: "/assets/lectures/tesamorelin-dark.png?v=2",
    },
  },
  {
    id: "b7-33",
    slugs: ["b7-33", "b733"],
    keywords: [["b7", "33"], ["b7-33"]],
    photos: {
      light: "/assets/lectures/b7-33-light.png?v=2",
      dark: "/assets/lectures/b7-33-dark.png?v=2",
    },
  },
  {
    id: "dihexa",
    slugs: ["dihexa"],
    keywords: [["dihexa"]],
    photos: {
      light: "/assets/lectures/dihexa-light.png?v=2",
      dark: "/assets/lectures/dihexa-dark.png?v=2",
    },
  },
  {
    id: "chonluten",
    slugs: ["chonluten"],
    keywords: [["chonluten"]],
    photos: {
      light: "/assets/lectures/chonluten-light.png?v=2",
      dark: "/assets/lectures/chonluten-dark.png?v=2",
    },
  },
  {
    id: "mk-677",
    slugs: ["mk-677", "mk677"],
    keywords: [["mk", "677"], ["mk-677"], ["ibutamoren"]],
    photos: {
      light: "/assets/lectures/mk-677-light.png?v=2",
      dark: "/assets/lectures/mk-677-dark.png?v=2",
    },
  },
  {
    id: "ara-290",
    slugs: ["ara-290", "ara290"],
    keywords: [["ara", "290"], ["ara-290"]],
    photos: {
      light: "/assets/lectures/ara-290-light.png?v=2",
      dark: "/assets/lectures/ara-290-dark.png?v=2",
    },
  },
  {
    id: "igf-1-des",
    slugs: ["igf-1-des", "igf1-des", "igf-1des"],
    keywords: [["igf-1", "des"], ["igf", "1", "des"], ["igf-1 des"]],
    photos: {
      light: "/assets/lectures/igf-1-des-light.png?v=2",
      dark: "/assets/lectures/igf-1-des-dark.png?v=2",
    },
  },
  {
    id: "igf-1-lr3",
    slugs: ["igf-1-lr3", "igf1-lr3", "igf-lr3"],
    keywords: [["igf-1", "lr3"], ["igf", "1", "lr3"], ["igf-lr3"], ["igf", "lr3"]],
    photos: {
      light: "/assets/lectures/igf-1-lr3-light.png?v=2",
      dark: "/assets/lectures/igf-1-lr3-dark.png?v=2",
    },
  },
  {
    id: "n-acetyl-epitalon-amidate",
    slugs: ["n-acetyl-epitalon-amidate", "n-acetyl-epithalon-amidate"],
    keywords: [
      ["n-acetyl", "epitalon", "amidate"],
      ["n-acetyl", "epithalon", "amidate"],
      ["n-acetyle", "epithalon", "amidate"],
      ["epitalon", "amidate"],
      ["epithalon", "amidate"],
    ],
    photos: {
      light: "/assets/lectures/n-acetyl-epitalon-amidate-light.png?v=2",
      dark: "/assets/lectures/n-acetyl-epitalon-amidate-dark.png?v=2",
    },
  },
  {
    id: "ovagen",
    slugs: ["ovagen"],
    keywords: [["ovagen"]],
    photos: {
      light: "/assets/lectures/ovagen-light.png?v=2",
      dark: "/assets/lectures/ovagen-dark.png?v=2",
    },
  },
  {
    id: "livagen",
    slugs: ["livagen"],
    keywords: [["livagen"]],
    photos: {
      light: "/assets/lectures/livagen-light.png?v=2",
      dark: "/assets/lectures/livagen-dark.png?v=2",
    },
  },
  {
    id: "bpc-157",
    slugs: ["bpc-157", "bpc157"],
    keywords: [["bpc", "157"], ["bpc-157"]],
    photos: {
      light: "/assets/lectures/bpc-157-light.png?v=2",
      dark: "/assets/lectures/bpc-157-dark.png?v=2",
    },
  },
  {
    id: "dsip",
    slugs: ["dsip"],
    keywords: [["dsip"]],
    photos: {
      light: "/assets/lectures/dsip-light.png?v=2",
      dark: "/assets/lectures/dsip-dark.png?v=2",
    },
  },
  {
    id: "thymalin",
    slugs: ["thymalin"],
    keywords: [["thymalin"]],
    photos: {
      light: "/assets/lectures/thymalin-light.png?v=2",
      dark: "/assets/lectures/thymalin-dark.png?v=2",
    },
  },
  {
    id: "semax",
    slugs: ["semax"],
    keywords: [["semax"]],
    photos: {
      light: "/assets/lectures/semax-light.png?v=2",
      dark: "/assets/lectures/semax-dark.png?v=2",
    },
  },
  {
    id: "ss-31",
    slugs: ["ss-31", "ss31"],
    keywords: [["ss", "31"], ["ss-31"], ["elamipretide"]],
    photos: {
      light: "/assets/lectures/ss-31-light.png?v=2",
      dark: "/assets/lectures/ss-31-dark.png?v=2",
    },
  },
  {
    id: "pt-141",
    slugs: ["pt-141", "pt141"],
    keywords: [["pt", "141"], ["pt-141"], ["bremelanotide"]],
    photos: {
      light: "/assets/lectures/pt-141-light.png?v=2",
      dark: "/assets/lectures/pt-141-dark.png?v=2",
    },
  },
  {
    id: "hgh",
    slugs: ["hgh"],
    keywords: [["hgh"]],
    photos: {
      light: "/assets/lectures/hgh-light.png?v=2",
      dark: "/assets/lectures/hgh-dark.png?v=2",
    },
  },
  {
    id: "epitalon",
    slugs: ["epitalon", "epithalon"],
    keywords: [["epitalon"], ["epithalon"]],
    photos: {
      light: "/assets/lectures/epitalon-light.png?v=2",
      dark: "/assets/lectures/epitalon-dark.png?v=2",
    },
  },
  {
    id: "hcg",
    slugs: ["hcg"],
    keywords: [["hcg"], ["human", "chorionic", "gonadotropin"]],
    photos: {
      light: "/assets/lectures/hcg-light.png?v=2",
      dark: "/assets/lectures/hcg-dark.png?v=2",
    },
  },
  {
    id: "mgf",
    slugs: ["mgf"],
    keywords: [["mgf"], ["mechano", "growth", "factor"]],
    photos: {
      light: "/assets/lectures/mgf-light.png?v=2",
      dark: "/assets/lectures/mgf-dark.png?v=2",
    },
  },
  {
    id: "foxo4-dri",
    slugs: ["foxo4-dri", "foxo4dri"],
    keywords: [["foxo4", "dri"], ["foxo4-dri"]],
    photos: {
      light: "/assets/lectures/foxo4-dri-light.png?v=2",
      dark: "/assets/lectures/foxo4-dri-dark.png?v=2",
    },
  },
  {
    id: "thymulin",
    slugs: ["thymulin"],
    keywords: [["thymulin"]],
    photos: {
      light: "/assets/lectures/thymulin-light.png?v=2",
      dark: "/assets/lectures/thymulin-dark.png?v=2",
    },
  },
  {
    id: "bacteriostatic-water",
    slugs: ["bacteriostatic-water", "bac-water"],
    keywords: [["bacteriostatic", "water"], ["bac", "water"]],
    photos: {
      light: "/assets/lectures/bacteriostatic-water-light.png?v=2",
      dark: "/assets/lectures/bacteriostatic-water-dark.png?v=2",
    },
  },
];

function resolveCoverEntry(entry: CourseCoverEntry): ResolvedCourseCover {
  const isBook = entry.layout === "book";
  return {
    photos: entry.photos,
    isCustom: true,
    coverId: entry.id,
    objectPosition: entry.objectPosition ?? (isBook ? undefined : "40% 46%"),
    layout: entry.layout,
  };
}

const DEFAULT_COVER_PHOTOS: CourseCoverPhotos = {
  light: VIAL_PHOTO_LIGHT,
  dark: VIAL_PHOTO_DARK,
};

function slugifyCoverTitle(title: string): string {
  return tidyCoverTitle(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u2018\u2019\u201B\u2032\u0060\u00B4']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function matchesCourseCoverEntry(slug: string, normalizedTitle: string, entry: CourseCoverEntry): boolean {
  if (entry.slugs?.some((alias) => slug === alias || slug.startsWith(`${alias}-`))) {
    return true;
  }
  if (entry.keywords?.some((group) => group.every((token) => normalizedTitle.includes(token)))) {
    return true;
  }
  return false;
}

/** Nudge Magnific vial art right on the volume front cover so the left title column stays clear. */
export function shiftCoverObjectPositionForPanel(
  objectPosition: string,
  shiftPercent = 12,
): string {
  const match = objectPosition.match(/^([\d.]+)%\s+([\d.]+)%$/);
  if (!match) {
    return objectPosition;
  }

  const x = Math.min(parseFloat(match[1]) + shiftPercent, 72);
  return `${x}% ${match[2]}%`;
}

/** Resolve light/dark cover photos + whether to use full-bleed custom art. */
export function resolveCourseCover(courseId: string, title?: string): ResolvedCourseCover {
  if (courseId) {
    for (const entry of COURSE_COVER_ENTRIES) {
      if (entry.courseIds?.includes(courseId)) {
        return resolveCoverEntry(entry);
      }
    }
  }

  if (!title) {
    return { photos: DEFAULT_COVER_PHOTOS, isCustom: false };
  }

  const slug = slugifyCoverTitle(title);
  const normalizedTitle = tidyCoverTitle(title).toLowerCase();

  for (const entry of COURSE_COVER_ENTRIES) {
    if (matchesCourseCoverEntry(slug, normalizedTitle, entry)) {
      return resolveCoverEntry(entry);
    }
  }

  return { photos: DEFAULT_COVER_PHOTOS, isCustom: false };
}

/** @deprecated Use resolveCourseCover */
export function getCourseCoverPhotos(title?: string): CourseCoverPhotos {
  return resolveCourseCover("", title).photos;
}

/** @deprecated Use resolveCourseCover */
export function hasCustomCourseCover(title?: string): boolean {
  return resolveCourseCover("", title).isCustom;
}

export type CourseCoverPalette = {
  navy: string;
  mid: string;
  lime: string;
  sky: string;
  ink: string;
  glow: string;
};

export type CourseCoverSpec = {
  /** Stable index for soft brand glow placement */
  pattern: number;
  palette: CourseCoverPalette;
};

/**
 * Premium close product-shot framing — oversized contain stage + scale so the vial
 * dominates the media. Soft studio-edge bleed via overflow is intentional; avoid
 * mid-glyph chops by keeping the product silhouette mostly intact.
 */
export type VialCompositionRecipe = {
  id: string;
  name: string;
  /** Stage width as % of media box (often 85–110% for close framing) */
  width: string;
  /** Stage height as % of media box (often 95–120%) */
  height: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  objectPosition: string;
  /** Contain keeps silhouette coherent; closeness comes from stage size + scale */
  objectFit: "contain";
  /** Extra spin on top of the baked-in product tilt (−6…+6) */
  rotate: number;
  /** Aggressive close-up scale (≈1.35…1.75) — editorial bleed OK */
  scale: number;
  opacity: number;
  /** 0–1 — separate aura layer intensity behind vial (not img blur) */
  glowIntensity: number;
  transformOrigin: string;
  /** 0–1 — stronger left scrim when vial sits closer to center */
  textScrimStrength: number;
};

export type CoverAccentLayout = VialCompositionRecipe & {
  transform: string;
  recipeId: string;
  recipeName: string;
};

/** @deprecated Use CoverAccentLayout */
export type CoverVialLayout = CoverAccentLayout;

/** HOLS brand-forward palettes (Prussian / Dusk / Lemon Lime / Baby Blue). */
const PALETTES: CourseCoverPalette[] = [
  {
    navy: "#142644",
    mid: "#1a2f55",
    lime: "#DDE466",
    sky: "#8DC3E1",
    ink: "#F4F7FB",
    glow: "rgba(221, 228, 102, 0.28)",
  },
  {
    navy: "#101b30",
    mid: "#3853A4",
    lime: "#DDE466",
    sky: "#8DC3E1",
    ink: "#EEF3FA",
    glow: "rgba(141, 195, 225, 0.32)",
  },
  {
    navy: "#0d1626",
    mid: "#152744",
    lime: "#E2EB6E",
    sky: "#A8D4EC",
    ink: "#F7FAFC",
    glow: "rgba(221, 228, 102, 0.22)",
  },
  {
    navy: "#142644",
    mid: "#243d66",
    lime: "#D4DE58",
    sky: "#79B8D8",
    ink: "#F0F4F9",
    glow: "rgba(56, 83, 164, 0.45)",
  },
  {
    navy: "#0e1830",
    mid: "#1c3558",
    lime: "#DDE466",
    sky: "#95C8E4",
    ink: "#F5F8FC",
    glow: "rgba(141, 195, 225, 0.26)",
  },
  {
    navy: "#0b1528",
    mid: "#1f3a60",
    lime: "#CFDC4C",
    sky: "#8DC3E1",
    ink: "#EEF2F8",
    glow: "rgba(221, 228, 102, 0.3)",
  },
];

/**
 * 10 close product-shot stages — oversized contain + aggressive scale.
 * Vial dominates the media (~editorial close-up); soft studio edges may bleed
 * past the card crop. Left title zone kept readable via scrim strength.
 */
export const VIAL_COMPOSITION_RECIPES: VialCompositionRecipe[] = [
  {
    id: "hero-right",
    name: "Hero right",
    top: "-4%",
    right: "-6%",
    width: "96%",
    height: "112%",
    objectPosition: "54% 50%",
    objectFit: "contain",
    rotate: -2,
    scale: 1.55,
    opacity: 1,
    glowIntensity: 0.34,
    transformOrigin: "58% 50%",
    textScrimStrength: 0.52,
  },
  {
    id: "soft-offset",
    name: "Soft offset",
    top: "-2%",
    right: "-2%",
    width: "90%",
    height: "108%",
    objectPosition: "52% 48%",
    objectFit: "contain",
    rotate: 0,
    scale: 1.48,
    opacity: 1,
    glowIntensity: 0.3,
    transformOrigin: "55% 50%",
    textScrimStrength: 0.5,
  },
  {
    id: "high-right",
    name: "High right",
    top: "-10%",
    right: "-8%",
    width: "98%",
    height: "118%",
    objectPosition: "56% 44%",
    objectFit: "contain",
    rotate: 3,
    scale: 1.62,
    opacity: 1,
    glowIntensity: 0.36,
    transformOrigin: "60% 40%",
    textScrimStrength: 0.54,
  },
  {
    id: "low-settle",
    name: "Low settle",
    bottom: "-8%",
    right: "-4%",
    width: "94%",
    height: "114%",
    objectPosition: "53% 56%",
    objectFit: "contain",
    rotate: -4,
    scale: 1.58,
    opacity: 1,
    glowIntensity: 0.32,
    transformOrigin: "56% 62%",
    textScrimStrength: 0.55,
  },
  {
    id: "far-right",
    name: "Far right",
    top: "-3%",
    right: "-12%",
    width: "88%",
    height: "110%",
    objectPosition: "58% 50%",
    objectFit: "contain",
    rotate: 2,
    scale: 1.42,
    opacity: 1,
    glowIntensity: 0.32,
    transformOrigin: "62% 50%",
    textScrimStrength: 0.48,
  },
  {
    id: "center-bias",
    name: "Center bias",
    top: "-2%",
    right: "0%",
    width: "102%",
    height: "112%",
    objectPosition: "48% 50%",
    objectFit: "contain",
    rotate: -1,
    scale: 1.52,
    opacity: 1,
    glowIntensity: 0.35,
    transformOrigin: "50% 50%",
    textScrimStrength: 0.6,
  },
  {
    id: "gentle-tilt",
    name: "Gentle tilt",
    top: "-6%",
    right: "-5%",
    width: "94%",
    height: "116%",
    objectPosition: "54% 50%",
    objectFit: "contain",
    rotate: 5,
    scale: 1.5,
    opacity: 1,
    glowIntensity: 0.33,
    transformOrigin: "56% 50%",
    textScrimStrength: 0.53,
  },
  {
    id: "counter-tilt",
    name: "Counter tilt",
    top: "-5%",
    right: "-4%",
    width: "92%",
    height: "114%",
    objectPosition: "53% 50%",
    objectFit: "contain",
    rotate: -5,
    scale: 1.54,
    opacity: 1,
    glowIntensity: 0.34,
    transformOrigin: "55% 50%",
    textScrimStrength: 0.54,
  },
  {
    id: "generous",
    name: "Generous",
    top: "-8%",
    right: "-8%",
    width: "108%",
    height: "120%",
    objectPosition: "52% 50%",
    objectFit: "contain",
    rotate: 0,
    scale: 1.68,
    opacity: 1,
    glowIntensity: 0.31,
    transformOrigin: "55% 50%",
    textScrimStrength: 0.56,
  },
  {
    id: "intimate",
    name: "Intimate",
    top: "-6%",
    right: "-2%",
    width: "100%",
    height: "118%",
    objectPosition: "50% 46%",
    objectFit: "contain",
    rotate: 4,
    scale: 1.72,
    opacity: 1,
    glowIntensity: 0.38,
    transformOrigin: "52% 46%",
    textScrimStrength: 0.58,
  },
];

const PANEL_SCALE = 0.85;

function scalePercent(value: string | undefined, factor: number): string | undefined {
  if (value === undefined) return undefined;
  const match = /^(-?\d+(?:\.\d+)?)%$/.exec(value);
  if (!match) return value;
  const scaled = Math.round(parseFloat(match[1]!) * factor * 10) / 10;
  return `${scaled}%`;
}

function toPanelRecipe(recipe: VialCompositionRecipe): VialCompositionRecipe {
  return {
    ...recipe,
    width: scalePercent(recipe.width, PANEL_SCALE) ?? recipe.width,
    height: scalePercent(recipe.height, PANEL_SCALE) ?? recipe.height,
    top: scalePercent(recipe.top, PANEL_SCALE),
    right: scalePercent(recipe.right, PANEL_SCALE),
    bottom: scalePercent(recipe.bottom, PANEL_SCALE),
    left: scalePercent(recipe.left, PANEL_SCALE),
    scale: Math.round(recipe.scale * 0.96 * 100) / 100,
  };
}

/** FNV-1a style hash — stable across sessions. */
export function hashCourseId(courseId: string): number {
  let h = 2166136261;
  for (let i = 0; i < courseId.length; i += 1) {
    h ^= courseId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getCourseCoverSpec(courseId: string): CourseCoverSpec {
  const hash = hashCourseId(courseId);
  return {
    pattern: hash % 8,
    palette: PALETTES[(hash >>> 12) % PALETTES.length]!,
  };
}

/** Display title for book-cover typography (lecture heading above vial). */
export function getCoverDisplayTitle(title: string): string {
  return tidyCoverTitle(title);
}

/** All lecture covers use the HOLS vial photo. Kept for API compatibility. */
export function courseNeedsVial(_title?: string): boolean {
  return true;
}

/** Resolve the raw recipe for a course (before panel scaling). */
export function getVialCompositionRecipe(courseId: string): VialCompositionRecipe {
  const hash = hashCourseId(courseId);
  const slot = (hash >>> 3) % VIAL_COMPOSITION_RECIPES.length;
  return VIAL_COMPOSITION_RECIPES[slot]!;
}

function recipeToLayout(recipe: VialCompositionRecipe): CoverAccentLayout {
  return {
    ...recipe,
    recipeId: recipe.id,
    recipeName: recipe.name,
    transform: `rotate(${recipe.rotate}deg) scale(${recipe.scale})`,
  };
}

/**
 * Position + scale for cover vial — close product hero, unique per course_id.
 * 10 named recipes hashed deterministically from course_id.
 */
export function getCoverVialLayout(
  courseId: string,
  variant: "card" | "panel",
): CoverAccentLayout {
  const base = getVialCompositionRecipe(courseId);
  const recipe = variant === "panel" ? toPanelRecipe(base) : base;
  return recipeToLayout(recipe);
}

/** @deprecated Covers always use vial — retained for decor component if reused elsewhere. */
export function getCoverDecorLayout(
  spec: CourseCoverSpec,
  variant: "card" | "panel",
): CoverAccentLayout {
  return getCoverVialLayout(String(spec.pattern), variant);
}

export function courseCoverCssVars(spec: CourseCoverSpec): Record<string, string> {
  return {
    "--cover-art-navy": spec.palette.navy,
    "--cover-art-mid": spec.palette.mid,
    "--cover-art-lime": spec.palette.lime,
    "--cover-art-sky": spec.palette.sky,
    "--cover-art-ink": spec.palette.ink,
    "--cover-art-glow": spec.palette.glow,
  };
}

/** Deterministic particle positions for cover atmosphere layers. */
export function coverAtmosphereParticles(
  seed: number,
): Array<{ x: number; y: number; size: number; opacity: number }> {
  const particles: Array<{ x: number; y: number; size: number; opacity: number }> = [];
  let s = seed;
  for (let i = 0; i < 10; i += 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    particles.push({
      x: 6 + (s % 880) / 10,
      y: 4 + ((s >> 8) % 320) / 10,
      size: 1.5 + (s % 3),
      opacity: 0.1 + (s % 16) / 100,
    });
  }
  return particles;
}
