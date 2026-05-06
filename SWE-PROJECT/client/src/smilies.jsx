// All available phpBB smilies with their text codes and filenames.
// These are self-hosted at /smilies/*.svg

const S = (file) => `/smilies/${file}`;

export const SMILIES = [
  { code: ":)",          file: "icon_e_smile.svg",    alt: "smile"     },
  { code: ":D",          file: "icon_e_biggrin.svg",  alt: "grin"      },
  { code: ";)",          file: "icon_e_wink.svg",     alt: "wink"      },
  { code: ":(",          file: "icon_e_sad.svg",      alt: "sad"       },
  { code: ":lol:",       file: "icon_lol.svg",        alt: "lol"       },
  { code: ":cool:",      file: "icon_cool.svg",       alt: "cool"      },
  { code: ":mad:",       file: "icon_mad.svg",        alt: "mad"       },
  { code: ":eek:",       file: "icon_eek.svg",        alt: "eek"       },
  { code: ":cry:",       file: "icon_cry.svg",        alt: "cry"       },
  { code: ":idea:",      file: "icon_idea.svg",       alt: "idea"      },
  { code: ":thumbup:",   file: "icon_thumbup.svg",    alt: "+1"        },
  { code: ":thumbdown:", file: "icon_thumbdown.svg",  alt: "-1"        },
  { code: ":clap:",      file: "icon_clap.svg",       alt: "clap"      },
  { code: ":wave:",      file: "icon_wave.svg",       alt: "wave"      },
  { code: ":think:",     file: "icon_think.svg",      alt: "thinking"  },
  { code: ":wtf:",       file: "icon_wtf.svg",        alt: "wtf"       },
  { code: ":evil:",      file: "icon_evil.svg",       alt: "evil"      },
  { code: ":crazy:",     file: "icon_crazy.svg",      alt: "crazy"     },
  { code: ":twisted:",   file: "icon_twisted.svg",    alt: "twisted"   },
  { code: ":shifty:",    file: "icon_shifty.svg",     alt: "shifty"    },
  { code: ":angel:",     file: "icon_angel.svg",      alt: "angel"     },
  { code: ":mrgreen:",   file: "icon_mrgreen.svg",    alt: "mrgreen"   },
  { code: ":geek:",      file: "icon_e_geek.svg",     alt: "geek"      },
  { code: ":ugeek:",     file: "icon_e_ugeek.svg",    alt: "ugeek"     },
  { code: ":confused:",  file: "icon_e_confused.svg", alt: "confused"  },
  { code: ":surprised:", file: "icon_e_surprised.svg",alt: "surprised" },
  { code: ":question:",  file: "icon_question.svg",   alt: "?"         },
  { code: ":exclaim:",   file: "icon_exclaim.svg",    alt: "!"         },
  { code: ":neutral:",   file: "icon_neutral.svg",    alt: "neutral"   },
  { code: ":redface:",   file: "icon_redface.svg",    alt: "blush"     },
  { code: ":razz:",      file: "icon_razz.svg",       alt: "razz"      },
  { code: ":rolleyes:",  file: "icon_rolleyes.svg",   alt: "rolleyes"  },
  { code: ":arrow:",     file: "icon_arrow.svg",      alt: "arrow"     },
  { code: ":shh:",       file: "icon_shh.svg",        alt: "shh"       },
  { code: ":sick:",      file: "icon_sick.svg",       alt: "sick"      },
  { code: ":silent:",    file: "icon_silent.svg",     alt: "silent"    },
  { code: ":yawn:",      file: "icon_yawn.svg",       alt: "yawn"      },
  { code: ":eh:",        file: "icon_eh.svg",         alt: "eh"        },
  { code: ":lolno:",     file: "icon_lolno.svg",      alt: "lolno"     },
  { code: ":problem:",   file: "icon_problem.svg",    alt: "problem"   },
];

// Build a regex that matches any smiley code (escaped)
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SMILEY_REGEX = new RegExp(
  SMILIES.map(s => escapeRegex(s.code)).join("|"),
  "g"
);
const SMILEY_MAP = Object.fromEntries(
  SMILIES.map(s => [s.code, { src: S(s.file), alt: s.alt }])
);

/**
 * Parse a line of text, replacing smiley codes with <img> React elements.
 * Returns an array of strings and React elements.
 */
export function parseSmileyLine(text, keyPrefix = "") {
  const parts = [];
  let last = 0;
  SMILEY_REGEX.lastIndex = 0;
  let m;
  while ((m = SMILEY_REGEX.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const { src, alt } = SMILEY_MAP[m[0]];
    parts.push(
      <img key={`${keyPrefix}-${m.index}`} src={src} alt={alt}
        title={m[0]}
        style={{ width: "18px", height: "18px", verticalAlign: "middle", display: "inline", imageRendering: "pixelated" }} />
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
