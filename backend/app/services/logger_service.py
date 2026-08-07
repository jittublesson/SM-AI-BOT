import time
from typing import Dict, Any, List
from datetime import datetime

# Global Audit Registry for Enterprise Monitoring
_AUDIT_LOGS = []

class AuditLogger:
    @staticmethod
    def log_api(endpoint: str, method: str, duration_ms: int, params: Dict[str, Any] = None):
        """
        Logs API call latency and parameters.
        """
        log_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
            "type": "API_CALL",
            "method": method,
            "endpoint": endpoint,
            "duration_ms": duration_ms,
            "params": params or {},
            "status": "SUCCESS"
        }
        _AUDIT_LOGS.append(log_entry)
        # Keep logs limited to last 100 entries
        if len(_AUDIT_LOGS) > 100:
            _AUDIT_LOGS.pop(0)

    @staticmethod
    def log_ai(agent_name: str, task: str, reasoning_steps: List[str]):
        """
        Logs AI reasoning tracks and agent dispatches.
        """
        log_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
            "type": "AI_REASONING",
            "agent": agent_name,
            "task": task,
            "reasoning": reasoning_steps,
            "status": "COMPLETED"
        }
        _AUDIT_LOGS.append(log_entry)
        if len(_AUDIT_LOGS) > 100:
            _AUDIT_LOGS.pop(0)

    @staticmethod
    def get_audit_trail() -> List[Dict[str, Any]]:
        return _AUDIT_LOGS
