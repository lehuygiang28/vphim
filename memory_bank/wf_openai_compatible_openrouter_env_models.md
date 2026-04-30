## Current tasks from user prompt
- Thêm config env để dùng OpenAI-compatible và OpenRouter cho Copilotkit (apps/api).
- Config models với env: nếu có env set thì không dùng các hardcode models nữa.
- Models ở env có thể trùng lặp để biểu thị số lần retries qua những models đó.
- Áp dụng cho cả:
  - Copilotkit models (hiện hardcode trong `CopilotkitController`)
  - Movie AI models (hiện hardcode trong `MovieService`)

## Plan (simple): your plan & thoughts to solve task(s).
- Chuẩn hoá các biến env cho “OpenAI-compatible/OpenRouter” theo pattern đang có (`GOOGLE_AI_USE_OPENAI_COMPATIBLE`, `GOOGLE_AI_GPROXY_BASE_URL`, `GOOGLE_AI_GPROXY_KEY`), bổ sung ví dụ rõ ràng trong `apps/api/.env.example`.
- Thêm 2 biến env models:
  - `GOOGLE_AI_MODELS` (CSV, giữ duplicates) dùng cho Copilotkit.
  - `MOVIE_AI_MODELS` (CSV, giữ duplicates) dùng cho MovieService.
- Implement parse CSV an toàn: split `,`, trim, filter bỏ empty nhưng **không** uniq/dedupe để retries hoạt động theo số lần xuất hiện.
- Logic ưu tiên: nếu env models tồn tại và parse ra được >= 1 item thì dùng env; ngược lại fallback về mảng hardcode hiện tại.
- (Tuỳ chọn) Thêm env cho OpenRouter headers (`OPENROUTER_HTTP_REFERER`, `OPENROUTER_X_TITLE`) nếu cần, nhưng để optional và không phá các provider khác.

## Steps
- Audit `CopilotkitController` và `MovieService` để xác định nơi set models list và retry loop.
- Define helpers nhỏ để parse models từ env (giữ duplicates).
- Update `CopilotkitController`:
  - lấy models từ `GOOGLE_AI_MODELS` nếu có
  - giữ nguyên cơ chế retry theo thứ tự array
- Update `MovieService`:
  - lấy models từ `MOVIE_AI_MODELS` nếu có
  - giữ nguyên cơ chế retry theo thứ tự array
- Update `apps/api/.env.example` thêm block AI config + ví dụ OpenAI-compatible/OpenRouter + models CSV (có duplicates).
- Verify build/lint cho `apps/api` (tối thiểu compile TypeScript/Nest).

## Things done
- Xác định 2 điểm hardcode models cần override bằng env:
  - `apps/api/src/app/copilotkit/copilotkit.controller.ts`
  - `apps/api/src/app/movies/movie.service.ts`
- Chốt naming: `GOOGLE_AI_MODELS` (Copilotkit) và `MOVIE_AI_MODELS` (MovieService)
- Implement parse CSV models (trim, bỏ empty, giữ duplicates) và dùng env override khi list không rỗng.
- Update `apps/api/.env.example` thêm block AI config + ví dụ OpenAI-compatible/OpenRouter + models CSV (có duplicates).
- Verified: `yarn nx build api` chạy thành công.
- Thêm `DISABLE_COPILOTKIT` để tắt Copilotkit backend (không mount module) + update env example.
- Verified: `yarn nx build api` vẫn chạy thành công sau khi thêm toggle.

## Things not done yet
- Không còn.
