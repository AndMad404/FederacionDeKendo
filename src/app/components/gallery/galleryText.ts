const GALLERY_TITLE_MAX_LENGTH = 32;
const GALLERY_TAG_MAX_LENGTH = 20;
const GALLERY_DESCRIPTION_MAX_LENGTH = 200;
const MOBILE_DESCRIPTION_MAX_LENGTH = 70;
export const OPEN_DETAILS_LABEL = "Abrir detalles";

const ellipsis = "...";

function truncateAtWord(value: string, maxLength: number) {
  const text = value.trim();

  if (text.length <= maxLength) return text;
  if (maxLength <= 0) return "";

  const truncated = text.slice(0, maxLength).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace <= 0) return truncated;

  return truncated.slice(0, lastSpace);
}

function truncateText(value: string, maxLength: number) {
  const text = value.trim();

  if (text.length <= maxLength) return text;
  if (maxLength <= ellipsis.length) return text.slice(0, maxLength);

  return `${truncateAtWord(text, maxLength - ellipsis.length)}${ellipsis}`;
}

export function getGalleryDisplayText({
  title,
  tag,
  description,
}: {
  title: string;
  tag: string;
  description?: string;
}) {
  const displayTitle = truncateText(title, GALLERY_TITLE_MAX_LENGTH);
  const displayTag = truncateText(tag, GALLERY_TAG_MAX_LENGTH);
  const displayDescription = description
    ? truncateText(description, GALLERY_DESCRIPTION_MAX_LENGTH)
    : "";

  return {
    displayTitle,
    displayTag,
    displayDescription,
  };
}

export function getMobileDescriptionPreview(
  description: string,
  openDetailsLabel = OPEN_DETAILS_LABEL,
) {
  const text = truncateText(description, GALLERY_DESCRIPTION_MAX_LENGTH);

  if (text.length <= MOBILE_DESCRIPTION_MAX_LENGTH) {
    return {
      preview: text,
      isTruncated: false,
    };
  }

  const textLimit =
    MOBILE_DESCRIPTION_MAX_LENGTH - openDetailsLabel.length - ellipsis.length;

  return {
    preview: `${truncateAtWord(text, textLimit)}${ellipsis}${openDetailsLabel}`,
    isTruncated: true,
  };
}
