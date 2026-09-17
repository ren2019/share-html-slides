import { pgTable, text, timestamp, boolean, integer, bigint, index } from 'drizzle-orm/pg-core';
const timestamps = { createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull() };
export const user = pgTable('users', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(), image: text('image'),
  phoneNumber: text('phone_number').unique(), phoneNumberVerified: boolean('phone_number_verified').default(false), ...timestamps,
});
export const session = pgTable('sessions', {
  id: text('id').primaryKey(), token: text('token').notNull().unique(), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'), userAgent: text('user_agent'), userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }), ...timestamps,
}, table => [index('sessions_user_idx').on(table.userId)]);
export const account = pgTable('accounts', {
  id: text('id').primaryKey(), accountId: text('account_id').notNull(), providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'), refreshToken: text('refresh_token'), idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }), refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'), password: text('password'), ...timestamps,
}, table => [index('accounts_user_idx').on(table.userId)]);
export const verification = pgTable('verifications', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), ...timestamps,
}, table => [index('verifications_identifier_idx').on(table.identifier)]);
export const rateLimit = pgTable('rate_limits', {
  id: text('id').primaryKey(), key: text('key').notNull().unique(), count: integer('count').notNull(), lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});
export const smsCooldown = pgTable('sms_cooldowns', { phoneNumber: text('phone_number').primaryKey(), sentAt: timestamp('sent_at', { withTimezone: true }).notNull() });
export const material = pgTable('materials', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), originalFilename: text('original_filename').notNull(), ...timestamps,
}, table => [index('materials_owner_idx').on(table.ownerId)]);
