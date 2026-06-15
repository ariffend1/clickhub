-- =====================================================
-- ClickHub Database Schema
-- Generated: 2026-06-15
-- Target: dtjsjbyoxwbrzlhdoaqn (faeyzasolusiOrg/clickhub)
-- =====================================================

-- =====================
-- 1. ENUM TYPES
-- =====================
CREATE TYPE public."ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE public."AssetStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'BROKEN', 'MAINTENANCE', 'RETIRED');
CREATE TYPE public."AssignmentStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'RETURNED', 'REJECTED');
CREATE TYPE public."ChatStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSE_REQUESTED', 'CLOSED');
CREATE TYPE public."CheckoutStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'CHECKED_OUT', 'RETURNED', 'OVERDUE', 'PARTIALLY_RETURNED', 'LOST');
CREATE TYPE public."GoodsCondition" AS ENUM ('GOOD', 'DAMAGED', 'PARTIAL');
CREATE TYPE public."GoodsDestinationType" AS ENUM ('INVENTORY', 'ASSET');
CREATE TYPE public."NotificationType" AS ENUM ('TICKET_NEW', 'TICKET_ASSIGNED', 'STATUS_CHANGE', 'COMMENT_NEW', 'SLA_WARNING', 'USER_REGISTERED', 'STOCK_ALERT');
CREATE TYPE public."ReplacementReason" AS ENUM ('BROKEN', 'WORN_OUT', 'OBSOLETE', 'UPGRADE', 'OTHER');
CREATE TYPE public."ReplacementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE public."Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN', 'EMPLOYEE');
CREATE TYPE public."StockRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ORDERED', 'RECEIVED');
CREATE TYPE public."StockRequestType" AS ENUM ('RESTOCK', 'NEW_ITEM');
CREATE TYPE public."TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
CREATE TYPE public."TaskType" AS ENUM ('MAINTENANCE', 'PROJECT', 'TODO');
CREATE TYPE public."TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE public."TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_PART', 'RESOLVED', 'CLOSED');
CREATE TYPE public."WorkNoteType" AS ENUM ('DAILY_LOG', 'SCRATCHPAD');

-- =====================
-- 2. TABLES
-- =====================

