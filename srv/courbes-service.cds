using { onee.courbes as db } from '../db/schema';

service CourbesChargeService @(path: '/api/courbes') {

  // ── Points de comptage ──────────────────────
  entity PointComptage as projection on db.PointComptage;

  // ── Courbes de charge ───────────────────────
  entity CourbeCharge  as projection on db.CourbeCharge;

  // ── Relevés ─────────────────────────────────
  entity Releve        as projection on db.Releve;

}
