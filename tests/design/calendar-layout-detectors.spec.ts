import { expect, test } from "@playwright/test";
import { calendarLayoutFindings } from "../helpers/calendar-layout";

for (const [rule, mutation] of [
  ["overflow_horizontal", "document.querySelector('main').style.width='200vw'"],
  [
    "recorte",
    "document.querySelector('article').style.height='20px'; document.querySelector('article').style.overflow='hidden'",
  ],
  [
    "colapso",
    "document.querySelector('aside').style.height='0'; document.querySelector('aside').style.overflow='hidden'",
  ],
  [
    "solapamiento",
    "document.querySelector('aside').style.position='absolute'; document.querySelector('aside').style.top='0'",
  ],
]) {
  test(`controlled ${rule} is detected`, async ({ page }) => {
    await page.setContent(
      '<style>main {width:300px} article {position:relative} aside {height:44px} footer{height:44px}</style><main><section aria-labelledby="event-page-title"><h1>Evento</h1><article><dl><dt>Fecha</dt><dd>Fecha de prueba</dd></dl><h2>Descripción</h2><p>Contenido</p><aside>Acciones</aside></article></section></main><footer>Footer</footer>',
    );
    expect(await calendarLayoutFindings(page)).toEqual([]);
    await page.evaluate(mutation);
    expect(
      (await calendarLayoutFindings(page)).map((finding) => finding.rule),
    ).toContain(rule);
  });
}

test("approved clipping exceptions and a recoverable carousel stay valid", async ({
  page,
}) => {
  await page.setContent(
    '<style>.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.line-clamp-2{height:20px;overflow:hidden} main{width:300px} [role=group]{display:flex;width:100px;overflow-x:auto}button{flex:none;width:80px;height:50px}</style><main><h1>Calendario</h1><nav>Controles</nav><p class="sr-only">Texto accesible</p><p class="line-clamp-2">Resumen<br>compacto<br>recortado</p><div role="group"><button>Uno</button><button>Dos</button></div></main><footer>Footer</footer>',
  );
  expect(await calendarLayoutFindings(page)).toEqual([]);
});
