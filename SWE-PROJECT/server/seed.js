/**
 * RevIndex — Forum Seed Script
 * Run: node server/seed.js
 * Creates 85 fake users, their vehicles, 45 threads, and reply chains.
 * Seed accounts are not loginable — each gets a random unguessable password.
 */

"use strict";
const Database = require("better-sqlite3");
const bcrypt   = require("bcryptjs");
const path     = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "db/carlog.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate() {
  const start = new Date("2026-03-03").getTime();
  const end   = new Date("2026-05-06T23:59:59").getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().replace("T", " ").substring(0, 19);
}
function randDateAfter(isoStr) {
  const start = new Date(isoStr.replace(" ", "T") + "Z").getTime();
  const end   = new Date("2026-05-06T23:59:59").getTime();
  if (start >= end) return isoStr;
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().replace("T", " ").substring(0, 19);
}

// ─── Data Pools ───────────────────────────────────────────────────────────────
const USERNAMES = [
  "E39Kris", "thatslow5point0", "IS333", "RedlineRandy13", "BoostedBenny",
  "CleanE46", "MisfireMatty", "GTR_Gus", "SlantSix_Steve", "TurboTerry",
  "LoweredLuis", "WideBodyWendy", "DriftKingDave", "AutocrossAlex",
  "StockStanley", "V8Vinnie", "JDM_Jake", "HondaHarold", "RB26Rita",
  "ClutchKickCarlos", "CamberCraig", "OversteerOllie", "FlatSixFrank",
  "InjectedIvan", "NaturallyNick", "ForgedPistonsPhil", "DownpipeDennis",
  "MapEcuMike", "DynoDay_Dana", "PullAndPray_Pete", "SlipAngle_Sara",
  "BoostGremlin", "WastegateWalt", "BrokenOdometerBob", "CamCameron",
  "LSswapLarry", "K24Katie", "2JZ_Jerome", "EvoEddie", "SubieSusan",
  "S14Samantha", "MR2Marco", "BRZ_Brianna", "GC8_Garrett", "AE86Andy",
  "ChaseYourTail_Chad", "QuarterMileQuinn", "LapTimer_Lexi",
  "TireWall_Tim", "GravelTrap_Grace", "Understeer_Umberto",
  "ColdAirCorey", "IntakeManifold_Mia", "HeadGasket_Henry",
  "TimingBelt_Tara", "ThrowoutBearing_Thor", "BrakeFade_Brendan",
  "RotorRuss", "PadDust_Patty", "BBK_Brian", "StopTech_Stephanie",
  "AdjCoilovers_Aaron", "SwayBar_Sofia", "EndLinks_Eli",
  "TireRub_Rachel", "SpacerProblems_Spence", "LugNut_Luke",
  "TorqueSpec_Todd", "DegreeCam_Derek", "IgnitionDwell_Ian",
  "AirFuelRatio_Amy", "WOT_Wayne", "PartThrottle_Perry",
  "KnockRetard_Kayla", "DwellAngle_Devin", "CrankWalk_Cole",
  "WristPin_Wesley", "RodKnock_Rhonda", "HeadStuds_Hank",
  "BoreAndStroke_Beth", "CompressionRatio_Carl", "CamDuration_Cindy",
  "LiftSpec_Leon", "PortedAndPolished_Pat"
];

