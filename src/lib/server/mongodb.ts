import { MongoClient, type Db } from "mongodb";
import { migrateUserIdField } from "./migrate";

const globalForMongo = globalThis as unknown as { _todoMongo?: Promise<Db> };

/**
 * DB 연결을 프로세스 전체에서 재사용한다 (개발 모드 HMR, 서버리스 인스턴스 재사용 대비).
 * DB 이름은 MONGODB_DB, 없으면 "todo_goals". 처음 연결할 때 스키마 마이그레이션과 인덱스를 확인한다.
 */
export function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI 환경 변수가 없습니다. .env 파일을 확인하세요.");

  if (!globalForMongo._todoMongo) {
    globalForMongo._todoMongo = new MongoClient(uri)
      .connect()
      .then(async (client) => {
        const db = client.db(process.env.MONGODB_DB || "todo_goals");
        const reports = await migrateUserIdField(db);
        const changed = reports.filter((r) => r.renamed || r.droppedIndexes.length);
        if (changed.length) console.log("[mongodb] user_id 마이그레이션:", JSON.stringify(changed));
        return db;
      })
      .catch((error) => {
        // 실패하면 캐시를 비워 다음 요청에서 다시 시도한다
        globalForMongo._todoMongo = undefined;
        throw error;
      });
  }
  return globalForMongo._todoMongo;
}
