"""Log-only email notifications (FR-003, FR-007, FR-014, FR-018)."""
import logging

log = logging.getLogger("support.email")


def send_email(to_email: str, subject: str, body: str) -> None:
    log.info("EMAIL to=%s subject=%s\n%s", to_email, subject, body[:500])
