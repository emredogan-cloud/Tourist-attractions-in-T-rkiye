import type { User } from "@prisma/client";
import { prisma } from "~/server/db/client";
import { ConflictError, NotFoundError, ValidationError } from "~/lib/errors";
import { isLocale, type Locale } from "~/lib/i18n/config";
import { logger } from "~/lib/logger";

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      locale: true,
      role: true,
      emailVerifiedAt: true,
      consentVersion: true,
      consentAt: true,
      marketingOptIn: true,
      premiumUntil: true,
      createdAt: true,
    },
  });
  if (!user) throw new NotFoundError("User");
  return user;
}

export async function updateUserProfile(
  userId: string,
  patch: { displayName?: string | null; avatarUrl?: string | null; locale?: Locale; marketingOptIn?: boolean },
) {
  if (patch.displayName && patch.displayName.length > 80) {
    throw new ValidationError("Display name too long");
  }
  if (patch.locale !== undefined && !isLocale(patch.locale)) {
    throw new ValidationError("Invalid locale");
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
      ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}),
      ...(patch.locale !== undefined ? { locale: patch.locale } : {}),
      ...(patch.marketingOptIn !== undefined ? { marketingOptIn: patch.marketingOptIn } : {}),
    },
    select: { id: true, email: true, displayName: true, avatarUrl: true, locale: true, marketingOptIn: true },
  });
}

export async function softDeleteUser(userId: string): Promise<{ hardDeleteAt: Date }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");
  if (user.deletedAt) throw new ConflictError("Already pending deletion");

  // Anonymize reviews: keep them visible but unlink the user; copy their
  // displayName at deletion time becomes "Anonymous Visitor".
  const hardDeleteAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);

  await prisma.$transaction([
    prisma.review.updateMany({
      where: { userId },
      data: { userId: null, authorDisplayName: "Anonymous Visitor" },
    }),
    prisma.favorite.deleteMany({ where: { userId } }),
    prisma.pushToken.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        hardDeleteAt: new Date(Date.now() + 90 * 24 * 3600 * 1000), // 90-day re-registration hold
        email: `deleted-${userId.slice(-8)}@deleted.local`,
        displayName: null,
        avatarUrl: null,
        passwordHash: null,
      },
    }),
  ]);
  logger.info({ userId, hardDeleteAt }, "user soft-deleted");
  return { hardDeleteAt };
}

export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");
  const [favorites, reviews, itineraries, pushTokens, conciergeMessages] = await Promise.all([
    prisma.favorite.findMany({ where: { userId } }),
    prisma.review.findMany({ where: { userId } }),
    prisma.itinerary.findMany({ where: { userId }, include: { days: { include: { stops: true } } } }),
    prisma.pushToken.findMany({ where: { userId }, select: { platform: true, locale: true, createdAt: true } }),
    prisma.conciergeMessage.findMany({ where: { userId }, select: { role: true, content: true, createdAt: true } }),
  ]);
  // Strip raw password / sensitive auth fields
  const { passwordHash: _ph, ...safeUser } = user;
  void _ph;
  return {
    exportedAt: new Date().toISOString(),
    user: safeUser,
    favorites,
    reviews,
    itineraries,
    pushTokens,
    conciergeMessages,
  };
}

export async function listFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: {
      attraction: {
        include: {
          category: true,
          region: true,
          province: true,
          translations: true,
          media: { where: { isHero: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addFavorite(userId: string, attractionId: string) {
  const attraction = await prisma.attraction.findUnique({ where: { id: attractionId } });
  if (!attraction) throw new NotFoundError("Attraction");
  await prisma.favorite.upsert({
    where: { userId_attractionId: { userId, attractionId } },
    create: { userId, attractionId },
    update: {},
  });
}

export async function removeFavorite(userId: string, attractionId: string) {
  await prisma.favorite.deleteMany({ where: { userId, attractionId } });
}

export async function isFavorite(userId: string, attractionId: string): Promise<boolean> {
  const fav = await prisma.favorite.findUnique({
    where: { userId_attractionId: { userId, attractionId } },
  });
  return fav !== null;
}

export type SafeUser = Omit<User, "passwordHash">;
