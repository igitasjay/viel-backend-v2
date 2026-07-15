import cron from "node-cron";
import { prisma } from "@shared/db/prisma";
import { logger } from "@/lib/winston";
import { publishToQueue } from "@shared/workers/publisher";
import { NOTIFICATION_CONSTRAINTS } from "@/admins/constants/constants";

// export const startBirthdayNotificationJob = () => {
//   cron.schedule("0 8 * * *", async () => {
//     try {
//       logger.info("Starting birthday notification job...");

//       const today = new Date();
//       const month = today.getMonth() + 1;
//       const day = today.getDate();

//       const allUsers = await prisma.user.findMany({
//         where: {
//           isActive: true,
//           dateOfBirth: { not: null },
//         },
//         select: {
//           id: true,
//           fullname: true,
//           email: true,
//           dateOfBirth: true,
//         },
//       });

//       const birthdayUsers = allUsers.filter((user) => {
//         if (!user.dateOfBirth) return false;
//         const birthDate = new Date(user.dateOfBirth);
//         return (
//           birthDate.getMonth() + 1 === month && birthDate.getDate() === day
//         );
//       });

//       logger.info(`Found ${birthdayUsers.length} users with birthdays today`);

//       const todayStart = new Date(today.setHours(0, 0, 0, 0));
//       const todayEnd = new Date(today.setHours(23, 59, 59, 999));

//       for (const user of birthdayUsers) {
//         const existingNotification = await prisma.notification.findFirst({
//           where: {
//             userId: user.id,
//             meta: {
//               path: ["type"],
//               equals: "birthday",
//             },
//             createdAt: {
//               gte: todayStart,
//               lte: todayEnd,
//             },
//           },
//         });

//         if (existingNotification) {
//           logger.info(
//             `Birthday notification already sent to user ${user.id} today`,
//           );
//           continue;
//         }

//         await publishToQueue({
//           type: "NOTIFICATION_EVENT",
//           payload: {
//             userId: user.id,
//             notificationType: "PROMO",
//             priority: "high",
//             title: `Happy Birthday ${user.fullname}! 🎉`,
//             message:
//               "Wishing you an amazing birthday! Enjoy a special gift from us - check your wallet for a surprise!",
//             metadata: {
//               type: "birthday",
//               year: new Date().getFullYear(),
//             },
//             deliveryChannels: ["in_app", "push"],
//           },
//         });

//         logger.info(`Birthday notification sent to user ${user.id}`);
//       }

//       logger.info(
//         `Birthday notification job completed. Sent ${birthdayUsers.length} notifications`,
//       );
//     } catch (error) {
//       logger.error("Birthday notification job failed:", error as any);
//     }
//   });

//   logger.info("Birthday notification job scheduled (daily at 8:00 AM)");
// };

// Runs daily at 10:00 AM to remind inactive users
export const startInactivityReminderJob = () => {
  cron.schedule("0 10 * * *", async () => {
    try {
      logger.info("Starting inactivity reminder job...");

      const INACTIVITY_DAYS = [7, 14, 30, 60, 90];
      const now = new Date();
      let totalSent = 0;

      for (const days of INACTIVITY_DAYS) {
        const inactiveDate = new Date(now);
        inactiveDate.setDate(inactiveDate.getDate() - days);

        // Allow a 1-day window to avoid missing users due to exact timestamp matching
        const inactiveDateStart = new Date(inactiveDate);
        inactiveDateStart.setHours(0, 0, 0, 0);
        const inactiveDateEnd = new Date(inactiveDate);
        inactiveDateEnd.setHours(23, 59, 59, 999);

        // Find users who last logged in exactly N days ago via their device sessions
        const deviceSessions = await prisma.deviceSession.findMany({
          where: {
            lastLoginAt: {
              gte: inactiveDateStart,
              lte: inactiveDateEnd,
            },
            user: {
              isActive: true,
            },
          },
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                fullname: true,
              },
            },
          },
          distinct: ["userId"],
        });

        const inactiveUsers = deviceSessions.map((session: any) => session.user);

        logger.info(
          `Found ${inactiveUsers.length} users inactive for ${days} days`,
        );

        for (const user of inactiveUsers) {
          let message = "";

          if (days === 7) {
            message = `Hey ${user.fullname}, we noticed you haven't been around for a week. Come back and explore what's new!`;
          } else if (days === 14) {
            message = `${user.fullname}, we miss you! It's been 2 weeks. Check out our latest offers just for you!`;
          } else if (days === 30) {
            message = `Welcome back ${user.fullname}! It's been a month. We have exciting updates waiting for you!`;
          } else if (days === 60) {
            message = `${user.fullname}, it's been a while! We'd love to see you back. Claim your comeback bonus today!`;
          } else if (days === 90) {
            message = `We really miss you ${user.fullname}! Your account is waiting. Come back and get a special welcome-back reward!`;
          }

          await publishToQueue({
            type: "NOTIFICATION_EVENT",
            payload: {
              userId: user.id,
              notificationType: "PROMO",
              priority: days >= 30 ? "high" : "medium",
              title: days >= 30 ? "We Miss You! 💝" : "Come Back Soon! 👋",
              message,
              metadata: {
                type: "inactivity_reminder",
                inactiveDays: days,
              },
              deliveryChannels: ["in_app", "push"],
            },
          });

          totalSent++;
        }
      }

      logger.info(
        `Inactivity reminder job completed. Sent ${totalSent} notifications`,
      );
    } catch (error) {
      logger.error("Inactivity reminder job failed:", error as any);
    }
  });

  logger.info("Inactivity reminder job scheduled (daily at 10:00 AM)");
};

