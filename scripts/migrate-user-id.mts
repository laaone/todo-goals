/**
 * user_id 스키마 마이그레이션 (수동 실행용). 서버도 첫 DB 연결 때 같은 마이그레이션을 실행한다.
 *   npm run migrate                      # .env의 MONGODB_URI, MONGODB_DB(기본 todo_goals)
 * 여러 번 실행해도 안전하다.
 */
import { MongoClient } from "mongodb";
import { migrateUserIdField } from "../src/lib/server/migrate.ts";

try {
  process.loadEnvFile(".env");
} catch {
  /* .env가 없으면 이미 설정된 환경 변수를 쓴다 */
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI가 없습니다. .env를 확인하세요.");
  process.exit(1);
}
const dbName = process.env.MONGODB_DB || "todo_goals";

const client = await new MongoClient(uri).connect();
try {
  const reports = await migrateUserIdField(client.db(dbName));
  console.log(`DB "${dbName}" 마이그레이션 완료`);
  for (const r of reports) {
    console.log(
      `  ${r.collection}: userId→user_id ${r.renamed}건` +
        (r.droppedIndexes.length ? `, 예전 인덱스 삭제 ${r.droppedIndexes.join(", ")}` : ""),
    );
  }
} finally {
  await client.close();
}
