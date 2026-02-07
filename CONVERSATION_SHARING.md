# Conversation Sharing Feature

## Overview

The conversation sharing feature allows users to explicitly share conversations with other users in the system. This solves the access issue where invited users couldn't view conversations created by other users.

## How It Works

### Database Schema

A new `conversationShares` table tracks sharing relationships:

```sql
CREATE TABLE conversationShares (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversationId INT NOT NULL,
  sharedWithUserId INT NOT NULL,
  permission ENUM('view', 'edit', 'admin') DEFAULT 'view',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sharedWithUserId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Access Control Logic

Users can access a conversation if they:
1. **Own the conversation** (userId matches conversation.userId), OR
2. **Have been explicitly shared access** (entry in conversationShares table)

### Database Functions

New functions in `server/db.ts`:

- **`shareConversation(conversationId, sharedWithUserId, permission)`** - Share a conversation with another user
- **`getSharedConversations(userId)`** - Get all conversations shared with a user
- **`removeConversationShare(conversationId, sharedWithUserId)`** - Remove sharing
- **`hasConversationAccess(conversationId, userId)`** - Check if user can access conversation

### API Procedures

New tRPC procedures in `server/routers/chat.ts`:

#### Share a Conversation
```typescript
trpc.chat.shareConversation.useMutation({
  conversationId: 1,
  sharedWithUserId: 2,
  permission: "view" // or "edit", "admin"
})
```

#### Get Shared Conversations
```typescript
const { data: sharedConvs } = trpc.chat.getSharedWithMe.useQuery();
```

#### Remove Share
```typescript
trpc.chat.removeShare.useMutation({
  conversationId: 1,
  sharedWithUserId: 2
})
```

## Permission Levels

- **view**: User can read the conversation and messages, but cannot edit or share
- **edit**: User can read and edit messages (future feature)
- **admin**: User can manage sharing and delete the conversation (future feature)

## Implementation Steps

### For Admin Users

To share a conversation with invited users:

1. **Via API/Admin Dashboard** (when implemented):
   ```bash
   POST /api/trpc/chat.shareConversation
   {
     "conversationId": 1,
     "sharedWithUserId": 2,
     "permission": "view"
   }
   ```

2. **Via Database** (direct SQL):
   ```sql
   INSERT INTO conversationShares (conversationId, sharedWithUserId, permission)
   VALUES (1, 2, 'view');
   ```

### For Frontend

When invited users log in:
1. They see their own conversations (if any)
2. They see conversations shared with them via `getSharedWithMe` query
3. They can open and read shared conversations
4. They cannot delete or rename shared conversations (owner-only actions)

## Frontend Integration

Update `ChatInterface.tsx` to show both owned and shared conversations:

```typescript
// Get owned conversations
const { data: ownedConvs } = trpc.chat.listConversations.useQuery();

// Get shared conversations
const { data: sharedConvs } = trpc.chat.getSharedWithMe.useQuery();

// Combine and display
const allConversations = [
  ...ownedConvs,
  ...sharedConvs.map(s => s.conversation)
];
```

## Next Steps

1. **Update Frontend** - Modify sidebar to show both owned and shared conversations
2. **Add Admin Interface** - Create UI for admins to share conversations
3. **Add Sharing UI** - Allow users to share their own conversations
4. **Implement Edit/Admin Permissions** - Add edit and delete controls based on permission level
5. **Add Sharing History** - Track who shared what and when

## Testing

### Test Scenario 1: Basic Sharing
1. User A creates a conversation
2. Admin shares it with User B
3. User B logs in and can see the conversation
4. User B can read messages but not delete/rename

### Test Scenario 2: Multiple Shares
1. User A creates a conversation
2. Admin shares with User B (view) and User C (view)
3. Both B and C can access the conversation
4. User A can remove share from B
5. User B can no longer access

### Test Scenario 3: Permission Levels
1. User A creates a conversation
2. Admin shares with User B (view) and User C (edit)
3. User B can only read
4. User C can read and edit (future)

## Troubleshooting

### User can't see shared conversation
- Check if share exists: `SELECT * FROM conversationShares WHERE conversationId = X AND sharedWithUserId = Y;`
- Verify user ID is correct
- Check if conversation exists: `SELECT * FROM conversations WHERE id = X;`

### User can edit/delete shared conversation
- Check permission level in conversationShares
- Verify frontend checks permission before showing edit/delete buttons
- Check backend authorization in chat router

### Sharing fails
- Verify both users exist in database
- Check if conversation exists and user is owner
- Check database connection and permissions