// Runs daily at 9:00 AM to celebrate user anniversaries
export const startAnniversaryNotificationJob = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      logger.info("Starting anniversary notification job...");

      const today = new Date();
      const currentYear = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      // Fetch all active users (database-agnostic approach)
      const allUsers = await prisma.user.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          fullname: true,
          createdAt: true,
        },
      });

      // Filter users with anniversaries today (1 year or more)
      const anniversaryUsers = allUsers.filter((user: any) => {
        const registeredDate = new Date(user.createdAt);
        const registeredYear = registeredDate.getFullYear();
        const registeredMonth = registeredDate.getMonth() + 1;
        const registeredDay = registeredDate.getDate();

        // Check if it's their anniversary and at least 1 year has passed
        return (
          registeredMonth === month &&
          registeredDay === day &&
          registeredYear < currentYear
        );
      });

      logger.info(
        `Found ${anniversaryUsers.length} users with anniversaries today`,
      );

      // Check if already sent today to prevent duplicates
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      // Send anniversary notifications
      for (const user of anniversaryUsers) {
        const yearsWithUs =
          currentYear - new Date(user.createdAt).getFullYear();

        // Check if notification was already sent today
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            meta: {
              path: ["type"],
              equals: "anniversary",
            },
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        });

        if (existingNotification) {
          logger.info(
            `Anniversary notification already sent to user ${user.id} today`,
          );
          continue;
        }

        await publishToQueue({
          type: "NOTIFICATION_EVENT",
          payload: {
            userId: user.id,
            notificationType: "PROMO",
            priority: "high",
            title: `${yearsWithUs} Year${yearsWithUs > 1 ? "s" : ""} With Us! 🎊`,
            message: `Thank you for ${yearsWithUs} amazing year${yearsWithUs > 1 ? "s" : ""}, ${user.fullname}! We've added a special bonus to your wallet as a token of our appreciation. Here's to many more!`,
            metadata: {
              type: "anniversary",
              years: yearsWithUs,
              registeredDate: user.createdAt,
            },
            deliveryChannels: ["in_app", "push"],
          },
        });

        logger.info(
          `Anniversary notification sent to user ${user.id} (${yearsWithUs} years)`,
        );
      }

      logger.info(
        `Anniversary notification job completed. Sent ${anniversaryUsers.length} notifications`,
      );
    } catch (error) {
      logger.error("Anniversary notification job failed:", error as any);
    }
  });

  logger.info("Anniversary notification job scheduled (daily at 9:00 AM)");
};

export const sendWelcomeNotification = async (
  userId: string,
  fullname: string,
) => {
  try {
    await publishToQueue({
      type: "NOTIFICATION_EVENT",
      payload: {
        userId,
        notificationType: "SYSTEM",
        priority: "high",
        title: `Welcome to MyViel, ${fullname}! 🚀`,
        message:
          "We're thrilled to have you here! Complete your profile to unlock all features and start your journey with us.",
        metadata: {
          type: "welcome",
          step: 1,
        },
        deliveryChannels: ["in_app", "push", "email"],
      },
    });

    logger.info(`Welcome notification sent to user ${userId}`);
  } catch (error) {
    logger.error(
      `Failed to send welcome notification to user ${userId}:`,
      error as any,
    );
  }
};

