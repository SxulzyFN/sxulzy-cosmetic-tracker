// utils/rareownersboard.js

const { getAllLockerSnapshots } = require("../storage");
const {
  getRoleEntries,
  snapshotOwnsEntry,
} = require("./exclusiveRoleSync");

async function buildRareOwnersBoard() {
  const snapshots = getAllLockerSnapshots() || {};
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
      label: entry.rareLabel || entry.roleName,
      owners,
      category: entry.category || "exclusive",
      kind: entry.kind || "cosmetic",
      roleLabel: entry.roleName || null,
    });
  }

  rows.sort((a, b) => {
    if (b.owners !== a.owners) return b.owners - a.owners;
    return a.label.localeCompare(b.label);
  });

  return {
    trackedLockers,
    rows,
  };
}

module.exports = {
  buildRareOwnersBoard,
};