const MAKES_MODELS = [
  { make: "BMW",        model: "E39 M5",         year: 2002 },
  { make: "BMW",        model: "E46 M3",          year: 2004 },
  { make: "BMW",        model: "E36 328i",        year: 1997 },
  { make: "BMW",        model: "E92 M3",          year: 2009 },
  { make: "Lexus",      model: "IS300",           year: 2002 },
  { make: "Lexus",      model: "GS400",           year: 2000 },
  { make: "Lexus",      model: "SC300",           year: 1995 },
  { make: "Ford",       model: "Mustang GT",      year: 2018 },
  { make: "Ford",       model: "Mustang Cobra",   year: 2003 },
  { make: "Ford",       model: "F-150 Raptor",    year: 2021 },
  { make: "Chevrolet",  model: "Camaro SS",       year: 2016 },
  { make: "Chevrolet",  model: "Corvette C5",     year: 2001 },
  { make: "Chevrolet",  model: "Corvette C6 Z06", year: 2007 },
  { make: "Nissan",     model: "GT-R R35",        year: 2015 },
  { make: "Nissan",     model: "350Z",            year: 2006 },
  { make: "Nissan",     model: "370Z",            year: 2012 },
  { make: "Nissan",     model: "S14 240SX",       year: 1997 },
  { make: "Mitsubishi", model: "Evo IX",          year: 2006 },
  { make: "Mitsubishi", model: "Evo X",           year: 2010 },
  { make: "Subaru",     model: "WRX STI",         year: 2008 },
  { make: "Subaru",     model: "Impreza WRX",     year: 2004 },
  { make: "Subaru",     model: "BRZ",             year: 2017 },
  { make: "Toyota",     model: "Supra MK4",       year: 1997 },
  { make: "Toyota",     model: "AE86 Corolla",    year: 1985 },
  { make: "Toyota",     model: "MR2 Turbo",       year: 1993 },
  { make: "Toyota",     model: "GR86",            year: 2023 },
  { make: "Honda",      model: "Civic Si",        year: 2007 },
  { make: "Honda",      model: "Civic Type R",    year: 2019 },
  { make: "Honda",      model: "S2000",           year: 2004 },
  { make: "Honda",      model: "Integra Type R",  year: 2000 },
  { make: "Mazda",      model: "RX-7 FD",         year: 1993 },
  { make: "Mazda",      model: "Miata MX-5",      year: 2001 },
  { make: "Mazda",      model: "Mazdaspeed3",     year: 2010 },
  { make: "Porsche",    model: "911 GT3",         year: 2016 },
  { make: "Porsche",    model: "Cayman S",        year: 2008 },
  { make: "Dodge",      model: "Challenger SRT8", year: 2012 },
  { make: "Dodge",      model: "Viper GTS",       year: 2001 },
  { make: "Volkswagen", model: "Golf GTI Mk7",    year: 2016 },
  { make: "Volkswagen", model: "Golf R",          year: 2018 },
  { make: "Audi",       model: "RS3",             year: 2019 },
  { make: "Audi",       model: "TT RS",           year: 2017 },
  { make: "Mercedes",   model: "C63 AMG",         year: 2014 },
  { make: "Acura",      model: "NSX",             year: 2001 },
  { make: "Acura",      model: "RSX Type S",      year: 2004 },
  { make: "Pontiac",    model: "GTO",             year: 2005 },
];

