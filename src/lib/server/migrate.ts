/**
 * 스키마 마이그레이션: 데이터 컬렉션의 소유자 필드 userId → user_id, 인덱스 교체.
 * 몇 번을 실행해도 결과가 같다(idempotent). 서버 시작 시 getDb()가 한 번 실행하고,
 * 수동 실행은 `npm run migrate` (scripts/migrate-user-id.mts).
 *
 * 이 파일은 스크립트에서도 직접 import하므로 경로 별칭(@/...)이나 다른 모듈을 import하지 않는다.
 */
import type { Db } from "mongodb";

const DATA_COLLECTIONS = ["goals", "weeklyPlans", "weeklyGoals", "todos"] as const;

export interface MigrationReport {
  collection: string;
  renamed: number;
  droppedIndexes: string[];
}

export async function migrateUserIdField(db: Db): Promise<MigrationReport[]> {
  const reports: MigrationReport[] = [];
  for (const name of DATA_COLLECTIONS) {
    const col = db.collection(name);
    const key = name === "weeklyPlans" ? "weekStart" : "id";

    // 1) 예전 인덱스(userId_1_...)를 먼저 지운다. 남아 있으면 userId가 없는 새 문서끼리 충돌한다
    const droppedIndexes: string[] = [];
    const existing = await col.indexes().catch(() => []); // 컬렉션이 아직 없으면 빈 목록
    for (const idx of existing) {
      if (idx.name && idx.key && "userId" in idx.key) {
        try {
          await col.dropIndex(idx.name);
          droppedIndexes.push(idx.name);
        } catch (error) {
          // 다른 프로세스(서버 인스턴스, npm run migrate)가 먼저 지웠으면 IndexNotFound(27) — 무시
          if ((error as { code?: number }).code !== 27) throw error;
        }
      }
    }

    // 2) 필드 이름 변경
    const { modifiedCount } = await col.updateMany(
      { userId: { $exists: true } },
      { $rename: { userId: "user_id" } },
    );

    // 3) 새 인덱스
    await col.createIndex({ user_id: 1, [key]: 1 }, { unique: true });
    reports.push({ collection: name, renamed: modifiedCount, droppedIndexes });
  }

  await db.collection("users").createIndex({ githubId: 1 }, { unique: true });
  await db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true });
  // 만료된 세션은 MongoDB가 자동으로 지운다 (조회 시에도 expiresAt을 따로 확인한다)
  await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("sessions").createIndex({ user_id: 1 });
  return reports;
}
