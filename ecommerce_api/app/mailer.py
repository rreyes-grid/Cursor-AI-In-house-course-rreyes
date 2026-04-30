import smtplib
from email.message import EmailMessage
from typing import Optional

from flask import current_app

from app.extensions import db
from app.models.email_notification import EmailNotification


def record_and_send_email(
    *,
    user_id: int,
    order_id: Optional[int],
    notification_type: str,
    to_address: str,
    subject: str,
    body: str,
) -> EmailNotification:
    row = EmailNotification(
        user_id=user_id,
        order_id=order_id,
        notification_type=notification_type,
        subject=subject,
        body_text=body,
        smtp_attempted=False,
    )
    db.session.add(row)
    db.session.flush()

    cfg = current_app.config
    server = cfg.get("MAIL_SERVER")
    sender = cfg.get("MAIL_DEFAULT_SENDER", "orders@demo.local")

    current_app.logger.info(
        "[email:%s] to=%s subject=%s body=%s",
        notification_type,
        to_address,
        subject,
        body[:500],
    )

    if server and cfg.get("MAIL_USERNAME"):
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to_address
        msg.set_content(body)
        port = cfg.get("MAIL_PORT", 587)
        use_tls = cfg.get("MAIL_USE_TLS", True)
        try:
            with smtplib.SMTP(server, port, timeout=15) as smtp:
                if use_tls:
                    smtp.starttls()
                pwd = cfg.get("MAIL_PASSWORD")
                user_m = cfg.get("MAIL_USERNAME")
                if pwd and user_m:
                    smtp.login(user_m, pwd)
                smtp.send_message(msg)
            row.smtp_attempted = True
        except OSError as e:
            current_app.logger.warning("SMTP send skipped or failed: %s", e)
    else:
        row.smtp_attempted = False

    db.session.commit()
    return row