const THREAD_DATA = [
  // Build Logs
  { title: "E46 M3 Full Track Build — Caged, Coilovers, Everything", tag: "Build Log",
    description: "Finally pulling the trigger on a full cage install. Already have Ohlins TTX, AP Racing brakes, and a Quaife LSD. Documenting everything here." },
  { title: "S14 240SX LS Swap Progress Thread", tag: "Build Log",
    description: "The SR20 gave up the ghost on the track. Decided to go full heresy and drop in an LS1. Motor's out, transmission tunnel gets cut this weekend." },
  { title: "Supra MK4 2JZ-GTE Single Turbo Build Log", tag: "Build Log",
    description: "Starting with a stock R154 trans 2JZ-GTE. Target is 700whp on E85 with a Precision 7675. Long road ahead." },
  { title: "Miata NA track car — stripping everything nonessential", tag: "Build Log",
    description: "NC full cage done, now doing the NA. Pulling AC, power steering, stereo. Harddog cage goes in next week." },
  { title: "AE86 Levin gets a 4AGE 20V blacktop", tag: "Build Log",
    description: "The redtop blew on me at a local gymkhana. Sourced a JDM 20V blacktop. Needs ITBs rebuilt but otherwise looks clean." },
  { title: "Evo IX full rebuild after spun bearing", tag: "Build Log",
    description: "Found metal in the oil at 112k miles. Spinning the 4G63 completely. Wiseco pistons, Eagle rods, balanced crank. Documenting here." },
  { title: "Golf R APR Stage 2+ build — catless, IS38", tag: "Build Log",
    description: "Started with APR Stage 1 map and went down the rabbit hole. IS38 is in, catless downpipe shipped. Will dyno next month." },
  { title: "C5 Corvette LS6 swap and suspension refresh", tag: "Build Log",
    description: "Bought this Z51 with 180k on the original LS1. Doing a full LS6 swap plus DE suspension. Going autocross-focused." },

  // Tech
  { title: "Dialing in coilover alignment — what are your track settings?", tag: "Tech",
    description: "Running BC Racing BR coilovers on an E46. Currently at -2.5 front camber, 0 rear. Tires are cupping on the inside. Open to suggestions." },
  { title: "S54 vs S65 — real world differences on track", tag: "Tech",
    description: "I've driven both. The S54 feels more linear but the S65 revs absolutely insane. Looking for actual lap time data from people who've switched." },
  { title: "RB26 fueling issues above 6500rpm — help needed", tag: "Tech",
    description: "On a 700whp RB26 single setup. AFR drops rich above 6500 and power falls off hard. Injectors are 1000cc, NISMO FPR, Walbro 450." },
  { title: "Head gasket timing on 4G63 — when to pull the motor?", tag: "Tech",
    description: "At 60k miles, just bought an Evo IX. Previous owner says it was never done. Stock gasket was known to blow around 80k under boost. Pre-emptive or wait?" },
  { title: "Limited slip differences — VLSD vs Torsen vs Clutch-type", tag: "Tech",
    description: "Putting a diff in my IS300 for autocross. Power isn't crazy (240whp) but I want something progressive, not grabby." },
  { title: "Tire compounds for street/track — Pilot Sport 4S vs RE-71RS", tag: "Tech",
    description: "Use the car 3 days a week to commute, one autocross a month. PS4S feels like the obvious answer but RE-71RS is way faster. Is the wear worth it?" },
  { title: "Intercooler sizing — when does bigger stop helping?", tag: "Tech",
    description: "On my WRX, going from a TMIC to a FMIC. People say to avoid going too big because of lag. Where's the sweet spot for a 350whp target?" },

  // Questions
  { title: "Anyone running E85 in the PNW? Ethanol content varies so much", tag: "Question",
    description: "Flex fuel kit is on the way but people keep telling me E85 in the Pacific Northwest tests closer to E60-70. Is this actually a tuning problem?" },
  { title: "How bad is it to daily a GT3?", tag: "Question",
    description: "Found a 2016 GT3 for a reasonable price. I know it's NA, screaming NA motor. But PDK makes it livable? Or is this a terrible idea?" },
  { title: "First track day — what actually matters to prepare?", tag: "Question",
    description: "Never done a track day. Have a Civic Si with stock brakes. Everyone says check brake fluid, bleed it, bring extra. What else am I missing?" },
  { title: "Buying an S2000 in 2026 — is the market still crazy?", tag: "Question",
    description: "Looking at APs. Anything under $25k seems rough. Are prices actually coming down or are they sticky forever now?" },
  { title: "RX-7 FD — realistic reliability as a weekend car?", tag: "Question",
    description: "I know the 13B is a commitment. But as a Saturday car, not daily, and with a competent rotary shop nearby — what's the real ownership experience?" },
  { title: "Is a standalone ECU worth it over a reflash for a mild build?", tag: "Question",
    description: "Running a K24 swap with bolt-ons. The Haltech is $1500+. KPro is $800. At 280whp, am I leaving anything on the table with KPro?" },
  { title: "What does actual camber adjustment cost at an alignment shop?", tag: "Question",
    description: "Have adjustable control arms on my E36. Shop is charging $250 for a 4-wheel alignment. Is that normal? They said it'll take 2 hours." },

  // Help
  { title: "CEL P0300 random misfire — can't figure it out", tag: "Help",
    description: "2007 Civic Si, 160k miles. Changed plugs, coils, fuel injectors. Still getting P0300. Runs rough only at idle. No vacuum leaks I can find." },
  { title: "Oil leak from timing cover — is this a pull-the-motor job?", tag: "Help",
    description: "1997 E36 328i. Leak started small but it's leaving a spot now. Heard BMW timing cover can be done without pulling the motor but it's tight." },
  { title: "My GTI bogs under WOT at boost — only when hot", tag: "Help",
    description: "APR Stage 1, MK7. When the car is cold it pulls hard. Once it's fully warmed up and I go WOT, it hesitates then pulls. Getting N75 code intermittently." },
  { title: "Clutch slipping on a Stage 3 WRX — which clutch holds?", tag: "Help",
    description: "Exedy OEM replacement gave up at 30k miles on 380whp. Considering South Bend or Clutchmasters. Anyone running these on similar power?" },
  { title: "350Z knocking at startup — rod knock or piston slap?", tag: "Help",
    description: "3.5 VQ35HR, 98k miles. Cold startup knock that goes away after 20 seconds. Oil pressure is fine. Slightly worried." },
  { title: "Brake bias bar setup on E46 track car — where to start?", tag: "Help",
    description: "Just installed a Tilton 900 bias bar. Running 4-piston Brembos up front, stock rears. No idea where to start with adjustment." },

  // General
  { title: "What's the most fun you've had in a truly stock car?", tag: "General",
    description: "Hot take: a stock Miata on a backroad beats most modded cars in terms of raw enjoyment per dollar. What's your most memorable stock car drive?" },
  { title: "Cars you regret selling", tag: "General",
    description: "I sold a clean 2003 Cobra for $18k in 2019. I think about it constantly. Share your automotive regrets." },
  { title: "Track cars that surprise people — sleepers on circuit", tag: "General",
    description: "An MR2 NA with a driver who knows the car will take out modded cars all day. What are your favorite 'wait, THAT beat me?' moments?" },
  { title: "What would you build with a $15k build budget right now?", tag: "General",
    description: "Not including the cost of the car. $15k for mods, suspension, brakes, safety. What direction do you go? Track? Street? Autocross?" },
  { title: "The problem with new sports cars — too much grip, not enough feel", tag: "General",
    description: "The GR86 is objectively fast and fun but feels clinical compared to an AE86. Is this just nostalgia or is there something being lost in modern tuning?" },
  { title: "Coolest car you've seen at a local meetup recently", tag: "General",
    description: "Saw a clean FC RX-7 with a proper twin-scroll 13B rebuild at our monthly meet. Full cage, street legal. Absolutely flawless." },
  { title: "What's the worst car advice you've ever received?", tag: "General",
    description: "'Just put bigger injectors and it'll make more power without a tune.' A friend told me this about his Evo. It did not go well." },
  { title: "Unpopular opinion: daily driving a dedicated track car teaches you more", tag: "General",
    description: "Stiff suspension, no ABS on some setups — you learn car control faster because you're always on the edge. Thoughts?" },

  // For Sale
  { title: "[FS] BC Racing BR Coilovers — E46 fitment, 8k miles", tag: "For Sale",
    description: "Selling my BC BR coilovers off my E46 project. 8k miles, no leaks, all hardware included. Asking $650 OBO. Local pickup preferred." },
  { title: "[FS] Recaro SP-G seat — standard mount, black/red", tag: "For Sale",
    description: "Pulling this out for a rail-mounted setup. Great condition, no rips or tears. Asking $900, bracket not included. Shipping available." },
  { title: "[FS] Garrett GTX3076R turbo — used one season", tag: "For Sale",
    description: "Pulled off a track car I sold. One autocross season of use. Compressor wheel is clean, no shaft play. $950 shipped." },
  { title: "[FS] EBC Yellowstuff pads — E92 front, barely used", tag: "For Sale",
    description: "Swapped to Ferodo DS2500. These have maybe 500 miles on them. $65 shipped." },
  { title: "[FS] Enkei RPF1 17x9 +35 — ET35, 5x114.3, set of 4", tag: "For Sale",
    description: "Off my 350Z track car. Curb rash on two wheels, nothing structural. No tires. $600 for the set, local only." },
  { title: "[FS] AEM Infinity 6 standalone ECU — harness included", tag: "For Sale",
    description: "Off my K24 build. Full AEM harness for K-series included. Recently tuned at 340whp, maps come with it. $1200 OBO." },
  { title: "[FS] Cusco Street Zero A coilovers — WRX GD fitment", tag: "For Sale",
    description: "Daily driven for 2 years, zero issues. Full adjustment range. Asking $700 shipped. These go for $1400 new." },
];

