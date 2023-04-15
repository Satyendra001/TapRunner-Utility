// Pipline
const API_BASE_URL = "http://localhost:8000/";

export const CATALOG_FETCH_URL = API_BASE_URL + "pipeline/stream-selection";
export const CATALOG_SUBMIT_URL = CATALOG_FETCH_URL;
export const DISCOVERY_RUN_URL = API_BASE_URL + "pipeline/discovery";
export const STATE_FETCH_URL = API_BASE_URL + "pipeline/state";
export const SYNC_RUN_URL = API_BASE_URL + "pipeline/sync";
export const LOGS_URL = API_BASE_URL + "pipeline/logs";
export const FILE_SHOW_URL = API_BASE_URL + "pipeline/";
export const SYNC_REPORT_URL = API_BASE_URL + "pipeline/reports"
export const COMPARE_INSTANCES_URL = API_BASE_URL + "pipeline/compare";
export const COVERAGE_DATA_URL = API_BASE_URL + "pipeline/coverage";

export const TAP_SETUP_URL = API_BASE_URL + "dashboard/tap-setup";
export const CHART_DATA = API_BASE_URL + "dashboard/chart-data";

export const USER_SIGNUP = API_BASE_URL + "userauth/signup"
export const USER_LOGIN = API_BASE_URL + "userauth/login"
export const JWT_TOKEN = API_BASE_URL + "userauth/token"
export const USER_LOGOUT = API_BASE_URL + "userauth/logout"
export const ACTIVE_USER = API_BASE_URL + "userauth/getUser"
export const USER_SESSION = API_BASE_URL + "userauth/session"
export const CSRF_COOKIE = API_BASE_URL + "userauth/csrf_cookie"
