// utils/rareownersboard.js

const { getAllLockerSnapshots } = require("../storage");
const {
  getRoleEntries,
  snapshotOwnsEntry,
} = require("./exclusiveRoleSync");

async function buildRareOwnersBoard() {
  const snapshots = (await getAllLockerSnapshots()) || {};
  const snapshotValues = Object.values(snapshots);
  const trackedLockers = snapshotValues.length;

  const entries = getRoleEntries();
  const rows = [];

  for (const entry of entries) {
    let owners = 0;

    for (const snapshot of snapshotValues) {
      if (await snapshotOwnsEntry(snapshot, entry)) {
        owners++;
      }
    }

    rows.push({
      label: entry.rareLabel || entry.roleName || "Unknown",
      owners,
      category: entry.category || "exclusive",
      kind: entry.kind || "cosmetic",
      roleLabel: entry.roleName || null,
    });
  }

  // rarest first
  rows.sort((a, b) => {
    if (a.owners !== b.owners) return a.owners - b.owners;
    return String(a.label).localeCompare(String(b.label));
  });

  return {
    trackedLockers,
    rows,
  };
}

module.exports = {
  buildRareOwnersBoard,
};
