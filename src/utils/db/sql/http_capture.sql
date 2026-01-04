-- 创建表
CREATE TABLE test_data_url_capture (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_url TEXT NOT NULL,
    api_method TEXT NOT NULL,
    api_post_data TEXT,
    api_params JSON,
    api_request_headers JSON,
    api_response_headers JSON,
    api_response_body JSON,
    api_status_code INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)