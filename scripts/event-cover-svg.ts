/** Read the supplied editable SVG as source text; never flatten or redraw paths. */
export function styleCoverBackground(
  background: string,
  paper: string,
  flagOpacity: number,
) {
  if (
    !/^#[a-f0-9]{6}$/i.test(paper) ||
    flagOpacity < 0 ||
    flagOpacity > 1 ||
    !Number.isFinite(flagOpacity)
  )
    throw new Error("Invalid background style");
  return background
    .replace(/<rect\b[^>]*>/, (rect) =>
      rect.replace(/fill="[^"]*"/, `fill="${paper}"`),
    )
    .replace(/opacity="[^"]*"/, `opacity="${flagOpacity}"`);
}

export function extractCoverSvgLayers(source: string) {
  if (
    /<!DOCTYPE|<!ENTITY|<script\b|<foreignObject\b|\bon\w+\s*=|\bhref\s*=\s*["'](?!data:image\/png;base64,)|url\((?!#[\w-]+\))/i.test(
      source,
    )
  )
    throw new Error(
      "Cover source must be self-contained vector paths without active content",
    );
  const viewBox = /<svg\b[^>]*\bviewBox="([\d.\s-]+)"/.exec(source)?.[1];
  if (!viewBox || viewBox.trim().split(/\s+/).length !== 4)
    throw new Error("Missing SVG viewBox");
  function group(id: string) {
    const start = new RegExp(`<g\\b[^>]*\\bid="${id}"[^>]*>`).exec(source);
    if (!start) throw new Error(`Missing SVG layer: ${id}`);
    const rest = source.slice(start.index);
    const tags = /<\/?g\b[^>]*>/g;
    let depth = 0;
    for (const tag of rest.matchAll(tags)) {
      if (tag[0].startsWith("</")) depth--;
      else if (!tag[0].endsWith("/>")) depth++;
      if (depth === 0) return rest.slice(0, tag.index + tag[0].length);
    }
    throw new Error(`Unclosed SVG layer: ${id}`);
  }
  const backgroundGroup = group("fondo-bandera");
  const illustrationGroup = group("kendoka");
  const wrap = (content: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${content}</svg>`;
  return {
    viewBox,
    backgroundGroup,
    illustrationGroup,
    background: wrap(backgroundGroup),
    illustration: wrap(illustrationGroup),
  };
}

/** Reuse the approved composition while limiting the label to external events. */
export function selectCoverComposition(source: string, external: boolean) {
  if (external) return source;
  const label = /<g\b[^>]*\bid="evento-externo"[^>]*>[\s\S]*?<\/g>/;
  if (!label.test(source)) throw new Error("Missing external cover label");
  const canvas = /viewBox="([\d.\s-]+)"/
    .exec(source)?.[1]
    .split(/\s+/)
    .map(Number);
  const logo =
    /<g id="external-logo"><image x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/.exec(
      source,
    );
  if (!canvas || !logo) throw new Error("Missing vertical cover logo geometry");
  const offset =
    canvas[0] + canvas[2] / 2 - (Number(logo[1]) + Number(logo[2]) / 2);
  return source
    .replace(label, "")
    .replace(
      '<g id="external-logo">',
      `<g id="external-logo" transform="translate(${offset} 0)">`,
    );
}
