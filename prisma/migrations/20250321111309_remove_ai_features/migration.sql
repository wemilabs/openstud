-- DropForeignKey
ALTER TABLE "AIConversation" DROP CONSTRAINT "AIConversation_userId_fkey";

-- DropForeignKey
ALTER TABLE "AIMessage" DROP CONSTRAINT "AIMessage_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "NoteEmbedding" DROP CONSTRAINT "NoteEmbedding_noteId_fkey";

-- DropTable
DROP TABLE "AIConversation";

-- DropTable
DROP TABLE "AIMessage";

-- DropTable
DROP TABLE "NoteEmbedding";