const COMMENTS_POOL = [
  // Build log comments
  "Subbed. Love seeing cage builds documented properly. What wall thickness are you running?",
  "What cage shop are you using? Getting quotes now and everyone is in the $4-6k range for a bolt-in.",
  "Make sure you get a door bar on the driver side before you go back on track. Learned that lesson the hard way.",
  "The LS swap is the right call. SR20 is a great motor until it isn't. Zero regrets on mine.",
  "You'll need to notch the transmission tunnel more than you think. The crossmember placement is annoying.",
  "Which trans are you mating to the LS? T56 or TR6060? The T56 is easier to find but the TR6060 handles power better.",
  "Following this. Did a 2JZ swap myself, ARP headstuds are non-negotiable at any power level above 400whp.",
  "Get your injector duty cycle right before you chase power. Most FD issues above 600whp are fuel delivery, not tune.",
  "The 20V blacktop swap is a great upgrade. Are you keeping ITBs or going to a single throttle body?",
  "Rebuild looks clean. I'd recommend a MLS head gasket regardless of brand — the OEM 4G63 gaskets are a known weak point.",
  "Nice progress. What's your power goal? 600whp is very doable on a built 4G63 but the transfer case becomes the weak link.",
  "IS38 is worth every penny. Did mine 18 months ago and it's been flawless. Make sure your DV is upgraded too.",
  "You'll want to address the intercooler piping once the IS38 is in. The stock charge pipes crack under boost.",
  "LS6 is a noticeable step up from the LS1. The intake manifold alone is worth the swap.",
  "Did you source a complete engine or go shortblock route? LS6 complete engines are getting harder to find.",

  // Tech comments
  "I run -3.0 front on my E46 track setup. Switched to Michelin PS Cup 2 and the cupping stopped immediately — might be a tire compound issue more than camber.",
  "The S65 is a better track motor imo. More linear torque curve, better throttle response at the top. The S54 is iconic but the S65 is the better tool.",
  "I've seen that fueling issue before. Check your fuel pump controller — at high rpm the OEM controller can underdrive the Walbro.",
  "Torsen differentials are incredibly underrated for autocross. They're progressive and predictable. I'd take a Torsen over a clutch-type for street/autox any day.",
  "PS4S all day if you're commuting. RE-71RS will be dead in 10k miles and will feel greasy in the cold. The time you gain on course isn't worth it unless you're competing seriously.",
  "Bigger intercooler does help up to a point, but you need to match your piping diameter too. A 600x300x76mm FMIC with 3-inch piping should put you right where you need to be.",
  "E85 content in the PNW tests around E60-65% in winter. Your flex fuel kit will compensate automatically — that's literally what it's for.",
  "The GT3 dailied fine for me for 8 months. Oil service every 6k, check your coolant reservoir, and don't let it sit too long without running. Perfectly manageable.",
  "Brake fluid is the most important thing. Use Motul 600 and bleed it the morning of. Carry extra pads even if you don't think you'll need them.",

  // Help comments
  "P0300 on a K20 can be a crankshaft position sensor. Coils are the common culprit but if you've done those, CKP is next. Also check for a cracked intake manifold.",
  "E36 timing cover can absolutely be done in-car. Remove the front bumper for access, it's tight but doable. Budget 4 hours.",
  "The hot-only boost bog on MK7 GTIs is almost always the diverter valve failing under heat. Replace it with a Forge or GFB and you'll probably never see that N75 code again.",
  "South Bend Stage 3 Daily held my STI at 420whp for 40k miles. The engagement point is a bit aggressive but it works. ClutchMasters FX400 is also solid.",
  "If the knock goes away quickly after startup and oil pressure is good, that's almost certainly piston slap from cold thermal expansion. Common on VQ35s. Monitor it.",
  "Brake bias is very track-specific. A good starting point is 65/35 front/rear and adjust from there. If you're locking the rears first, add more front bias.",
  "What's your brake caliper setup? E46 stock rears are tiny. If you want the bias bar to actually do anything useful, consider upgrading the rear calipers.",

  // General discussion
  "Stock Cayman S on a technical track. Completely stock. Took out cars with $10k in mods because of balance. That car is genuinely perfect.",
  "I sold my 1993 RX-7 FD for $14k in 2017. Cherry red, all original, had a rebuilt 13B. I try not to think about what it's worth now.",
  "MR2 Turbo with a knowledgeable driver is absolutely terrifying to race against. Midship balance at the limit is a superpower if you know how to use it.",
  "With $15k I'd do: Ohlins DFV, big brake kit, harness and seat, cage. Spending on control first, power second. You can drive a slow car fast but you can't slow down a fast car.",
  "The GR86 is better than the AE86 in literally every measurable way but I understand the feeling. Analog feedback through the wheel and pedals is harder to quantify but it's real.",
  "Someone brought a built EJ20 Legacy to our meet. Nobody knew what it was and it walked everything in a pull. Underrated era of Subaru.",
  "Worst advice I got: 'The clutch will break in if you slip it a bunch.' Burned through a brand new OEM clutch in three weeks.",
  "The problem with dailying a track car is everyone on the street thinks you're being aggressive when you're actually just managing understeer at 30mph.",

  // For Sale comments
  "PM sent. If it falls through let me know.",
  "What's your lowest on the coilovers? Local to you and can come tomorrow.",
  "Do you have the original springs? Asking for a friend who wants to return the car to stock.",
  "What country are you in? I'm in Canada, wondering if you'd ship across the border.",
  "Does the Recaro come with a mounting bracket? The stock rails won't work with my car's floor.",
  "How many heat cycles on the EBC pads? Any glazing?",
  "Are the RPF1s in 5x114.3? What offset?",
  "Does the AEM tune include a base map I can drive on, or does it need a full retune for my setup?",
  "Is the Cusco kit the 1-way or 2-way damping adjustment?",
  "Is $600 your firm price on the RPF1s? Would you take $500 plus I pay shipping?",

  // Reply chain content
  "That makes sense. I went through the same thing with my E36 — ended up doing the cover in-car and saved $400.",
  "Appreciate the info. Will try the DV swap first since it's the cheapest option.",
  "Agreed on the tire point. I made that mistake last year and ended up on shaved slicks that didn't make sense for my street ratio.",
  "Good call on the headstuds. Already have a set of ARP 625+ ready to go before the engine goes back in.",
  "Just checked and it's definitely 5x114.3 +35. Message me your zip and I'll get a shipping quote.",
  "I'll do $550 on the RPF1s if you're local. If shipping I need to stay at $600 to cover the freight.",
  "The Cusco is 1-way. Works great for street/autox but if you're doing hard track days you'd probably want more rebound control.",
  "Went ahead and ordered the Forge DV. Thanks for the recommendation. Will update the thread.",
  "Just did this on mine. Took me 5 hours but that's because I had to chase a stripped bolt. Easy job if your hardware is clean.",
  "Interesting, I've heard mixed reviews on the GTX3076R for street cars. Does it spool okay under 4k?",
  "On my setup (2.0L 4G63) it spools from about 3200 RPM. Completely streetable. Very different from a big GT series turbo.",
  "That's reassuring. The car will be ~70% track duty so early spool isn't critical but I didn't want a turbo that makes nothing below 5000.",
  "You'll be totally fine then. The 3076R is a great all-arounder. Wish I could buy it back honestly.",
  "Is this listed anywhere else? Want to make sure I'm not wasting your time before I drive out.",
  "Only listing it here for now. Comes down Friday if nobody local grabs it.",
];

