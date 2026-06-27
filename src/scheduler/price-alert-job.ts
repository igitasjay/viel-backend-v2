// import cron from "node-cron";
// import { prisma } from "@shared/db";
// import { logger } from "@shared/common";
// import { publishToQueue } from "@shared/workers";
// import { substituteVariables } from "@shared/utils";

// async function checkPriceAlerts() {
//   try {
//     logger.info("Starting price alert check...");

//     const priceAlertTemplate = await prisma.notificationTemplate.findUnique({
//       where: { name: "price_alert_triggered" },
//     });

//     if (!priceAlertTemplate || !priceAlertTemplate.isActive) {
//       logger.warn(
//         "Price alert template not found or inactive. Using fallback messages.",
//       );
//     }

//     const activeAlerts = await prisma.priceAlert.findMany({
//       where: {
//         isActive: true,
//         triggeredAt: null,
//       },
//       include: {
//         user: {
//           select: {
//             id: true,
//             email: true,
//             fullname: true,
//           },
//         },
//       },
//     });

//     if (activeAlerts.length === 0) {
//       logger.info("No active price alerts to check");
//       return;
//     }

//     logger.info(`Checking ${activeAlerts.length} active price alerts`);

//     const cryptoAssets = [
//       ...new Set(activeAlerts.map((alert) => alert.cryptoAsset)),
//     ];
//     const cryptoAssetsData = await prisma.cryptoAsset.findMany({
//       where: {
//         code: { in: cryptoAssets },
//         buyRate: { not: null },
//       },
//     });

//     const rateMap = new Map(
//       cryptoAssetsData.map((asset) => [asset.code, Number(asset.buyRate)]),
//     );

//     let triggeredCount = 0;

//     for (const alert of activeAlerts) {
//       const currentRate = rateMap.get(alert.cryptoAsset);

//       if (!currentRate) {
//         logger.warn(
//           `No rate found for ${alert.cryptoAsset}, skipping alert ${alert.id}`,
//         );
//         continue;
//       }

//       const targetAmount = Number(alert.targetAmount);
//       let shouldTrigger = false;

//       if (alert.triggerCondition === "ABOVE" && currentRate > targetAmount) {
//         shouldTrigger = true;
//       } else if (
//         alert.triggerCondition === "AT" &&
//         currentRate >= targetAmount
//       ) {
//         shouldTrigger = true;
//       }

//       if (shouldTrigger) {
//         logger.info(
//           `Alert ${alert.id} triggered for user ${alert.user.fullname}. ` +
//             `${alert.cryptoAsset} ${alert.rateType} rate: ₦${currentRate.toLocaleString()} ` +
//             `(target: ₦${targetAmount.toLocaleString()})`,
//         );

//         await prisma.priceAlert.update({
//           where: { id: alert.id },
//           data: {
//             triggeredAt: new Date(),
//             isActive: false,
//           },
//         });

//         const conditionText =
//           alert.triggerCondition === "ABOVE" ? "is now above" : "has reached";

//         const templateVariables = {
//           cryptoAsset: alert.cryptoAsset,
//           rateType: alert.rateType.toLowerCase(),
//           currentRate: currentRate.toLocaleString(),
//           targetAmount: targetAmount.toLocaleString(),
//           conditionText,
//         };

//         let notificationTitle: string;
//         let notificationMessage: string;

//         if (priceAlertTemplate && priceAlertTemplate.isActive) {
//           notificationTitle = substituteVariables(
//             priceAlertTemplate.title,
//             templateVariables,
//           );
//           notificationMessage = substituteVariables(
//             priceAlertTemplate.message,
//             templateVariables,
//           );
//         } else {
//           // Fallback to hardcoded messages
//           notificationTitle = `🚀 Price Alert: ${alert.cryptoAsset}`;
//           notificationMessage =
//             `${alert.cryptoAsset} ${alert.rateType.toLowerCase()} rate ${conditionText} ` +
//             `your target of ₦${targetAmount.toLocaleString()}. ` +
//             `Current rate: ₦${currentRate.toLocaleString()}.`;
//         }

//         if (alert.pushNotification) {
//           try {
//             await publishToQueue({
//               type: "NOTIFICATION_EVENT",
//               payload: {
//                 userId: alert.userId,
//                 notificationType: "SYSTEM",
//                 // priority: "high",
//                 title: notificationTitle,
//                 message: notificationMessage,
//                 metadata: {
//                   alertId: alert.id,
//                   cryptoAsset: alert.cryptoAsset,
//                   currentRate: currentRate.toString(),
//                   targetAmount: targetAmount.toString(),
//                   triggerCondition: alert.triggerCondition,
//                   type: "price_alert",
//                 },
//                 deliveryChannels: ["in_app", "push"],
//               },
//             });
//             logger.info(`Push notification queued for alert ${alert.id}`);
//           } catch (error: any) {
//             logger.error(
//               `Failed to queue push notification for alert ${alert.id}:`,
//               error,
//             );
//           }
//         }

//         if (alert.emailNotification) {
//           try {
//             await publishToQueue({
//               type: "NOTIFICATION_EVENT",
//               payload: {
//                 userId: alert.userId,
//                 notificationType: "SYSTEM",
//                 priority: "high",
//                 title: notificationTitle,
//                 message: notificationMessage,
//                 metadata: {
//                   alertId: alert.id,
//                   cryptoAsset: alert.cryptoAsset,
//                   currentRate: currentRate.toString(),
//                   targetAmount: targetAmount.toString(),
//                   triggerCondition: alert.triggerCondition,
//                   type: "price_alert",
//                 },
//                 deliveryChannels: ["email"],
//               },
//             });
//             logger.info(`Email notification queued for alert ${alert.id}`);
//           } catch (error: any) {
//             logger.error(
//               `Failed to queue email notification for alert ${alert.id}:`,
//               error,
//             );
//           }
//         }

//         triggeredCount++;
//       }
//     }

//     logger.info(
//       `Price alert check completed. Triggered: ${triggeredCount}/${activeAlerts.length} alerts`,
//     );
//   } catch (error: any) {
//     logger.error("Error in price alert monitoring job:", error);
//   }
// }

// export function startPriceAlertMonitoring() {
//   cron.schedule("*/5 * * * *", async () => {
//     await checkPriceAlerts();
//   });

//   logger.info("Price alert monitoring job scheduled (runs every 5 minutes)");

//   setTimeout(() => {
//     checkPriceAlerts().catch((error) => {
//       logger.error("Error in initial price alert check:", error);
//     });
//   }, 10000);
// }
