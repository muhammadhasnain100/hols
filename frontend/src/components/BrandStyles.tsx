import { brandToCssVariables } from "@/lib/brand-to-css";

/** Injects brand CSS variables from src/config/brand.ts into the document */
export function BrandStyles() {
  return (
    <style
      data-brand="hols"
      dangerouslySetInnerHTML={{ __html: brandToCssVariables() }}
    />
  );
}
