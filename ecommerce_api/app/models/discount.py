from datetime import datetime
from typing import Optional, Tuple

from app.extensions import db


class DiscountCode(db.Model):
    __tablename__ = "eco_discount_codes"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(48), unique=True, nullable=False, index=True)
    # Exactly one strategy: percent_off (1–100) OR amount_off_cents
    percent_off = db.Column(db.Integer, nullable=True)
    amount_off_cents = db.Column(db.Integer, nullable=True)
    min_subtotal_cents = db.Column(db.Integer, nullable=False, default=0)
    max_uses = db.Column(db.Integer, nullable=True)
    uses_count = db.Column(db.Integer, nullable=False, default=0)
    active = db.Column(db.Boolean, nullable=False, default=True)
    valid_until = db.Column(db.DateTime, nullable=True)

    def applies_ok(self, subtotal_cents: int) -> Tuple[bool, Optional[str]]:
        if not self.active:
            return False, "inactive"
        if self.valid_until and datetime.utcnow() > self.valid_until:
            return False, "expired"
        if self.max_uses is not None and self.uses_count >= self.max_uses:
            return False, "sold_out"
        if subtotal_cents < self.min_subtotal_cents:
            return False, "min_subtotal_not_met"
        pct = self.percent_off
        amt = self.amount_off_cents
        if (pct is None) == (amt is None):
            return False, "invalid_code_config"
        if pct is not None and not (1 <= pct <= 100):
            return False, "invalid_code_config"
        if amt is not None and amt <= 0:
            return False, "invalid_code_config"
        return True, None

    def compute_discount(self, subtotal_cents: int) -> int:
        if self.percent_off is not None:
            return min(subtotal_cents, int(subtotal_cents * self.percent_off / 100))
        off = min(subtotal_cents, self.amount_off_cents or 0)
        return max(0, off)
