import { defaults } from "$playground/defaults";
import type { PlaygroundConfig } from "$playground/types";
import { readConfig } from "$playground/url";

/** The live playground configuration, seeded from the URL's params. */
export const config = $state<PlaygroundConfig>({ ...defaults, ...readConfig() });
