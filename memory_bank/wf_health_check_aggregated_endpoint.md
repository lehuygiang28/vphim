## Current tasks from user prompt
- Tạo 1 API để ping/health check gom lại: API, Elasticsearch, Redis, MongoDB.

## Plan (simple): your plan & thoughts to solve task(s).
- Thêm endpoint `GET /health` (trong namespace `/api`) trả JSON trạng thái cho từng dependency.
- Check song song: Redis `PING`, Elasticsearch `ping()`/`info()`, MongoDB `admin().ping()`.
- Trả HTTP 200 nếu tất cả ok, ngược lại 503 nhưng vẫn trả body chi tiết.

## Steps
- Audit nơi đặt ping route hiện tại (`AppController`).
- Implement health route và inject `RedisService`, `ElasticsearchService`, `mongoose Connection`.
- Add minimal timeouts để tránh treo request.
- Verify `yarn nx build api`.

## Things done
- Thêm endpoint `GET /api/health` check Redis/Elasticsearch/MongoDB và trả 200/503 + JSON chi tiết.
- Verified: `yarn nx build api` chạy thành công.

## Things not done yet
- Không còn.
