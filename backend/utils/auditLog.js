const db = require("../config/db");

// =================================================
// CREATE AUDIT LOG
// =================================================

const logAction = async ({
  userId,
  action,
  entity,
  entityId = null,
  description,
}) => {
  try {
    const userResult = await db.query(
      `SELECT name, email, role
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const user = userResult.rows[0];

    await db.query(
      `INSERT INTO audit_logs
       (
         user_id,
         user_name,
         user_email,
         user_role,
         action,
         entity,
         entity_id,
         description
       )
       VALUES
       (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8
       )`,
      [
        userId || null,
        user?.name || "Unknown User",
        user?.email || "",
        user?.role || "unknown",
        action,
        entity,
        entityId,
        description,
      ]
    );
  } catch (error) {
    console.error(
      "AUDIT LOG ERROR:",
      error
    );
  }
};

module.exports = logAction;