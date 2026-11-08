// Import models explicitly so startup and seeders register the same schemas.
export { default as User } from "./user.model";
export { default as Session } from "./session.model";
export { default as UserToken } from "./userToken.model";
export { default as PendingSignup } from "./pendingSignup.model";

import Farm from "./farm.model";
import FarmMember from "./farmMember.model";

Farm.hasMany(FarmMember, { as: "memberships", foreignKey: "farmId" });
FarmMember.belongsTo(Farm, { foreignKey: "farmId" });

export { Farm, FarmMember };
export { default as Flock } from "./flock.model";
export { default as DailyRecord } from "./dailyRecord.model";
export { default as FeedStage } from "./feedStage.model";
export { default as VaccinationSchedule } from "./vaccinationSchedule.model";
export { default as VaccinationRecord } from "./vaccinationRecord.model";
export { default as FarmTask } from "./farmTask.model";
export { default as FarmInvitation } from "./farmInvitation.model";
export { default as AuditLog } from "./auditLog.model";
