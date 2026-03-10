// utils/exclusiveslist.js

function cleanId(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function cosmetic(id, roleLabel, extra = {}) {
  return {
    kind: "cosmetic",
    cosmetic: { id: cleanId(id) },
    roleLabel,
    label: roleLabel,
    ...extra,
  };
}

function style(cosmeticName, styleName, roleLabel, extra = {}) {
  return {
    kind: "style",
    cosmetic: { name: String(cosmeticName || "").trim() },
    styleName: String(styleName || "").trim(),
    styleText: String(styleName || "").trim(),
    roleLabel,
    label: roleLabel,
    ...extra,
  };
}

function bundle(roleLabel, itemIds, extra = {}) {
  return {
    kind: "bundle",
    roleLabel,
    label: roleLabel,
    items: (Array.isArray(itemIds) ? itemIds : [])
      .map((id) => cleanId(id))
      .filter(Boolean)
      .map((id) => ({ id })),
    ...extra,
  };
}

const EXCLUSIVES_LIST = [
  // --------------------
  // Skins
  // --------------------
  cosmetic("CID_175_Athena_Commando_M_Celestial", "Galaxy"),
  cosmetic("CID_174_Athena_Commando_F_CarbideWhite", "Eon"),
  cosmetic("CID_183_Athena_Commando_M_ModernMilitaryRed", "Double Helix"),
  cosmetic("CID_342_Athena_Commando_M_StreetRacerMetallic", "Honour Guard"),
  cosmetic("CID_313_Athena_Commando_M_KpopFashion", "Ikonik"),
  cosmetic("CID_386_Athena_Commando_M_StreetOpsStealth", "Stealth Reflex"),
  cosmetic("CID_371_Athena_Commando_M_SpeedyMidnight", "Dark Vertex"),
  cosmetic("CID_434_Athena_Commando_F_StealthHonor", "Wonder"),
  cosmetic("CID_516_Athena_Commando_M_BlackWidowRogue", "Rogue Spider Knight"),
  cosmetic("CID_479_Athena_Commando_F_Davinci", "Glow"),
  cosmetic("CID_757_Athena_Commando_F_WildCat", "Wildcat"),
  cosmetic("CID_783_Athena_Commando_M_AquaJacket", "Surf Strider"),
  cosmetic("CID_660_Athena_Commando_F_BandageNinjaBlue", "Indigo Kuno"),
  cosmetic("CID_850_Athena_Commando_F_SkullBriteCube", "Dark Skully"),
  cosmetic("Character_MasterKeyOrder", "Huntmaster Saber"),
  cosmetic("Character_SnowNinjaDark", "Cobalt Snowfoot"),
  cosmetic("Character_SummerUnsuitable", "Thrilldiver"),
  cosmetic("Character_AsterOrder", "Florin"),
  cosmetic("Character_CoolSuitable", "Freediver"),
  cosmetic("Character_UnbrokenTrash", "Clyde"),
  cosmetic("Character_OasisCheck", "FFC Striker Sparkplug"),
  cosmetic("Character_StrayManta", "Elite Daigo"),
  cosmetic("CID_619_Athena_Commando_F_TechLlama", "Brilliant Bomber"),
  cosmetic("CID_948_Athena_Commando_M_Football20Referee_B_QPXTH", "Sideline Commander (Content Creator)"),
  cosmetic("CID_954_Athena_Commando_F_Football20Referee_C_NAQ0G", "Spiral Specialist (Content Creator)"),
  cosmetic("CID_478_Athena_Commando_F_WorldCup", "World Warrior"),
  cosmetic("CID_376_Athena_Commando_M_DarkShaman", "Shaman"),

  // Skin styles
  style("Renegade Raider", "BLACK AND GOLD", "Renegade Raider (BLACK AND GOLD)"),
  style("Aerial Assault Trooper", "BLACK AND GOLD", "Aerial Assault Trooper (BLACK AND GOLD)"),
  style("Ghoul Trooper", "PINK", "Ghoul Trooper (PINK)"),
  style("Skull Trooper", "PURPLE", "Skull Trooper (PURPLE)"),
  style("The Paradigm", "REALITY WARRIOR", "The Paradigm (REALITY WARRIOR)"),
  style("Fishstick", "WORLD CUP", "Fishstick (WORLD CUP)"),
  style("Party Trooper", "J BALVIN", "Party Trooper (J BALVIN)"),
  style("Party Trooper", "NEON PARTY TROOPER", "Party Trooper (NEON PARTY TROOPER)"),

  // --------------------
  // Back Blings
  // --------------------
  cosmetic("Backpack_JackColby", "Speaker Box"),

  // --------------------
  // Emotes
  // --------------------
  cosmetic("EID_HipHop01", "Freestylin’"),
  cosmetic("EID_PlayerEleven", "Introducing"),
  cosmetic("EID_Hoppin", "Square Up"),
  cosmetic("EID_GroovingSparkle", "Vibrant Vibin’"),
  cosmetic("EID_EyeSpire", "Spectatin’"),
  cosmetic("EID_WishingStar", "Wishing Star"),
  cosmetic("EID_Fresh", "Fresh"),
  cosmetic("EID_TrophyCelebration", "Kiss The Cup"),
  cosmetic("EID_RigorMortis", "Zombie Shambles"),
  cosmetic("EID_LetsPlay", "Raise The Cup"),
  cosmetic("EID_RichFam", "It’s Complicated"),
  cosmetic("EID_CycloneHeadBang", "Headbanger"),
  cosmetic("EID_HNYGoodRiddance", "Out With The Old"),
  cosmetic("EID_ProVisitorProtest", "Welcome!"),

  // --------------------
  // Pickaxes
  // --------------------
  cosmetic("Pickaxe_FNCSChampion", "Axe of Champions 3.0"),
  cosmetic("Pickaxe_JackColby", "Waveform Sword"),
  cosmetic("Pickaxe_SpookyNeonBlue", "Midnight Scythe"),
  cosmetic("Pickaxe_SpookyNeonRed", "Sunfall Scythe"),
  cosmetic("Pickaxe_ID_195_SpaceBunny", "Plasma Carrot"),
  cosmetic("Pickaxe_ID_294_CandyCane", "Merry-Mint Axe"),
  cosmetic("Pickaxe_ID_178_SpeedyMidnight", "Dark Razor"),
  cosmetic("Pickaxe_ID_STW006_Tier_7", "AxeHammer"),
  cosmetic("Pickaxe_SpookyNeonOrange", "Dawning Scythe"),
  cosmetic("Pickaxe_ID_398_WildCatFemale", "Electri-Claw"),
  cosmetic("Pickaxe_WolfHunter", "Nite Unit Tac Axe"),

  // Pickaxe style
  style("Raiders Revenge", "BLACK AND GOLD", "Raiders Revenge (BLACK AND GOLD)"),

  // --------------------
  // Gliders
  // --------------------
  style("Aerial Assault One", "BLACK AND GOLD", "Aerial Assault One (BLACK AND GOLD)"),

  // --------------------
  // Sprays
  // --------------------
  cosmetic("Spray_LanternFest25", "Victory!"),
  cosmetic("SPID_089_ShareTheLove_E", "Max Share The Love"),
  cosmetic("SPID_022_SoloShowdown", "Solo Showdown"),
  cosmetic("Spray_CinderMax_Fireball", "Fire Friend"),

  // --------------------
  // Emoticons
  // --------------------
  cosmetic("Emoji_S34_LanternFest25", "Celebration Heart"),
  cosmetic("Emoji_S20_NeedLoot", "Cameo Needs Loot"),
  cosmetic("Emoji_S22_FunBreak", "FunFlower"),
  cosmetic("Emoji_S25_StarStrayFN", "Crossfade Helm"),
  cosmetic("Emoji_S19_FNCS_GOAT", "Goaticon"),

  // --------------------
  // Wraps
  // --------------------
  cosmetic("Wrap_521_Comp21F", "C3S3 CHAMPION III"),
  cosmetic("Wrap_Comp22F", "C3C4 CHAMPION III"),
  cosmetic("Wrap_Comp23F", "C4C1 CHAMPION III"),

  // --------------------
  // Bundles
  // --------------------
  bundle("Iollek Bundle", [
    "Emoji_S19_ShowdownPanda",
    "SPID_349_ShowdownPanda",
  ]),

  bundle("Repaz Bundle", [
    "SPID_348_ShowdownReaper",
    "Emoji_S19_ShowdownReaper",
  ]),

  bundle("Coqto Bundle", [
    "Emoji_S22_Showdown_Co",
    "Spray_Showdown_Co",
  ]),

  bundle("Meavys Bundle", [
    "Spray_Showdown_Mae",
    "Emoji_S22_Showdown_Mae",
  ]),

  bundle("Heystan Bundle", [
    "Emoji_S19_ShowdownTomato",
    "SPID_347_ShowdownTomato",
  ]),

  bundle("Llama Sprays", [
    "SPID_041_GC2018",
    "SPID_023_E3",
    "SPID_042_LlamaControllers",
    "SPID_043_Flairspray",
  ]),

  bundle("Season X Level 100", [
    "SPID_141_S10Level100",
    "Emoji_S10Lvl100",
  ]),

  bundle("Season 8 Level 100", [
    "SPID_104_S8Lvl100",
  ]),

  bundle("Season 9 Level 100", [
    "SPID_120_S9Lvl100",
    "Emoji_S9Lvl100",
  ]),

  bundle("Season 6 Level 100", [
    "SPID_064_S6Lvl100",
    "Emoji_S6Lvl100",
  ]),

  bundle("Season 7 Level 100", [
    "SPID_080_S7Lvl100",
    "Emoji_S7Lvl100",
  ]),

  bundle("Creator Cup Items", [
    "Emoji_S14_Medal",
    "Emoji_S14_LlamaSurprise",
    "Emoji_S14_KingOfTheHill",
    "Emoji_S14_Horseshoe",
    "Emoji_S14_BestFriends",
  ]),

  bundle("Collegiate Cup Items", [
    "SPID_380_CollegeCup",
    "SPID_447_Scholastic_Doggo",
    "Spray_ScholasticTournament_Spray1",
    "Emoji_S20_GG_CampFire",
    "SPID_446_Scholastic_Meowscles",
    "SPID_387_Jonesy_Competitive",
    "Spray_ScholasticTournament_Spray3",
    "SPID_448_Scholastic_BlueLlama",
    "Emoji_S20_GG_Pizza",
    "Spray_ScholasticTournament_Spray2",
    "Emoji_S20_Cheers_Competitive",
  ]),
];

function getAllExclusiveIds() {
  const ids = new Set();

  for (const entry of EXCLUSIVES_LIST) {
    if (entry.kind === "cosmetic" && entry?.cosmetic?.id) {
      ids.add(cleanId(entry.cosmetic.id).toLowerCase());
    }

    if (entry.kind === "bundle" && Array.isArray(entry.items)) {
      for (const item of entry.items) {
        if (item?.id) ids.add(cleanId(item.id).toLowerCase());
      }
    }
  }

  return ids;
}

function getAllExclusiveStyleDefinitions() {
  return EXCLUSIVES_LIST
    .filter((entry) => entry.kind === "style")
    .map((entry) => ({
      cosmeticName: entry?.cosmetic?.name || "",
      styleName: entry?.styleName || "",
      styleText: entry?.styleText || "",
      roleLabel: entry?.roleLabel || entry?.label || "",
    }));
}

module.exports = {
  EXCLUSIVES_LIST,
  ALL_EXCLUSIVE_IDS: getAllExclusiveIds(),
  EXCLUSIVE_STYLE_DEFINITIONS: getAllExclusiveStyleDefinitions(),
  getAllExclusiveIds,
  getAllExclusiveStyleDefinitions,
};