// Onboarding Sequence Notifications
// Day 1: Profile completion reminder
// Day 3: First transaction encouragement
// Day 7: Feature exploration
export const startOnboardingSequenceJob = () => {
  cron.schedule("0 12 * * *", async () => {
    try {
      logger.info("Starting onboarding sequence job...");

      const now = new Date();
      let totalSent = 0;

      // Day 1: Profile completion reminder
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      oneDayAgo.setHours(0, 0, 0, 0);
      const oneDayAgoEnd = new Date(oneDayAgo);
      oneDayAgoEnd.setHours(23, 59, 59, 999);

      const day1Users = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: oneDayAgo,
            lte: oneDayAgoEnd,
          },
          isKycVerified: false,
          isActive: true,
        },
        select: { id: true, fullname: true },
      });

      for (const user of day1Users) {
        await publishToQueue({
          type: "NOTIFICATION_EVENT",
          payload: {
            userId: user.id,
            notificationType: "SYSTEM",
            priority: "medium",
            title: "Complete Your Profile 📝",
            message: `Hi ${user.fullname}! Complete your KYC verification to unlock all features and start transacting.`,
            metadata: { type: "onboarding", day: 1 },
            deliveryChannels: ["in_app", "push"],
          },
        });
        totalSent++;
      }

      // Day 3: First transaction encouragement
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);
      const threeDaysAgoEnd = new Date(threeDaysAgo);
      threeDaysAgoEnd.setHours(23, 59, 59, 999);

      const day3Users = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: threeDaysAgo,
            lte: threeDaysAgoEnd,
          },
          isActive: true,
        },
        select: { id: true, fullname: true },
      });

      for (const user of day3Users) {
        const hasTransacted = await prisma.transaction.findFirst({
          where: { userId: user.id },
        });

        if (!hasTransacted) {
          await publishToQueue({
            type: "NOTIFICATION_EVENT",
            payload: {
              userId: user.id,
              notificationType: "PROMO",
              priority: "medium",
              title: "Make Your First Transaction! 💰",
              message: `${user.fullname}, ready to get started? Make your first transaction and earn bonus cashback!`,
              metadata: { type: "onboarding", day: 3 },
              deliveryChannels: ["in_app", "push"],
            },
          });
          totalSent++;
        }
      }

      // Day 7: Feature exploration
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const sevenDaysAgoEnd = new Date(sevenDaysAgo);
      sevenDaysAgoEnd.setHours(23, 59, 59, 999);

      const day7Users = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
            lte: sevenDaysAgoEnd,
          },
          isActive: true,
        },
        select: { id: true, fullname: true },
      });

      for (const user of day7Users) {
        await publishToQueue({
          type: "NOTIFICATION_EVENT",
          payload: {
            userId: user.id,
            notificationType: "SYSTEM",
            priority: "low",
            title: "Explore All Features 🎯",
            message: `Hey ${user.fullname}! You've been with us for a week. Have you tried buying airtime, giftcards, or paying bills? Explore all our features!`,
            metadata: { type: "onboarding", day: 7 },
            deliveryChannels: ["in_app"],
          },
        });
        totalSent++;
      }

      logger.info(
        `Onboarding sequence job completed. Sent ${totalSent} notifications`,
      );
    } catch (error) {
      logger.error("Onboarding sequence job failed:", error as any);
    }
  });

  logger.info("Onboarding sequence job scheduled (daily at 12:00 PM)");
};

