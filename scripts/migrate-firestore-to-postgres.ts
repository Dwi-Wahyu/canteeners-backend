import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PrismaClient, MessageType, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
  console.log("🚀 Starting Firestore to Postgres Migration Script...");

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ FIREBASE_PRIVATE_KEY is missing in environment variables.");
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  const firestore = getFirestore();

  let chatsMigrated = 0;
  let messagesMigrated = 0;
  let notificationsMigrated = 0;
  const failedChats: string[] = [];

  // 1. Migrate Chats & Messages
  console.log("\n📦 Migrating Chats & Messages...");
  const chatsSnap = await firestore.collection("chats").get();
  console.log(`Found ${chatsSnap.docs.length} chat documents in Firestore.`);

  for (const doc of chatsSnap.docs) {
    const data = doc.data();
    const chatId = doc.id;

    try {
      let customerId = data.customerId;
      let ownerId = data.ownerId;

      if (!customerId || !ownerId) {
        const pIds: string[] = data.participantIds || [];
        if (pIds.length >= 2) {
          const user1 = await prisma.customer.findFirst({ where: { user_id: pIds[0] } });
          const user2 = await prisma.owner.findFirst({ where: { user_id: pIds[1] } });
          if (user1 && user2) {
            customerId = user1.id;
            ownerId = user2.id;
          } else {
            const user1Owner = await prisma.owner.findFirst({ where: { user_id: pIds[0] } });
            const user2Cust = await prisma.customer.findFirst({ where: { user_id: pIds[1] } });
            if (user1Owner && user2Cust) {
              customerId = user2Cust.id;
              ownerId = user1Owner.id;
            }
          }
        }
      }

      if (!customerId || !ownerId) {
        console.warn(`⚠️ Chat ${chatId} missing customerId or ownerId. Skipping.`);
        failedChats.push(chatId);
        continue;
      }

      const lastMessageAt = data.lastMessageAt?.toDate
        ? data.lastMessageAt.toDate()
        : new Date();

      await prisma.chat.upsert({
        where: { id: chatId },
        create: {
          id: chatId,
          customer_id: customerId,
          owner_id: ownerId,
          last_message: data.lastMessage || null,
          last_message_type: (data.lastMessageType as MessageType) || MessageType.TEXT,
          last_message_at: lastMessageAt,
          last_message_sender_id: data.lastMessageSenderId || null,
          unread_counts: data.unreadCounts || {},
        },
        update: {
          last_message: data.lastMessage || null,
          last_message_at: lastMessageAt,
          unread_counts: data.unreadCounts || {},
        },
      });
      chatsMigrated++;

      const messagesSnap = await doc.ref.collection("messages").orderBy("createdAt", "asc").get();
      for (const msgDoc of messagesSnap.docs) {
        const msgData = msgDoc.data();
        const createdAt = msgData.createdAt?.toDate ? msgData.createdAt.toDate() : new Date();

        await prisma.message.upsert({
          where: { id: msgDoc.id },
          create: {
            id: msgDoc.id,
            chat_id: chatId,
            sender_id: msgData.senderId || msgData.sender_id || "",
            text: msgData.text || null,
            type: (msgData.type as MessageType) || MessageType.TEXT,
            attachments: msgData.attachments || [],
            order_id: msgData.order_id || null,
            read_by: msgData.readBy || msgData.read_by || [],
            created_at: createdAt,
          },
          update: {},
        });
        messagesMigrated++;
      }
    } catch (err: any) {
      console.error(`❌ Failed to migrate chat ${chatId}:`, err.message);
      failedChats.push(chatId);
    }
  }

  // 2. Migrate Notifications
  console.log("\n🔔 Migrating Notifications...");
  try {
    const notifsSnap = await firestore.collection("notifications").get();
    console.log(`Found ${notifsSnap.docs.length} notifications in Firestore.`);

    for (const doc of notifsSnap.docs) {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();

      await prisma.notification.upsert({
        where: { id: doc.id },
        create: {
          id: doc.id,
          recipient_id: data.recipientId || data.recipient_id || "",
          type: (data.type as NotificationType) || NotificationType.ORDER,
          subtype: data.subType || data.subtype || null,
          title: data.title || "Notification",
          body: data.body || null,
          data: data.metadata || data.data || {},
          is_read: !!data.isRead,
          created_at: createdAt,
        },
        update: {},
      });
      notificationsMigrated++;
    }
  } catch (err: any) {
    console.error("❌ Failed to migrate notifications:", err.message);
  }

  console.log("\n==========================================");
  console.log("🎉 Migration Summary:");
  console.log(`- Chats Migrated: ${chatsMigrated}`);
  console.log(`- Messages Migrated: ${messagesMigrated}`);
  console.log(`- Notifications Migrated: ${notificationsMigrated}`);
  console.log(`- Failed Chats (${failedChats.length}):`, failedChats);
  console.log("==========================================\n");

  await prisma.$disconnect();
}

migrate().catch((e) => {
  console.error("Migration Script Error:", e);
  process.exit(1);
});
