-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'employee', 'partner');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('inprogress', 'completed', 'pending', 'approved');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Cancelled');

-- CreateEnum
CREATE TYPE "QuotationApprovalStatus" AS ENUM ('pending', 'sent', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('Lead', 'Quotation', 'Confirmation', 'Finalised', 'callUp');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PackageServiceCategory" AS ENUM ('WEDDING', 'RECEPTION', 'ENGAGEMENT', 'RITUALS', 'EXTRA_COMPLEMENTARY', 'SHOOT', 'DELIVERABLE', 'COMPLEMENTARY');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "unique_id" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "reset_token" VARCHAR(64),
    "reset_token_expiry" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "employees_detail" (
    "employee_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "contact_number" VARCHAR(20),
    "dob" DATE,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "work_location" VARCHAR(150),
    "sales_type" VARCHAR(100),
    "experience" INTEGER,
    "date_of_join" DATE,
    "portfolio_path" TEXT,
    "photography_description" TEXT,
    "position" VARCHAR(100),
    "commission" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "document_pdf_path" TEXT,
    "gender" VARCHAR(20) DEFAULT 'Male',
    "profile_image_path" TEXT,

    CONSTRAINT "employees_detail_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "employees_attendance" (
    "attendance_id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "date" DATE NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "status" VARCHAR(20),

    CONSTRAINT "employees_attendance_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "admin_attendance" (
    "attendance_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "status" VARCHAR(20),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_attendance_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "employee_financials" (
    "financial_id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "account_number" VARCHAR(30) NOT NULL,
    "bank_name" VARCHAR(150) NOT NULL,
    "ifsc_code" VARCHAR(20) NOT NULL,
    "commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_financials_pkey" PRIMARY KEY ("financial_id")
);

-- CreateTable
CREATE TABLE "employee_leave_requests" (
    "leave_request_id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "leave_type" VARCHAR(50) NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "no_of_days" INTEGER,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'Pending',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_leave_requests_pkey" PRIMARY KEY ("leave_request_id")
);

-- CreateTable
CREATE TABLE "events" (
    "event_id" SERIAL NOT NULL,
    "event_name" VARCHAR(200) NOT NULL,
    "lead_id" INTEGER,
    "employee_id" INTEGER,
    "budget" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "event_datetime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "EventStatus" NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "invoice_issues" (
    "issue_id" SERIAL NOT NULL,
    "invoice_id" INTEGER,
    "issue_title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Open',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "invoice_issues_pkey" PRIMARY KEY ("issue_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "invoice_id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "billing_date" DATE NOT NULL,
    "plan" VARCHAR(150) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "sent_at" TIMESTAMP(3),
    "token" VARCHAR(255),
    "invoiceSnapshot" JSONB,
    "totalAmount" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "previewEvents" JSONB,
    "qtyOverrides" JSONB,
    "paid" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "InvoiceAddon" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "addonServiceId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "category" TEXT,

    CONSTRAINT "InvoiceAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads_detail" (
    "lead_id" SERIAL NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "email" VARCHAR(255),
    "contact_number" VARCHAR(20),
    "lead_followed_by" VARCHAR(150),
    "address" TEXT,
    "event_type" VARCHAR(100),
    "lead_source" VARCHAR(100),
    "priority" VARCHAR(20),
    "budget" DECIMAL(12,2),
    "paid_amount" DECIMAL(12,2) DEFAULT 0.0,
    "discount" DECIMAL(12,2) DEFAULT 0.0,
    "event_date" DATE,
    "description" TEXT,
    "created_time" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "current_stage" "LeadStage" NOT NULL DEFAULT 'Lead',
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "lead_serial_number" VARCHAR(20),
    "leadType" TEXT NOT NULL DEFAULT 'LD',
    "password_hash" TEXT,
    "client_token" TEXT,

    CONSTRAINT "leads_detail_pkey" PRIMARY KEY ("lead_id")
);

-- CreateTable
CREATE TABLE "lead_employee" (
    "lead_employee_id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "task_name" VARCHAR(150),
    "estimated_duration" INTEGER,
    "deadline" DATE,
    "priority" VARCHAR(20),
    "description" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "lead_employee_pkey" PRIMARY KEY ("lead_employee_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" SERIAL NOT NULL,
    "invoice_id" INTEGER,
    "event_id" INTEGER,
    "lead_id" INTEGER NOT NULL,
    "payment_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "payment_date" DATE NOT NULL,
    "paid" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "proof_url" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by" INTEGER,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "quotation_packages" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER,
    "service_name" TEXT NOT NULL,
    "service_provided" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "combo_id" INTEGER,
    "terms" INTEGER,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "items" JSONB,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,

    CONSTRAINT "quotation_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_lead" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "quotation_id" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "QuotationApprovalStatus" NOT NULL,
    "sent_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "token" VARCHAR(255),

    CONSTRAINT "quotation_lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_lead_issues" (
    "id" SERIAL NOT NULL,
    "quotation_lead_id" INTEGER NOT NULL,
    "issue_title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Open',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_lead_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packageServices" (
    "id" SERIAL NOT NULL,
    "package_title" VARCHAR(200) NOT NULL,
    "package_type" VARCHAR(100) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "packageServices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_call" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "call_Time" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "notes" TEXT,
    "is_taken" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_lead" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "unit" INTEGER NOT NULL DEFAULT 1,
    "is_removed" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_event" (
    "id" SERIAL NOT NULL,
    "combo_name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "issue_type" VARCHAR(50) NOT NULL,
    "invoice_issue_id" INTEGER,
    "quotation_issue_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "employee_id" INTEGER,
    "user_id" INTEGER,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "package_service_items" (
    "id" SERIAL NOT NULL,
    "package_service_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "category" "PackageServiceCategory" NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addon_services" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "unit_label" TEXT NOT NULL DEFAULT 'Session',
    "defaultQty" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addon_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_addons" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "addon_service_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_additional" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "events" JSONB NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_additional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "category" TEXT,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_markings" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "value" VARCHAR(500) NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_markings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_sequence" (
    "id" VARCHAR(10) NOT NULL,
    "seq_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lead_sequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_deliveries" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "delivery_type" TEXT NOT NULL,
    "drive_link" TEXT,
    "video_drive_link" TEXT,
    "drone_photo_drive_link" TEXT,
    "drone_video_drive_link" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "query_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_unique_id_key" ON "users"("unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_detail_user_id_key" ON "employees_detail"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_attendance_user_id_date_key" ON "admin_attendance"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_token_key" ON "invoices"("token");

-- CreateIndex
CREATE UNIQUE INDEX "lead_employee_lead_id_employee_id_key" ON "lead_employee"("lead_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_lead_token_key" ON "quotation_lead"("token");

-- CreateIndex
CREATE UNIQUE INDEX "addon_services_name_key" ON "addon_services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lead_addons_lead_id_addon_service_id_key" ON "lead_addons"("lead_id", "addon_service_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_additional_invoice_id_key" ON "invoice_additional"("invoice_id");

-- AddForeignKey
ALTER TABLE "employees_detail" ADD CONSTRAINT "employees_detail_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees_detail" ADD CONSTRAINT "employees_detail_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees_attendance" ADD CONSTRAINT "employees_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees_detail"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_attendance" ADD CONSTRAINT "admin_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_financials" ADD CONSTRAINT "employee_financials_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees_detail"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leave_requests" ADD CONSTRAINT "employee_leave_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leave_requests" ADD CONSTRAINT "employee_leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees_detail"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees_detail"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_detail"("lead_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_issues" ADD CONSTRAINT "invoice_issues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_issues" ADD CONSTRAINT "invoice_issues_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_detail"("lead_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceAddon" ADD CONSTRAINT "InvoiceAddon_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceAddon" ADD CONSTRAINT "InvoiceAddon_addonServiceId_fkey" FOREIGN KEY ("addonServiceId") REFERENCES "addon_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads_detail" ADD CONSTRAINT "leads_detail_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads_detail" ADD CONSTRAINT "leads_detail_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_employee" ADD CONSTRAINT "lead_employee_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees_detail"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_employee" ADD CONSTRAINT "lead_employee_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_detail"("lead_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_detail"("lead_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_packages" ADD CONSTRAINT "quotation_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packageServices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_packages" ADD CONSTRAINT "quotation_packages_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combo_event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_packages" ADD CONSTRAINT "quotation_packages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lead" ADD CONSTRAINT "quotation_lead_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_detail"("lead_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lead" ADD CONSTRAINT "quotation_lead_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotation_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_lead_issues" ADD CONSTRAINT "quotation_lead_issues_quotation_lead_id_fkey" FOREIGN KEY ("quotation_lead_id") REFERENCES "quotation_lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packageServices" ADD CONSTRAINT "packageServices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packageServices" ADD CONSTRAINT "packageServices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_call" ADD CONSTRAINT "lead_call_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_detail"("lead_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_lead" ADD CONSTRAINT "package_lead_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_lead" ADD CONSTRAINT "package_lead_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packageServices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees_detail"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_invoice_issue_id_fkey" FOREIGN KEY ("invoice_issue_id") REFERENCES "invoice_issues"("issue_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_quotation_issue_id_fkey" FOREIGN KEY ("quotation_issue_id") REFERENCES "quotation_lead_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_service_items" ADD CONSTRAINT "package_service_items_package_service_id_fkey" FOREIGN KEY ("package_service_id") REFERENCES "packageServices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_addons" ADD CONSTRAINT "lead_addons_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_detail"("lead_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_addons" ADD CONSTRAINT "lead_addons_addon_service_id_fkey" FOREIGN KEY ("addon_service_id") REFERENCES "addon_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_additional" ADD CONSTRAINT "invoice_additional_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_markings" ADD CONSTRAINT "invoice_markings_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliveries" ADD CONSTRAINT "client_deliveries_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_detail"("lead_id") ON DELETE CASCADE ON UPDATE CASCADE;
