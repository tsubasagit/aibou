-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "channel_email_configs" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "imap_host" TEXT NOT NULL,
    "imap_port" INTEGER NOT NULL DEFAULT 993,
    "imap_user" TEXT NOT NULL,
    "imap_pass" TEXT NOT NULL,
    "imap_tls" BOOLEAN NOT NULL DEFAULT true,
    "smtp_host" TEXT NOT NULL,
    "smtp_port" INTEGER NOT NULL DEFAULT 587,
    "smtp_user" TEXT NOT NULL,
    "smtp_pass" TEXT NOT NULL,
    "smtp_tls" BOOLEAN NOT NULL DEFAULT true,
    "email_address" TEXT NOT NULL,
    "display_name" TEXT,
    "last_sync_uid" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_email_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_contacts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "email_message_id" TEXT,
    "in_reply_to" TEXT,
    "references" TEXT,
    "subject" TEXT,
    "from_email" TEXT NOT NULL,
    "to_emails" TEXT NOT NULL,
    "cc_emails" TEXT,
    "direction" "EmailDirection" NOT NULL,
    "external_contact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_email_configs_channel_id_key" ON "channel_email_configs"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_contacts_workspace_id_email_key" ON "external_contacts"("workspace_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "email_messages_message_id_key" ON "email_messages"("message_id");

-- CreateIndex
CREATE INDEX "email_messages_email_message_id_idx" ON "email_messages"("email_message_id");

-- AddForeignKey
ALTER TABLE "channel_email_configs" ADD CONSTRAINT "channel_email_configs_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_contacts" ADD CONSTRAINT "external_contacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_external_contact_id_fkey" FOREIGN KEY ("external_contact_id") REFERENCES "external_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
