const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

// ─── Helper: Send Expo Push Notification ────────────
async function sendPushNotifications(tokens, title, body, data = {}) {
  const messages = tokens
    .filter((token) => token)
    .map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

  if (messages.length === 0) return;

  // Expo Push API
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
}

// ─── Get other members' push tokens ─────────────────
async function getOtherMemberTokens(familyId, excludeMemberId) {
  const membersSnap = await db
    .collection('families')
    .doc(familyId)
    .collection('members')
    .get();

  return membersSnap.docs
    .filter((doc) => doc.id !== excludeMemberId)
    .map((doc) => doc.data().pushToken)
    .filter(Boolean);
}

// ─── Expense Added Notification ─────────────────────
exports.onExpenseAdded = functions.firestore
  .document('families/{familyId}/expenses/{expenseId}')
  .onCreate(async (snap, context) => {
    const { familyId } = context.params;
    const expense = snap.data();

    const tokens = await getOtherMemberTokens(familyId, expense.memberId);

    const categoryEmojis = {
      Food: '🍕',
      Bills: '📄',
      Travel: '✈️',
      Shopping: '🛍️',
      Health: '🏥',
      Education: '📚',
      Entertainment: '🎬',
      Other: '📌',
    };

    const emoji = categoryEmojis[expense.category] || '📌';
    const title = `${expense.memberName} spent Rs ${expense.amount}`;
    const body = `${emoji} ${expense.category}${expense.comment ? ' — ' + expense.comment : ''}`;

    await sendPushNotifications(tokens, title, body, {
      type: 'expense',
      familyId,
    });
  });

// ─── Income Added Notification ──────────────────────
exports.onIncomeAdded = functions.firestore
  .document('families/{familyId}/income/{incomeId}')
  .onCreate(async (snap, context) => {
    const { familyId } = context.params;
    const income = snap.data();

    const tokens = await getOtherMemberTokens(familyId, income.memberId);

    const title = `${income.memberName} added income`;
    const body = `💰 Rs ${income.amount} from ${income.source}`;

    await sendPushNotifications(tokens, title, body, {
      type: 'income',
      familyId,
    });
  });

// ─── Udhar Added Notification ───────────────────────
exports.onUdharAdded = functions.firestore
  .document('families/{familyId}/udhar/{udharId}')
  .onCreate(async (snap, context) => {
    const { familyId } = context.params;
    const udhar = snap.data();

    const tokens = await getOtherMemberTokens(familyId, udhar.memberId);

    let title, body;
    if (udhar.type === 'give') {
      title = `${udhar.memberName} gave udhar`;
      body = `🤝 Rs ${udhar.amount} to ${udhar.personName}${udhar.comment ? ' — ' + udhar.comment : ''}`;
    } else {
      title = `${udhar.memberName} received return`;
      body = `💰 Rs ${udhar.amount} from ${udhar.personName}${udhar.comment ? ' — ' + udhar.comment : ''}`;
    }

    await sendPushNotifications(tokens, title, body, {
      type: 'udhar',
      familyId,
    });
  });

// ─── Member Joined Notification ─────────────────────
exports.onMemberJoined = functions.firestore
  .document('families/{familyId}/members/{memberId}')
  .onCreate(async (snap, context) => {
    const { familyId, memberId } = context.params;
    const member = snap.data();

    const tokens = await getOtherMemberTokens(familyId, memberId);

    const title = 'New family member!';
    const body = `👋 ${member.name} joined the family group`;

    await sendPushNotifications(tokens, title, body, {
      type: 'member_joined',
      familyId,
    });
  });