// ─── Main Seed Function ────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Seeding RevIndex database...\n");

  // Each seed account gets a unique random password — not stored anywhere, not loginable
  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (username, email, password_hash, email_verified, created_at) VALUES (?, ?, ?, 1, ?)"
  );
  const userIds = [];
  for (let i = 0; i < USERNAMES.length; i++) {
    const username = USERNAMES[i];
    const email    = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@revindex.fake`;
    const date     = randDate();
    // Random 32-byte hash — no known plaintext, account cannot be logged into
    const password_hash = bcrypt.hashSync(require("crypto").randomBytes(32).toString("hex"), 10);
    try {
      const result = insertUser.run(username, email, password_hash, date);
      if (result.lastInsertRowid) {
        userIds.push(result.lastInsertRowid);
      } else {
        const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
        if (existing) userIds.push(existing.id);
      }
    } catch (e) {
      const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
      if (existing) userIds.push(existing.id);
    }
  }
  console.log(`✅ ${userIds.length} users created/found`);

  // ── 2. Create Vehicles (one per user) ─────────────────────────────────────
  const insertVehicle = db.prepare(
    "INSERT INTO vehicles (user_id, make, model, year, is_public) VALUES (?, ?, ?, ?, 1)"
  );
  const vehicleIds = [];
  for (const uid of userIds) {
    const { make, model, year } = randItem(MAKES_MODELS);
    const date = randDate();
    const result = insertVehicle.run(uid, make, model, year);
    vehicleIds.push({ vehicleId: result.lastInsertRowid, userId: uid });
  }
  console.log(`✅ ${vehicleIds.length} vehicles created`);

  // ── 3. Create 45 Threads ───────────────────────────────────────────────────
  const insertThread = db.prepare(
    "INSERT INTO threads (vehicle_id, title, description, tag, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertComment = db.prepare(
    "INSERT INTO comments (thread_id, user_id, author, content, created_at) VALUES (?, ?, ?, ?, ?)"
  );

  // Use exactly 45 thread templates (we have 45)
  const threads = THREAD_DATA.slice(0, 45);
  let totalComments = 0;

  for (let i = 0; i < threads.length; i++) {
    const { title, description, tag } = threads[i];
    // Pick a random user/vehicle as the OP
    const opIndex  = randInt(0, vehicleIds.length - 1);
    const op       = vehicleIds[opIndex];
    const opUser   = db.prepare("SELECT username FROM users WHERE id = ?").get(op.userId);
    const threadDate = randDate();

    const threadResult = insertThread.run(
      op.vehicleId, title, description, tag, op.userId, threadDate
    );
    const threadId = threadResult.lastInsertRowid;

    // Add OP's own opening comment
    const opUsername = opUser?.username || "Anonymous";
    insertComment.run(threadId, op.userId, opUsername, description, threadDate);
    totalComments++;

    // Add 3-8 reply comments from different users
    const numReplies = randInt(3, 8);
    let lastDate = threadDate;

    for (let r = 0; r < numReplies; r++) {
      // Advance time by a few hours/days
      const minutesLater = randInt(30, 2880); // 30 min to 2 days
      const candidate = new Date(new Date(lastDate.replace(" ", "T") + "Z").getTime() + minutesLater * 60000);
      const cap = new Date("2026-05-06T23:59:59Z");
      const replyDate = (candidate > cap ? cap : candidate)
        .toISOString().replace("T", " ").substring(0, 19);
      lastDate = replyDate;

      // Pick a random commenter (not OP for first few)
      let commenterIndex = randInt(0, vehicleIds.length - 1);
      if (r < 2 && commenterIndex === opIndex) {
        commenterIndex = (commenterIndex + 1) % vehicleIds.length;
      }
      const commenter = vehicleIds[commenterIndex];
      const commenterUser = db.prepare("SELECT username FROM users WHERE id = ?").get(commenter.userId);
      const commenterName = commenterUser?.username || "Anonymous";

      // Pick a relevant comment
      let comment = randItem(COMMENTS_POOL);

      // For "For Sale" threads, bias toward FS comments
      if (tag === "For Sale" && Math.random() < 0.6) {
        const fsComments = COMMENTS_POOL.filter(c => 
          c.includes("PM") || c.includes("local") || c.includes("ship") || 
          c.includes("bracket") || c.includes("lowest") || c.includes("firm")
        );
        if (fsComments.length) comment = randItem(fsComments);
      }

      // For reply chain (50% chance of OP replying back after 2nd comment)
      if (r >= 2 && Math.random() < 0.4) {
        const chainComments = COMMENTS_POOL.filter(c =>
          c.startsWith("That makes sense") || c.startsWith("Appreciate") ||
          c.startsWith("Agreed") || c.startsWith("Good call") ||
          c.startsWith("Just checked") || c.startsWith("I'll do") ||
          c.startsWith("Only listing") || c.startsWith("Went ahead") ||
          c.startsWith("Just did")
        );
        if (chainComments.length) {
          comment = randItem(chainComments);
          // This one is from OP
          insertComment.run(threadId, op.userId, opUsername, comment, replyDate);
          totalComments++;
          continue;
        }
      }

      insertComment.run(threadId, commenter.userId, commenterName, comment, replyDate);
      totalComments++;
    }
  }

  console.log(`✅ ${threads.length} threads created with ${totalComments} total comments`);
  console.log("\n🎉 Seed complete! (Seed accounts have random passwords — not loginable)");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
