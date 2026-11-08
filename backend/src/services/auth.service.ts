import { randomUUID } from "crypto";
import { Op, Transaction, UniqueConstraintError } from "sequelize";

import { db } from "../config/connectDb";
import { appConfig } from "../config/index.config";
import { User, Session, UserToken, PendingSignup } from "../models";
import { hashPassword, comparePassword } from "../utils/passwordHashing";
import {
  createAccessToken,
  createRefreshToken,
  createEmailToken,
  hashToken,
  readAuthToken,
} from "../utils/authToken";
import { HttpError } from "../utils/httpError";
import { sendEmail } from "../utils/sendEmail";
import { logger } from "../utils/logger.utils";
import { clientVerificationEmail } from "./VerificationEmail.template";

// Every response uses an explicit list of public profile fields.
export const publicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Serialize signup, resend and approval for the same email, including requests
// arriving before a pending row exists. Different emails can proceed in parallel.
const lockSignupEmail = async (email: string, transaction: Transaction) => {
  await db.query("SELECT pg_advisory_xact_lock(73519002, hashtext(:email))", {
    replacements: { email },
    transaction,
  });
};

const deliverApproval = async (signup: PendingSignup, token: string) => {
  try {
    await sendEmail({
      email: signup.email,
      ...clientVerificationEmail(signup.name, token),
    });
  } catch {
    logger.warn("[AUTH] Approval email delivery failed; no user was created");
  }
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const password = await hashPassword(data.password);
  const token = createEmailToken();

  const signup = await db.transaction(async (transaction) => {
    await lockSignupEmail(data.email, transaction);

    if (await User.findOne({ where: { email: data.email }, transaction })) {
      return null;
    }

    const existing = await PendingSignup.findOne({
      where: { email: data.email },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existing && existing.expiresAt.getTime() > Date.now()) {
      return null;
    }

    const values = {
      name: data.name,
      email: data.email,
      password,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    if (existing) return existing.update(values, { transaction });
    return PendingSignup.create(values, { transaction });
  });

  // SMTP failure leaves only a pending request for resend, never a user account.
  if (signup) await deliverApproval(signup, token);
  return { email: data.email };
};

export const resendVerification = async (email: string) => {
  const token = createEmailToken();
  const signup = await db.transaction(async (transaction) => {
    await lockSignupEmail(email, transaction);
    const pending = await PendingSignup.findOne({
      where: { email },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!pending) return null;

    await pending.update(
      {
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      { transaction },
    );

    return pending;
  });

  if (signup) await deliverApproval(signup, token);
};

export const verifyEmail = async (token: string) => {
  const tokenHash = hashToken(token);

  try {
    await db.transaction(async (transaction) => {
      const request = await PendingSignup.findOne({
        where: { tokenHash },
        transaction,
      });
      if (!request) throw new HttpError("INVALID_LINK");

      await lockSignupEmail(request.email, transaction);
      const signup = await PendingSignup.scope("withCredentials").findOne({
        where: { tokenHash, expiresAt: { [Op.gt]: new Date() } },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!signup) throw new HttpError("INVALID_LINK");

      // This is the only account-creation path: approval and consumption commit
      // together, so failed or repeated confirmations cannot create another user.
      await User.create(
        {
          id: signup.id,
          name: signup.name,
          email: signup.email,
          password: signup.password,
          isAdmin: false,
          isEmailVerified: true,
        },
        { transaction },
      );
      await signup.destroy({ transaction });
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new HttpError("INVALID_LINK");
    }
    throw error;
  }
};

const savePasswordResetToken = async (
  userId: string,
  transaction: Transaction,
) => {
  const token = createEmailToken();
  const purpose = "reset-password";
  await UserToken.destroy({ where: { userId, purpose }, transaction });
  await UserToken.create(
    {
      userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
    { transaction },
  );
  return token;
};

// Password reset applies only to an existing, approved user.
const findPasswordResetToken = async (
  token: string,
  transaction: Transaction,
) => {
  const tokenHash = hashToken(token);
  const purpose = "reset-password";
  const record = await UserToken.findOne({
    where: { tokenHash, purpose },
    transaction,
  });
  if (!record) throw new HttpError("INVALID_LINK");

  const user = await User.scope("withPassword").findByPk(record.userId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const currentToken = await UserToken.findOne({
    where: { tokenHash, purpose, expiresAt: { [Op.gt]: new Date() } },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!user || !currentToken) throw new HttpError("INVALID_LINK");
  return { user, record: currentToken };
};

export const loginUser = async (email: string, password: string) => {
  return db.transaction(async (transaction) => {
    const user = await User.scope("withPassword").findOne({
      where: { email },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    // Perform the same bcrypt check for unknown emails and incorrect passwords.
    // This dummy hash is not associated with a real account.
    const dummyHash =
      "$2b$12$jDHJ3Pc6XTCzfPfGkNHrT.trVcJ4yEpsKspbotOhcXGSX1UZ3ITj2";
    const passwordMatches = await comparePassword(
      password,
      user?.password || dummyHash,
    );

    if (!user || !passwordMatches || !user.isEmailVerified) {
      throw new HttpError("INVALID_CREDENTIALS");
    }

    const sessionId = randomUUID();
    const expiresAt = new Date(
      Date.now() + appConfig.app.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    );
    const refreshToken = createRefreshToken(user.id, sessionId, expiresAt);

    await Session.create(
      {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt,
      },
      { transaction },
    );

    return {
      user: publicUser(user),
      accessToken: createAccessToken(user.id, sessionId),
      refreshToken,
      expiresAt,
    };
  });
};

export const refreshSession = async (token: string) => {
  const { userId, sessionId } = readAuthToken(token, "refresh");

  const result = await db.transaction(async (transaction) => {
    // All auth writes take the user lock first to avoid deadlocks with resets.
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const session = await Session.findByPk(sessionId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (
      !user ||
      !user.isEmailVerified ||
      !session ||
      session.userId !== userId ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }

    if (session.refreshTokenHash !== hashToken(token)) {
      // A previously rotated token was reused. Commit revocation before replying.
      await session.update({ revokedAt: new Date() }, { transaction });
      logger.warn("[AUTH] Refresh token reuse detected; session revoked");
      return null;
    }

    const refreshToken = createRefreshToken(
      userId,
      sessionId,
      session.expiresAt,
    );
    await session.update(
      { refreshTokenHash: hashToken(refreshToken) },
      { transaction },
    );

    return {
      accessToken: createAccessToken(userId, sessionId),
      refreshToken,
      expiresAt: session.expiresAt,
    };
  });

  if (!result) {
    throw new HttpError("SESSION_EXPIRED");
  }

  return result;
};

export const revokeSession = async (token: string) => {
  try {
    const { userId, sessionId } = readAuthToken(token, "refresh");
    await Session.update(
      { revokedAt: new Date() },
      {
        where: { id: sessionId, userId, revokedAt: null },
      },
    );
  } catch (error) {
    if (!(error instanceof HttpError)) {
      throw error;
    }
    // Logout remains safe to repeat after the cookie has expired.
  }
};

export const requestPasswordReset = async (email: string) => {
  const result = await db.transaction(async (transaction) => {
    const user = await User.findOne({
      where: { email },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!user) {
      return null;
    }

    const token = await savePasswordResetToken(user.id, transaction);

    return { user, token };
  });

  if (!result) {
    return;
  }

  const resetUrl = `${appConfig.app.clientUrl}/reset-password?token=${result.token}`;

  try {
    await sendEmail({
      email: result.user.email,
      subject: "Reset your RP Ranch password",
      text: `Reset your password using this link (valid for one hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    });
  } catch {
    logger.warn("[AUTH] Password reset email delivery failed");
  }
};

export const resetPassword = async (token: string, password: string) => {
  const passwordHash = await hashPassword(password);

  await db.transaction(async (transaction) => {
    const { user, record } = await findPasswordResetToken(token, transaction);

    await user.update({ password: passwordHash }, { transaction });
    await record.destroy({ transaction });
    await Session.update(
      { revokedAt: new Date() },
      {
        where: { userId: user.id, revokedAt: null },
        transaction,
      },
    );
  });
};
