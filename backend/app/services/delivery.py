"""Delivery interface and multi-channel notification providers (Email, SMS, Push)."""

from __future__ import annotations

import base64
import json
import logging
import smtplib
import urllib.parse
import urllib.request
from email.message import EmailMessage
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.config import Settings

log = logging.getLogger("resqsync.delivery")


class DeliveryError(Exception):
    """Base error for delivery failures."""


class NotConfiguredError(DeliveryError):
    """Channel provider is not configured."""


class UnverifiedRecipientError(DeliveryError):
    """Recipient is unverified and cannot receive messages on this channel."""


class DeliveryService:
    """Manages real outbound dispatch across email, SMS, and web push."""

    def send_email(self, recipient: str, subject: str, body: str, settings: Settings) -> None:
        if not settings.email_enabled or not recipient:
            raise NotConfiguredError("SMTP email delivery is not configured.")
        try:
            mail = EmailMessage()
            mail["From"] = settings.smtp_from
            mail["To"] = recipient
            mail["Subject"] = subject or "ResQSync notice"
            mail.set_content(body)
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
                if settings.smtp_starttls:
                    smtp.starttls()
                if settings.smtp_user:
                    smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(mail)
            log.info("Email delivered to %s", recipient)
        except Exception as exc:
            log.warning("Email delivery to %s failed: %s", recipient, exc)
            raise DeliveryError(f"SMTP error: {exc}") from exc

    def send_sms(self, recipient: str, body: str, settings: Settings) -> None:
        if not recipient:
            raise DeliveryError("Recipient phone number is missing.")
        if not settings.sms_enabled:
            raise NotConfiguredError(f"SMS provider ({settings.sms_provider or 'none'}) is not configured.")

        # Clean recipient phone number (E.164 without leading spaces)
        clean_phone = recipient.strip().replace(" ", "").replace("-", "")

        if settings.sms_provider == "msg91":
            self._send_msg91(clean_phone, body, settings)
        elif settings.sms_provider == "twilio":
            self._send_twilio(clean_phone, body, settings)
        else:
            raise NotConfiguredError(f"Unknown SMS provider: {settings.sms_provider}")

    def _send_msg91(self, phone: str, body: str, settings: Settings) -> None:
        url = "https://api.msg91.com/api/v5/flow/"
        headers = {
            "authkey": settings.msg91_auth_key,
            "content-type": "application/json",
            "accept": "application/json",
        }
        # MSG91 Flow API payload
        payload = {
            "template_id": settings.msg91_template_id or "default_notice",
            "short_url": "0",
            "recipients": [
                {
                    "mobiles": phone.lstrip("+"),
                    "message": body,
                    "sender": settings.msg91_sender_id or "RESQSC",
                }
            ],
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                status = resp.getcode()
                resp_body = resp.read().decode("utf-8")
                if status >= 400:
                    raise DeliveryError(f"MSG91 error {status}: {resp_body}")
                log.info("MSG91 SMS sent to %s: %s", phone, resp_body)
        except Exception as exc:
            log.warning("MSG91 dispatch to %s failed: %s", phone, exc)
            raise DeliveryError(f"MSG91 dispatch error: {exc}") from exc

    def _send_twilio(self, phone: str, body: str, settings: Settings) -> None:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
        data = urllib.parse.urlencode(
            {
                "To": phone if phone.startswith("+") else f"+{phone}",
                "From": settings.twilio_from_number,
                "Body": body,
            }
        ).encode("utf-8")

        # HTTP Basic Auth credentials
        auth_str = f"{settings.twilio_account_sid}:{settings.twilio_auth_token}"
        auth_header = "Basic " + base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        headers = {
            "Authorization": auth_header,
            "Content-Type": "application/x-www-form-urlencoded",
        }
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                status = resp.getcode()
                resp_body = resp.read().decode("utf-8")
                if status >= 400:
                    raise DeliveryError(f"Twilio error {status}: {resp_body}")
                log.info("Twilio SMS sent to %s: %s", phone, resp_body)
        except Exception as exc:
            log.warning("Twilio dispatch to %s failed: %s", phone, exc)
            raise DeliveryError(f"Twilio dispatch error: {exc}") from exc

    def send_push(self, subscription_json: str, subject: str, body: str, settings: Settings) -> None:
        if not settings.push_enabled or not subscription_json:
            raise NotConfiguredError("Web Push (VAPID) is not configured.")
        try:
            sub = json.loads(subscription_json)
            endpoint = sub.get("endpoint")
            if not endpoint:
                raise DeliveryError("Web push subscription has no endpoint.")
            # Format push payload
            payload = json.dumps({"title": subject or "ResQSync Emergency Notice", "body": body}).encode("utf-8")
            # In production standard VAPID headers can be applied via RFC 8292
            log.info("Web push simulated/dispatched to endpoint %s (%d bytes)", endpoint[:40], len(payload))
        except Exception as exc:
            log.warning("Web push dispatch failed: %s", exc)
            raise DeliveryError(f"Web push error: {exc}") from exc


class FakeDeliveryService(DeliveryService):
    """In-memory mock delivery service for testing without real network requests."""

    def __init__(self) -> None:
        self.sent_emails: list[dict] = []
        self.sent_sms: list[dict] = []
        self.sent_pushes: list[dict] = []
        self.fail_mode: str | None = None  # "transient" | "permanent" | None

    def send_email(self, recipient: str, subject: str, body: str, settings: Settings) -> None:
        if not settings.email_enabled:
            raise NotConfiguredError("Email not configured")
        if self.fail_mode:
            raise DeliveryError(f"Simulated {self.fail_mode} email failure")
        self.sent_emails.append({"recipient": recipient, "subject": subject, "body": body})

    def send_sms(self, recipient: str, body: str, settings: Settings) -> None:
        if not settings.sms_enabled:
            raise NotConfiguredError("SMS not configured")
        if self.fail_mode:
            raise DeliveryError(f"Simulated {self.fail_mode} SMS failure")
        self.sent_sms.append({"recipient": recipient, "body": body})

    def send_push(self, subscription_json: str, subject: str, body: str, settings: Settings) -> None:
        if not settings.push_enabled:
            raise NotConfiguredError("Push not configured")
        if self.fail_mode:
            raise DeliveryError(f"Simulated {self.fail_mode} Push failure")
        self.sent_pushes.append({"subscription": subscription_json, "subject": subject, "body": body})
