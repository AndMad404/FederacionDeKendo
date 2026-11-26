import seoData from "./seo-data.json";

const calendar = seoData.routes["/eventos/"];
const { srcSet, sizes, type } = calendar.preloadImage;

export const calendarBannerImage = {
  src: calendar.image,
  sources: [{ srcSet, sizes, type }],
  width: calendar.imageWidth,
  height: calendar.imageHeight,
  className: "object-[center_20%]",
};
