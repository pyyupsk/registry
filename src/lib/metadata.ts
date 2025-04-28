import type { Metadata } from "next";

const BASE_URL = "https://fasu.dev";

const DEFAULT_AUTHOR = {
  name: "pyyupsk",
  url: BASE_URL,
};
const APPLICATION_NAME = "fasu.dev";
const TWITTER_HANDLE = "@pyyupsk_";
const DEFAULT_IMAGE_DIMENSIONS = { height: 630, width: 1200 };

type MetadataOptions = {
  additionalMetadata?: Partial<Metadata>;
  description: string;
  image?: string;
  title: string;
};

export function generateMetadata({
  additionalMetadata = {},
  description,
  image = "/og.png",
  title,
}: MetadataOptions): Metadata {
  const baseMetadata: Metadata = {
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: title,
    },
    applicationName: APPLICATION_NAME,
    authors: [DEFAULT_AUTHOR],
    creator: DEFAULT_AUTHOR.name,
    description,
    formatDetection: {
      telephone: false,
    },
    icons: [
      {
        rel: "icon",
        type: "image/svg+xml",
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='10 0 100 100'><text y='.90em' font-size='90'>👋</text></svg>",
      },
    ],
    metadataBase: new URL(BASE_URL),
    openGraph: {
      description,
      images: image
        ? [
            {
              alt: title,
              url: image,
              ...DEFAULT_IMAGE_DIMENSIONS,
            },
          ]
        : undefined,
      locale: "en_US",
      siteName: APPLICATION_NAME,
      title: title,
      type: "website",
    },
    publisher: DEFAULT_AUTHOR.name,
    title: title,
    twitter: {
      card: "summary_large_image",
      creator: TWITTER_HANDLE,
    },
  };

  // Merge baseMetadata with additionalMetadata using spread syntax
  return {
    ...baseMetadata,
    ...additionalMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      ...additionalMetadata.openGraph,
    },
    twitter: {
      ...baseMetadata.twitter,
      ...additionalMetadata.twitter,
    },
  };
}
