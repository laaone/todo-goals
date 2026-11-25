import type { AnyBulkWriteOperation, Document } from "mongodb";
import { COLLECTIONS, keyOf, type CollectionName, type EntityMap, type SyncPayload } from "../sync";
import type { AppData } from "../types";
import { getDb } from "./mongodb";

const keyField = (c: CollectionName) => (c === "weeklyPlans" ? "weekStart" : "id");

/** 사용자 데이터 전체를 AppData 모양으로 읽는다. userId = 로그인한 사용자(users._id) */
export async function loadData(userId: string): Promise<AppData> {
  const db = await getDb();
  const [goals, weeklyPlans, weeklyGoals, todos] = await Promise.all(
    COLLECTIONS.map((c) =>
      db.collection(c).find({ user_id: userId }, { projection: { _id: 0, user_id: 0 } }).toArray(),
    ),
  );
  return {
    version: 1,
    goals: goals as unknown as AppData["goals"],
    weeklyPlans: weeklyPlans as unknown as AppData["weeklyPlans"],
    weeklyGoals: weeklyGoals as unknown as AppData["weeklyGoals"],
    todos: todos as unknown as AppData["todos"],
  };
}

/**
 * 검증을 마친 변경분을 컬렉션별 bulkWrite로 반영한다. 모든 쿼리에 user_id를 건다.
 * 다른 사용자의 항목 id를 보내도 필터에 user_id가 있으므로 그 사용자의 문서는 바뀌지 않는다.
 */
export async function applySync(userId: string, payload: SyncPayload): Promise<void> {
  const db = await getDb();
  await Promise.all(
    COLLECTIONS.map(async (c) => {
      const change = payload[c];
      if (!change) return;
      const k = keyField(c);
      const ops: AnyBulkWriteOperation<Document>[] = [
        ...(change.upsert ?? []).map((item) => ({
          replaceOne: {
            filter: { user_id: userId, [k]: keyOf(c, item as EntityMap[typeof c]) },
            replacement: { ...item, user_id: userId },
            upsert: true,
          },
        })),
        ...(change.delete ?? []).map((key) => ({
          deleteOne: { filter: { user_id: userId, [k]: key } },
        })),
      ];
      if (ops.length) await db.collection(c).bulkWrite(ops, { ordered: false });
    }),
  );
}

/**
 * 로그인 전 익명 ID로 만든 데이터를 로그인한 사용자 소유로 옮긴다.
 * 같은 키(id, weekStart)가 이미 사용자 쪽에 있으면 사용자 쪽을 남기고 익명 쪽을 지운다.
 */
export async function claimAnonymousData(anonId: string, userId: string): Promise<number> {
  if (anonId === userId) return 0;
  const db = await getDb();
  let moved = 0;
  for (const c of COLLECTIONS) {
    const k = keyField(c);
    const col = db.collection(c);
    const taken = await col.distinct(k, { user_id: userId });
    if (taken.length) await col.deleteMany({ user_id: anonId, [k]: { $in: taken } });
    const { modifiedCount } = await col.updateMany({ user_id: anonId }, { $set: { user_id: userId } });
    moved += modifiedCount;
  }
  return moved;
}