CREATE TABLE IF NOT EXISTS public."User" (
  "id" text NOT NULL,
  "name" text,
  "email" text NOT NULL,
  "password" text NOT NULL,
  "role" public."Role" DEFAULT 'EMPLOYEE'::"Role" NOT NULL,
  "isApproved" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  "department" text,
  "phone" text,
  "lastLoginAt" timestamp without time zone,
  "phoneNumber" text,
  "telegramId" text,
  "resetToken" text,
  "resetTokenExpiry" timestamp without time zone,
  "profilePhoto" text,
  "isBlocked" boolean DEFAULT false NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON public."User"("email");

CREATE TABLE IF NOT EXISTS public."Article" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "category" text NOT NULL,
  "isPublic" boolean DEFAULT false NOT NULL,
  "authorId" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Asset" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "brand" text,
  "type" text NOT NULL,
  "serialNumber" text NOT NULL,
  "location" text NOT NULL,
  "warehousePosition" text,
  "status" public."AssetStatus" DEFAULT 'AVAILABLE'::"AssetStatus" NOT NULL,
  "purchaseDate" timestamp without time zone,
  "price" numeric,
  "vendor" text,
  "warrantyExpiry" timestamp without time zone,
  "ipAddress" text,
  "macAddress" text,
  "hostname" text,
  "osVersion" text,
  "processor" text,
  "ramSize" text,
  "storageSize" text,
  "customSpecs" text,
  "parentAssetId" text,
  "lastMaintenanceDate" timestamp without time zone,
  "nextMaintenanceDate" timestamp without time zone,
  "maintenanceNotes" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  "isVerified" boolean DEFAULT true NOT NULL,
  "createdById" text,
  "verifiedById" text,
  "verifiedAt" timestamp without time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."AssetComponentHistory" (
  "id" text NOT NULL,
  "assetId" text NOT NULL,
  "action" text NOT NULL,
  "performedById" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "componentId" text NOT NULL,
  "note" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."AssetMaintenanceLog" (
  "id" text NOT NULL,
  "assetId" text NOT NULL,
  "cost" numeric,
  "loggedById" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "action" text NOT NULL,
  "itemName" text NOT NULL,
  "reason" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."AssignedAsset" (
  "id" text NOT NULL,
  "assetId" text NOT NULL,
  "userId" text,
  "assigneeName" text NOT NULL,
  "purpose" text,
  "location" text,
  "status" public."AssignmentStatus" DEFAULT 'PENDING_APPROVAL'::"AssignmentStatus" NOT NULL,
  "assignedById" text,
  "approvedById" text,
  "requestedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "approvedAt" timestamp without time zone,
  "startedAt" timestamp without time zone,
  "returnedAt" timestamp without time zone,
  "returnCondition" text,
  "returnNotes" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Ticket" (
  "id" text NOT NULL,
  "ticketNumber" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "status" public."TicketStatus" DEFAULT 'OPEN'::"TicketStatus" NOT NULL,
  "priority" public."TicketPriority" DEFAULT 'MEDIUM'::"TicketPriority" NOT NULL,
  "reporterId" text NOT NULL,
  "assigneeId" text,
  "assetId" text,
  "sparePartRequest" text,
  "sparePartApproved" boolean DEFAULT false NOT NULL,
  "category" text,
  "slaDeadline" timestamp without time zone,
  "resolution" text,
  "delayReason" text,
  "assignedAt" timestamp without time zone,
  "resolvedAt" timestamp without time zone,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  "csatFeedback" text,
  "csatRating" integer,
  "isArchived" boolean DEFAULT false NOT NULL,
  "isDeleteRequested" boolean DEFAULT false NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Attachment" (
  "id" text NOT NULL,
  "fileName" text NOT NULL,
  "fileUrl" text NOT NULL,
  "fileType" text NOT NULL,
  "fileSize" integer NOT NULL,
  "ticketId" text NOT NULL,
  "uploadedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "isDeleteRequested" boolean DEFAULT false,
  "deleteReason" text,
  "originalSize" integer,
  "deleteRequestedById" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."AuditLog" (
  "id" text NOT NULL,
  "action" text NOT NULL,
  "details" text,
  "userId" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Category" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."ChatSession" (
  "id" text NOT NULL,
  "employeeId" text NOT NULL,
  "employeeName" text DEFAULT 'Unknown'::text NOT NULL,
  "handlerId" text,
  "handlerName" text,
  "status" public."ChatStatus" DEFAULT 'OPEN'::"ChatStatus" NOT NULL,
  "closeRequestedBy" text,
  "closeRequestedAt" timestamp without time zone,
  "firstResponseAt" timestamp without time zone,
  "closedAt" timestamp without time zone,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."ChatMessage" (
  "id" text NOT NULL,
  "sessionId" text NOT NULL,
  "senderId" text NOT NULL,
  "senderName" text NOT NULL,
  "senderRole" text NOT NULL,
  "content" text NOT NULL,
  "isSystem" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "fileUrl" text,
  "fileName" text,
  "fileType" text,
  "fileSize" integer,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Checklist" (
  "id" text NOT NULL,
  "content" text NOT NULL,
  "isCompleted" boolean DEFAULT false NOT NULL,
  "taskId" text NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."CheckoutItem" (
  "id" text NOT NULL,
  "checkoutId" text NOT NULL,
  "assetId" text,
  "inventoryId" text,
  "quantity" integer DEFAULT 1 NOT NULL,
  "scannedOut" boolean DEFAULT false NOT NULL,
  "scannedOutAt" timestamp without time zone,
  "scannedIn" boolean DEFAULT false NOT NULL,
  "scannedInAt" timestamp without time zone,
  "conditionOut" text,
  "conditionIn" text,
  "damageNotes" text,
  "isLost" boolean DEFAULT false NOT NULL,
  "lostReportedAt" timestamp without time zone,
  "lostTicketId" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Comment" (
  "id" text NOT NULL,
  "content" text NOT NULL,
  "ticketId" text NOT NULL,
  "userId" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."DirectoryCategory" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "icon" text DEFAULT 'folder'::text NOT NULL,
  "order" integer DEFAULT 0 NOT NULL,
  "visibility" text DEFAULT 'PUBLIC'::text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "color" text DEFAULT '#6B7280'::text NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."DirectoryEntry" (
  "id" text NOT NULL,
  "categoryId" text NOT NULL,
  "description" text,
  "isPublic" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "location" text,
  "name" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."EquipmentCheckout" (
  "id" text NOT NULL,
  "checkoutNumber" text NOT NULL,
  "technicianId" text NOT NULL,
  "ticketId" text,
  "taskId" text,
  "purpose" text NOT NULL,
  "status" public."CheckoutStatus" DEFAULT 'PENDING_APPROVAL'::"CheckoutStatus" NOT NULL,
  "approvalStatus" public."ApprovalStatus" DEFAULT 'NOT_REQUIRED'::"ApprovalStatus" NOT NULL,
  "approverId" text,
  "approvedAt" timestamp without time zone,
  "rejectionReason" text,
  "checkoutTime" timestamp without time zone,
  "expectedReturn" timestamp without time zone NOT NULL,
  "actualReturn" timestamp without time zone,
  "notes" text,
  "photoOnCheckout" text,
  "photoOnReturn" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."GoodsReceipt" (
  "id" text NOT NULL,
  "receiptNumber" text NOT NULL,
  "purchaseRequestId" text NOT NULL,
  "itemName" text NOT NULL,
  "quantityOrdered" integer NOT NULL,
  "quantityReceived" integer NOT NULL,
  "destinationType" public."GoodsDestinationType" NOT NULL,
  "inventoryId" text,
  "assetId" text,
  "receivedById" text NOT NULL,
  "receivedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "condition" public."GoodsCondition" DEFAULT 'GOOD'::"GoodsCondition" NOT NULL,
  "notes" text,
  "assetSerialNumber" text,
  "assetLocation" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Holiday" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "date" timestamp without time zone NOT NULL,
  "year" integer NOT NULL,
  "isNational" boolean DEFAULT true NOT NULL,
  "isCutiBersama" boolean DEFAULT false NOT NULL,
  "isWeekend" boolean DEFAULT false NOT NULL,
  "region" text,
  "source" text DEFAULT 'api-harilibur'::text NOT NULL,
  "isEnabled" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Inventory" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "sku" text NOT NULL,
  "quantity" integer DEFAULT 0 NOT NULL,
  "minStock" integer DEFAULT 5 NOT NULL,
  "unit" text DEFAULT 'pcs'::text NOT NULL,
  "location" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  "isVerified" boolean DEFAULT true NOT NULL,
  "createdById" text,
  "verifiedById" text,
  "verifiedAt" timestamp without time zone,
  "quantityInService" integer DEFAULT 0 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."InventoryTransaction" (
  "id" text NOT NULL,
  "date" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "type" text NOT NULL,
  "quantity" integer NOT NULL,
  "previousQty" integer NOT NULL,
  "newQty" integer NOT NULL,
  "notes" text,
  "referenceId" text,
  "inventoryId" text NOT NULL,
  "userId" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Location" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."MaintenanceSchedule" (
  "id" text NOT NULL,
  "assetId" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "frequency" text NOT NULL,
  "scheduledDate" timestamp without time zone NOT NULL,
  "lastPerformed" timestamp without time zone,
  "isActive" boolean DEFAULT true NOT NULL,
  "notifyDaysBefore" integer DEFAULT 7 NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."MasterData" (
  "id" text NOT NULL,
  "category" text NOT NULL,
  "name" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."MenuPermission" (
  "id" text NOT NULL,
  "menuKey" text NOT NULL,
  "role" public."Role" NOT NULL,
  "isEnabled" boolean DEFAULT true NOT NULL,
  "canDelegate" boolean DEFAULT false NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Notification" (
  "id" text NOT NULL,
  "userId" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "type" public."NotificationType" DEFAULT 'TICKET_NEW'::"NotificationType" NOT NULL,
  "isRead" boolean DEFAULT false NOT NULL,
  "link" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."PartRequest" (
  "id" text NOT NULL,
  "ticketId" text,
  "inventoryId" text NOT NULL,
  "quantity" integer NOT NULL,
  "status" text DEFAULT 'PENDING'::text NOT NULL,
  "requestedBy" text NOT NULL,
  "approvedBy" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  "taskId" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Permission" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."PurchaseRequest" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "ticketId" text,
  "itemName" text NOT NULL,
  "quantity" integer NOT NULL,
  "estimatedCost" numeric,
  "status" text DEFAULT 'PENDING'::text NOT NULL,
  "requestedById" text NOT NULL,
  "approvedById" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."RelocationHistory" (
  "id" text NOT NULL,
  "assetId" text NOT NULL,
  "fromLocation" text NOT NULL,
  "toLocation" text NOT NULL,
  "reason" text,
  "relocatedById" text NOT NULL,
  "relocatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."ReplacementRequest" (
  "id" text NOT NULL,
  "requestNumber" text NOT NULL,
  "ticketId" text,
  "assetId" text NOT NULL,
  "reason" public."ReplacementReason" NOT NULL,
  "reasonDetails" text,
  "urgency" text DEFAULT 'MEDIUM'::text NOT NULL,
  "newAssetId" text,
  "status" public."ReplacementStatus" DEFAULT 'PENDING'::"ReplacementStatus" NOT NULL,
  "requestedById" text NOT NULL,
  "approvedById" text,
  "requestedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "approvedAt" timestamp without time zone,
  "completedAt" timestamp without time zone,
  "rejectionReason" text,
  "notes" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."RolePermission" (
  "id" text NOT NULL,
  "role" public."Role" NOT NULL,
  "permissionId" text NOT NULL,
  "isAllowed" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Space" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "color" text DEFAULT '#6366F1'::text NOT NULL,
  "icon" text DEFAULT '📁'::text NOT NULL,
  "order" integer DEFAULT 0 NOT NULL,
  "allowedRoles" text[],
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."TaskList" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "color" text DEFAULT '#6366F1'::text NOT NULL,
  "spaceId" text NOT NULL,
  "order" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Task" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "type" public."TaskType" DEFAULT 'TODO'::"TaskType" NOT NULL,
  "status" public."TaskStatus" DEFAULT 'TODO'::"TaskStatus" NOT NULL,
  "priority" public."TicketPriority" DEFAULT 'MEDIUM'::"TicketPriority" NOT NULL,
  "dueDate" timestamp without time zone,
  "assigneeId" text,
  "createdById" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  "assigneeIds" text[],
  "listId" text,
  "spaceId" text,
  "ticketId" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."TeamMessage" (
  "id" text NOT NULL,
  "senderId" text NOT NULL,
  "senderName" text NOT NULL,
  "senderRole" text NOT NULL,
  "content" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."StockAdjustmentRequest" (
  "id" text NOT NULL,
  "type" text NOT NULL,
  "quantity" integer NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'PENDING'::text NOT NULL,
  "inventoryId" text NOT NULL,
  "requestedById" text NOT NULL,
  "approvedById" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."StockOpname" (
  "id" text NOT NULL,
  "date" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "status" text DEFAULT 'IN_PROGRESS'::text NOT NULL,
  "notes" text,
  "printCount" integer DEFAULT 0 NOT NULL,
  "createdById" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."StockOpnameItem" (
  "id" text NOT NULL,
  "opnameId" text NOT NULL,
  "inventoryId" text NOT NULL,
  "systemQty" integer NOT NULL,
  "physicalQty" integer,
  "difference" integer,
  "reason" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."StockRequest" (
  "id" text NOT NULL,
  "requestNumber" text NOT NULL,
  "type" public."StockRequestType" NOT NULL,
  "inventoryId" text,
  "itemName" text NOT NULL,
  "itemDescription" text,
  "category" text,
  "quantity" integer NOT NULL,
  "estimatedPrice" numeric,
  "reason" text NOT NULL,
  "urgency" text DEFAULT 'MEDIUM'::text NOT NULL,
  "status" public."StockRequestStatus" DEFAULT 'PENDING'::"StockRequestStatus" NOT NULL,
  "requestedById" text NOT NULL,
  "approvedById" text,
  "requestedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "approvedAt" timestamp without time zone,
  "orderedAt" timestamp without time zone,
  "receivedAt" timestamp without time zone,
  "rejectionReason" text,
  "notes" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."SystemSetting" (
  "key" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS public."SystemSettings" (
  "id" text NOT NULL,
  "key" text NOT NULL,
  "value" text NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."WorkNote" (
  "id" text NOT NULL,
  "content" text NOT NULL,
  "date" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "type" public."WorkNoteType" DEFAULT 'DAILY_LOG'::"WorkNoteType" NOT NULL,
  "userId" text NOT NULL,
  "ticketId" text,
  "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);

-- =====================
-- 3. ADMIN USER
-- =====================
INSERT INTO public."User" (
  "id", "name", "email", "password", "role",
  "isApproved", "isBlocked", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'Support Admin',
  'support@clickhub.com',
  crypt('support1234', gen_salt('bf', 10)),
  'SUPER_ADMIN',
  true,
  false,
  NOW(),
  NOW()
);