//  Runs every 1 minute to process scheduled notifications
export const startScheduledNotificationDeliveryJob = () => {
  // Run every 1 minute
  cron.schedule("* * * * *", async () => {
    try {
      logger.info("Scheduled notification delivery job starting...");

      const now = new Date();

      const scheduledNotifications =
        await prisma.scheduledNotification.findMany({
          where: {
            status: "PENDING",
            scheduledFor: {
              lte: now, // Scheduled time has passed
            },
          },
        });

      if (scheduledNotifications.length === 0) {
        logger.info("No scheduled notifications ready for delivery");
        return;
      }

      logger.info(
        `Processing ${scheduledNotifications.length} scheduled notification(s)`,
      );

      for (const notification of scheduledNotifications) {
        try {
          await prisma.$transaction(async (tx: any) => {
            // Update status to processing
            await tx.scheduledNotification.update({
              where: { id: notification.id },
              data: { status: "PROCESSING" },
            });

            let targetUsers: { id: string; fullname: string }[] = [];

            if (
              notification.targetUserIds &&
              Array.isArray(notification.targetUserIds) &&
              notification.targetUserIds.length > 0
            ) {
              targetUsers = await tx.user.findMany({
                where: { id: { in: notification.targetUserIds as string[] } },
                select: { id: true, fullname: true },
              });
            } else if (
              notification.filterCriteria &&
              Object.keys(notification.filterCriteria).length > 0
            ) {
              const filters = notification.filterCriteria as any;
              const whereClause: any = { isActive: true };

              if (filters.tier && Array.isArray(filters.tier)) {
                whereClause.tier = { in: filters.tier };
              }
              if (filters.isActive !== undefined) {
                whereClause.isActive = filters.isActive;
              }
              if (filters.isVerified !== undefined) {
                whereClause.isVerified = filters.isVerified;
              }

              targetUsers = await tx.user.findMany({
                where: whereClause,
                select: { id: true, fullname: true },
              });
            }

            if (targetUsers.length === 0) {
              logger.warn(
                `Scheduled notification ${notification.id} has no target users`,
              );
              await tx.scheduledNotification.update({
                where: { id: notification.id },
                data: {
                  status: "FAILED",
                },
              });
              return;
            }

            let totalSent = 0;

            const deliveryChannels = (notification.metadata as any)
              ?.deliveryChannels || ["in_app", "push", "email"];

            for (
              let i = 0;
              i < targetUsers.length;
              i += NOTIFICATION_CONSTRAINTS.BATCH_SIZE
            ) {
              const batch = targetUsers.slice(
                i,
                i + NOTIFICATION_CONSTRAINTS.BATCH_SIZE,
              );
              const batchPromises = batch.map((user) =>
                publishToQueue({
                  type: "NOTIFICATION_EVENT",
                  payload: {
                    userId: user.id,
                    notificationType: notification.type,
                    priority: notification.priority,
                    title: notification.title,
                    message: notification.message,
                    metadata: notification.metadata || {},
                    deliveryChannels,
                  },
                }),
              );

              await Promise.all(batchPromises);
              totalSent += batch.length;
              logger.info(
                `Sent batch ${Math.ceil((i + 1) / NOTIFICATION_CONSTRAINTS.BATCH_SIZE)} for notification ${notification.id}`,
              );
            }

            // Mark as delivered
            await tx.scheduledNotification.update({
              where: { id: notification.id },
              data: {
                status: "DELIVERED",
                deliveredAt: new Date(),
              },
            });

            logger.info(
              `Scheduled notification ${notification.id} delivered to ${totalSent} user(s)`,
            );

            // Handle recurring notifications
            if (notification.isRecurring && notification.recurringPattern) {
              const { calculateNextScheduledDate } =
                await import("@shared/utils/recurring-pattern.js");
              const nextScheduledFor = calculateNextScheduledDate(
                new Date(notification.scheduledFor),
                notification.recurringPattern,
              );

              await tx.scheduledNotification.create({
                data: {
                  title: notification.title,
                  message: notification.message,
                  type: notification.type,
                  priority: notification.priority,
                  scheduledFor: nextScheduledFor,
                  isRecurring: true,
                  recurringPattern: notification.recurringPattern,
                  targetUserIds: notification.targetUserIds || [],
                  filterCriteria: notification.filterCriteria || {},
                  metadata: notification.metadata || {},
                  createdById: notification.createdById,
                },
              });

              logger.info(
                `Created recurring notification for ${nextScheduledFor.toISOString()} using pattern: ${notification.recurringPattern}`,
              );
            }
          });
        } catch (error) {
          logger.error(
            `Failed to deliver scheduled notification ${notification.id}:`,
            error as any,
          );

          // Mark as failed (outside transaction)
          try {
            await prisma.scheduledNotification.update({
              where: { id: notification.id },
              data: { status: "FAILED" },
            });
          } catch (updateError) {
            logger.error(
              `Failed to update status for notification ${notification.id}:`,
              updateError as any,
            );
          }
        }
      }

      logger.info("Scheduled notification delivery job completed");
    } catch (error) {
      logger.error("Scheduled notification delivery job failed:", error as any);
    }
  });

  logger.info(
    "Scheduled notification delivery job initialized (runs every 1 minute)",
  );
};

export const startAllNotificationJobs = () => {
  logger.info("Initializing all notification cron jobs...");

  // startBirthdayNotificationJob();
  startInactivityReminderJob();
  startAnniversaryNotificationJob();
  startOnboardingSequenceJob();
  startScheduledNotificationDeliveryJob();

  logger.info("All notification cron jobs initialized successfully");
};
