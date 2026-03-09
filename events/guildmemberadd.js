// events/guildMemberAdd.js
const { Events } = require("discord.js");
const { getLockerSnapshot } = require("../storage");
const { syncExclusiveRolesForMember } = require("../utils/exclusiveRoleSync");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    try {
      const snapshot = getLockerSnapshot(member.user.id);
      if (!snapshot?.cosmetics) return;

      const result = await syncExclusiveRolesForMember(member, snapshot);

      console.log(
        `✅ Exclusive role sync on join for ${member.user.tag} in ${member.guild.name} ` +
        `(created: ${result.created.length}, added: ${result.added.length}, removed: ${result.removed.length})`
      );
    } catch (e) {
      console.log("⚠️ Auto role sync on join failed:", e.message);
    }
  },
};